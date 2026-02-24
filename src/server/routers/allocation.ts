import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const allocationRouter = router({
    // List allocations for a date range (all team members)
    list: protectedProcedure
        .input(z.object({
            weekFrom: z.string().optional(), // YYYY-Www
            weekTo: z.string().optional(),
            projectId: z.string().optional(),
            userId: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];

            const where: any = {};

            // Scope to org members
            const orgUsers = await ctx.db.user.findMany({
                where: { orgId: user.orgId },
                select: { id: true },
            });
            where.userId = { in: orgUsers.map((u: any) => u.id) };

            if (input?.projectId) where.projectId = input.projectId;
            if (input?.userId) where.userId = input.userId;

            const allocations = await ctx.db.allocation.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, title: true, targetUtil: true } },
                    project: { select: { id: true, name: true } },
                },
                orderBy: { week: "asc" },
            });

            // Client-side week filtering
            if (input?.weekFrom || input?.weekTo) {
                return allocations.filter((a: any) => {
                    if (input?.weekFrom && a.week < input.weekFrom) return false;
                    if (input?.weekTo && a.week > input.weekTo) return false;
                    return true;
                });
            }

            return allocations;
        }),

    // Set (upsert) an allocation
    set: protectedProcedure
        .input(z.object({
            userId: z.string(),
            projectId: z.string(),
            week: z.string(),
            plannedHours: z.number(),
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.allocation.upsert({
                where: {
                    userId_projectId_week: {
                        userId: input.userId,
                        projectId: input.projectId,
                        week: input.week,
                    },
                },
                update: { plannedHours: input.plannedHours },
                create: input,
            });
        }),

    // Team capacity overview: for each team member, planned vs actual hours by week
    teamCapacity: protectedProcedure
        .input(z.object({
            weekFrom: z.string(),
            weekTo: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];

            const members = await ctx.db.user.findMany({
                where: { orgId: user.orgId },
                select: { id: true, name: true, title: true, targetUtil: true },
            });

            const allocations = await ctx.db.allocation.findMany({
                where: {
                    userId: { in: members.map((m: any) => m.id) },
                    week: { gte: input.weekFrom, lte: input.weekTo },
                },
                include: { project: { select: { id: true, name: true } } },
            });

            // Get actual time entries
            const timeEntries = await ctx.db.timeEntry.findMany({
                where: {
                    userId: { in: members.map((m: any) => m.id) },
                    date: { gte: isoWeekToDate(input.weekFrom), lte: isoWeekToDate(input.weekTo, true) },
                },
            });

            return members.map((member: any) => {
                const memberAllocs = allocations.filter((a: any) => a.userId === member.id);
                const memberEntries = timeEntries.filter((e: any) => e.userId === member.id);

                // Group by week
                const weekData: Record<string, { planned: number; actual: number; projects: string[] }> = {};
                memberAllocs.forEach((a: any) => {
                    if (!weekData[a.week]) weekData[a.week] = { planned: 0, actual: 0, projects: [] };
                    weekData[a.week].planned += a.plannedHours;
                    if (a.project?.name && !weekData[a.week].projects.includes(a.project.name)) {
                        weekData[a.week].projects.push(a.project.name);
                    }
                });

                memberEntries.forEach((e: any) => {
                    const w = dateToIsoWeek(e.date);
                    if (!weekData[w]) weekData[w] = { planned: 0, actual: 0, projects: [] };
                    weekData[w].actual += e.hours;
                });

                const totalPlanned = Object.values(weekData).reduce((s, w) => s + w.planned, 0);
                const totalActual = Object.values(weekData).reduce((s, w) => s + w.actual, 0);

                return {
                    ...member,
                    totalPlanned,
                    totalActual,
                    weeks: weekData,
                };
            });
        }),

    // Forecast: project-level resource needs
    forecast: protectedProcedure
        .input(z.object({
            weekFrom: z.string(),
            weekTo: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];

            const projects = await ctx.db.project.findMany({
                where: { orgId: user.orgId, status: "active" },
                select: { id: true, name: true },
            });

            const allocations = await ctx.db.allocation.findMany({
                where: {
                    projectId: { in: projects.map((p: any) => p.id) },
                    week: { gte: input.weekFrom, lte: input.weekTo },
                },
                include: { user: { select: { name: true } } },
            });

            return projects.map((project: any) => {
                const projAllocs = allocations.filter((a: any) => a.projectId === project.id);
                const totalHours = projAllocs.reduce((s: number, a: any) => s + a.plannedHours, 0);
                const people = [...new Set(projAllocs.map((a: any) => a.user?.name))];

                return {
                    id: project.id,
                    name: project.name,
                    totalPlannedHours: totalHours,
                    assignedPeople: people,
                };
            });
        }),
});

// Helper: ISO week string → date string
function isoWeekToDate(week: string, endOfWeek = false): string {
    const match = week.match(/(\d{4})-W(\d{2})/);
    if (!match) return week;
    const year = parseInt(match[1]);
    const weekNum = parseInt(match[2]);
    // Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7; // Mon=1
    const weekStart = new Date(jan4);
    weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNum - 1) * 7);
    if (endOfWeek) weekStart.setDate(weekStart.getDate() + 6);
    return weekStart.toISOString().slice(0, 10);
}

function dateToIsoWeek(dateStr: string): string {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

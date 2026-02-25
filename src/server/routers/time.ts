import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";

export const timeRouter = router({
    getEntries: protectedProcedure
        .input(z.object({
            startDate: z.string(),
            endDate: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.timeEntry.findMany({
                where: {
                    userId: user.id,
                    date: { gte: input.startDate, lte: input.endDate },
                },
                include: { project: true, phase: true },
                orderBy: { date: "desc" },
            });
        }),

    logEntry: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            phaseId: z.string(),
            date: z.string(),
            hours: z.number().min(0),
            notes: z.string().default(""),
            billable: z.boolean().default(true),
            entryType: z.enum(["regular", "pto", "holiday", "admin"]).default("regular"),
            activityType: z.enum(["design", "project-mgmt", "site-visit", "meeting", "admin", "other"]).default("design"),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.timeEntry.create({
                data: { ...input, userId: user.id },
                include: { project: true, phase: true },
            });
        }),

    submit: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.timeEntry.updateMany({
                where: { id: { in: input.ids } },
                data: { status: "submitted" },
            });
        }),

    ptoSummary: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            const members = await ctx.db.user.findMany({
                where: { orgId: user.orgId },
            });
            const results = [];
            for (const m of members) {
                const ptoEntries = await ctx.db.timeEntry.findMany({
                    where: { userId: m.id, entryType: "pto" },
                });
                const ptoHours = ptoEntries.reduce((s: number, e: { hours: number }) => s + e.hours, 0);
                results.push({
                    id: m.id,
                    name: m.name,
                    ptoDays: ptoHours / 8,
                    ptoHours,
                });
            }
            return results;
        }),

    // List all org entries (for manager/inbox views)
    list: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.timeEntry.findMany({
                where: { user: { orgId: user.orgId } },
                include: { project: true, phase: true, user: { select: { id: true, name: true } } },
                orderBy: { date: "desc" },
                take: 200,
            });
        }),

    // Approve submitted entries (manager only)
    approve: managerProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.timeEntry.updateMany({
                where: { id: { in: input.ids } },
                data: { status: "approved" },
            });
        }),

    // Reject submitted entries (manager only)
    reject: managerProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.timeEntry.updateMany({
                where: { id: { in: input.ids } },
                data: { status: "draft" },
            });
        }),

    // Bulk update hours/notes
    bulkUpdate: protectedProcedure
        .input(z.object({
            entries: z.array(z.object({
                id: z.string(),
                hours: z.number().optional(),
                notes: z.string().optional(),
                billable: z.boolean().optional(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            for (const entry of input.entries) {
                const { id, ...data } = entry;
                await ctx.db.timeEntry.update({ where: { id }, data });
            }
            return { count: input.entries.length };
        }),

    // Recent projects for auto-suggest
    recentProjects: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            const recent = await ctx.db.timeEntry.findMany({
                where: { userId: user.id },
                select: { projectId: true, project: { select: { id: true, name: true } } },
                orderBy: { date: "desc" },
                take: 50,
            });
            // Deduplicate
            const seen = new Set<string>();
            return recent.filter(r => { if (seen.has(r.projectId)) return false; seen.add(r.projectId); return true; }).map(r => r.project).slice(0, 5);
        }),

    // ─── Timesheet Submission (weekly) ───

    submitWeek: protectedProcedure
        .input(z.object({
            week: z.string(), // e.g. "2025-W08"
            totalHours: z.number(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");

            // Upsert the submission record
            const existing = await ctx.db.timesheetSubmission.findFirst({
                where: { userId: user.id, week: input.week },
            });

            if (existing) {
                return ctx.db.timesheetSubmission.update({
                    where: { id: existing.id },
                    data: { status: "submitted", totalHours: input.totalHours, submittedAt: new Date().toISOString() },
                });
            }

            return ctx.db.timesheetSubmission.create({
                data: {
                    userId: user.id,
                    orgId: user.orgId,
                    week: input.week,
                    status: "submitted",
                    totalHours: input.totalHours,
                    submittedAt: new Date().toISOString(),
                },
            });
        }),

    getMySubmissions: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.timesheetSubmission.findMany({
                where: { userId: user.id },
                orderBy: { week: "desc" },
                take: 20,
            });
        }),

    getTeamSubmissions: managerProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.timesheetSubmission.findMany({
                where: { orgId: user.orgId },
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { week: "desc" },
                take: 100,
            });
        }),

    approveWeek: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            return ctx.db.timesheetSubmission.update({
                where: { id: input.id },
                data: { status: "approved", reviewedBy: reviewer?.name ?? "", reviewedAt: new Date().toISOString() },
            });
        }),

    rejectWeek: managerProcedure
        .input(z.object({ id: z.string(), notes: z.string().default("") }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            return ctx.db.timesheetSubmission.update({
                where: { id: input.id },
                data: { status: "rejected", reviewedBy: reviewer?.name ?? "", reviewedAt: new Date().toISOString(), notes: input.notes },
            });
        }),

    // ─── Time Off Requests ───

    requestTimeOff: protectedProcedure
        .input(z.object({
            type: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            hours: z.number(),
            notes: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.timeOffRequest.create({
                data: { ...input, userId: user.id, orgId: user.orgId },
            });
        }),

    getMyTimeOffRequests: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.timeOffRequest.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
            });
        }),

    getTeamTimeOffRequests: managerProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.timeOffRequest.findMany({
                where: { orgId: user.orgId },
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: "desc" },
            });
        }),

    approveTimeOff: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            return ctx.db.timeOffRequest.update({
                where: { id: input.id },
                data: { status: "approved", reviewedBy: reviewer?.name ?? "", reviewedAt: new Date().toISOString() },
            });
        }),

    rejectTimeOff: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            return ctx.db.timeOffRequest.update({
                where: { id: input.id },
                data: { status: "rejected", reviewedBy: reviewer?.name ?? "", reviewedAt: new Date().toISOString() },
            });
        }),
});

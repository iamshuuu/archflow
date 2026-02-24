import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

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
});

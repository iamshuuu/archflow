import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
    list: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];
            return ctx.db.notification.findMany({
                where: { userId: user.id },
                include: { project: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
                take: 50,
            });
        }),

    unreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return 0;
            return ctx.db.notification.count({
                where: { userId: user.id, read: false },
            });
        }),

    markRead: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.notification.update({
                where: { id: input.id },
                data: { read: true },
            });
        }),

    markAllRead: protectedProcedure
        .mutation(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return;
            return ctx.db.notification.updateMany({
                where: { userId: user.id, read: false },
                data: { read: true },
            });
        }),

    checkBudgets: protectedProcedure
        .mutation(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return { created: 0 };

            const projects = await ctx.db.project.findMany({
                where: { orgId: user.orgId },
                include: {
                    phases: {
                        include: { timeEntries: { select: { hours: true } } },
                    },
                },
            });

            let created = 0;

            for (const proj of projects) {
                const totalBudgetHours = proj.phases.reduce((s, ph) => s + ph.budgetHours, 0);
                const totalUsedHours = proj.phases.reduce(
                    (s, ph) => s + ph.timeEntries.reduce((hs, te) => hs + te.hours, 0), 0
                );
                if (totalBudgetHours === 0) continue;

                const burnPct = Math.round((totalUsedHours / totalBudgetHours) * 100);
                const thresholds = [
                    { pct: 100, type: "budget_critical", title: "Over Budget", msg: `${proj.name} has exceeded its hour budget (${totalUsedHours}/${totalBudgetHours}h)` },
                    { pct: 90, type: "budget_warning", title: "Budget Warning", msg: `${proj.name} is at ${burnPct}% of hour budget (${totalUsedHours}/${totalBudgetHours}h)` },
                    { pct: 75, type: "budget_alert", title: "Budget Alert", msg: `${proj.name} has reached ${burnPct}% of hour budget (${totalUsedHours}/${totalBudgetHours}h)` },
                ];

                for (const t of thresholds) {
                    if (burnPct >= t.pct) {
                        // Only create if no existing unread notification of this type for this project
                        const existing = await ctx.db.notification.findFirst({
                            where: { userId: user.id, projectId: proj.id, type: t.type, read: false },
                        });
                        if (!existing) {
                            await ctx.db.notification.create({
                                data: {
                                    userId: user.id,
                                    projectId: proj.id,
                                    type: t.type,
                                    title: t.title,
                                    message: t.msg,
                                },
                            });
                            created++;
                        }
                        break; // Only fire the highest threshold
                    }
                }
            }

            return { created };
        }),
});

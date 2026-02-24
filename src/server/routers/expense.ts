import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const expenseRouter = router({
    list: protectedProcedure
        .input(z.object({
            projectId: z.string().optional(),
            category: z.string().optional(),
            status: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return [];

            const where: any = { userId: user.id };
            if (input?.projectId) where.projectId = input.projectId;
            if (input?.category) where.category = input.category;
            if (input?.status) where.status = input.status;

            const expenses = await ctx.db.expense.findMany({
                where,
                include: { project: { select: { id: true, name: true } } },
                orderBy: { date: "desc" },
            });

            // client-side date filtering
            if (input?.dateFrom || input?.dateTo) {
                return expenses.filter((e: any) => {
                    if (input.dateFrom && e.date < input.dateFrom) return false;
                    if (input.dateTo && e.date > input.dateTo) return false;
                    return true;
                });
            }

            return expenses;
        }),

    summary: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) return { total: 0, pending: 0, approved: 0, mileage: 0, byCategory: {} as Record<string, number> };

            const expenses = await ctx.db.expense.findMany({ where: { userId: user.id } });

            const total = expenses.reduce((s: number, e: any) => s + e.amount, 0);
            const pending = expenses.filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + e.amount, 0);
            const approved = expenses.filter((e: any) => e.status === "approved").reduce((s: number, e: any) => s + e.amount, 0);
            const mileage = expenses.filter((e: any) => e.category === "mileage").reduce((s: number, e: any) => s + e.mileage, 0);

            const byCategory: Record<string, number> = {};
            expenses.forEach((e: any) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

            return { total, pending, approved, mileage, byCategory };
        }),

    create: protectedProcedure
        .input(z.object({
            category: z.string(),
            description: z.string().min(1),
            amount: z.number(),
            date: z.string(),
            billable: z.boolean().default(true),
            projectId: z.string().optional(),
            phaseId: z.string().optional(),
            mileage: z.number().default(0),
            mileageRate: z.number().default(0.67),
            notes: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");

            // For mileage, calculate amount from miles × rate
            const amount = input.category === "mileage" ? input.mileage * input.mileageRate : input.amount;

            return ctx.db.expense.create({
                data: {
                    ...input,
                    amount,
                    userId: user.id,
                },
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            category: z.string().optional(),
            description: z.string().optional(),
            amount: z.number().optional(),
            date: z.string().optional(),
            billable: z.boolean().optional(),
            status: z.string().optional(),
            mileage: z.number().optional(),
            notes: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.expense.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.expense.delete({ where: { id: input.id } });
        }),
});

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const projectRouter = router({
    clients: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.client.findMany({ where: { orgId: user.orgId }, orderBy: { name: "asc" } });
    }),

    budgets: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.project.findMany({
            where: { orgId: user.orgId },
            include: {
                client: true,
                phases: { include: { timeEntries: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.project.findMany({
            where: { orgId: user.orgId },
            include: { client: true, phases: true },
            orderBy: { createdAt: "desc" },
        });
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.project.findUnique({
                where: { id: input.id },
                include: { client: true, phases: { include: { timeEntries: true } } },
            });
        }),

    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            clientId: z.string(),
            type: z.string().default("Commercial"),
            contractValue: z.number().default(0),
            startDate: z.string().default(""),
            endDate: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.project.create({
                data: { ...input, status: "active", orgId: user.orgId },
                include: { client: true },
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            status: z.string().optional(),
            phase: z.string().optional(),
            progress: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.project.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.project.delete({ where: { id: input.id } });
        }),
});

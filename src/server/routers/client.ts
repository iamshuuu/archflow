import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const clientRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.client.findMany({
            where: { orgId: user.orgId },
            include: {
                projects: { select: { id: true, name: true, status: true, contractValue: true } },
                invoices: { select: { id: true, amount: true, status: true } },
                proposals: { select: { id: true, title: true, amount: true, status: true } },
                _count: { select: { projects: true, invoices: true } },
            },
            orderBy: { name: "asc" },
        });
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.client.findUnique({
                where: { id: input.id },
                include: {
                    projects: { include: { phases: true }, orderBy: { createdAt: "desc" } },
                    invoices: { orderBy: { date: "desc" } },
                    proposals: { orderBy: { createdAt: "desc" } },
                },
            });
        }),

    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            email: z.string().default(""),
            phone: z.string().default(""),
            address: z.string().default(""),
            website: z.string().default(""),
            notes: z.string().default(""),
            industry: z.string().default(""),
            status: z.string().default("active"),
            contactName: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.client.create({
                data: { ...input, orgId: user.orgId },
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            website: z.string().optional(),
            notes: z.string().optional(),
            industry: z.string().optional(),
            status: z.string().optional(),
            contactName: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.client.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.client.delete({ where: { id: input.id } });
        }),

    // ─── Proposals ───
    createProposal: protectedProcedure
        .input(z.object({
            clientId: z.string(),
            title: z.string().min(1),
            amount: z.number().default(0),
            status: z.string().default("draft"),
            sentDate: z.string().default(""),
            notes: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return (ctx.db as any).proposal.create({
                data: { ...input, orgId: user.orgId },
            });
        }),

    updateProposal: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            amount: z.number().optional(),
            status: z.string().optional(),
            sentDate: z.string().optional(),
            notes: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return (ctx.db as any).proposal.update({ where: { id }, data });
        }),

    deleteProposal: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return (ctx.db as any).proposal.delete({ where: { id: input.id } });
        }),
});

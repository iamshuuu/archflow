import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, type TRPCContext } from "../trpc";

async function requireCurrentUser(ctx: TRPCContext) {
    const email = ctx.session?.user?.email;
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    const user = await ctx.db.user.findUnique({ where: { email }, select: { id: true, orgId: true } });
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
    return user;
}

async function requireClientAccess(ctx: TRPCContext, orgId: string, clientId: string) {
    const client = await ctx.db.client.findFirst({ where: { id: clientId, orgId }, select: { id: true } });
    if (!client) throw new TRPCError({ code: "FORBIDDEN", message: "Client not found or inaccessible" });
    return client;
}

export const clientRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
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
            const user = await requireCurrentUser(ctx);
            await requireClientAccess(ctx, user.orgId, input.id);
            return ctx.db.client.findFirst({
                where: { id: input.id, orgId: user.orgId },
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
            const user = await requireCurrentUser(ctx);
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
            const user = await requireCurrentUser(ctx);
            const { id, ...data } = input;
            await requireClientAccess(ctx, user.orgId, id);
            return ctx.db.client.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            await requireClientAccess(ctx, user.orgId, input.id);
            return ctx.db.client.delete({ where: { id: input.id } });
        }),

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
            const user = await requireCurrentUser(ctx);
            await requireClientAccess(ctx, user.orgId, input.clientId);
            return ctx.db.proposal.create({
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
            const user = await requireCurrentUser(ctx);
            const { id, ...data } = input;
            const proposal = await ctx.db.proposal.findFirst({ where: { id, orgId: user.orgId }, select: { id: true, clientId: true } });
            if (!proposal) throw new TRPCError({ code: "FORBIDDEN", message: "Proposal not found or inaccessible" });
            return ctx.db.proposal.update({ where: { id }, data });
        }),

    deleteProposal: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const proposal = await ctx.db.proposal.findFirst({ where: { id: input.id, orgId: user.orgId }, select: { id: true } });
            if (!proposal) throw new TRPCError({ code: "FORBIDDEN", message: "Proposal not found or inaccessible" });
            return ctx.db.proposal.delete({ where: { id: input.id } });
        }),
});

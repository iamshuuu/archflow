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

async function requireConsultantAccess(ctx: TRPCContext, orgId: string, consultantId: string) {
    const consultant = await ctx.db.consultant.findFirst({ where: { id: consultantId, orgId }, select: { id: true } });
    if (!consultant) throw new TRPCError({ code: "FORBIDDEN", message: "Consultant not found or inaccessible" });
    return consultant;
}

async function requireProjectAccess(ctx: TRPCContext, orgId: string, projectId: string) {
    const project = await ctx.db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
    if (!project) throw new TRPCError({ code: "FORBIDDEN", message: "Project not found or inaccessible" });
    return project;
}

export const consultantRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.consultant.findMany({
            where: { orgId: user.orgId },
            include: { bills: true },
            orderBy: { name: "asc" },
        });
    }),

    create: protectedProcedure
        .input(z.object({
            name: z.string(),
            company: z.string().default(""),
            email: z.string().default(""),
            phone: z.string().default(""),
            specialty: z.string().default(""),
            markupPct: z.number().default(0),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.consultant.create({
                data: { ...input, orgId: user.orgId },
                include: { bills: true },
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            company: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            specialty: z.string().optional(),
            markupPct: z.number().optional(),
            status: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const { id, ...data } = input;
            await requireConsultantAccess(ctx, user.orgId, id);
            return ctx.db.consultant.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            await requireConsultantAccess(ctx, user.orgId, input.id);
            return ctx.db.consultant.delete({ where: { id: input.id } });
        }),

    listBills: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.consultantBill.findMany({
            where: { orgId: user.orgId },
            include: { consultant: true, project: true },
            orderBy: { date: "desc" },
        });
    }),

    createBill: protectedProcedure
        .input(z.object({
            consultantId: z.string(),
            projectId: z.string(),
            amount: z.number(),
            date: z.string(),
            description: z.string().default(""),
            invoiceRef: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            await requireConsultantAccess(ctx, user.orgId, input.consultantId);
            await requireProjectAccess(ctx, user.orgId, input.projectId);
            return ctx.db.consultantBill.create({
                data: { ...input, orgId: user.orgId },
                include: { consultant: true, project: true },
            });
        }),

    updateBillStatus: protectedProcedure
        .input(z.object({ id: z.string(), status: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const bill = await ctx.db.consultantBill.findFirst({ where: { id: input.id, orgId: user.orgId }, select: { id: true } });
            if (!bill) throw new TRPCError({ code: "FORBIDDEN", message: "Bill not found or inaccessible" });
            return ctx.db.consultantBill.update({
                where: { id: input.id },
                data: { status: input.status },
            });
        }),

    billSummary: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        const bills = await ctx.db.consultantBill.findMany({ where: { orgId: user.orgId } });
        return {
            total: bills.reduce((s: number, b) => s + b.amount, 0),
            pending: bills.filter((b) => b.status === "pending").reduce((s: number, b) => s + b.amount, 0),
            approved: bills.filter((b) => b.status === "approved").reduce((s: number, b) => s + b.amount, 0),
            paid: bills.filter((b) => b.status === "paid").reduce((s: number, b) => s + b.amount, 0),
        };
    }),
});

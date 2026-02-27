import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const consultantRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
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
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
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
            const { id, ...data } = input;
            return ctx.db.consultant.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.consultant.delete({ where: { id: input.id } });
        }),

    // ─── Bills ───

    listBills: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
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
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.consultantBill.create({
                data: { ...input, orgId: user.orgId },
                include: { consultant: true, project: true },
            });
        }),

    updateBillStatus: protectedProcedure
        .input(z.object({ id: z.string(), status: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.consultantBill.update({
                where: { id: input.id },
                data: { status: input.status },
            });
        }),

    billSummary: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return { total: 0, pending: 0, approved: 0, paid: 0 };
        const bills = await ctx.db.consultantBill.findMany({ where: { orgId: user.orgId } });
        return {
            total: bills.reduce((s: number, b: any) => s + b.amount, 0),
            pending: bills.filter((b: any) => b.status === "pending").reduce((s: number, b: any) => s + b.amount, 0),
            approved: bills.filter((b: any) => b.status === "approved").reduce((s: number, b: any) => s + b.amount, 0),
            paid: bills.filter((b: any) => b.status === "paid").reduce((s: number, b: any) => s + b.amount, 0),
        };
    }),
});

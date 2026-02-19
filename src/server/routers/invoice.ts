import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const invoiceRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.invoice.findMany({
            where: { orgId: user.orgId },
            include: { client: true, project: true, lineItems: true },
            orderBy: { date: "desc" },
        });
    }),

    create: protectedProcedure
        .input(z.object({
            clientId: z.string(),
            projectId: z.string(),
            date: z.string(),
            dueDate: z.string(),
            lineItems: z.array(z.object({ description: z.string(), qty: z.number(), rate: z.number() })),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            const count = await ctx.db.invoice.count({ where: { orgId: user.orgId } });
            const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
            const amount = input.lineItems.reduce((s, li) => s + li.qty * li.rate, 0);
            return ctx.db.invoice.create({
                data: {
                    number, amount, date: input.date, dueDate: input.dueDate, status: "draft",
                    clientId: input.clientId, projectId: input.projectId, orgId: user.orgId,
                    lineItems: { create: input.lineItems },
                },
                include: { client: true, project: true, lineItems: true },
            });
        }),

    updateStatus: protectedProcedure
        .input(z.object({ id: z.string(), status: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.invoice.update({ where: { id: input.id }, data: { status: input.status } });
        }),
});

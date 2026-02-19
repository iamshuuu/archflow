import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const teamRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.user.findMany({
            where: { orgId: user.orgId },
            include: { timeEntries: true },
            orderBy: { name: "asc" },
        });
    }),

    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            email: z.string().email(),
            phone: z.string().default(""),
            role: z.string().default("member"),
            title: z.string().default(""),
            costRate: z.number().default(0),
            billRate: z.number().default(0),
            targetUtil: z.number().default(75),
            password: z.string().default("changeme123"),
        }))
        .mutation(async ({ ctx, input }) => {
            const currentUser = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!currentUser) throw new Error("User not found");
            const { password, ...rest } = input;
            const { hashSync } = await import("bcryptjs");
            return ctx.db.user.create({
                data: { ...rest, passwordHash: hashSync(password, 10), orgId: currentUser.orgId },
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            role: z.string().optional(),
            title: z.string().optional(),
            costRate: z.number().optional(),
            billRate: z.number().optional(),
            targetUtil: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.user.update({ where: { id }, data });
        }),
});

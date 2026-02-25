import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";

export const settingsRouter = router({
    // ─── Organization Settings ───

    get: protectedProcedure.query(async ({ ctx }) => {
        const userId = (ctx.session.user as any).id;
        const user = await ctx.db.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        return ctx.db.organization.findUnique({ where: { id: user.orgId } });
    }),

    update: adminProcedure
        .input(
            z.object({
                name: z.string().optional(),
                address: z.string().optional(),
                website: z.string().optional(),
                phone: z.string().optional(),
                email: z.string().optional(),
                logoUrl: z.string().optional(),
                clientEmailSignature: z.string().optional(),
                timezone: z.string().optional(),
                locale: z.string().optional(),
                currency: z.string().optional(),
                unitOfMeasurement: z.string().optional(),
                overheadCosts: z.number().optional(),
                workingHoursPerYear: z.number().int().optional(),
                targetUtilization: z.number().optional(),
                targetRealization: z.number().optional(),
                permissionsJson: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = (ctx.session.user as any).id;
            const user = await ctx.db.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            return ctx.db.organization.update({
                where: { id: user.orgId },
                data: input,
            });
        }),

    // ─── Time Off Policies ───

    getTimeOffPolicies: protectedProcedure.query(async ({ ctx }) => {
        const userId = (ctx.session.user as any).id;
        const user = await ctx.db.user.findUnique({ where: { id: userId } });
        if (!user) return [];
        return ctx.db.timeOffPolicy.findMany({ where: { orgId: user.orgId } });
    }),

    createTimeOffPolicy: adminProcedure
        .input(z.object({ name: z.string(), type: z.string(), daysPerYear: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = (ctx.session.user as any).id;
            const user = await ctx.db.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            return ctx.db.timeOffPolicy.create({ data: { ...input, orgId: user.orgId } });
        }),

    deleteTimeOffPolicy: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.timeOffPolicy.delete({ where: { id: input.id } });
        }),

    // ─── Holidays ───

    getHolidays: protectedProcedure.query(async ({ ctx }) => {
        const userId = (ctx.session.user as any).id;
        const user = await ctx.db.user.findUnique({ where: { id: userId } });
        if (!user) return [];
        return ctx.db.holiday.findMany({ where: { orgId: user.orgId }, orderBy: { date: "asc" } });
    }),

    createHoliday: adminProcedure
        .input(z.object({ name: z.string(), date: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = (ctx.session.user as any).id;
            const user = await ctx.db.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            return ctx.db.holiday.create({ data: { ...input, orgId: user.orgId } });
        }),

    deleteHoliday: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.holiday.delete({ where: { id: input.id } });
        }),

    // ─── Default Roles (billing rates) ───

    getDefaultRoles: protectedProcedure.query(async ({ ctx }) => {
        const userId = (ctx.session.user as any).id;
        const user = await ctx.db.user.findUnique({ where: { id: userId } });
        if (!user) return [];
        return ctx.db.defaultRole.findMany({ where: { orgId: user.orgId } });
    }),

    createDefaultRole: adminProcedure
        .input(
            z.object({
                name: z.string(),
                defaultBillRate: z.number(),
                defaultCostRate: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = (ctx.session.user as any).id;
            const user = await ctx.db.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            return ctx.db.defaultRole.create({ data: { ...input, orgId: user.orgId } });
        }),

    updateDefaultRole: adminProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                defaultBillRate: z.number().optional(),
                defaultCostRate: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.defaultRole.update({ where: { id }, data });
        }),

    deleteDefaultRole: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.defaultRole.delete({ where: { id: input.id } });
        }),
});

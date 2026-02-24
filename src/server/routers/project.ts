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

    // includes milestones for Gantt
    schedule: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.project.findMany({
            where: { orgId: user.orgId, status: { in: ["active", "pipeline"] } },
            include: {
                client: true,
                phases: {
                    include: {
                        milestones: true,
                        timeEntries: { select: { hours: true } },
                    },
                },
            },
            orderBy: { startDate: "asc" },
        });
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.project.findUnique({
                where: { id: input.id },
                include: {
                    client: true,
                    phases: {
                        include: {
                            timeEntries: true,
                            milestones: true,
                        },
                    },
                },
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

    // Phase mutations for Gantt
    updatePhase: protectedProcedure
        .input(z.object({
            id: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            color: z.string().optional(),
            name: z.string().optional(),
            budgetHours: z.number().optional(),
            budgetAmount: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.phase.update({ where: { id }, data });
        }),

    // Milestone mutations
    addMilestone: protectedProcedure
        .input(z.object({
            phaseId: z.string(),
            projectId: z.string(),
            name: z.string().min(1),
            date: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.milestone.create({ data: input });
        }),

    updateMilestone: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            date: z.string().optional(),
            done: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.milestone.update({ where: { id }, data });
        }),

    deleteMilestone: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.milestone.delete({ where: { id: input.id } });
        }),

    // ─── Pipeline Stage ───
    updatePipelineStage: protectedProcedure
        .input(z.object({ id: z.string(), pipelineStage: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.project.update({
                where: { id: input.id },
                data: { pipelineStage: input.pipelineStage },
            });
        }),

    // ─── Project Templates ───
    listTemplates: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.projectTemplate.findMany({ where: { orgId: user.orgId } });
    }),

    createTemplate: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            description: z.string().default(""),
            defaultPhases: z.string().default("[]"),
            defaultType: z.string().default("Commercial"),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.projectTemplate.create({
                data: { ...input, orgId: user.orgId },
            });
        }),

    deleteTemplate: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.projectTemplate.delete({ where: { id: input.id } });
        }),

    createFromTemplate: protectedProcedure
        .input(z.object({
            templateId: z.string(),
            name: z.string().min(1),
            clientId: z.string(),
            contractValue: z.number().default(0),
            startDate: z.string().default(""),
            endDate: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");

            const template = await ctx.db.projectTemplate.findUnique({
                where: { id: input.templateId },
            });
            if (!template) throw new Error("Template not found");

            let phases: string[] = [];
            try { phases = JSON.parse(template.defaultPhases); } catch { }

            const project = await ctx.db.project.create({
                data: {
                    name: input.name,
                    clientId: input.clientId,
                    type: template.defaultType,
                    contractValue: input.contractValue,
                    startDate: input.startDate,
                    endDate: input.endDate,
                    status: "active",
                    orgId: user.orgId,
                    templateId: input.templateId,
                    phases: {
                        create: phases.map((name: string) => ({ name })),
                    },
                },
                include: { client: true, phases: true },
            });

            return project;
        }),

    // ─── Tasks ───
    listTasks: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.task.findMany({
                where: { projectId: input.projectId },
                include: { assignee: { select: { id: true, name: true } }, phase: { select: { id: true, name: true } } },
                orderBy: { sortOrder: "asc" },
            });
        }),

    createTask: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            phaseId: z.string(),
            title: z.string().min(1),
            assigneeId: z.string().optional(),
            dueDate: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const count = await ctx.db.task.count({ where: { projectId: input.projectId } });
            return ctx.db.task.create({
                data: { ...input, sortOrder: count },
                include: { assignee: { select: { id: true, name: true } }, phase: { select: { id: true, name: true } } },
            });
        }),

    updateTask: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            status: z.string().optional(),
            assigneeId: z.string().nullable().optional(),
            dueDate: z.string().optional(),
            sortOrder: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.task.update({
                where: { id },
                data,
                include: { assignee: { select: { id: true, name: true } }, phase: { select: { id: true, name: true } } },
            });
        }),

    deleteTask: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.task.delete({ where: { id: input.id } });
        }),
});

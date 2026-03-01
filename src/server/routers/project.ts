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
            type: z.string().optional(),
            contractValue: z.number().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            pipelineStage: z.string().optional(),
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

    // ─── Phase CRUD ───
    addPhase: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            name: z.string().min(1),
            budgetHours: z.number().default(0),
            budgetAmount: z.number().default(0),
            feeType: z.string().default("hourly"),
            startDate: z.string().default(""),
            endDate: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.phase.create({ data: input });
        }),

    deletePhase: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.phase.delete({ where: { id: input.id } });
        }),

    // ─── Performance Analytics ───
    performance: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
                include: {
                    phases: {
                        include: {
                            timeEntries: { select: { hours: true } },
                        },
                    },
                },
            });
            if (!project) return null;

            const phases = project.phases.map((ph) => {
                const usedHours = ph.timeEntries.reduce((s, te) => s + te.hours, 0);
                const burnPct = ph.budgetHours > 0 ? Math.round((usedHours / ph.budgetHours) * 100) : 0;
                const remaining = Math.max(0, ph.budgetHours - usedHours);
                return {
                    id: ph.id,
                    name: ph.name,
                    budgetHours: ph.budgetHours,
                    usedHours,
                    remaining,
                    burnPct,
                    budgetAmount: ph.budgetAmount,
                    feeType: ph.feeType,
                    startDate: ph.startDate,
                    endDate: ph.endDate,
                };
            });

            const totalBudget = phases.reduce((s, p) => s + p.budgetHours, 0);
            const totalUsed = phases.reduce((s, p) => s + p.usedHours, 0);
            const totalRemaining = phases.reduce((s, p) => s + p.remaining, 0);
            const overallBurn = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

            // Schedule variance — days elapsed vs planned
            let scheduleVariance = 0;
            if (project.startDate && project.endDate) {
                const start = new Date(project.startDate).getTime();
                const end = new Date(project.endDate).getTime();
                const now = Date.now();
                const totalDuration = end - start;
                const elapsed = now - start;
                if (totalDuration > 0) {
                    const expectedPct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
                    scheduleVariance = overallBurn - expectedPct; // positive = ahead, negative = behind
                }
            }

            return { phases, totalBudget, totalUsed, totalRemaining, overallBurn, scheduleVariance };
        }),

    // ─── Profit Analytics ───
    profit: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
                include: {
                    invoices: { select: { amount: true, status: true } },
                    phases: {
                        include: {
                            timeEntries: {
                                include: { user: { select: { costRate: true, billRate: true } } },
                            },
                        },
                    },
                    expenses: { select: { amount: true } },
                },
            });
            if (!project) return null;

            const revenue = project.invoices
                .filter((inv) => inv.status === "paid" || inv.status === "sent" || inv.status === "viewed")
                .reduce((s, inv) => s + inv.amount, 0);

            let laborCost = 0;
            let billableValue = 0;
            project.phases.forEach((ph) => {
                ph.timeEntries.forEach((te) => {
                    laborCost += te.hours * (te.user?.costRate || 0);
                    billableValue += te.hours * (te.user?.billRate || 0);
                });
            });

            const expenseCost = project.expenses.reduce((s, e) => s + e.amount, 0);
            const totalCost = laborCost + expenseCost;
            const grossProfit = revenue - totalCost;
            const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
            const multiplier = laborCost > 0 ? Math.round((revenue / laborCost) * 100) / 100 : 0;

            return {
                contractValue: project.contractValue,
                revenue,
                laborCost,
                expenseCost,
                totalCost,
                grossProfit,
                margin,
                multiplier,
                billableValue,
            };
        }),

    // ─── Project Files ───
    listFiles: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.projectFile.findMany({
                where: { projectId: input.projectId },
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                    phase: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            });
        }),

    addFile: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            name: z.string().min(1),
            url: z.string().default(""),
            fileType: z.string().default("other"),
            size: z.number().default(0),
            phaseId: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            return ctx.db.projectFile.create({
                data: { ...input, uploadedById: user.id, orgId: user.orgId },
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                    phase: { select: { id: true, name: true } },
                },
            });
        }),

    deleteFile: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.projectFile.delete({ where: { id: input.id } });
        }),

    // ─── Deliverables ───
    listDeliverables: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.deliverable.findMany({
                where: { projectId: input.projectId },
                include: {
                    assignee: { select: { id: true, name: true } },
                    phase: { select: { id: true, name: true } },
                },
                orderBy: [{ phaseId: "asc" }, { sortOrder: "asc" }],
            });
        }),

    createDeliverable: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            phaseId: z.string(),
            title: z.string().min(1),
            description: z.string().default(""),
            dueDate: z.string().default(""),
            assigneeId: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const count = await ctx.db.deliverable.count({ where: { projectId: input.projectId } });
            return ctx.db.deliverable.create({
                data: { ...input, sortOrder: count },
                include: {
                    assignee: { select: { id: true, name: true } },
                    phase: { select: { id: true, name: true } },
                },
            });
        }),

    updateDeliverable: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            status: z.string().optional(),
            dueDate: z.string().optional(),
            completedDate: z.string().optional(),
            assigneeId: z.string().nullable().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.deliverable.update({
                where: { id },
                data,
                include: {
                    assignee: { select: { id: true, name: true } },
                    phase: { select: { id: true, name: true } },
                },
            });
        }),

    deleteDeliverable: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.deliverable.delete({ where: { id: input.id } });
        }),
});

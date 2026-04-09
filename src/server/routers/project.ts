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

async function ensureProjectAccess(ctx: TRPCContext, orgId: string, projectId: string) {
    const project = await ctx.db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
    if (!project) throw new TRPCError({ code: "FORBIDDEN", message: "Project not found or inaccessible" });
}

async function ensurePhaseAccess(ctx: TRPCContext, orgId: string, phaseId: string) {
    const phase = await ctx.db.phase.findFirst({ where: { id: phaseId, project: { orgId } }, select: { id: true, projectId: true } });
    if (!phase) throw new TRPCError({ code: "FORBIDDEN", message: "Phase not found or inaccessible" });
    return phase;
}

async function ensureTemplateAccess(ctx: TRPCContext, orgId: string, templateId: string) {
    const template = await ctx.db.projectTemplate.findFirst({ where: { id: templateId, orgId } });
    if (!template) throw new TRPCError({ code: "FORBIDDEN", message: "Template not found or inaccessible" });
    return template;
}

function parseDateOnly(value: string) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function roundTo(value: number, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function computePlannedProgress(startDate: string, endDate: string, now = new Date()) {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 0;

    const totalDuration = end.getTime() - start.getTime();
    if (totalDuration <= 0) return 100;

    const elapsed = now.getTime() - start.getTime();
    return Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
}

export const projectRouter = router({
    clients: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.client.findMany({ where: { orgId: user.orgId }, orderBy: { name: "asc" } });
    }),

    budgets: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
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
        const user = await requireCurrentUser(ctx);
        return ctx.db.project.findMany({
            where: { orgId: user.orgId },
            include: {
                client: true,
                phases: {
                    include: {
                        timeEntries: { select: { hours: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }),

    // includes milestones for Gantt
    schedule: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
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
            const user = await requireCurrentUser(ctx);
            return ctx.db.project.findFirst({
                where: { id: input.id, orgId: user.orgId },
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
            const user = await requireCurrentUser(ctx);
            const client = await ctx.db.client.findFirst({ where: { id: input.clientId, orgId: user.orgId }, select: { id: true } });
            if (!client) throw new TRPCError({ code: "FORBIDDEN", message: "Client not found or inaccessible" });
            return ctx.db.project.create({
                data: { ...input, status: "active", orgId: user.orgId },
                include: { client: true },
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            status: z.enum(["active", "pipeline", "on-hold", "completed", "archived"]).optional(),
            type: z.string().optional(),
            contractValue: z.number().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            pipelineStage: z.enum(["lead", "proposal", "negotiation", "won", "lost"]).optional(),
            phase: z.string().optional(),
            progress: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const { id, ...data } = input;
            await ensureProjectAccess(ctx, user.orgId, id);
            return ctx.db.project.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.id);
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
            feeType: z.enum(["hourly", "fixed", "not-to-exceed"]).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const { id, ...data } = input;
            await ensurePhaseAccess(ctx, user.orgId, id);
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
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.projectId);
            const phase = await ensurePhaseAccess(ctx, user.orgId, input.phaseId);
            if (phase.projectId !== input.projectId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Phase does not belong to project" });
            }
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
            const user = await requireCurrentUser(ctx);
            const milestone = await ctx.db.milestone.findFirst({
                where: { id: input.id, project: { orgId: user.orgId } },
                select: { id: true },
            });
            if (!milestone) throw new TRPCError({ code: "FORBIDDEN", message: "Milestone not found or inaccessible" });
            const { id, ...data } = input;
            return ctx.db.milestone.update({ where: { id }, data });
        }),

    deleteMilestone: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const milestone = await ctx.db.milestone.findFirst({
                where: { id: input.id, project: { orgId: user.orgId } },
                select: { id: true },
            });
            if (!milestone) throw new TRPCError({ code: "FORBIDDEN", message: "Milestone not found or inaccessible" });
            return ctx.db.milestone.delete({ where: { id: input.id } });
        }),

    // ─── Pipeline Stage ───
    updatePipelineStage: protectedProcedure
        .input(z.object({
            id: z.string(),
            pipelineStage: z.enum(["lead", "proposal", "negotiation", "won", "lost"]),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.id);
            return ctx.db.project.update({
                where: { id: input.id },
                data: { pipelineStage: input.pipelineStage },
            });
        }),

    // ─── Project Templates ───
    listTemplates: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
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
            const user = await requireCurrentUser(ctx);
            return ctx.db.projectTemplate.create({
                data: { ...input, orgId: user.orgId },
            });
        }),

    deleteTemplate: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const result = await ctx.db.projectTemplate.deleteMany({ where: { id: input.id, orgId: user.orgId } });
            if (result.count === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Template not found or inaccessible" });
            return { success: true };
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
            const user = await requireCurrentUser(ctx);
            const client = await ctx.db.client.findFirst({ where: { id: input.clientId, orgId: user.orgId }, select: { id: true } });
            if (!client) throw new TRPCError({ code: "FORBIDDEN", message: "Client not found or inaccessible" });
            const template = await ensureTemplateAccess(ctx, user.orgId, input.templateId);

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
            const user = await requireCurrentUser(ctx);
            return ctx.db.task.findMany({
                where: { projectId: input.projectId, project: { orgId: user.orgId } },
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
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.projectId);
            const phase = await ensurePhaseAccess(ctx, user.orgId, input.phaseId);
            if (phase.projectId !== input.projectId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Phase does not belong to project" });
            }
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
            status: z.enum(["todo", "in-progress", "review", "done"]).optional(),
            assigneeId: z.string().nullable().optional(),
            dueDate: z.string().optional(),
            sortOrder: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const task = await ctx.db.task.findFirst({ where: { id: input.id, project: { orgId: user.orgId } }, select: { id: true } });
            if (!task) throw new TRPCError({ code: "FORBIDDEN", message: "Task not found or inaccessible" });
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
            const user = await requireCurrentUser(ctx);
            const task = await ctx.db.task.findFirst({ where: { id: input.id, project: { orgId: user.orgId } }, select: { id: true } });
            if (!task) throw new TRPCError({ code: "FORBIDDEN", message: "Task not found or inaccessible" });
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
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.projectId);
            return ctx.db.phase.create({ data: input });
        }),

    deletePhase: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            await ensurePhaseAccess(ctx, user.orgId, input.id);
            return ctx.db.phase.delete({ where: { id: input.id } });
        }),

    // ─── Performance Analytics ───
    performance: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const project = await ctx.db.project.findFirst({
                where: { id: input.projectId, orgId: user.orgId },
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

    budgetControl: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const project = await ctx.db.project.findFirst({
                where: { id: input.projectId, orgId: user.orgId },
                include: {
                    phases: {
                        include: {
                            timeEntries: {
                                include: {
                                    user: { select: { costRate: true, billRate: true } },
                                },
                            },
                        },
                    },
                    invoices: {
                        include: {
                            payments: { select: { amount: true } },
                        },
                    },
                    expenses: {
                        select: {
                            amount: true,
                            billable: true,
                            status: true,
                        },
                    },
                },
            });
            if (!project) return null;

            const now = new Date();
            const last30Days = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
            const projectPlannedProgress = computePlannedProgress(project.startDate, project.endDate, now);

            const phases = project.phases.map((ph) => {
                const usedHours = ph.timeEntries.reduce((sum, te) => sum + te.hours, 0);
                const recentHours = ph.timeEntries.reduce((sum, te) => {
                    const entryDate = parseDateOnly(te.date);
                    return entryDate && entryDate >= last30Days ? sum + te.hours : sum;
                }, 0);
                const burnPctRaw = ph.budgetHours > 0 ? (usedHours / ph.budgetHours) * 100 : 0;
                const burnPct = Math.round(burnPctRaw);
                const remainingHours = Math.max(0, ph.budgetHours - usedHours);
                const laborCost = ph.timeEntries.reduce((sum, te) => sum + te.hours * (te.user?.costRate || 0), 0);
                const billableValue = ph.timeEntries.reduce((sum, te) => sum + te.hours * (te.user?.billRate || 0), 0);
                const plannedProgress = computePlannedProgress(ph.startDate, ph.endDate, now);
                const actualProgress = ph.budgetHours > 0 ? Math.min(100, burnPctRaw) : 0;
                const scheduleVariance = Math.round(actualProgress - plannedProgress);

                let forecastHoursAtCompletion: number | null = null;
                const phaseStart = parseDateOnly(ph.startDate);
                const phaseEnd = parseDateOnly(ph.endDate);
                if (phaseStart && phaseEnd && usedHours > 0) {
                    const totalDays = Math.max(1, (phaseEnd.getTime() - phaseStart.getTime()) / 86400000 + 1);
                    const elapsedDays = Math.max(1, (Math.min(now.getTime(), phaseEnd.getTime()) - phaseStart.getTime()) / 86400000 + 1);
                    forecastHoursAtCompletion = roundTo((usedHours / elapsedDays) * totalDays, 1);
                }

                const projectedBurnPct = ph.budgetHours > 0 && forecastHoursAtCompletion !== null
                    ? Math.round((forecastHoursAtCompletion / ph.budgetHours) * 100)
                    : null;

                let status: "planned" | "active" | "at-risk" | "over-budget" | "complete" = "planned";
                if (burnPctRaw >= 100) status = usedHours > ph.budgetHours ? "over-budget" : "complete";
                else if (burnPctRaw >= 85 || scheduleVariance < -10) status = "at-risk";
                else if (usedHours > 0) status = "active";

                return {
                    id: ph.id,
                    name: ph.name,
                    feeType: ph.feeType,
                    budgetHours: ph.budgetHours,
                    budgetAmount: ph.budgetAmount,
                    usedHours: roundTo(usedHours, 1),
                    remainingHours: roundTo(remainingHours, 1),
                    burnPct,
                    recentHours: roundTo(recentHours, 1),
                    laborCost: roundTo(laborCost, 0),
                    billableValue: roundTo(billableValue, 0),
                    budgetRate: ph.budgetHours > 0 ? roundTo(ph.budgetAmount / ph.budgetHours, 0) : 0,
                    avgCostRate: usedHours > 0 ? roundTo(laborCost / usedHours, 0) : 0,
                    avgBillRate: usedHours > 0 ? roundTo(billableValue / usedHours, 0) : 0,
                    plannedProgress,
                    actualProgress: Math.round(actualProgress),
                    scheduleVariance,
                    forecastHoursAtCompletion,
                    projectedBurnPct,
                    startDate: ph.startDate,
                    endDate: ph.endDate,
                    status,
                };
            });

            const totalBudgetHours = phases.reduce((sum, ph) => sum + ph.budgetHours, 0);
            const totalBudgetAmount = phases.reduce((sum, ph) => sum + ph.budgetAmount, 0);
            const totalUsedHours = phases.reduce((sum, ph) => sum + ph.usedHours, 0);
            const totalRemainingHours = Math.max(0, totalBudgetHours - totalUsedHours);
            const overallBurn = totalBudgetHours > 0 ? Math.round((totalUsedHours / totalBudgetHours) * 100) : 0;
            const scheduleVariance = Math.round(overallBurn - projectPlannedProgress);
            const recentHours = phases.reduce((sum, ph) => sum + ph.recentHours, 0);
            const recentBurnRateHoursPerWeek = roundTo((recentHours / 30) * 7, 1);
            const budgetCoveragePct = project.contractValue > 0 ? Math.round((totalBudgetAmount / project.contractValue) * 100) : 0;
            const unallocatedContract = roundTo(project.contractValue - totalBudgetAmount, 0);

            const issuedInvoices = project.invoices.filter((invoice) => invoice.status !== "draft");
            const invoicedAmount = issuedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
            const draftAmount = project.invoices
                .filter((invoice) => invoice.status === "draft")
                .reduce((sum, invoice) => sum + invoice.amount, 0);
            const collectedAmount = project.invoices.reduce((sum, invoice) => {
                const paid = invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
                return sum + paid;
            }, 0);
            const outstandingAmount = roundTo(Math.max(0, invoicedAmount - collectedAmount), 0);
            const overdueAmount = roundTo(project.invoices
                .filter((invoice) => invoice.status === "overdue")
                .reduce((sum, invoice) => {
                    const paid = invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
                    return sum + Math.max(0, invoice.amount - paid);
                }, 0), 0);

            const laborCost = phases.reduce((sum, ph) => sum + ph.laborCost, 0);
            const billableValue = phases.reduce((sum, ph) => sum + ph.billableValue, 0);
            const expenseCost = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const reimbursableExpenses = project.expenses
                .filter((expense) => expense.billable)
                .reduce((sum, expense) => sum + expense.amount, 0);
            const nonBillableExpenses = expenseCost - reimbursableExpenses;
            const totalCost = laborCost + expenseCost;
            const grossProfit = roundTo(invoicedAmount - totalCost, 0);
            const cashPosition = roundTo(collectedAmount - totalCost, 0);
            const margin = invoicedAmount > 0 ? Math.round((grossProfit / invoicedAmount) * 100) : 0;
            const multiplier = laborCost > 0 ? roundTo(invoicedAmount / laborCost, 2) : 0;

            let projectedDepletionDate = "";
            if (recentBurnRateHoursPerWeek > 0 && totalRemainingHours > 0) {
                const weeksLeft = totalRemainingHours / recentBurnRateHoursPerWeek;
                projectedDepletionDate = new Date(now.getTime() + weeksLeft * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            }

            let forecastHoursAtCompletion: number | null = null;
            const projectStart = parseDateOnly(project.startDate);
            const projectEnd = parseDateOnly(project.endDate);
            if (projectStart && projectEnd && totalUsedHours > 0) {
                const totalDays = Math.max(1, (projectEnd.getTime() - projectStart.getTime()) / 86400000 + 1);
                const elapsedDays = Math.max(1, (Math.min(now.getTime(), projectEnd.getTime()) - projectStart.getTime()) / 86400000 + 1);
                forecastHoursAtCompletion = roundTo((totalUsedHours / elapsedDays) * totalDays, 1);
            }
            const projectedOverallBurn = totalBudgetHours > 0 && forecastHoursAtCompletion !== null
                ? Math.round((forecastHoursAtCompletion / totalBudgetHours) * 100)
                : overallBurn;

            return {
                summary: {
                    totalBudgetHours: roundTo(totalBudgetHours, 1),
                    totalBudgetAmount: roundTo(totalBudgetAmount, 0),
                    totalUsedHours: roundTo(totalUsedHours, 1),
                    totalRemainingHours: roundTo(totalRemainingHours, 1),
                    overallBurn,
                    scheduleVariance,
                    projectPlannedProgress,
                    recentBurnRateHoursPerWeek,
                    budgetCoveragePct,
                    unallocatedContract,
                    activePhaseCount: phases.filter((phase) => phase.status === "active").length,
                    atRiskPhaseCount: phases.filter((phase) => phase.status === "at-risk").length,
                    overBudgetPhaseCount: phases.filter((phase) => phase.status === "over-budget").length,
                },
                forecast: {
                    forecastHoursAtCompletion,
                    projectedOverallBurn,
                    projectedDepletionDate,
                },
                finances: {
                    contractValue: project.contractValue,
                    totalBudgetAmount: roundTo(totalBudgetAmount, 0),
                    invoicedAmount: roundTo(invoicedAmount, 0),
                    collectedAmount: roundTo(collectedAmount, 0),
                    outstandingAmount,
                    overdueAmount,
                    draftAmount: roundTo(draftAmount, 0),
                    laborCost: roundTo(laborCost, 0),
                    billableValue: roundTo(billableValue, 0),
                    expenseCost: roundTo(expenseCost, 0),
                    reimbursableExpenses: roundTo(reimbursableExpenses, 0),
                    nonBillableExpenses: roundTo(nonBillableExpenses, 0),
                    totalCost: roundTo(totalCost, 0),
                    grossProfit,
                    cashPosition,
                    margin,
                    multiplier,
                },
                phases,
            };
        }),

    // ─── Profit Analytics ───
    profit: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const project = await ctx.db.project.findFirst({
                where: { id: input.projectId, orgId: user.orgId },
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
            const user = await requireCurrentUser(ctx);
            return ctx.db.projectFile.findMany({
                where: { projectId: input.projectId, orgId: user.orgId },
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
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.projectId);
            if (input.phaseId) {
                const phase = await ensurePhaseAccess(ctx, user.orgId, input.phaseId);
                if (phase.projectId !== input.projectId) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Phase does not belong to project" });
                }
            }
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
            const user = await requireCurrentUser(ctx);
            const file = await ctx.db.projectFile.findFirst({ where: { id: input.id, orgId: user.orgId }, select: { id: true } });
            if (!file) throw new TRPCError({ code: "FORBIDDEN", message: "File not found or inaccessible" });
            return ctx.db.projectFile.delete({ where: { id: input.id } });
        }),

    // ─── Deliverables ───
    listDeliverables: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.deliverable.findMany({
                where: { projectId: input.projectId, project: { orgId: user.orgId } },
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
            const user = await requireCurrentUser(ctx);
            await ensureProjectAccess(ctx, user.orgId, input.projectId);
            const phase = await ensurePhaseAccess(ctx, user.orgId, input.phaseId);
            if (phase.projectId !== input.projectId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Phase does not belong to project" });
            }
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
            status: z.enum(["pending", "in-progress", "completed", "approved"]).optional(),
            dueDate: z.string().optional(),
            completedDate: z.string().optional(),
            assigneeId: z.string().nullable().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const deliverable = await ctx.db.deliverable.findFirst({ where: { id: input.id, project: { orgId: user.orgId } }, select: { id: true } });
            if (!deliverable) throw new TRPCError({ code: "FORBIDDEN", message: "Deliverable not found or inaccessible" });
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
            const user = await requireCurrentUser(ctx);
            const deliverable = await ctx.db.deliverable.findFirst({ where: { id: input.id, project: { orgId: user.orgId } }, select: { id: true } });
            if (!deliverable) throw new TRPCError({ code: "FORBIDDEN", message: "Deliverable not found or inaccessible" });
            return ctx.db.deliverable.delete({ where: { id: input.id } });
        }),
});

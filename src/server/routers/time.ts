import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, managerProcedure, type TRPCContext } from "../trpc";

async function requireCurrentUser(ctx: TRPCContext) {
    const email = ctx.session?.user?.email;
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    const user = await ctx.db.user.findUnique({ where: { email }, select: { id: true, orgId: true, role: true, name: true } });
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
    return user;
}

function canReviewTime(role: string) {
    return role === "owner" || role === "admin" || role === "manager";
}

function parseDateOnly(value: string) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid date" });
    return date;
}

function isoWeekRange(week: string) {
    const match = /^(\d{4})-W(\d{2})$/.exec(week);
    if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid ISO week" });
    const year = Number(match[1]);
    const weekNo = Number(match[2]);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (weekNo - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return {
        startDate: monday.toISOString().slice(0, 10),
        endDate: sunday.toISOString().slice(0, 10),
    };
}

async function ensureProjectPhase(ctx: TRPCContext, orgId: string, projectId: string, phaseId: string) {
    const phase = await ctx.db.phase.findFirst({
        where: { id: phaseId, projectId, project: { orgId } },
        select: { id: true, projectId: true, startDate: true, endDate: true },
    });
    if (!phase) throw new TRPCError({ code: "FORBIDDEN", message: "Project phase not found or inaccessible" });
    return phase;
}

function assertWithinPhase(date: string, phase: { startDate: string; endDate: string }) {
    if (!date) return;
    const target = parseDateOnly(date);
    const start = phase.startDate ? parseDateOnly(phase.startDate) : null;
    const end = phase.endDate ? parseDateOnly(phase.endDate) : null;
    if (start && target < start) throw new TRPCError({ code: "BAD_REQUEST", message: "Time date is before the phase start date" });
    if (end && target > end) throw new TRPCError({ code: "BAD_REQUEST", message: "Time date is after the phase end date" });
}

async function ensureOptionalWorkLinks(ctx: TRPCContext, orgId: string, input: { projectId: string; phaseId: string; deliverableId?: string; taskId?: string }) {
    if (input.deliverableId) {
        const deliverable = await ctx.db.deliverable.findFirst({
            where: { id: input.deliverableId, projectId: input.projectId, phaseId: input.phaseId, project: { orgId } },
            select: { id: true },
        });
        if (!deliverable) throw new TRPCError({ code: "BAD_REQUEST", message: "Deliverable must belong to the selected phase" });
    }

    if (input.taskId) {
        const task = await ctx.db.task.findFirst({
            where: { id: input.taskId, projectId: input.projectId, phaseId: input.phaseId, project: { orgId } },
            select: { id: true, deliverableId: true },
        });
        if (!task) throw new TRPCError({ code: "BAD_REQUEST", message: "Task must belong to the selected phase" });
        if (input.deliverableId && task.deliverableId !== input.deliverableId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Task must belong to the selected deliverable" });
        }
    }
}

async function syncTaskActualHours(ctx: TRPCContext, taskId?: string | null) {
    if (!taskId) return;
    const entries = await ctx.db.timeEntry.findMany({ where: { taskId }, select: { hours: true } });
    const actualHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    await ctx.db.task.update({ where: { id: taskId }, data: { actualHours } });
}

const timeEntryInclude = {
    project: { select: { id: true, name: true, contractValue: true } },
    phase: { select: { id: true, name: true, budgetHours: true, startDate: true, endDate: true } },
    user: { select: { id: true, name: true, title: true, billRate: true, costRate: true } },
    deliverable: { select: { id: true, title: true } },
    task: { select: { id: true, title: true, status: true, estimatedHours: true } },
};

export const timeRouter = router({
    approvalContext: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return { canApprove: canReviewTime(user.role), userId: user.id, role: user.role };
    }),

    projectOptions: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.project.findMany({
            where: { orgId: user.orgId, status: { not: "archived" } },
            select: {
                id: true,
                name: true,
                client: { select: { name: true } },
                phases: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                        assignments: { select: { userId: true } },
                        deliverables: {
                            select: {
                                id: true,
                                title: true,
                                tasks: { select: { id: true, title: true, assigneeId: true, status: true } },
                            },
                            orderBy: { sortOrder: "asc" },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        });
    }),

    getEntries: protectedProcedure
        .input(z.object({ startDate: z.string(), endDate: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.timeEntry.findMany({
                where: {
                    userId: user.id,
                    date: { gte: input.startDate, lte: input.endDate },
                },
                include: timeEntryInclude,
                orderBy: [{ date: "asc" }, { id: "asc" }],
            });
        }),

    weekMetrics: protectedProcedure
        .input(z.object({ startDate: z.string(), endDate: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const personalEntries = await ctx.db.timeEntry.findMany({
                where: { userId: user.id, date: { gte: input.startDate, lte: input.endDate } },
                include: { user: { select: { costRate: true, billRate: true } }, phase: { select: { budgetHours: true } } },
            });
            const teamEntries = canReviewTime(user.role)
                ? await ctx.db.timeEntry.findMany({
                    where: { user: { orgId: user.orgId }, date: { gte: input.startDate, lte: input.endDate } },
                    include: { user: { select: { costRate: true, billRate: true } } },
                })
                : [];

            const summarize = (entries: typeof personalEntries) => {
                const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
                const billableHours = entries.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours, 0);
                const approvedBillableHours = entries.filter((entry) => entry.billable && entry.status === "approved").reduce((sum, entry) => sum + entry.hours, 0);
                const laborCost = entries.reduce((sum, entry) => sum + entry.hours * (entry.user.costRate || 0), 0);
                const billableValue = entries.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours * (entry.user.billRate || 0), 0);
                return {
                    totalHours,
                    billableHours,
                    nonBillableHours: totalHours - billableHours,
                    approvedBillableHours,
                    draftHours: entries.filter((entry) => entry.status === "draft").reduce((sum, entry) => sum + entry.hours, 0),
                    submittedHours: entries.filter((entry) => entry.status === "submitted").reduce((sum, entry) => sum + entry.hours, 0),
                    approvedHours: entries.filter((entry) => entry.status === "approved").reduce((sum, entry) => sum + entry.hours, 0),
                    rejectedHours: entries.filter((entry) => entry.status === "rejected").reduce((sum, entry) => sum + entry.hours, 0),
                    utilization: Math.round((billableHours / 40) * 100),
                    laborCost,
                    billableValue,
                    realization: billableValue > 0 ? Math.round((approvedBillableHours / billableHours) * 100) : 0,
                };
            };

            return {
                personal: summarize(personalEntries),
                team: canReviewTime(user.role) ? summarize(teamEntries as any) : null,
            };
        }),

    logEntry: protectedProcedure
        .input(z.object({
            id: z.string().optional(),
            projectId: z.string(),
            phaseId: z.string(),
            deliverableId: z.string().optional(),
            taskId: z.string().optional(),
            date: z.string(),
            hours: z.number().min(0).max(24),
            notes: z.string().default(""),
            billable: z.boolean().default(true),
            entryType: z.enum(["regular", "pto", "holiday", "admin"]).default("regular"),
            activityType: z.enum(["design", "project-mgmt", "site-visit", "meeting", "admin", "other"]).default("design"),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const phase = await ensureProjectPhase(ctx, user.orgId, input.projectId, input.phaseId);
            assertWithinPhase(input.date, phase);
            await ensureOptionalWorkLinks(ctx, user.orgId, input);

            if (input.id) {
                const existing = await ctx.db.timeEntry.findFirst({ where: { id: input.id, userId: user.id }, select: { id: true, status: true, taskId: true } });
                if (!existing) throw new TRPCError({ code: "FORBIDDEN", message: "Time entry not found or inaccessible" });
                if (existing.status === "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Approved time cannot be edited" });
                const updated = await ctx.db.timeEntry.update({ where: { id: input.id }, data: { ...input, userId: user.id, status: "draft" }, include: timeEntryInclude });
                await syncTaskActualHours(ctx, existing.taskId);
                await syncTaskActualHours(ctx, updated.taskId);
                return updated;
            }

            const created = await ctx.db.timeEntry.create({
                data: { ...input, userId: user.id, status: "draft" },
                include: timeEntryInclude,
            });
            await syncTaskActualHours(ctx, created.taskId);
            return created;
        }),

    deleteEntry: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const entry = await ctx.db.timeEntry.findFirst({ where: { id: input.id, userId: user.id }, select: { id: true, status: true, taskId: true } });
            if (!entry) throw new TRPCError({ code: "FORBIDDEN", message: "Time entry not found or inaccessible" });
            if (entry.status === "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Approved time cannot be deleted" });
            const deleted = await ctx.db.timeEntry.delete({ where: { id: input.id } });
            await syncTaskActualHours(ctx, entry.taskId);
            return deleted;
        }),

    submit: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.timeEntry.updateMany({
                where: { id: { in: input.ids }, userId: user.id, status: { in: ["draft", "rejected"] } },
                data: { status: "submitted" },
            });
        }),

    ptoSummary: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        const members = await ctx.db.user.findMany({ where: { orgId: user.orgId } });
        return Promise.all(members.map(async (member) => {
            const ptoEntries = await ctx.db.timeEntry.findMany({ where: { userId: member.id, entryType: "pto" } });
            const ptoHours = ptoEntries.reduce((sum, entry) => sum + entry.hours, 0);
            return { id: member.id, name: member.name, ptoDays: ptoHours / 8, ptoHours };
        }));
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.timeEntry.findMany({
            where: canReviewTime(user.role) ? { user: { orgId: user.orgId } } : { userId: user.id },
            include: timeEntryInclude,
            orderBy: { date: "desc" },
            take: 300,
        });
    }),

    approve: managerProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.timeEntry.updateMany({
                where: { id: { in: input.ids }, user: { orgId: user.orgId }, status: "submitted" },
                data: { status: "approved" },
            });
        }),

    reject: managerProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.timeEntry.updateMany({
                where: { id: { in: input.ids }, user: { orgId: user.orgId }, status: "submitted" },
                data: { status: "rejected" },
            });
        }),

    bulkUpdate: protectedProcedure
        .input(z.object({ entries: z.array(z.object({ id: z.string(), hours: z.number().optional(), notes: z.string().optional(), billable: z.boolean().optional() })) }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            for (const entry of input.entries) {
                const { id, ...data } = entry;
                const existing = await ctx.db.timeEntry.findFirst({ where: { id, userId: user.id }, select: { id: true, status: true, taskId: true } });
                if (!existing || existing.status === "approved") continue;
                await ctx.db.timeEntry.update({ where: { id }, data });
                await syncTaskActualHours(ctx, existing.taskId);
            }
            return { count: input.entries.length };
        }),

    recentProjects: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        const recent = await ctx.db.timeEntry.findMany({
            where: { userId: user.id },
            select: { projectId: true, project: { select: { id: true, name: true } } },
            orderBy: { date: "desc" },
            take: 50,
        });
        const seen = new Set<string>();
        return recent.filter((row) => { if (seen.has(row.projectId)) return false; seen.add(row.projectId); return true; }).map((row) => row.project).slice(0, 5);
    }),

    submitWeek: protectedProcedure
        .input(z.object({ week: z.string(), totalHours: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const range = isoWeekRange(input.week);
            await ctx.db.timeEntry.updateMany({
                where: { userId: user.id, date: { gte: range.startDate, lte: range.endDate }, status: { in: ["draft", "rejected"] } },
                data: { status: "submitted" },
            });
            const existing = await ctx.db.timesheetSubmission.findFirst({ where: { userId: user.id, week: input.week } });
            if (existing) {
                return ctx.db.timesheetSubmission.update({ where: { id: existing.id }, data: { status: "submitted", totalHours: input.totalHours, submittedAt: new Date().toISOString(), notes: "" } });
            }
            return ctx.db.timesheetSubmission.create({ data: { userId: user.id, orgId: user.orgId, week: input.week, status: "submitted", totalHours: input.totalHours, submittedAt: new Date().toISOString() } });
        }),

    getMySubmissions: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.timesheetSubmission.findMany({ where: { userId: user.id }, orderBy: { week: "desc" }, take: 20 });
    }),

    getTeamSubmissions: managerProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.timesheetSubmission.findMany({
            where: { orgId: user.orgId },
            include: { user: { select: { id: true, name: true, email: true, title: true } } },
            orderBy: { week: "desc" },
            take: 100,
        });
    }),

    approveWeek: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await requireCurrentUser(ctx);
            const submission = await ctx.db.timesheetSubmission.findFirst({ where: { id: input.id, orgId: reviewer.orgId } });
            if (!submission) throw new TRPCError({ code: "FORBIDDEN", message: "Timesheet not found or inaccessible" });
            const range = isoWeekRange(submission.week);
            await ctx.db.timeEntry.updateMany({ where: { userId: submission.userId, date: { gte: range.startDate, lte: range.endDate }, status: "submitted" }, data: { status: "approved" } });
            return ctx.db.timesheetSubmission.update({ where: { id: input.id }, data: { status: "approved", reviewedBy: reviewer.name, reviewedAt: new Date().toISOString() } });
        }),

    rejectWeek: managerProcedure
        .input(z.object({ id: z.string(), notes: z.string().default("") }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await requireCurrentUser(ctx);
            const submission = await ctx.db.timesheetSubmission.findFirst({ where: { id: input.id, orgId: reviewer.orgId } });
            if (!submission) throw new TRPCError({ code: "FORBIDDEN", message: "Timesheet not found or inaccessible" });
            const range = isoWeekRange(submission.week);
            await ctx.db.timeEntry.updateMany({ where: { userId: submission.userId, date: { gte: range.startDate, lte: range.endDate }, status: "submitted" }, data: { status: "rejected" } });
            return ctx.db.timesheetSubmission.update({ where: { id: input.id }, data: { status: "rejected", reviewedBy: reviewer.name, reviewedAt: new Date().toISOString(), notes: input.notes } });
        }),

    requestTimeOff: protectedProcedure
        .input(z.object({ type: z.string(), startDate: z.string(), endDate: z.string(), hours: z.number(), notes: z.string().default("") }))
        .mutation(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            return ctx.db.timeOffRequest.create({ data: { ...input, userId: user.id, orgId: user.orgId } });
        }),

    getMyTimeOffRequests: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.timeOffRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    }),

    getTeamTimeOffRequests: managerProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.timeOffRequest.findMany({ where: { orgId: user.orgId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } });
    }),

    approveTimeOff: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await requireCurrentUser(ctx);
            return ctx.db.timeOffRequest.update({ where: { id: input.id }, data: { status: "approved", reviewedBy: reviewer.name, reviewedAt: new Date().toISOString() } });
        }),

    rejectTimeOff: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const reviewer = await requireCurrentUser(ctx);
            return ctx.db.timeOffRequest.update({ where: { id: input.id }, data: { status: "rejected", reviewedBy: reviewer.name, reviewedAt: new Date().toISOString() } });
        }),
});

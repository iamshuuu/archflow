import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
    // ─── Firm-wide KPIs ───
    firmKPIs: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({
            where: { email: ctx.session!.user!.email! },
            include: { org: true },
        });
        if (!user) return null;
        const orgId = user.orgId;

        // Fetch all data in parallel
        const [team, invoices, expenses, timeEntries, allocations] = await Promise.all([
            ctx.db.user.findMany({ where: { orgId }, include: { timeEntries: true } }),
            ctx.db.invoice.findMany({ where: { orgId } }),
            ctx.db.expense.findMany({ where: { userId: { in: (await ctx.db.user.findMany({ where: { orgId }, select: { id: true } })).map(u => u.id) } } }),
            ctx.db.timeEntry.findMany({ where: { userId: { in: (await ctx.db.user.findMany({ where: { orgId }, select: { id: true } })).map(u => u.id) } } }),
            ctx.db.allocation.findMany({ where: { userId: { in: (await ctx.db.user.findMany({ where: { orgId }, select: { id: true } })).map(u => u.id) } } }),
        ]);

        const projects = await ctx.db.project.findMany({
            where: { orgId },
            include: { phases: { include: { timeEntries: true } } },
        });

        // --- Operating Profit ---
        const totalPaidRevenue = invoices
            .filter(i => i.status === "paid")
            .reduce((s, i) => s + i.amount, 0);
        const avgCostRate = team.length > 0
            ? team.reduce((s, m) => s + m.costRate, 0) / team.length
            : 55;
        const totalHoursAll = timeEntries.reduce((s, te) => s + te.hours, 0);
        const totalLaborCost = totalHoursAll * avgCostRate;
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const operatingProfit = totalPaidRevenue - totalLaborCost - totalExpenses;

        // --- Utilization ---
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        const monthEntries = timeEntries.filter(e => e.date >= startOfMonth && e.date <= endOfMonth);
        const billableHours = monthEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
        const workingDaysInMonth = 22;
        const dailyHours = 8;
        const totalCapacityHours = team.length * workingDaysInMonth * dailyHours;
        const utilization = totalCapacityHours > 0 ? Math.round((billableHours / totalCapacityHours) * 100) : 0;

        // --- Projected Profit ---
        const totalContractValue = projects
            .filter(p => p.status === "active" || p.status === "pipeline")
            .reduce((s, p) => s + p.contractValue, 0);
        const totalBudgetHours = projects.reduce((s, p) =>
            s + p.phases.reduce((ps, ph) => ps + ph.budgetHours, 0), 0);
        const hoursUsed = projects.reduce((s, p) =>
            s + p.phases.reduce((ps, ph) => ps + ph.timeEntries.reduce((ts, te) => ts + te.hours, 0), 0), 0);
        const remainingHours = Math.max(0, totalBudgetHours - hoursUsed);
        const estimatedRemainingCost = remainingHours * avgCostRate;
        const projectedProfit = totalContractValue - totalLaborCost - estimatedRemainingCost - totalExpenses;

        // --- Firm Capacity ---
        const isoWeek = getISOWeek(now);
        const currentWeekAllocated = allocations
            .filter(a => a.week === isoWeek)
            .reduce((s, a) => s + a.plannedHours, 0);
        const weeklyCapacity = team.length * 40;
        const availableHours = Math.max(0, weeklyCapacity - currentWeekAllocated);

        // --- Hours This Week vs Last ---
        const monday = getMondayOfWeek(now);
        const lastMonday = new Date(monday);
        lastMonday.setDate(lastMonday.getDate() - 7);
        const thisWeekStart = monday.toISOString().split("T")[0];
        const thisWeekEnd = new Date(monday.getTime() + 6 * 86400000).toISOString().split("T")[0];
        const lastWeekStart = lastMonday.toISOString().split("T")[0];
        const lastWeekEnd = new Date(lastMonday.getTime() + 6 * 86400000).toISOString().split("T")[0];

        const hoursThisWeek = timeEntries
            .filter(e => e.date >= thisWeekStart && e.date <= thisWeekEnd)
            .reduce((s, e) => s + e.hours, 0);
        const hoursLastWeek = timeEntries
            .filter(e => e.date >= lastWeekStart && e.date <= lastWeekEnd)
            .reduce((s, e) => s + e.hours, 0);
        const weekOverWeekDelta = hoursLastWeek > 0
            ? Math.round(((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100)
            : 0;

        // --- Team Workload ---
        const teamWorkload = team.map(m => {
            const memberEntries = timeEntries.filter(e => e.userId === m.id && e.date >= thisWeekStart && e.date <= thisWeekEnd);
            const hrs = memberEntries.reduce((s, e) => s + e.hours, 0);
            const billable = memberEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
            return {
                id: m.id,
                name: m.name,
                title: m.title,
                hoursThisWeek: Math.round(hrs * 10) / 10,
                billableHours: Math.round(billable * 10) / 10,
                utilization: 40 > 0 ? Math.round((billable / 40) * 100) : 0,
                targetUtil: m.targetUtil,
            };
        });

        // --- Onboarding Checklist ---
        const org = user.org;
        const hasOrgSettings = !!(org.address || org.phone || org.website);
        const hasTeamMembers = team.length > 1;
        const hasClients = (await ctx.db.client.count({ where: { orgId } })) > 0;
        const hasProjects = projects.length > 0;
        const hasTimesheet = timeEntries.length > 0;
        const hasInvoice = invoices.length > 0;

        const onboarding = {
            steps: [
                { key: "org_settings", label: "Configure organization settings", done: hasOrgSettings, href: "/dashboard/settings", est: "2 min" },
                { key: "team", label: "Add team members", done: hasTeamMembers, href: "/dashboard/team", est: "3 min" },
                { key: "clients", label: "Add your first client", done: hasClients, href: "/dashboard/clients", est: "2 min" },
                { key: "project", label: "Create a project", done: hasProjects, href: "/dashboard/projects", est: "3 min" },
                { key: "timesheet", label: "Log your first timesheet", done: hasTimesheet, href: "/dashboard/time", est: "2 min" },
                { key: "invoice", label: "Send your first invoice", done: hasInvoice, href: "/dashboard/invoices", est: "3 min" },
            ],
            completedCount: [hasOrgSettings, hasTeamMembers, hasClients, hasProjects, hasTimesheet, hasInvoice].filter(Boolean).length,
            totalCount: 6,
        };

        // --- Monthly Revenue (real data) ---
        const monthlyRevenue: { month: string; invoiced: number; paid: number }[] = [];
        for (let m = 0; m < 12; m++) {
            const yr = now.getFullYear();
            const start = `${yr}-${String(m + 1).padStart(2, "0")}-01`;
            const end = `${yr}-${String(m + 1).padStart(2, "0")}-${new Date(yr, m + 1, 0).getDate()}`;
            const monthInvoices = invoices.filter(i => i.date >= start && i.date <= end);
            monthlyRevenue.push({
                month: new Date(yr, m).toLocaleString("en", { month: "short" }),
                invoiced: monthInvoices.reduce((s, i) => s + i.amount, 0),
                paid: monthInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0),
            });
        }

        return {
            operatingProfit,
            utilization,
            projectedProfit,
            availableHours,
            weeklyCapacity,
            hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
            hoursLastWeek: Math.round(hoursLastWeek * 10) / 10,
            weekOverWeekDelta,
            teamWorkload,
            onboarding,
            monthlyRevenue,
            totalPaidRevenue,
            totalExpenses,
            teamCount: team.length,
            activeProjects: projects.filter(p => p.status === "active").length,
        };
    }),

    // ─── Revenue Forecast ───
    revenueForecast: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return { pipeline: [], monthlyForecast: [] };
        const orgId = user.orgId;

        const projects = await ctx.db.project.findMany({
            where: { orgId },
            include: { client: true },
        });

        // Pipeline probabilities
        const stageProbability: Record<string, number> = {
            lead: 0.10,
            proposal: 0.25,
            negotiation: 0.50,
            won: 1.0,
            lost: 0,
        };

        const pipeline = projects
            .filter(p => p.status === "active" || p.status === "pipeline")
            .map(p => ({
                id: p.id,
                name: p.name,
                client: p.client?.name || "—",
                stage: p.pipelineStage,
                contractValue: p.contractValue,
                probability: stageProbability[p.pipelineStage] ?? 0,
                weightedValue: Math.round(p.contractValue * (stageProbability[p.pipelineStage] ?? 0)),
                expectedClose: p.endDate || "—",
            }));

        // Monthly forecast for next 6 months
        const now = new Date();
        const monthlyForecast: { month: string; projected: number; confirmed: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthStr = futureDate.toLocaleString("en", { month: "short", year: "2-digit" });
            const start = futureDate.toISOString().split("T")[0];
            const end = new Date(futureDate.getFullYear(), futureDate.getMonth() + 1, 0).toISOString().split("T")[0];

            // Projects ending in this month
            const endingProjects = projects.filter(p => p.endDate >= start && p.endDate <= end);
            const confirmed = endingProjects
                .filter(p => p.pipelineStage === "won" || p.status === "active")
                .reduce((s, p) => s + p.contractValue, 0);
            const projected = endingProjects
                .reduce((s, p) => s + p.contractValue * (stageProbability[p.pipelineStage] ?? 0), 0);

            monthlyForecast.push({ month: monthStr, projected: Math.round(projected), confirmed: Math.round(confirmed) });
        }

        return {
            pipeline: pipeline.sort((a, b) => b.weightedValue - a.weightedValue),
            monthlyForecast,
            totalPipelineValue: pipeline.reduce((s, p) => s + p.contractValue, 0),
            totalWeightedValue: pipeline.reduce((s, p) => s + p.weightedValue, 0),
        };
    }),

    // ─── Project Retrospectives ───
    retrospectives: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        const orgId = user.orgId;

        const projects = await ctx.db.project.findMany({
            where: { orgId },
            include: {
                client: true,
                phases: { include: { timeEntries: true } },
                invoices: true,
            },
        });

        return projects.map(p => {
            const budgetHours = p.phases.reduce((s, ph) => s + ph.budgetHours, 0);
            const actualHours = p.phases.reduce((s, ph) =>
                s + ph.timeEntries.reduce((ts, te) => ts + te.hours, 0), 0);
            const budgetAmount = p.phases.reduce((s, ph) => s + ph.budgetAmount, 0);
            const invoicedAmount = p.invoices.reduce((s, inv) => s + inv.amount, 0);
            const hoursVariance = budgetHours > 0 ? Math.round(((actualHours - budgetHours) / budgetHours) * 100) : 0;
            const amountVariance = budgetAmount > 0 ? Math.round(((invoicedAmount - budgetAmount) / budgetAmount) * 100) : 0;

            // Schedule status
            const now = new Date();
            const endDate = p.endDate ? new Date(p.endDate) : null;
            let scheduleStatus: "on-time" | "behind" | "ahead" | "completed" | "no-date" = "no-date";
            if (p.status === "completed") scheduleStatus = "completed";
            else if (endDate) {
                const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
                const progressPct = budgetHours > 0 ? (actualHours / budgetHours) * 100 : 0;
                if (daysRemaining < 0) scheduleStatus = "behind";
                else if (progressPct > 90 && daysRemaining > 14) scheduleStatus = "ahead";
                else scheduleStatus = "on-time";
            }

            return {
                id: p.id,
                name: p.name,
                client: p.client?.name || "—",
                status: p.status,
                budgetHours,
                actualHours: Math.round(actualHours * 10) / 10,
                hoursVariance,
                budgetAmount,
                invoicedAmount,
                amountVariance,
                scheduleStatus,
                endDate: p.endDate || "—",
                contractValue: p.contractValue,
            };
        });
    }),
});

// ─── Helpers ───

function getISOWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

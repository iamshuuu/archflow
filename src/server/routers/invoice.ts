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
            notes: z.string().default(""),
            paymentUrl: z.string().default(""),
            paymentTerms: z.string().default("net30"),
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
                    notes: input.notes, paymentUrl: input.paymentUrl, paymentTerms: input.paymentTerms,
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

    // ─── Unbilled Work ───
    unbilledWork: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        // Get all billable time entries
        const entries = await ctx.db.timeEntry.findMany({
            where: { project: { orgId: user.orgId }, billable: true },
            include: { user: { select: { name: true, billRate: true } }, project: { select: { id: true, name: true } }, phase: { select: { name: true } } },
            orderBy: { date: "desc" },
        });
        // Get all invoiced time ranges (by project)
        const invoices = await ctx.db.invoice.findMany({
            where: { orgId: user.orgId, status: { not: "draft" } },
            select: { projectId: true, date: true },
        });
        const invoicedProjectIds = new Set(invoices.map((i: any) => i.projectId));
        // Group by project, sum hours and value
        const projectMap: Record<string, { projectId: string; projectName: string; entries: any[]; totalHours: number; totalValue: number }> = {};
        for (const e of entries as any[]) {
            const pid = e.project?.id;
            if (!pid) continue;
            if (!projectMap[pid]) {
                projectMap[pid] = { projectId: pid, projectName: e.project?.name || "", entries: [], totalHours: 0, totalValue: 0 };
            }
            const rate = e.user?.billRate || 150;
            projectMap[pid].entries.push({ ...e, rate });
            projectMap[pid].totalHours += e.hours;
            projectMap[pid].totalValue += e.hours * rate;
        }
        return Object.values(projectMap);
    }),

    // ─── AR Aging ───
    arAging: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return { current: [], bucket30: [], bucket60: [], bucket90: [], bucket90plus: [], totals: { current: 0, bucket30: 0, bucket60: 0, bucket90: 0, bucket90plus: 0 } };
        const invoices = await ctx.db.invoice.findMany({
            where: { orgId: user.orgId, status: { in: ["sent", "viewed", "overdue"] } },
            include: { client: true, project: true, payments: true },
            orderBy: { dueDate: "asc" },
        });
        const today = new Date();
        const buckets = { current: [] as any[], bucket30: [] as any[], bucket60: [] as any[], bucket90: [] as any[], bucket90plus: [] as any[] };
        const totals = { current: 0, bucket30: 0, bucket60: 0, bucket90: 0, bucket90plus: 0 };
        for (const inv of invoices as any[]) {
            const paid = (inv.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
            const balance = inv.amount - paid;
            if (balance <= 0) continue;
            const dueDate = new Date(inv.dueDate);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
            const item = { ...inv, balance, daysOverdue };
            if (daysOverdue <= 0) { buckets.current.push(item); totals.current += balance; }
            else if (daysOverdue <= 30) { buckets.bucket30.push(item); totals.bucket30 += balance; }
            else if (daysOverdue <= 60) { buckets.bucket60.push(item); totals.bucket60 += balance; }
            else if (daysOverdue <= 90) { buckets.bucket90.push(item); totals.bucket90 += balance; }
            else { buckets.bucket90plus.push(item); totals.bucket90plus += balance; }
        }
        return { ...buckets, totals };
    }),

    // ─── Payments ───
    listPayments: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return [];
        return ctx.db.payment.findMany({
            where: { orgId: user.orgId },
            include: { invoice: { include: { client: true, project: true } } },
            orderBy: { date: "desc" },
        });
    }),

    recordPayment: protectedProcedure
        .input(z.object({
            invoiceId: z.string(),
            amount: z.number(),
            date: z.string(),
            method: z.string().default("check"),
            reference: z.string().default(""),
            notes: z.string().default(""),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            const payment = await ctx.db.payment.create({
                data: { ...input, orgId: user.orgId },
                include: { invoice: { include: { client: true, project: true, payments: true } } },
            });
            // Auto-mark invoice as paid if fully paid
            const totalPaid = (payment.invoice.payments as any[]).reduce((s: number, p: any) => s + p.amount, 0);
            if (totalPaid >= payment.invoice.amount) {
                await ctx.db.invoice.update({ where: { id: input.invoiceId }, data: { status: "paid" } });
            }
            return payment;
        }),

    // Generate invoice from unbilled time entries
    generateFromTime: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            fromDate: z.string(),
            toDate: z.string(),
            rate: z.number().default(150),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: { email: ctx.session!.user!.email! },
                include: { org: true },
            });
            if (!user) throw new Error("User not found");

            // Find unbilled time entries for the project within date range
            const entries = await ctx.db.timeEntry.findMany({
                where: {
                    projectId: input.projectId,
                    date: { gte: input.fromDate, lte: input.toDate },
                    billable: true,
                },
                include: { user: { select: { name: true } } },
                orderBy: { date: "asc" },
            });

            if (entries.length === 0) throw new Error("No billable time entries found in range");

            // Group entries by user
            const byUser: Record<string, { hours: number; entries: string[] }> = {};
            entries.forEach((e: any) => {
                const name = e.user?.name || "Unknown";
                if (!byUser[name]) byUser[name] = { hours: 0, entries: [] };
                byUser[name].hours += e.hours;
                byUser[name].entries.push(`${e.date}: ${e.description || "Work"} (${e.hours}h)`);
            });

            const lineItems = Object.entries(byUser).map(([name, data]) => ({
                description: `${name} — ${data.hours}h (${input.fromDate} to ${input.toDate})`,
                qty: data.hours,
                rate: input.rate,
            }));

            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
                include: { client: true },
            });
            if (!project) throw new Error("Project not found");

            const count = await ctx.db.invoice.count({ where: { orgId: user.orgId } });
            const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
            const amount = lineItems.reduce((s, li) => s + li.qty * li.rate, 0);
            const today = new Date().toISOString().slice(0, 10);
            const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

            return ctx.db.invoice.create({
                data: {
                    number, amount, date: today, dueDate: due, status: "draft",
                    clientId: project.clientId, projectId: input.projectId, orgId: user.orgId,
                    notes: `Generated from time entries: ${input.fromDate} to ${input.toDate}`,
                    lineItems: { create: lineItems },
                },
                include: { client: true, project: true, lineItems: true },
            });
        }),

    // Batch create invoices for multiple projects
    batchCreate: protectedProcedure
        .input(z.object({
            projectIds: z.array(z.string()),
            fromDate: z.string(),
            toDate: z.string(),
            rate: z.number().default(150),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");
            const results: any[] = [];

            for (const projectId of input.projectIds) {
                const entries = await ctx.db.timeEntry.findMany({
                    where: {
                        projectId,
                        date: { gte: input.fromDate, lte: input.toDate },
                        billable: true,
                    },
                    include: { user: { select: { name: true } } },
                });

                if (entries.length === 0) continue;

                const byUser: Record<string, number> = {};
                entries.forEach((e: any) => {
                    const name = e.user?.name || "Unknown";
                    byUser[name] = (byUser[name] || 0) + e.hours;
                });

                const lineItems = Object.entries(byUser).map(([name, hours]) => ({
                    description: `${name} — ${hours}h`,
                    qty: hours,
                    rate: input.rate,
                }));

                const project = await ctx.db.project.findUnique({
                    where: { id: projectId },
                    include: { client: true },
                });
                if (!project) continue;

                const count = await ctx.db.invoice.count({ where: { orgId: user.orgId } });
                const number = `INV-${new Date().getFullYear()}-${String(count + results.length + 1).padStart(3, "0")}`;
                const amount = lineItems.reduce((s, li) => s + li.qty * li.rate, 0);
                const today = new Date().toISOString().slice(0, 10);
                const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

                const invoice = await ctx.db.invoice.create({
                    data: {
                        number, amount, date: today, dueDate: due, status: "draft",
                        clientId: project.clientId, projectId, orgId: user.orgId,
                        notes: `Batch generated: ${input.fromDate} to ${input.toDate}`,
                        lineItems: { create: lineItems },
                    },
                    include: { client: true, project: true, lineItems: true },
                });
                results.push(invoice);
            }

            return results;
        }),

    // PDF generation — returns HTML string for client-side rendering/download
    generatePdf: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const invoice = await ctx.db.invoice.findUnique({
                where: { id: input.id },
                include: { client: true, project: true, lineItems: true, org: true },
            });
            if (!invoice) throw new Error("Invoice not found");

            // Get template
            const template = await ctx.db.invoiceTemplate.findFirst({
                where: { orgId: invoice.orgId, isDefault: true },
            }) || {
                companyName: (invoice as any).org?.name || "ArchFlow Studio",
                address: "", phone: "", email: "",
                headerText: "", footerText: "Payment is due within 30 days.",
                accentColor: "#B07A4A", logo: "",
            };

            const orgLocale = (invoice as any).org?.locale || "en-US";
            const orgCurrency = (invoice as any).org?.currency || "USD";
            const formatMoney = (value: number) => {
                try {
                    return new Intl.NumberFormat(orgLocale, {
                        style: "currency",
                        currency: orgCurrency,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(value);
                } catch {
                    return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(value);
                }
            };

            const lineItemsHtml = invoice.lineItems.map((li) => `
                <tr>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#333">${li.description}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:center">${li.qty}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right">${formatMoney(li.rate)}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;font-weight:600">${formatMoney(li.qty * li.rate)}</td>
                </tr>
            `).join("");

            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${invoice.number}</title>
<style>
body { font-family: 'Segoe UI', system-ui, sans-serif; margin:0; padding:40px; color:#333; background:#fff; }
.header { display:flex; justify-content:space-between; margin-bottom:40px; }
.company { font-size:20px; font-weight:700; color:${(template as any).accentColor}; }
.invoice-title { font-size:28px; font-weight:300; color:#333; text-align:right; }
.invoice-number { font-size:14px; color:#888; text-align:right; }
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:30px; }
.info-box h4 { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#999; margin:0 0 8px; }
.info-box p { font-size:13px; margin:2px 0; }
table { width:100%; border-collapse:collapse; margin:20px 0; }
th { background:${(template as any).accentColor}10; color:${(template as any).accentColor}; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; padding:10px 12px; text-align:left; }
th:nth-child(2) { text-align:center; } th:nth-child(3), th:nth-child(4) { text-align:right; }
.total-row { font-size:18px; font-weight:700; color:${(template as any).accentColor}; text-align:right; padding:16px 12px; border-top:2px solid ${(template as any).accentColor}; }
.footer { margin-top:40px; padding-top:20px; border-top:1px solid #eee; font-size:11px; color:#999; text-align:center; }
.notes { margin-top:24px; padding:16px; background:#f9f9f7; border-radius:8px; font-size:12px; color:#666; }
@media print { body { padding:20px; } }
</style></head>
<body>
<div class="header">
    <div>
        ${(template as any).logo ? `<img src="${(template as any).logo}" style="height:40px;margin-bottom:8px" />` : ""}
        <div class="company">${(template as any).companyName}</div>
        <p style="font-size:11px;color:#999;margin:4px 0">${(template as any).address}</p>
        ${(template as any).phone ? `<p style="font-size:11px;color:#999;margin:2px 0">${(template as any).phone}</p>` : ""}
        ${(template as any).email ? `<p style="font-size:11px;color:#999;margin:2px 0">${(template as any).email}</p>` : ""}
    </div>
    <div>
        <div class="invoice-title">Invoice</div>
        <div class="invoice-number">${invoice.number}</div>
    </div>
</div>
${(template as any).headerText ? `<p style="font-size:13px;color:#666;margin-bottom:20px">${(template as any).headerText}</p>` : ""}
<div class="info-grid">
    <div class="info-box">
        <h4>Bill To</h4>
        <p style="font-weight:600">${(invoice as any).client?.name || "—"}</p>
    </div>
    <div class="info-box" style="text-align:right">
        <h4>Details</h4>
        <p>Project: ${(invoice as any).project?.name || "—"}</p>
        <p>Date: ${invoice.date}</p>
        <p>Due: ${invoice.dueDate}</p>
        <p>Status: ${invoice.status.toUpperCase()}</p>
    </div>
</div>
<table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${lineItemsHtml}</tbody>
</table>
<div class="total-row">Total: ${formatMoney(invoice.amount)}</div>
${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}
${invoice.paymentUrl ? `<p style="margin-top:16px;font-size:13px">Pay online: <a href="${invoice.paymentUrl}" style="color:${(template as any).accentColor}">${invoice.paymentUrl}</a></p>` : ""}
<div class="footer">${(template as any).footerText}</div>
</body></html>`;

            return { html, number: invoice.number };
        }),

    // Template management
    getTemplate: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
        if (!user) return null;
        return ctx.db.invoiceTemplate.findFirst({
            where: { orgId: user.orgId, isDefault: true },
        });
    }),

    saveTemplate: protectedProcedure
        .input(z.object({
            id: z.string().optional(),
            name: z.string().default("Default"),
            logo: z.string().default(""),
            companyName: z.string().default(""),
            address: z.string().default(""),
            phone: z.string().default(""),
            email: z.string().default(""),
            headerText: z.string().default(""),
            footerText: z.string().default("Payment is due within 30 days."),
            accentColor: z.string().default("#B07A4A"),
        }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: ctx.session!.user!.email! } });
            if (!user) throw new Error("User not found");

            if (input.id) {
                return ctx.db.invoiceTemplate.update({
                    where: { id: input.id },
                    data: { ...input, id: undefined },
                });
            }

            // Upsert: find existing default or create
            const existing = await ctx.db.invoiceTemplate.findFirst({
                where: { orgId: user.orgId, isDefault: true },
            });

            if (existing) {
                return ctx.db.invoiceTemplate.update({
                    where: { id: existing.id },
                    data: { ...input, id: undefined },
                });
            }

            return ctx.db.invoiceTemplate.create({
                data: { ...input, id: undefined, orgId: user.orgId, isDefault: true },
            });
        }),
});

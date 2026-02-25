import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();
const pw = hashSync("password123", 10);

/* ─── helpers ─── */
const d = (offset: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split("T")[0];
};
const isoWeek = (offset: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offset * 7);
    const jan1 = new Date(dt.getFullYear(), 0, 1);
    const days = Math.floor((dt.getTime() - jan1.getTime()) / 86400000);
    const wk = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${dt.getFullYear()}-W${String(wk).padStart(2, "0")}`;
};

async function main() {
    /* ═══ CLEAN ═══ */
    await prisma.task.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.invoiceLineItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.allocation.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.timeOffRequest.deleteMany();
    await prisma.timesheetSubmission.deleteMany();
    await prisma.phase.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.project.deleteMany();
    await prisma.client.deleteMany();
    await prisma.timeOffPolicy.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.defaultRole.deleteMany();
    await prisma.invoiceTemplate.deleteMany();
    await prisma.projectTemplate.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    /* ═══ ORGANIZATION ═══ */
    const org = await prisma.organization.create({
        data: {
            name: "Studio Design Co.",
            address: "1420 NW Flanders St, Portland, OR 97209",
            website: "https://studiodesign.co",
            phone: "(503) 555-0142",
            email: "hello@studiodesign.co",
            clientEmailSignature: "Thank you for choosing Studio Design Co.\nWe look forward to creating something exceptional together.",
            timezone: "America/Los_Angeles",
            locale: "en-US",
            currency: "USD",
            unitOfMeasurement: "feet",
            overheadCosts: 48000,
            workingHoursPerYear: 2087,
            targetUtilization: 75,
            targetRealization: 65,
            permissionsJson: JSON.stringify({
                owner: { projects: true, invoices: true, team: true, reports: true, settings: true, expenses: true, time: true, clients: true, approvals: true },
                admin: { projects: true, invoices: true, team: true, reports: true, settings: true, expenses: true, time: true, clients: true, approvals: true },
                manager: { projects: true, invoices: true, team: false, reports: true, settings: false, expenses: true, time: true, clients: true, approvals: true },
                member: { projects: true, invoices: false, team: false, reports: false, settings: false, expenses: true, time: true, clients: false, approvals: false },
            }),
        },
    });

    /* ═══ SETTINGS: Time Off, Holidays, Default Roles ═══ */
    await prisma.timeOffPolicy.createMany({
        data: [
            { name: "Annual PTO", type: "pto", daysPerYear: 15, orgId: org.id },
            { name: "Sick Leave", type: "sick", daysPerYear: 5, orgId: org.id },
            { name: "Personal Days", type: "personal", daysPerYear: 3, orgId: org.id },
        ],
    });
    await prisma.holiday.createMany({
        data: [
            { name: "New Year's Day", date: "2026-01-01", orgId: org.id },
            { name: "Memorial Day", date: "2026-05-25", orgId: org.id },
            { name: "Independence Day", date: "2026-07-04", orgId: org.id },
            { name: "Labor Day", date: "2026-09-07", orgId: org.id },
            { name: "Thanksgiving", date: "2026-11-26", orgId: org.id },
            { name: "Christmas Day", date: "2026-12-25", orgId: org.id },
        ],
    });
    await prisma.defaultRole.createMany({
        data: [
            { name: "Principal", defaultBillRate: 175, defaultCostRate: 95, orgId: org.id },
            { name: "Project Architect", defaultBillRate: 150, defaultCostRate: 75, orgId: org.id },
            { name: "Designer", defaultBillRate: 125, defaultCostRate: 55, orgId: org.id },
            { name: "Intern", defaultBillRate: 65, defaultCostRate: 25, orgId: org.id },
        ],
    });

    /* ═══ USERS ═══ */
    const karan = await prisma.user.create({ data: { name: "Karan S.", email: "karan@archflow.io", passwordHash: pw, role: "owner", title: "Principal", costRate: 95, billRate: 175, targetUtil: 80, orgId: org.id } });
    const sarah = await prisma.user.create({ data: { name: "Sarah Mitchell", email: "sarah@archflow.io", passwordHash: pw, role: "admin", title: "Studio Director", costRate: 85, billRate: 165, targetUtil: 80, orgId: org.id } });
    const james = await prisma.user.create({ data: { name: "James Wright", email: "james@archflow.io", passwordHash: pw, role: "manager", title: "Project Architect", costRate: 75, billRate: 150, targetUtil: 85, orgId: org.id } });
    const priya = await prisma.user.create({ data: { name: "Priya Desai", email: "priya@archflow.io", passwordHash: pw, role: "member", title: "Designer II", costRate: 55, billRate: 125, targetUtil: 90, orgId: org.id } });
    const marcus = await prisma.user.create({ data: { name: "Marcus Lee", email: "marcus@archflow.io", passwordHash: pw, role: "member", title: "Junior Designer", costRate: 40, billRate: 95, targetUtil: 90, orgId: org.id } });
    const users = [karan, sarah, james, priya, marcus];

    /* ═══ CLIENTS ═══ */
    const apex = await prisma.client.create({ data: { name: "Apex Development Corp", email: "info@apexdev.com", phone: "(503) 555-0201", address: "800 SW Broadway, Portland, OR 97205", website: "https://apexdev.com", industry: "Real Estate Development", contactName: "Robert Chen", status: "active", orgId: org.id } });
    const coastal = await prisma.client.create({ data: { name: "Coastal Properties LLC", email: "contact@coastalprops.com", phone: "(503) 555-0302", address: "2100 NE Sandy Blvd, Portland, OR 97232", website: "https://coastalprops.com", industry: "Hospitality", contactName: "Diana Ross", status: "active", orgId: org.id } });
    const portland = await prisma.client.create({ data: { name: "City of Portland", email: "procurement@portland.gov", phone: "(503) 555-0400", address: "1221 SW 4th Ave, Portland, OR 97204", website: "https://portland.gov", industry: "Government", contactName: "Mark Sullivan", status: "active", orgId: org.id } });
    const metro = await prisma.client.create({ data: { name: "Metro Commercial Group", email: "dev@metrocommercial.com", phone: "(503) 555-0510", address: "920 SE Hawthorne Blvd, Portland, OR", industry: "Commercial Real Estate", contactName: "Linda Park", status: "active", orgId: org.id } });
    const urban = await prisma.client.create({ data: { name: "Urban Living Co.", email: "hello@urbanliving.co", phone: "(503) 555-0612", address: "400 NW 23rd Ave, Portland, OR", industry: "Residential", contactName: "Amy Torres", status: "active", orgId: org.id } });

    /* ═══ PROPOSALS ═══ */
    await prisma.proposal.createMany({
        data: [
            { title: "Waterfront Mixed-Use Development", amount: 720000, status: "sent", sentDate: d(-10), clientId: apex.id, orgId: org.id },
            { title: "Boutique Hotel Renovation", amount: 340000, status: "accepted", sentDate: d(-30), clientId: coastal.id, orgId: org.id },
            { title: "Community Library Expansion", amount: 250000, status: "draft", clientId: portland.id, orgId: org.id },
        ],
    });

    /* ═══ PROJECTS ═══ */
    const meridian = await prisma.project.create({ data: { name: "Meridian Tower", type: "Commercial", status: "active", phase: "Construction Docs", progress: 72, contractValue: 285000, startDate: "2025-06-01", endDate: "2026-08-15", clientId: apex.id, orgId: org.id } });
    const harbor = await prisma.project.create({ data: { name: "Harbor Residences", type: "Residential", status: "active", phase: "Design Development", progress: 45, contractValue: 420000, startDate: "2025-09-15", endDate: "2026-12-01", clientId: coastal.id, orgId: org.id } });
    const civic = await prisma.project.create({ data: { name: "Civic Center Renovation", type: "Civic", status: "active", phase: "Schematic Design", progress: 88, contractValue: 175000, startDate: "2025-03-01", endDate: "2026-03-30", clientId: portland.id, orgId: org.id } });
    const parkview = await prisma.project.create({ data: { name: "Park View Office Complex", type: "Commercial", status: "active", phase: "SD Phase", progress: 31, contractValue: 560000, startDate: "2025-11-01", endDate: "2027-06-01", clientId: metro.id, orgId: org.id } });
    const riverside = await prisma.project.create({ data: { name: "Riverside Lofts", type: "Residential", status: "active", phase: "Construction Admin", progress: 95, contractValue: 195000, startDate: "2024-08-01", endDate: "2026-03-01", clientId: urban.id, orgId: org.id } });
    const projects = [meridian, harbor, civic, parkview, riverside];

    /* ═══ PHASES (with colors for Gantt) ═══ */
    const phases: Record<string, any> = {};
    // Meridian Tower
    phases.merSD = await prisma.phase.create({ data: { name: "Schematic Design", budgetHours: 400, budgetAmount: 70000, feeType: "hourly", startDate: "2025-06-01", endDate: "2025-10-15", color: "#B07A4A", projectId: meridian.id } });
    phases.merDD = await prisma.phase.create({ data: { name: "Design Development", budgetHours: 500, budgetAmount: 87500, feeType: "hourly", startDate: "2025-10-16", endDate: "2026-02-15", color: "#8B6340", projectId: meridian.id } });
    phases.merCD = await prisma.phase.create({ data: { name: "Construction Docs", budgetHours: 800, budgetAmount: 140000, feeType: "hourly", startDate: "2026-02-16", endDate: "2026-08-15", color: "#6B4C30", projectId: meridian.id } });
    // Harbor Residences
    phases.harSD = await prisma.phase.create({ data: { name: "Schematic Design", budgetHours: 350, budgetAmount: 52500, feeType: "hourly", startDate: "2025-09-15", endDate: "2026-01-15", color: "#6B8DD6", projectId: harbor.id } });
    phases.harDD = await prisma.phase.create({ data: { name: "Design Development", budgetHours: 600, budgetAmount: 105000, feeType: "hourly", startDate: "2026-01-16", endDate: "2026-06-30", color: "#4A6AB0", projectId: harbor.id } });
    phases.harCD = await prisma.phase.create({ data: { name: "Construction Docs", budgetHours: 700, budgetAmount: 122500, feeType: "fixed", startDate: "2026-07-01", endDate: "2026-12-01", color: "#3A5490", projectId: harbor.id } });
    // Civic Center
    phases.civSD = await prisma.phase.create({ data: { name: "Schematic Design", budgetHours: 300, budgetAmount: 45000, feeType: "hourly", startDate: "2025-03-01", endDate: "2025-08-01", color: "#8BC6A0", projectId: civic.id } });
    phases.civDD = await prisma.phase.create({ data: { name: "Design Development", budgetHours: 400, budgetAmount: 60000, feeType: "hourly", startDate: "2025-08-02", endDate: "2025-12-31", color: "#6BA880", projectId: civic.id } });
    phases.civCD = await prisma.phase.create({ data: { name: "Construction Docs", budgetHours: 500, budgetAmount: 75000, feeType: "hourly", startDate: "2026-01-01", endDate: "2026-03-30", color: "#4B8A60", projectId: civic.id } });
    // Park View
    phases.pvSD = await prisma.phase.create({ data: { name: "Schematic Design", budgetHours: 500, budgetAmount: 87500, feeType: "hourly", startDate: "2025-11-01", endDate: "2026-04-30", color: "#D4A574", projectId: parkview.id } });
    phases.pvDD = await prisma.phase.create({ data: { name: "Design Development", budgetHours: 700, budgetAmount: 122500, feeType: "hourly", startDate: "2026-05-01", endDate: "2026-11-30", color: "#C4956A", projectId: parkview.id } });
    // Riverside
    phases.rivCA = await prisma.phase.create({ data: { name: "Construction Admin", budgetHours: 250, budgetAmount: 43750, feeType: "not-to-exceed", startDate: "2025-09-01", endDate: "2026-03-01", color: "#A08060", projectId: riverside.id } });
    phases.rivCO = await prisma.phase.create({ data: { name: "Closeout", budgetHours: 60, budgetAmount: 10500, feeType: "fixed", startDate: "2026-02-15", endDate: "2026-03-01", color: "#807060", projectId: riverside.id } });

    const phaseArr = Object.values(phases);

    /* ═══ MILESTONES ═══ */
    await prisma.milestone.createMany({
        data: [
            { name: "SD Review Complete", date: "2025-10-10", done: true, phaseId: phases.merSD.id, projectId: meridian.id },
            { name: "DD 50% Submittal", date: "2026-01-15", done: true, phaseId: phases.merDD.id, projectId: meridian.id },
            { name: "CD 90% Submittal", date: "2026-06-15", done: false, phaseId: phases.merCD.id, projectId: meridian.id },
            { name: "Permit Submission", date: "2026-07-30", done: false, phaseId: phases.merCD.id, projectId: meridian.id },
            { name: "Client Design Approval", date: "2026-01-10", done: true, phaseId: phases.harSD.id, projectId: harbor.id },
            { name: "DD Presentation", date: "2026-04-20", done: false, phaseId: phases.harDD.id, projectId: harbor.id },
            { name: "City Council Presentation", date: "2025-07-15", done: true, phaseId: phases.civSD.id, projectId: civic.id },
            { name: "Final Inspection", date: "2026-03-20", done: false, phaseId: phases.civCD.id, projectId: civic.id },
            { name: "Substantial Completion", date: "2026-02-28", done: false, phaseId: phases.rivCA.id, projectId: riverside.id },
        ],
    });

    /* ═══ TASKS ═══ */
    const taskData = [
        { title: "Finish floor plan revisions", status: "in-progress", dueDate: d(3), phaseId: phases.merCD.id, projectId: meridian.id, assigneeId: karan.id, sortOrder: 1 },
        { title: "Update MEP coordination drawings", status: "todo", dueDate: d(7), phaseId: phases.merCD.id, projectId: meridian.id, assigneeId: james.id, sortOrder: 2 },
        { title: "Prepare specification sections 01-05", status: "review", dueDate: d(5), phaseId: phases.merCD.id, projectId: meridian.id, assigneeId: priya.id, sortOrder: 3 },
        { title: "Structural calcs review", status: "done", dueDate: d(-5), phaseId: phases.merCD.id, projectId: meridian.id, assigneeId: sarah.id, sortOrder: 4 },
        { title: "Interior material selections", status: "in-progress", dueDate: d(10), phaseId: phases.harDD.id, projectId: harbor.id, assigneeId: priya.id, sortOrder: 1 },
        { title: "Landscape plan draft", status: "todo", dueDate: d(14), phaseId: phases.harDD.id, projectId: harbor.id, assigneeId: marcus.id, sortOrder: 2 },
        { title: "Façade detail development", status: "in-progress", dueDate: d(8), phaseId: phases.harDD.id, projectId: harbor.id, assigneeId: james.id, sortOrder: 3 },
        { title: "Code compliance review", status: "done", dueDate: d(-2), phaseId: phases.civCD.id, projectId: civic.id, assigneeId: sarah.id, sortOrder: 1 },
        { title: "ADA accessibility audit", status: "in-progress", dueDate: d(4), phaseId: phases.civCD.id, projectId: civic.id, assigneeId: james.id, sortOrder: 2 },
        { title: "Site plan survey", status: "todo", dueDate: d(20), phaseId: phases.pvSD.id, projectId: parkview.id, assigneeId: marcus.id, sortOrder: 1 },
        { title: "Punch list walkthrough", status: "in-progress", dueDate: d(2), phaseId: phases.rivCA.id, projectId: riverside.id, assigneeId: karan.id, sortOrder: 1 },
        { title: "Final as-built drawings", status: "todo", dueDate: d(10), phaseId: phases.rivCO.id, projectId: riverside.id, assigneeId: priya.id, sortOrder: 1 },
    ];
    for (const t of taskData) {
        await prisma.task.create({ data: t });
    }

    /* ═══ TIME ENTRIES — 4 weeks of realistic data ═══ */
    const activities = ["design", "project-mgmt", "site-visit", "meeting", "admin", "other"] as const;
    const assignments = [
        { user: karan, proj: meridian, phase: phases.merCD, act: "design" },
        { user: karan, proj: riverside, phase: phases.rivCA, act: "project-mgmt" },
        { user: sarah, proj: harbor, phase: phases.harDD, act: "design" },
        { user: sarah, proj: civic, phase: phases.civCD, act: "project-mgmt" },
        { user: james, proj: meridian, phase: phases.merCD, act: "design" },
        { user: james, proj: parkview, phase: phases.pvSD, act: "site-visit" },
        { user: priya, proj: harbor, phase: phases.harDD, act: "design" },
        { user: priya, proj: civic, phase: phases.civCD, act: "design" },
        { user: marcus, proj: parkview, phase: phases.pvSD, act: "design" },
        { user: marcus, proj: meridian, phase: phases.merCD, act: "design" },
    ];
    const notes = ["Floor plan revisions", "Client coord call", "Detail drawings", "Code review", "Material research", "Team meeting", "Site observation", "Spec writing", "Model updates", "Drawing set review"];

    for (let weekOff = -3; weekOff <= 0; weekOff++) {
        for (let dayOff = 0; dayOff < 5; dayOff++) {
            const dayOffset = weekOff * 7 + dayOff - (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
            const dateStr = d(dayOffset);
            const weekStatus = weekOff < 0 ? "approved" : "draft";
            for (const a of assignments) {
                const hrs = 3 + Math.round(Math.random() * 4 * 4) / 4; // 3–7h in 0.25 steps
                await prisma.timeEntry.create({
                    data: {
                        date: dateStr,
                        hours: hrs,
                        notes: notes[Math.floor(Math.random() * notes.length)],
                        status: weekStatus,
                        billable: Math.random() > 0.15,
                        entryType: "regular",
                        activityType: a.act,
                        userId: a.user.id,
                        projectId: a.proj.id,
                        phaseId: a.phase.id,
                    },
                });
            }
            // Add a PTO entry for Priya last week
            if (weekOff === -1 && dayOff === 3) {
                await prisma.timeEntry.create({
                    data: { date: dateStr, hours: 8, notes: "Doctor appointment", status: "approved", billable: false, entryType: "pto", activityType: "other", userId: priya.id, projectId: harbor.id, phaseId: phases.harDD.id },
                });
            }
        }
    }

    /* ═══ TIMESHEET SUBMISSIONS ═══ */
    await prisma.timesheetSubmission.createMany({
        data: [
            { week: isoWeek(-3), status: "approved", totalHours: 42, submittedAt: d(-18), reviewedBy: "Karan S.", reviewedAt: d(-17), userId: sarah.id, orgId: org.id },
            { week: isoWeek(-3), status: "approved", totalHours: 38.5, submittedAt: d(-18), reviewedBy: "Karan S.", reviewedAt: d(-17), userId: james.id, orgId: org.id },
            { week: isoWeek(-2), status: "approved", totalHours: 40, submittedAt: d(-11), reviewedBy: "Karan S.", reviewedAt: d(-10), userId: sarah.id, orgId: org.id },
            { week: isoWeek(-2), status: "submitted", totalHours: 36, submittedAt: d(-11), userId: priya.id, orgId: org.id },
            { week: isoWeek(-1), status: "submitted", totalHours: 41.5, submittedAt: d(-4), userId: james.id, orgId: org.id },
            { week: isoWeek(-1), status: "rejected", totalHours: 28, submittedAt: d(-4), reviewedBy: "Karan S.", reviewedAt: d(-3), notes: "Missing Friday entries", userId: marcus.id, orgId: org.id },
        ],
    });

    /* ═══ TIME OFF REQUESTS ═══ */
    await prisma.timeOffRequest.createMany({
        data: [
            { type: "pto", startDate: "2026-03-16", endDate: "2026-03-20", hours: 40, status: "approved", notes: "Spring break trip", reviewedBy: "Karan S.", reviewedAt: d(-5), userId: priya.id, orgId: org.id },
            { type: "sick", startDate: d(-8), endDate: d(-8), hours: 8, status: "approved", reviewedBy: "Karan S.", reviewedAt: d(-7), userId: james.id, orgId: org.id },
            { type: "pto", startDate: "2026-04-10", endDate: "2026-04-14", hours: 40, status: "pending", notes: "Family wedding", userId: marcus.id, orgId: org.id },
            { type: "personal", startDate: "2026-03-28", endDate: "2026-03-28", hours: 8, status: "pending", notes: "Moving day", userId: sarah.id, orgId: org.id },
        ],
    });

    /* ═══ INVOICES ═══ */
    const inv1 = await prisma.invoice.create({
        data: {
            number: "INV-2026-001", amount: 28500, date: "2026-01-15", dueDate: "2026-02-14", status: "paid",
            clientId: apex.id, projectId: meridian.id, orgId: org.id,
            lineItems: {
                create: [
                    { description: "Construction Docs — Dec 2025", qty: 152, rate: 175 },
                    { description: "Reimbursable expenses", qty: 1, rate: 1900 },
                ]
            },
        },
    });
    const inv2 = await prisma.invoice.create({
        data: {
            number: "INV-2026-002", amount: 18900, date: "2026-01-15", dueDate: "2026-02-14", status: "overdue",
            clientId: coastal.id, projectId: harbor.id, orgId: org.id,
            lineItems: { create: [{ description: "Design Development — Dec 2025", qty: 108, rate: 175 }] },
        },
    });
    await prisma.invoice.create({
        data: {
            number: "INV-2026-003", amount: 12400, date: "2026-02-01", dueDate: "2026-03-03", status: "sent",
            clientId: portland.id, projectId: civic.id, orgId: org.id,
            lineItems: { create: [{ description: "Schematic Design — progress billing", qty: 1, rate: 12400 }] },
        },
    });
    await prisma.invoice.create({
        data: {
            number: "INV-2026-004", amount: 35200, date: "2026-02-15", dueDate: "2026-03-17", status: "sent",
            clientId: apex.id, projectId: meridian.id, orgId: org.id,
            lineItems: {
                create: [
                    { description: "Construction Docs — Jan 2026", qty: 180, rate: 175 },
                    { description: "Printing & reproductions", qty: 1, rate: 3700 },
                ]
            },
        },
    });
    await prisma.invoice.create({
        data: {
            number: "INV-2026-005", amount: 8750, date: "2026-02-20", dueDate: "2026-03-22", status: "draft",
            clientId: metro.id, projectId: parkview.id, orgId: org.id,
            lineItems: { create: [{ description: "Schematic Design — Phase 1 progress", qty: 50, rate: 175 }] },
        },
    });
    await prisma.invoice.create({
        data: {
            number: "INV-2026-006", amount: 6500, date: "2026-02-20", dueDate: "2026-03-22", status: "paid",
            clientId: urban.id, projectId: riverside.id, orgId: org.id,
            lineItems: { create: [{ description: "Construction Admin — Feb 2026", qty: 40, rate: 162.5 }] },
        },
    });

    /* ═══ INVOICE TEMPLATE ═══ */
    await prisma.invoiceTemplate.create({
        data: {
            name: "Standard", companyName: "Studio Design Co.", address: "1420 NW Flanders St, Portland, OR 97209",
            phone: "(503) 555-0142", email: "billing@studiodesign.co",
            headerText: "Thank you for your continued partnership.",
            footerText: "Payment is due within 30 days.\nPlease remit payment via check or wire transfer.",
            accentColor: "#B07A4A", isDefault: true, orgId: org.id,
        },
    });

    /* ═══ EXPENSES ═══ */
    await prisma.expense.createMany({
        data: [
            { category: "travel", description: "Flight to client site — Apex Development", amount: 385, date: d(-12), billable: true, status: "approved", userId: karan.id, projectId: meridian.id },
            { category: "meals", description: "Client lunch — Harbor Residences kickoff", amount: 128.50, date: d(-8), billable: true, status: "approved", userId: sarah.id, projectId: harbor.id },
            { category: "materials", description: "Physical model supplies — foam board, basswood", amount: 245, date: d(-15), billable: false, status: "approved", userId: priya.id, projectId: harbor.id },
            { category: "software", description: "Revit cloud credits — monthly", amount: 450, date: d(-5), billable: false, status: "pending", userId: james.id },
            { category: "mileage", description: "Site visit — Civic Center", amount: 53.60, date: d(-3), billable: true, status: "pending", mileage: 80, mileageRate: 0.67, userId: james.id, projectId: civic.id },
            { category: "materials", description: "Plotting & printing — CD set review", amount: 312, date: d(-6), billable: true, status: "approved", userId: karan.id, projectId: meridian.id },
            { category: "travel", description: "Uber to city hall — permit meeting", amount: 34.50, date: d(-2), billable: true, status: "pending", userId: sarah.id, projectId: civic.id },
            { category: "meals", description: "Team lunch — project milestone celebration", amount: 186, date: d(-10), billable: false, status: "approved", userId: karan.id },
            { category: "other", description: "Conference registration — AIA Portland", amount: 350, date: d(-20), billable: false, status: "reimbursed", userId: james.id },
            { category: "mileage", description: "Site visit — Riverside Lofts punch list", amount: 26.80, date: d(-1), billable: true, status: "pending", mileage: 40, mileageRate: 0.67, userId: karan.id, projectId: riverside.id },
        ],
    });

    /* ═══ ALLOCATIONS (current + next 2 weeks) ═══ */
    for (let wk = 0; wk < 3; wk++) {
        const week = isoWeek(wk);
        await prisma.allocation.createMany({
            data: [
                { week, plannedHours: 24, userId: karan.id, projectId: meridian.id },
                { week, plannedHours: 8, userId: karan.id, projectId: riverside.id },
                { week, plannedHours: 20, userId: sarah.id, projectId: harbor.id },
                { week, plannedHours: 12, userId: sarah.id, projectId: civic.id },
                { week, plannedHours: 16, userId: james.id, projectId: meridian.id },
                { week, plannedHours: 16, userId: james.id, projectId: parkview.id },
                { week, plannedHours: 24, userId: priya.id, projectId: harbor.id },
                { week, plannedHours: 8, userId: priya.id, projectId: civic.id },
                { week, plannedHours: 20, userId: marcus.id, projectId: parkview.id },
                { week, plannedHours: 12, userId: marcus.id, projectId: meridian.id },
            ],
        });
    }

    /* ═══ NOTIFICATIONS ═══ */
    await prisma.notification.createMany({
        data: [
            { type: "budget_warning", title: "Meridian Tower — CD Phase at 78%", message: "Construction Docs phase has consumed 78% of budgeted hours with an estimated 4 weeks remaining.", userId: karan.id, projectId: meridian.id },
            { type: "budget_alert", title: "Harbor Residences — DD Phase at 65%", message: "Design Development phase is tracking ahead of budget. Consider reviewing scope allocation.", userId: sarah.id, projectId: harbor.id },
            { type: "info", title: "Invoice INV-2026-002 is overdue", message: "Coastal Properties LLC has an outstanding invoice of $18,900 that is 11 days past due.", userId: karan.id, projectId: harbor.id },
            { type: "info", title: "Timesheet pending approval", message: "James Wright has submitted his timesheet for review (41.5 hours).", userId: karan.id },
            { type: "budget_critical", title: "Riverside Lofts — CA Phase at 92%", message: "Construction Admin phase is nearing the not-to-exceed cap. Only 20 hours remain.", userId: karan.id, projectId: riverside.id },
        ],
    });

    /* ═══ PROJECT TEMPLATES ═══ */
    await prisma.projectTemplate.createMany({
        data: [
            { name: "Commercial Office", description: "Standard commercial office project workflow", defaultPhases: JSON.stringify(["Programming", "Schematic Design", "Design Development", "Construction Docs", "Bidding", "Construction Admin"]), defaultType: "Commercial", orgId: org.id },
            { name: "Residential Multi-Family", description: "Multi-family residential project workflow", defaultPhases: JSON.stringify(["Feasibility", "Schematic Design", "Design Development", "Construction Docs", "Permit", "Construction Admin", "Closeout"]), defaultType: "Residential", orgId: org.id },
        ],
    });

    console.log("✓ Seeded successfully!");
    console.log("  Organization: Studio Design Co.");
    console.log("  Users: 5 (karan, sarah, james, priya, marcus)");
    console.log("  Projects: 5 with 13 phases, 9 milestones, 12 tasks");
    console.log("  Time entries: ~200 across 4 weeks");
    console.log("  Invoices: 6 | Expenses: 10 | Allocations: 30");
    console.log("  Proposals: 3 | Notifications: 5");
    console.log("  Settings: 3 policies, 6 holidays, 4 default roles");
    console.log("  Time off requests: 4 | Timesheet submissions: 6");
    console.log("");
    console.log("  Demo login: karan@archflow.io / password123");
    console.log("  All users:  [name]@archflow.io / password123");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

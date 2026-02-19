import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Clean existing data
    await prisma.invoiceLineItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.phase.deleteMany();
    await prisma.project.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // Organization
    const org = await prisma.organization.create({
        data: { name: "Studio Design Co." },
    });

    // Demo user
    const user = await prisma.user.create({
        data: {
            name: "Karan S.",
            email: "karan@archflow.io",
            passwordHash: hashSync("password123", 10),
            role: "owner",
            title: "Principal",
            costRate: 95,
            billRate: 175,
            targetUtil: 80,
            orgId: org.id,
        },
    });

    // Additional team members
    const sarah = await prisma.user.create({
        data: { name: "Sarah Mitchell", email: "sarah@archflow.io", passwordHash: hashSync("password123", 10), role: "manager", title: "Project Architect", costRate: 75, billRate: 150, targetUtil: 85, orgId: org.id },
    });
    const james = await prisma.user.create({
        data: { name: "James Wright", email: "james@archflow.io", passwordHash: hashSync("password123", 10), role: "member", title: "Designer II", costRate: 55, billRate: 125, targetUtil: 90, orgId: org.id },
    });

    // Clients
    const apex = await prisma.client.create({ data: { name: "Apex Development Corp", email: "info@apexdev.com", orgId: org.id } });
    const coastal = await prisma.client.create({ data: { name: "Coastal Properties LLC", email: "contact@coastalprops.com", orgId: org.id } });
    const portland = await prisma.client.create({ data: { name: "City of Portland", email: "procurement@portland.gov", orgId: org.id } });
    const metro = await prisma.client.create({ data: { name: "Metro Commercial Group", email: "dev@metrocommercial.com", orgId: org.id } });
    const urban = await prisma.client.create({ data: { name: "Urban Living Co.", email: "hello@urbanliving.co", orgId: org.id } });

    // Projects
    const meridian = await prisma.project.create({
        data: { name: "Meridian Tower", type: "Commercial", status: "active", phase: "Construction Docs", progress: 72, contractValue: 285000, startDate: "2025-06-01", endDate: "2026-08-15", clientId: apex.id, orgId: org.id },
    });
    const harbor = await prisma.project.create({
        data: { name: "Harbor Residences", type: "Residential", status: "active", phase: "Design Development", progress: 45, contractValue: 420000, startDate: "2025-09-15", endDate: "2026-12-01", clientId: coastal.id, orgId: org.id },
    });
    const civic = await prisma.project.create({
        data: { name: "Civic Center Renovation", type: "Civic", status: "active", phase: "Schematic Design", progress: 88, contractValue: 175000, startDate: "2025-03-01", endDate: "2026-03-30", clientId: portland.id, orgId: org.id },
    });
    const parkview = await prisma.project.create({
        data: { name: "Park View Office Complex", type: "Commercial", status: "active", phase: "SD Phase", progress: 31, contractValue: 560000, startDate: "2025-11-01", endDate: "2027-06-01", clientId: metro.id, orgId: org.id },
    });
    const riverside = await prisma.project.create({
        data: { name: "Riverside Lofts", type: "Residential", status: "active", phase: "Construction Admin", progress: 95, contractValue: 195000, startDate: "2024-08-01", endDate: "2026-03-01", clientId: urban.id, orgId: org.id },
    });

    // Phases for Meridian Tower
    const cdPhase = await prisma.phase.create({ data: { name: "Construction Docs", budgetHours: 800, budgetAmount: 140000, feeType: "hourly", projectId: meridian.id } });
    const sdPhase = await prisma.phase.create({ data: { name: "Schematic Design", budgetHours: 400, budgetAmount: 70000, feeType: "hourly", projectId: meridian.id } });

    // Phases for Harbor
    const harborDD = await prisma.phase.create({ data: { name: "Design Development", budgetHours: 600, budgetAmount: 105000, feeType: "hourly", projectId: harbor.id } });

    // Sample time entries
    const today = new Date();
    for (let d = 0; d < 5; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split("T")[0];

        await prisma.timeEntry.create({ data: { date: dateStr, hours: 6 + Math.random() * 2, notes: "CD phase work", status: "approved", userId: user.id, projectId: meridian.id, phaseId: cdPhase.id } });
        await prisma.timeEntry.create({ data: { date: dateStr, hours: 2 + Math.random() * 2, notes: "DD phase review", status: "approved", userId: sarah.id, projectId: harbor.id, phaseId: harborDD.id } });
    }

    // Invoices
    await prisma.invoice.create({
        data: {
            number: "INV-2026-001", amount: 28500, date: "2026-02-01", dueDate: "2026-03-03", status: "paid",
            clientId: apex.id, projectId: meridian.id, orgId: org.id,
            lineItems: {
                create: [
                    { description: "Construction Docs — Jan 2026", qty: 152, rate: 175 },
                    { description: "Reimbursable expenses", qty: 1, rate: 1900 },
                ]
            },
        },
    });
    await prisma.invoice.create({
        data: {
            number: "INV-2026-002", amount: 18900, date: "2026-02-01", dueDate: "2026-03-03", status: "overdue",
            clientId: coastal.id, projectId: harbor.id, orgId: org.id,
            lineItems: { create: [{ description: "Design Development — Jan 2026", qty: 108, rate: 175 }] },
        },
    });
    await prisma.invoice.create({
        data: {
            number: "INV-2026-003", amount: 12400, date: "2026-02-10", dueDate: "2026-03-12", status: "sent",
            clientId: portland.id, projectId: civic.id, orgId: org.id,
            lineItems: { create: [{ description: "Schematic Design — progress billing", qty: 1, rate: 12400 }] },
        },
    });

    console.log("Seeded successfully!");
    console.log(`  Demo login: karan@archflow.io / password123`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

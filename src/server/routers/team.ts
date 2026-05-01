import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, type TRPCContext } from "../trpc";
import { createHash, randomBytes } from "crypto";

async function requireCurrentUser(ctx: TRPCContext) {
    const email = ctx.session?.user?.email;
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    const user = await ctx.db.user.findUnique({ where: { email }, select: { id: true, orgId: true, role: true } });
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
    return user;
}

function canInvite(role: string) {
    return role === "owner" || role === "admin" || role === "manager";
}

function hashInviteToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

function appBaseUrl() {
    return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function sendInviteEmail(input: { to: string; name: string; orgName: string; inviterName: string; role: string; inviteUrl: string; expiresAt: Date }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "ArchFlow <onboarding@resend.dev>";
    const subject = `You're invited to join ${input.orgName} on ArchFlow`;
    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2b2520;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="font-family:Georgia,serif;font-weight:400;">Join ${input.orgName} on ArchFlow</h2>
            <p>${input.inviterName} invited you to join the team as <strong>${input.role}</strong>.</p>
            <p>Your role, title, bill rate, and access level are already set by the team. You only need to confirm your profile and choose a password.</p>
            <p><a href="${input.inviteUrl}" style="display:inline-block;background:#B07A4A;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Accept Invite</a></p>
            <p style="font-size:12px;color:#7d746b;">This invite expires on ${input.expiresAt.toISOString().slice(0, 10)}. If you did not expect this invite, you can ignore this email.</p>
        </div>`;

    if (!apiKey) {
        console.warn(`[team invite] RESEND_API_KEY missing. Invite link for ${input.to}: ${input.inviteUrl}`);
        return { sent: false, reason: "missing_api_key" as const };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: input.to, subject, html }),
    });
    if (!response.ok) {
        const body = await response.text();
        console.warn(`[team invite] Resend failed: ${body}`);
        return { sent: false, reason: "resend_error" as const };
    }
    return { sent: true, reason: "sent" as const };
}

export const teamRouter = router({
    inviteContext: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return { canInvite: canInvite(user.role), role: user.role };
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        return ctx.db.user.findMany({
            where: { orgId: user.orgId },
            include: {
                timeEntries: {
                    include: {
                        project: { select: { id: true, name: true } },
                        phase: { select: { id: true, name: true, budgetHours: true } },
                        task: { select: { id: true, title: true, status: true } },
                        deliverable: { select: { id: true, title: true, status: true } },
                    },
                },
                phaseAssignments: {
                    include: {
                        phase: {
                            select: {
                                id: true,
                                name: true,
                                budgetHours: true,
                                startDate: true,
                                endDate: true,
                                project: { select: { id: true, name: true, status: true } },
                                tasks: { select: { id: true, status: true, assigneeId: true } },
                                deliverables: { select: { id: true, status: true, assigneeId: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        priority: true,
                        estimatedHours: true,
                        actualHours: true,
                        dueDate: true,
                        project: { select: { id: true, name: true } },
                        phase: { select: { id: true, name: true } },
                    },
                },
                deliverables: {
                    select: {
                        id: true,
                        status: true,
                        dueDate: true,
                        project: { select: { id: true, name: true } },
                        phase: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { name: "asc" },
        });
    }),

    pendingInvites: protectedProcedure.query(async ({ ctx }) => {
        const user = await requireCurrentUser(ctx);
        if (!canInvite(user.role)) return [];
        return ctx.db.teamInvite.findMany({
            where: { orgId: user.orgId, status: "pending" },
            include: { invitedBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }),

    projectStaffing: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await requireCurrentUser(ctx);
            const project = await ctx.db.project.findFirst({
                where: { id: input.projectId, orgId: user.orgId },
                include: {
                    phases: {
                        include: {
                            assignments: { include: { user: { select: { id: true, name: true, title: true, billRate: true, costRate: true } } } },
                            timeEntries: { include: { user: { select: { id: true, name: true, billRate: true, costRate: true } } } },
                            tasks: true,
                            deliverables: true,
                        },
                    },
                },
            });
            if (!project) throw new TRPCError({ code: "FORBIDDEN", message: "Project not found or inaccessible" });
            return project;
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
            const currentUser = await requireCurrentUser(ctx);
            if (!canInvite(currentUser.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required to invite team members" });
            const { password, ...rest } = input;
            const { hashSync } = await import("bcryptjs");
            return ctx.db.user.create({
                data: { ...rest, passwordHash: hashSync(password, 10), orgId: currentUser.orgId },
            });
        }),

    invite: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            email: z.string().email(),
            phone: z.string().default(""),
            role: z.enum(["owner", "admin", "manager", "member"]).default("member"),
            title: z.string().default(""),
            costRate: z.number().default(0),
            billRate: z.number().default(0),
            targetUtil: z.number().default(75),
        }))
        .mutation(async ({ ctx, input }) => {
            const currentUser = await requireCurrentUser(ctx);
            if (!canInvite(currentUser.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required to invite team members" });
            const existingUser = await ctx.db.user.findUnique({ where: { email: input.email }, select: { id: true } });
            if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "A team member with this email already exists" });

            const inviter = await ctx.db.user.findUnique({ where: { id: currentUser.id }, include: { org: true } });
            if (!inviter) throw new TRPCError({ code: "UNAUTHORIZED", message: "Inviter not found" });
            const token = randomBytes(32).toString("base64url");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await ctx.db.teamInvite.updateMany({
                where: { email: input.email, orgId: currentUser.orgId, status: "pending" },
                data: { status: "revoked" },
            });
            const invite = await ctx.db.teamInvite.create({
                data: {
                    ...input,
                    tokenHash: hashInviteToken(token),
                    expiresAt,
                    orgId: currentUser.orgId,
                    invitedById: currentUser.id,
                },
                include: { invitedBy: { select: { id: true, name: true } } },
            });
            const inviteUrl = `${appBaseUrl()}/accept-invite?token=${token}`;
            const mail = await sendInviteEmail({
                to: input.email,
                name: input.name,
                orgName: inviter.org.name,
                inviterName: inviter.name,
                role: input.role,
                inviteUrl,
                expiresAt,
            });
            return { invite, inviteUrl: mail.sent ? undefined : inviteUrl, mail };
        }),

    resendInvite: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const currentUser = await requireCurrentUser(ctx);
            if (!canInvite(currentUser.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required to resend invites" });
            const inviter = await ctx.db.user.findUnique({ where: { id: currentUser.id }, include: { org: true } });
            const invite = await ctx.db.teamInvite.findFirst({ where: { id: input.id, orgId: currentUser.orgId, status: "pending" } });
            if (!invite || !inviter) throw new TRPCError({ code: "FORBIDDEN", message: "Invite not found or inaccessible" });
            const token = randomBytes(32).toString("base64url");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const updated = await ctx.db.teamInvite.update({
                where: { id: invite.id },
                data: { tokenHash: hashInviteToken(token), expiresAt, lastSentAt: new Date() },
                include: { invitedBy: { select: { id: true, name: true } } },
            });
            const inviteUrl = `${appBaseUrl()}/accept-invite?token=${token}`;
            const mail = await sendInviteEmail({
                to: updated.email,
                name: updated.name,
                orgName: inviter.org.name,
                inviterName: inviter.name,
                role: updated.role,
                inviteUrl,
                expiresAt,
            });
            return { invite: updated, inviteUrl: mail.sent ? undefined : inviteUrl, mail };
        }),

    revokeInvite: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const currentUser = await requireCurrentUser(ctx);
            if (!canInvite(currentUser.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required to revoke invites" });
            const invite = await ctx.db.teamInvite.findFirst({ where: { id: input.id, orgId: currentUser.orgId, status: "pending" } });
            if (!invite) throw new TRPCError({ code: "FORBIDDEN", message: "Invite not found or inaccessible" });
            return ctx.db.teamInvite.update({ where: { id: invite.id }, data: { status: "revoked" } });
        }),

    getInviteByToken: publicProcedure
        .input(z.object({ token: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const tokenHash = hashInviteToken(input.token);
            const invite = await ctx.db.teamInvite.findUnique({
                where: { tokenHash },
                include: { org: { select: { name: true } }, invitedBy: { select: { name: true } } },
            });
            if (!invite) return null;
            if (invite.status !== "pending" || invite.expiresAt < new Date()) return { ...invite, expired: true };
            return { ...invite, expired: false };
        }),

    acceptInvite: publicProcedure
        .input(z.object({
            token: z.string().min(1),
            password: z.string().min(8),
            phone: z.string().default(""),
            name: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const tokenHash = hashInviteToken(input.token);
            const invite = await ctx.db.teamInvite.findUnique({ where: { tokenHash } });
            if (!invite || invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invite is invalid or already used" });
            if (invite.expiresAt < new Date()) {
                await ctx.db.teamInvite.update({ where: { id: invite.id }, data: { status: "expired" } });
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
            }
            const existingUser = await ctx.db.user.findUnique({ where: { email: invite.email }, select: { id: true } });
            if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
            const { hashSync } = await import("bcryptjs");
            const user = await ctx.db.user.create({
                data: {
                    name: input.name.trim(),
                    email: invite.email,
                    phone: input.phone.trim() || invite.phone,
                    role: invite.role,
                    title: invite.title,
                    costRate: invite.costRate,
                    billRate: invite.billRate,
                    targetUtil: invite.targetUtil,
                    passwordHash: hashSync(input.password, 10),
                    orgId: invite.orgId,
                },
            });
            await ctx.db.teamInvite.update({ where: { id: invite.id }, data: { status: "accepted", acceptedAt: new Date() } });
            return { userId: user.id, email: user.email };
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
            const currentUser = await requireCurrentUser(ctx);
            if (!canInvite(currentUser.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required to edit team members" });
            const { id, ...data } = input;
            const member = await ctx.db.user.findFirst({ where: { id, orgId: currentUser.orgId }, select: { id: true } });
            if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Team member not found or inaccessible" });
            return ctx.db.user.update({ where: { id }, data });
        }),
});

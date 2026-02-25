import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Context creation — available in every procedure
export const createTRPCContext = async () => {
    const session = await auth();
    return { db, session };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure — requires authenticated session
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    return next({ ctx: { ...ctx, session: ctx.session } });
});

// Admin procedure — requires owner or admin role
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const role = (ctx.session.user as any)?.role;
    if (role !== "owner" && role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next({ ctx });
});

// Manager procedure — requires owner, admin, or manager role
export const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const role = (ctx.session.user as any)?.role;
    if (role !== "owner" && role !== "admin" && role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
    }
    return next({ ctx });
});

import { hashSync } from "bcryptjs";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const exists = await db.user.findUnique({ where: { email } });
        if (exists) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        // Create a new org for each signup so accounts are isolated
        const org = await db.organization.create({
            data: { name: `${name}'s Firm` },
        });

        const user = await db.user.create({
            data: {
                name,
                email,
                passwordHash: hashSync(password, 10),
                role: "owner",
                orgId: org.id,
            },
        });

        return NextResponse.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

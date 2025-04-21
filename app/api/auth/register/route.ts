import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // Parse request body
    let email, password;
    try {
      const body = await req.json();
      email = body.email;
      password = body.password;
    } catch (e) {
      console.error("Error parsing request body:", e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid input types" },
        { status: 400 }
      );
    }

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error("Error checking existing user:", e);
      return NextResponse.json(
        { error: "Database error while checking user" },
        { status: 500 }
      );
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (e) {
      console.error("Error hashing password:", e);
      return NextResponse.json(
        { error: "Error processing password" },
        { status: 500 }
      );
    }

    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    } catch (e) {
      console.error("Error creating user:", e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          );
        }
      }
      return NextResponse.json(
        { error: "Error creating user account" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 
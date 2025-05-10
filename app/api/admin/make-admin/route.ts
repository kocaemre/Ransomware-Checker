import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Admin kontrolü - sadece belirli email hesabı
    const isAdmin = session.user?.email === "zeze@gmail.com";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }
    
    // İstek gövdesini al
    const body = await request.json();
    
    if (!body.email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }
    
    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: body.email }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: `User with email ${body.email} not found` },
        { status: 404 }
      );
    }
    
    // Kullanıcıyı admin yap
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });
    
    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} is now an admin`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin
      }
    });
    
  } catch (error) {
    console.error("Error making user admin:", error);
    return NextResponse.json(
      {
        error: "Failed to make user admin",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
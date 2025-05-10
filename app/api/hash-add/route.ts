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
    
    if (!body.hash) {
      return NextResponse.json(
        { error: "Hash is required" },
        { status: 400 }
      );
    }
    
    // Hash formatını doğrula (SHA-256: 64 hex karakter)
    const hashRegex = /^[a-f0-9]{64}$/i;
    if (!hashRegex.test(body.hash)) {
      return NextResponse.json(
        { error: "Invalid hash format. SHA-256 hash must be 64 hexadecimal characters." },
        { status: 400 }
      );
    }
    
    // Veritabanına kaydet
    const result = await prisma.maliciousHash.upsert({
      where: { hash: body.hash },
      update: {
        description: body.description || "Custom hash",
        source: body.source || "custom",
        updatedAt: new Date()
      },
      create: {
        hash: body.hash,
        description: body.description || "Custom hash",
        source: body.source || "custom"
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Hash added successfully",
      hash: result
    });
    
  } catch (error) {
    console.error("Error adding hash:", error);
    return NextResponse.json(
      {
        error: "Failed to add hash",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
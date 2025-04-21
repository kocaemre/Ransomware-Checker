import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Get scans with pagination
    const [scans, total] = await Promise.all([
      prisma.scan.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          fileHash: true,
          fileName: true,
          fileSize: true,
          status: true,
          scanResults: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.scan.count({
        where: { userId: session.user.id }
      })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      scans,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching scan history:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch scan history",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
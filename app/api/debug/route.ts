import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnalysisResult, getFileAnalysis, getComprehensiveAnalysis } from "@/lib/virustotal";

export async function GET(request: NextRequest) {
  try {
    // Check authentication (only admins should access debug endpoints)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get file hash from query parameters
    const searchParams = request.nextUrl.searchParams;
    const fileHash = searchParams.get("hash");
    const mode = searchParams.get("mode") || "comprehensive"; // file, analysis, or comprehensive
    
    if (!fileHash) {
      return NextResponse.json(
        { error: "Missing hash parameter" },
        { status: 400 }
      );
    }
    
    // Directly call VirusTotal API based on selected mode
    console.log(`Debug: Getting ${mode} for hash ${fileHash}`);
    try {
      let result;
      
      if (mode === "file") {
        result = await getAnalysisResult(fileHash);
      } else if (mode === "analysis") {
        result = await getFileAnalysis(fileHash);
      } else {
        // Default to comprehensive
        result = await getComprehensiveAnalysis(fileHash);
      }
      
      return NextResponse.json({
        success: true,
        mode,
        fileHash,
        result,
        status: result.status,
        stats: result.stats,
        engineCount: result.results ? Object.keys(result.results).length : 0
      });
    } catch (error) {
      console.error("Error getting analysis in debug endpoint:", error);
      return NextResponse.json(
        { 
          error: "Failed to get analysis results",
          details: error instanceof Error ? error.message : "Unknown error",
          fileHash,
          mode
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
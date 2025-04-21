import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getComprehensiveAnalysis } from "@/lib/virustotal";
import { Session } from "next-auth";

interface AnalysisResponse {
  status: string;
  stats: {
    malicious: number;
    suspicious: number;
    undetected: number;
    harmless: number;
    timeout: number;
    "confirmed-timeout": number;
    failure: number;
    "type-unsupported": number;
  };
  results?: Record<string, any>;
}

// Extend Session type to include user with id
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

// Cache for recent VirusTotal API calls to respect rate limits (4 lookups/min)
const API_CALL_CACHE: {
  [key: string]: {
    timestamp: number;
    result: any;
  }
} = {};

// Rate limiter - returns cached result if available and recent
function rateLimitedCall<T>(key: string, apiCall: () => Promise<T>, maxAgeMs = 15000): Promise<T> {
  const now = Date.now();
  const cachedResult = API_CALL_CACHE[key];
  
  if (cachedResult && (now - cachedResult.timestamp) < maxAgeMs) {
    console.log(`Using cached result for ${key} (${Math.round((now - cachedResult.timestamp)/1000)}s old)`);
    return Promise.resolve(cachedResult.result);
  }
  
  return apiCall().then(result => {
    API_CALL_CACHE[key] = {
      timestamp: now,
      result
    };
    return result;
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await params before using params.id
    const resolvedParams = await params;
    const scanId = resolvedParams.id;

    console.log("Finding scan with ID:", scanId);
    
    const scan = await prisma.scan.findUnique({
      where: {
        id: scanId,
        userId: session.user.id,
      },
    });

    console.log("Scan found:", scan ? "Yes" : "No");

    if (!scan) {
      return NextResponse.json(
        { error: "Scan not found" },
        { status: 404 }
      );
    }

    // If scan is already completed, return the results
    if (scan.status === "completed") {
      return NextResponse.json({ scan });
    }

    // If scan is queued or pending, try to get the latest results
    if (scan.status === "queued" || scan.status === "pending") {
      try {
        // Only allow checking for updates if the scan is at least 30 seconds old
        // This prevents multiple API calls when users refresh the page frequently
        const scanAgeMs = Date.now() - new Date(scan.createdAt).getTime();
        const minCheckInterval = 30 * 1000; // 30 seconds
        
        if (scanAgeMs < minCheckInterval) {
          console.log(`Scan is only ${Math.round(scanAgeMs/1000)}s old. Too soon to check for updates.`);
          return NextResponse.json({ scan });
        }
        
        // Use rate limited call to prevent exceeding VirusTotal API limits
        const analysisResults = await rateLimitedCall(
          `analysis-${scan.fileHash}`,
          () => {
            console.log(`Requesting analysis for file hash: ${scan.fileHash}, scan age: ${Math.round(scanAgeMs/1000)}s`);
            return getComprehensiveAnalysis(scan.fileHash);
          }
        );
        
        console.log(`Analysis results status: ${analysisResults.status}`);
        console.log(`Analysis results stats: ${JSON.stringify(analysisResults.stats)}`);
        
        // Only update the database if the status has changed
        if (analysisResults.status !== scan.status) {
          console.log(`Scan status changed from ${scan.status} to ${analysisResults.status}`);
          
          // Update the scan status and results
          const updatedScan = await prisma.scan.update({
            where: { id: scan.id },
            data: {
              status: analysisResults.status,
              scanResults: analysisResults as any, // Type cast to any to bypass Prisma type checking
            },
          });
          
          return NextResponse.json({ scan: updatedScan });
        }
        
        // If status hasn't changed, return the current scan data
        return NextResponse.json({ scan });
      } catch (error) {
        console.error("Error getting analysis results:", error);
        
        // Log more details about the error
        if (error instanceof Error) {
          console.error(`Error name: ${error.name}, message: ${error.message}`);
          console.error(`Error stack: ${error.stack}`);
        }
        
        // If there's an error, return the current scan data with a warning
        return NextResponse.json({ 
          scan, 
          warning: "An error occurred while checking for updates. The scan status might not be current."
        });
      }
    }

    return NextResponse.json({ scan });
  } catch (error) {
    console.error("Error fetching scan:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan" },
      { status: 500 }
    );
  }
} 
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar";

interface ScanResult {
  id: string;
  userId: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  status: string;
  scanResults: {
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
  };
  createdAt: string;
  updatedAt: string;
}

export default function ScanHistory() {
  const { data: session } = useSession();
  const router = useRouter();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!session) {
      if (session === null) {
        router.push("/login");
      }
      return;
    }

    const fetchScans = async () => {
      try {
        const response = await fetch(`/api/scans?page=${currentPage}&limit=10`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.error || "Failed to fetch scan history");
        }

        const data = await response.json();
        console.log("API Response:", data);

        setScans(data.scans);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch scan history");
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [session, router, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>
              View your previous file scan results and detailed analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No scan history found</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/")}
                >
                  Start a New Scan
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>Scan Date</TableHead>
                      <TableHead>Detection Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">{scan.fileName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {scan.fileHash.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {new Date(scan.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {scan.scanResults.stats?.malicious || 0}/{
                            (scan.scanResults.stats?.malicious || 0) +
                            (scan.scanResults.stats?.suspicious || 0) +
                            (scan.scanResults.stats?.undetected || 0) +
                            (scan.scanResults.stats?.harmless || 0)
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (scan.scanResults.stats?.malicious || 0) > 0
                                ? "destructive"
                                : "default"
                            }
                            className="whitespace-nowrap"
                          >
                            {(scan.scanResults.stats?.malicious || 0) > 0
                              ? `${scan.scanResults.stats.malicious} Threats`
                              : "Clean"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/scan-history/${scan.id}`)}
                          >
                            View Analysis
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
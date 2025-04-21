"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  Shield, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileWarning,
  FileLock2
} from "lucide-react";
import Navbar from "../../components/Navbar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress";

interface ScanResult {
  id: string;
  userId: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  status: string;
  scanResults: {
    stats: {
      failure: number;
      timeout: number;
      harmless: number;
      malicious: number;
      suspicious: number;
      undetected: number;
      "type-unsupported": number;
      "confirmed-timeout": number;
    };
    status: string;
    results?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

export default function ScanDetail({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [timeSinceRefresh, setTimeSinceRefresh] = useState<number>(0);
  
  // Unwrap params using React.use()
  const unwrappedId = React.use(params).id;

  const fetchScan = async () => {
    try {
      setRefreshing(true);
      console.log("Fetching scan with ID:", unwrappedId);
      const response = await fetch(`/api/scans/${unwrappedId}`);
      const data = await response.json();
      
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch scan details");
      }

      // Check for any warnings from the API
      if (data.warning) {
        console.warn("API Warning:", data.warning);
        // We could display this warning to the user if needed
      }

      setScan(data.scan);
      setLastRefreshed(new Date());
      setTimeSinceRefresh(0);
    } catch (err) {
      console.error("Error fetching scan:", err);
      setError("Failed to fetch scan details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update the time since last refresh
  useEffect(() => {
    if (!lastRefreshed || !scan || (scan.status !== "pending" && scan.status !== "queued")) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000);
      setTimeSinceRefresh(diffInSeconds);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastRefreshed, scan?.status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "loading") return;

    fetchScan();
  }, [status, router, unwrappedId]);

  // Set up auto-refresh for pending scans
  useEffect(() => {
    // Only set up the interval if the scan is pending
    if (scan && (scan.status === "pending" || scan.status === "queued")) {
      console.log("Setting up auto-refresh for pending scan");
      const intervalId = setInterval(() => {
        console.log("Auto-refreshing scan data...");
        fetchScan();
      }, 30000); // Refresh every 30 seconds (changed from 10000)
      
      // Clean up the interval when the component unmounts or scan status changes
      return () => {
        console.log("Clearing auto-refresh interval");
        clearInterval(intervalId);
      };
    }
  }, [scan?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-6"></div>
              <h3 className="text-xl font-medium text-gray-700">Loading scan results...</h3>
              <p className="text-gray-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Error</AlertTitle>
            <AlertDescription className="text-base">
              {error}. <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/scan-history")}>Return to scan history</Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              This scan either doesn't exist or you don't have permission to view it.
              <Button variant="link" className="ml-1 p-0 h-auto" onClick={() => router.push("/scan-history")}>
                Return to scan history
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Make sure stats exists and has valid data
  const stats = scan.scanResults.stats || {
    malicious: 0,
    suspicious: 0,
    undetected: 0,
    harmless: 0,
    failure: 0,
    timeout: 0,
    "type-unsupported": 0,
    "confirmed-timeout": 0
  };

  // Check if we have any valid stats (non-zero values)
  const hasValidStats = Object.values(stats).some(val => val > 0);

  // If we have no valid stats, show a message
  if (!hasValidStats && scan.status === "completed") {
    console.log("Warning: Scan marked as completed but no valid stats found", scan);
  }

  const totalScans = hasValidStats ? 
    stats.malicious +
    stats.suspicious +
    stats.undetected +
    stats.harmless +
    stats.failure +
    stats.timeout +
    stats["type-unsupported"] +
    stats["confirmed-timeout"]
    : 70; // Default total for VirusTotal is around 70 engines
    
  const threatLevel = 
    stats.malicious > 10 ? "Critical" :
    stats.malicious > 5 ? "High" :
    stats.malicious > 0 ? "Medium" :
    stats.suspicious > 0 ? "Low" : "Clean";

  const threatColor = {
    "Critical": "text-red-700 bg-red-100 border-red-200",
    "High": "text-orange-700 bg-orange-100 border-orange-200",
    "Medium": "text-amber-700 bg-amber-100 border-amber-200",
    "Low": "text-yellow-700 bg-yellow-100 border-yellow-200",
    "Clean": "text-green-700 bg-green-100 border-green-200",
  }[threatLevel];

  // Create an array of scan engine results for the table
  const engineResults = scan.scanResults.results ? 
    Object.entries(scan.scanResults.results).map(([engine, result]) => ({
      engine,
      category: result.category || "N/A",
      result: result.result || "N/A",
      method: result.method || "N/A"
    })).sort((a, b) => {
      // Sort by category - malicious first
      const categories = ["malicious", "suspicious", "undetected", "harmless", "timeout", "failure", "type-unsupported"];
      return categories.indexOf(a.category) - categories.indexOf(b.category);
    }) : [];

  const isPending = scan.status === "pending" || scan.status === "queued";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/scan-history")}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex-1">
            Scan Analysis
          </h1>
          
          <Badge 
            className={`ml-2 px-3 py-1.5 text-sm font-medium relative ${
              isPending ? "bg-blue-100 text-blue-800 border border-blue-200" : 
              stats.malicious > 0 ? "bg-red-100 text-red-800 border border-red-200" :
              "bg-green-100 text-green-800 border border-green-200"
            }`}
          >
            {isPending ? (
              <>
                <span className="inline-flex items-center">
                  Scanning
                  <span className="inline-block ml-1">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>.</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>.</span>
                  </span>
                </span>
                {refreshing && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                )}
              </>
            ) : 
             stats.malicious > 0 ? `${stats.malicious} Threats Detected` : 
             "Clean"}
          </Badge>
        </div>

        {/* File Info & Scan Status Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">File Name</p>
                  <p className="font-medium truncate">{scan.fileName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">File Size</p>
                  <p className="font-medium">{formatBytes(scan.fileSize)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500 mr-1">SHA-256 Hash</p>
                    <HoverCard>
                      <HoverCardTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          A SHA-256 hash is a unique fingerprint of a file. 
                          Files with identical content will have identical hashes, 
                          regardless of filename.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded overflow-x-auto">{scan.fileHash}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Scan Date</p>
                  <p className="font-medium">{formatDate(scan.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Threat Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-3 ${threatColor}`}>
                  {isPending ? (
                    <div className="animate-pulse">
                      <Clock className="h-10 w-10 animate-spin-slow" />
                    </div>
                  ) : (
                    threatLevel === "Clean" ? (
                      <CheckCircle className="h-10 w-10" />
                    ) : (
                      <AlertTriangle className="h-10 w-10" />
                    )
                  )}
                </div>
                <h3 className="text-2xl font-bold">
                  {isPending ? "Pending" : threatLevel}
                </h3>
                <p className="text-gray-500 mt-1">
                  {isPending ? (
                    <span className="inline-flex items-center">
                      Analysis in progress
                      <span className="inline-block ml-1">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>.</span>
                      </span>
                      {refreshing && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 animate-ping inline-block"></span>}
                    </span>
                  ) : 
                   threatLevel === "Clean" ? "No threats detected" : 
                   `${stats.malicious} engines detected threats`}
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg pt-2 pb-3 px-6">
              <div className="w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Detection Rate</span>
                  <span className="font-bold">{stats.malicious}/{totalScans}</span>
                </div>
                <Progress 
                  value={(stats.malicious / totalScans) * 100} 
                  className={`h-2 ${
                    stats.malicious > 10 ? "bg-red-600" :
                    stats.malicious > 5 ? "bg-orange-600" :
                    stats.malicious > 0 ? "bg-amber-600" :
                    stats.suspicious > 0 ? "bg-yellow-600" :
                    "bg-green-600"
                  }`}
                />
              </div>
            </CardFooter>
          </Card>
        </div>

        {isPending && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-blue-700">
                    This scan is currently in progress. Results will be automatically updated.
                  </p>
                </div>
                {refreshing && (
                  <div className="text-sm text-blue-600 mt-2 ml-7">
                    <span className="flex items-center">
                      <span className="animate-spin mr-1">⟳</span> Refreshing now...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan Results Tabs */}
        <Tabs defaultValue="summary" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Engine Details</TabsTrigger>
            <TabsTrigger value="technical">Technical Info</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scan Statistics</CardTitle>
                <CardDescription>
                  Overview of results from {totalScans} security engines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-xs font-medium text-red-600 mb-1">Malicious</p>
                    <p className="text-2xl font-bold text-red-700">{stats.malicious}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <p className="text-xs font-medium text-amber-600 mb-1">Suspicious</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.suspicious}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-xs font-medium text-green-600 mb-1">Clean</p>
                    <p className="text-2xl font-bold text-green-700">{stats.harmless}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 mb-1">Undetected</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.undetected}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Timeout</p>
                    <p className="text-2xl font-bold text-gray-700">{stats.timeout + stats["confirmed-timeout"]}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-gray-700">{stats.failure}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Unsupported</p>
                    <p className="text-2xl font-bold text-gray-700">{stats["type-unsupported"]}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <p className="text-xs font-medium text-purple-600 mb-1">Total Engines</p>
                    <p className="text-2xl font-bold text-purple-700">{totalScans}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">Scan Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <p className="text-gray-700">
                      {isPending ? (
                        "This file is currently being analyzed by multiple security engines. Results will be updated automatically when the analysis is complete."
                      ) : stats.malicious > 0 ? (
                        `This file was flagged as malicious by ${stats.malicious} security engines. It may contain malware, viruses, or other threats and should be handled with caution.`
                      ) : stats.suspicious > 0 ? (
                        `This file was flagged as suspicious by ${stats.suspicious} security engines. While not definitively malicious, it may contain potentially unwanted behavior and should be handled with caution.`
                      ) : (
                        "This file appears to be clean. No security engines detected malicious or suspicious content."
                      )}
                    </p>
                    {stats.malicious > 0 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                          This file is potentially harmful. We recommend against using it.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Engine Analysis Results</CardTitle>
                <CardDescription>
                  Detailed results from each security engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                {engineResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Engine</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {engineResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{result.engine}</TableCell>
                            <TableCell>{result.result}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  result.category === "malicious" ? "bg-red-100 text-red-800 border-red-200" :
                                  result.category === "suspicious" ? "bg-amber-100 text-amber-800 border-amber-200" :
                                  result.category === "harmless" ? "bg-green-100 text-green-800 border-green-200" :
                                  "bg-gray-100 text-gray-800 border-gray-200"
                                }
                              >
                                {result.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{result.method}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    {isPending ? (
                      <div>
                        <Clock className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">Analysis in progress</h3>
                        <p className="text-gray-500 mt-1">Detailed results will be available when the scan completes</p>
                      </div>
                    ) : (
                      <div>
                        <FileWarning className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No detailed results available</h3>
                        <p className="text-gray-500 mt-1">This scan doesn't have detailed engine results</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Technical Tab */}
          <TabsContent value="technical" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Technical Information</CardTitle>
                <CardDescription>
                  Technical details about the file and scan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="file-metadata">
                    <AccordionTrigger>File Metadata</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">File Name</p>
                          <p className="font-medium break-all">{scan.fileName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">File Size</p>
                          <p className="font-medium">{formatBytes(scan.fileSize)} ({scan.fileSize} bytes)</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">SHA-256 Hash</p>
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded overflow-x-auto">{scan.fileHash}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Scan ID</p>
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded overflow-x-auto">{scan.id}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="scan-details">
                    <AccordionTrigger>Scan Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Scan Status</p>
                          <p className="font-medium">
                            <Badge
                              variant="outline"
                              className={
                                scan.status === "completed" ? "bg-green-100 text-green-800 border-green-200" :
                                "bg-blue-100 text-blue-800 border-blue-200"
                              }
                            >
                              {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                            </Badge>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Created At</p>
                          <p className="font-medium">{formatDate(scan.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Last Updated</p>
                          <p className="font-medium">{formatDate(scan.updatedAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Engines Scanned</p>
                          <p className="font-medium">{totalScans}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">Raw Scan Statistics</p>
                        <pre className="font-mono text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(scan.scanResults.stats, null, 2)}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="api-response">
                    <AccordionTrigger>API Response Data</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-500 mb-2">
                        This is the raw API response data for advanced users and debugging purposes.
                      </p>
                      <pre className="font-mono text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-96">
                        {JSON.stringify(scan, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
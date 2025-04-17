"use client";

import { useState } from "react";
import Navbar from "./components/Navbar";
import DropzoneUploader from "./components/DropzoneUploader";

export default function Home() {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<"clean" | "infected" | null>(null);

  // Function that runs when a file is selected
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    startAnalysis(selectedFile);
  };

  // Analysis process (simulation for now)
  const startAnalysis = (selectedFile: File) => {
    setIsAnalyzing(true);
    setResult(null);

    // Additional operations on the selected file
    console.log("Starting analysis:", selectedFile.name);

    // Simulated analysis process (2 seconds)
    setTimeout(() => {
      // Random result (in real application, it would go to an API)
      const isInfected = Math.random() > 0.5;
      setResult(isInfected ? "infected" : "clean");
      setIsAnalyzing(false);
    }, 2000);
  };

  // Format file size
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Reset analysis for uploading a new file
  const resetAnalysis = () => {
    setFile(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Ransomware File Check
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Analyze your files securely and protect yourself from potential threats.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!file ? (
            <>
              <DropzoneUploader onFileSelect={handleFileSelect} />
              <div className="mt-10 text-center">
                <div className="space-y-3 max-w-2xl mx-auto">
                  <p className="font-semibold text-lg text-gray-700">
                    Ransomware Checker scans suspicious files to protect you from potential threats.
                  </p>
                  <p className="text-gray-600">
                    Upload your file now to test its security.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm">
              {/* File Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <svg
                    className="w-10 h-10 text-blue-500 mr-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-lg truncate text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </div>

              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="mb-8 text-center py-8">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                  <p className="text-lg text-gray-700">Analyzing file...</p>
                  <p className="text-sm text-gray-500 mt-2">This process may take a few seconds.</p>
                </div>
              )}

              {/* Result Display */}
              {result && (
                <div className={`mb-6 p-6 rounded-lg flex items-center ${result === "clean" ? "bg-green-50 border border-green-100" :
                  "bg-red-50 border border-red-100"
                  }`}>
                  {result === "clean" ? (
                    <>
                      <div className="bg-green-100 p-3 rounded-full mr-4">
                        <svg
                          className="w-8 h-8 text-green-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-800">File is Safe</h3>
                        <p className="text-green-700 mt-1">No threats were detected in your file.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-100 p-3 rounded-full mr-4">
                        <svg
                          className="w-8 h-8 text-red-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-red-800">Threat Detected!</h3>
                        <p className="text-red-700 mt-1">This file may contain ransomware.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Upload New File Button */}
              <button
                onClick={resetAnalysis}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Upload New File
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Ransomware Checker - All Rights Reserved</p>
            <p className="mt-1">This application analyzes files for security concerns.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

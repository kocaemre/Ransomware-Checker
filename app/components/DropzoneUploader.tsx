"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneUploaderProps {
    onFileSelect: (file: File) => void;
}

export default function DropzoneUploader({ onFileSelect }: DropzoneUploaderProps) {
    // Callback for when files are dropped
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            onFileSelect(selectedFile);
        }
    }, [onFileSelect]);

    // React Dropzone hook
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={`w-full max-w-xl mx-auto p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer shadow-sm
      ${isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center">
                <svg
                    className="w-20 h-20 mb-6 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <p className="text-center text-lg font-semibold text-gray-700">
                    Drop your file or click to select
                </p>
                <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
                    Upload your file for ransomware analysis. All analyses are performed in a secure environment and your file remains confidential.
                </p>
                <div className="mt-6 w-full">
                    <div className="relative">
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                className="relative w-full flex justify-center py-3 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Select File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
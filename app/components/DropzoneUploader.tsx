"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

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
                <Upload className="w-20 h-20 mb-6 text-gray-400" />
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
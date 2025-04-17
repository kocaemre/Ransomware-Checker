"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const tempErrors: Record<string, string> = {};
        let isValid = true;

        if (!formData.fullName) {
            tempErrors.fullName = "Full Name is required";
            isValid = false;
        }

        if (!formData.email) {
            tempErrors.email = "Email address is required";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        if (!formData.password) {
            tempErrors.password = "Password is required";
            isValid = false;
        } else if (formData.password.length < 6) {
            tempErrors.password = "Password must be at least 6 characters";
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            tempErrors.confirmPassword = "Passwords do not match";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setLoading(true);

            // Simulated registration process, would actually send a request to an API
            setTimeout(() => {
                // Registration process completed
                setLoading(false);
                // This would normally redirect the user to the login page, etc.
                alert("Registration successful! (Demo)");
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
                        <p className="text-gray-600">
                            Register for free to analyze your files against ransomware threats.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-colors`}
                                    placeholder="Full Name"
                                />
                                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-colors`}
                                    placeholder="example@mail.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-colors`}
                                    placeholder="At least 6 characters"
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-colors`}
                                    placeholder="Re-enter your password"
                                />
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="agree_terms"
                                    name="agree_terms"
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                                />
                                <label htmlFor="agree_terms" className="ml-2 block text-sm text-gray-700">
                                    I accept the terms of use and privacy policy
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 rounded-lg text-white font-medium transition-colors 
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Registering...
                                    </>
                                ) : (
                                    'Register'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 
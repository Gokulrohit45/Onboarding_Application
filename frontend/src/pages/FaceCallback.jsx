import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function FaceCallback() {
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const verifyFace = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get("token");
            const verifyStatus = params.get("status");

            if (!token || verifyStatus === "failure") {
                setStatus("error");
                setErrorMsg("Face verification failed. Please try again.");
                return;
            }

            try {
                // Call backend to verify the token and get a 'faceVerified: true' JWT
                const res = await API.post("/auth/verify-face", { token });

                if (res.data.success) {
                    localStorage.setItem("token", res.data.token);
                    setStatus("success");
                    
                    // Redirect to editor after 2 seconds to show success state
                    setTimeout(() => {
                        navigate("/editor");
                    }, 2000);
                } else {
                    setStatus("error");
                    setErrorMsg("Invalid verification response.");
                }
            } catch (err) {
                setStatus("error");
                setErrorMsg(err.response?.data?.message || "Verification service unavailable");
            }
        };

        verifyFace();
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center"
            >
                {status === "verifying" && (
                    <div className="space-y-6">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                            <Loader2 className="w-24 h-24 text-indigo-600 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Verifying Identity</h2>
                        <p className="text-gray-500">Checking face verification results, please wait...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6">
                        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Verification Success!</h2>
                        <p className="text-gray-500">Your identity has been confirmed. Redirecting to dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6">
                        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-16 h-16 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Verification Failed</h2>
                        <p className="text-red-500">{errorMsg}</p>
                        <button 
                            onClick={() => navigate("/login")}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

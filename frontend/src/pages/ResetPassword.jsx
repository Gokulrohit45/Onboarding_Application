import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMsg({ text: "Passwords do not match", type: "error" });
            return;
        }

        if (newPassword.length < 6) {
            setMsg({ text: "Password must be at least 6 characters", type: "error" });
            return;
        }

        setLoading(true);
        setMsg({ text: "", type: "" });

        try {
            const token = localStorage.getItem("resetToken");
            const res = await API.post("/user-auth/user/reset-password", { 
                token, 
                newPassword 
            });

            if (res.data.success) {
                setMsg({ text: "Password updated! Redirecting to login...", type: "success" });
                localStorage.removeItem("resetToken");
                setTimeout(() => navigate("/user/login"), 3000);
            }
        } catch (err) {
            setMsg({ 
                text: err.response?.data?.message || "Failed to update password", 
                type: "error" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Set New Password</h2>
                        <p className="text-slate-500 mt-2">Security update required for first-time login</p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {msg.text && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
                                msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                                {msg.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span>{msg.text}</span>
                            </div>
                        )}

                        <button
                            disabled={loading || msg.type === "success"}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Update Password & Secure Account"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Lock, LogIn, Loader2, AlertCircle, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setMsg("Admin username and password required");
            return;
        }

        setLoading(true);
        setMsg("");

        try {
            // Using the existing admin login endpoint
            const res = await API.post("/auth/login", { email, password });

            if (res.data.success) {
                localStorage.removeItem("token");
                localStorage.removeItem("userToken");
                localStorage.setItem("adminToken", res.data.token);
                localStorage.setItem("role", "admin");
                navigate("/admin/dashboard");
            } else {
                setMsg("Invalid admin credentials");
            }
        } catch (err) {
            setMsg(err.response?.data?.message || "Admin login service unavailable");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Ambient Background Lights */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/20 blur-[120px]"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/20">
                            <UserIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">
                            Admin Login
                        </h2>
                        <p className="text-slate-400 mt-3 font-medium">
                            Authorized personnel only
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                                Admin Username / Email
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    placeholder="admin@vtabsquare.com"
                                    className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                                Admin Password
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {msg && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{msg}</span>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative flex items-center justify-center px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Access Dashboard</span>
                                    <LogIn className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-center text-sm text-slate-500 font-medium">
                    &copy; {new Date().getFullYear()} VTAB Square. Secure Administration.
                </p>
            </motion.div>
        </div>
    );
}

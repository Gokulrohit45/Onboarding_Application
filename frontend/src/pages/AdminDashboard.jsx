import { useState, useEffect } from "react";
import API from "../api/axios";
import { UserPlus, Users, Mail, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setFetchLoading(true);
        setFetchError(null);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await API.get(`/user-auth/admin/users?t=${Date.now()}`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            console.log("Fetched users successfully:", res.data);
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setFetchError(err.response?.data?.message || err.message || "Could not connect to server");
        } finally {
            setFetchLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const token = localStorage.getItem("adminToken");
            const res = await API.post("/user-auth/admin/create-user", { email }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMessage({ text: res.data.message, type: "success" });
                setEmail("");
                fetchUsers();
                setTimeout(() => setShowCreate(false), 2000);
            }
        } catch (err) {
            setMessage({ 
                text: err.response?.data?.message || "Failed to create user", 
                type: "error" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-slate-500 font-medium">Manage users and face recognition access</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200"
                    >
                        {showCreate ? "Close Panel" : (
                            <>
                                <UserPlus className="w-5 h-5 mr-2" />
                                Create New User
                            </>
                        )}
                    </button>
                </header>

                <AnimatePresence>
                    {showCreate && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 40 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                                    Send Access Invitation
                                </h2>
                                <form onSubmit={handleCreateUser} className="max-w-md">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">User Email ID</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="user@example.com"
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            disabled={loading}
                                            className="w-full flex items-center justify-center px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            ) : (
                                                <>
                                                    <span>Create & Send Email</span>
                                                    <Send className="ml-2 w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {message.text && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
                                                message.type === "success" 
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                                : "bg-red-50 text-red-700 border border-red-100"
                                            }`}
                                        >
                                            {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                            <span className="font-medium">{message.text}</span>
                                        </motion.div>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


            </div>
        </div>
    );
}

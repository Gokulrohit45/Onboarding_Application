import { useState, useEffect } from "react";
import API from "../api/axios";
import { UserPlus, Users, Mail, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await API.get("/user-auth/admin/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
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

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <Users className="w-6 h-6 mr-3 text-slate-400" />
                            Registered Users
                        </h2>
                        <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            {users.length} Total
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                                    <th className="px-8 py-5">User Details</th>
                                    <th className="px-8 py-5">User ID</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fetchLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-4" />
                                            <p className="text-slate-500 font-medium">Fetching User Directory...</p>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No users found in the system</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                        {user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-800">{user.email}</div>
                                                        <div className="text-xs text-slate-400">Union #: {user.unionNumber || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <code className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                    {user.userId}
                                                </code>
                                            </td>
                                            <td className="px-8 py-6">
                                                {user.isVerified ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

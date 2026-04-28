import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PartyPopper, CheckCircle2, ShieldCheck, FileText, Loader2 } from "lucide-react";

export default function OfferPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/editor");
        }, 2000);
        return () => clearTimeout(timer);
    }, [navigate]);
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-100 text-center"
            >
                <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200">
                    <ShieldCheck className="w-12 h-12 text-white" />
                </div>
                
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Identity Verified</h1>
                <p className="text-lg text-slate-500 font-medium mb-10">Welcome to your secure onboarding portal.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-800">Biometric Secure</h3>
                        <p className="text-sm text-slate-500 mt-1">Your session is protected by face recognition.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-800">Documents Ready</h3>
                        <p className="text-sm text-slate-500 mt-1">Your offer letters and policies are ready for review.</p>
                    </div>
                </div>

                <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                    <PartyPopper className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-indigo-900">Congratulations!</h2>
                    <p className="text-indigo-700/70 text-sm mt-2">You have successfully completed the secure authentication process.</p>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-xs">Redirecting to your dashboard...</p>
                </div>
            </motion.div>
        </div>
    );
}

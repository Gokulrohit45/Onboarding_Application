import { useState, useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import Webcam from "react-webcam";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, AlertCircle, UserCheck, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FaceMatch() {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [matching, setMatching] = useState(false);
    const [status, setStatus] = useState("Initializing identity check...");
    const [error, setError] = useState("");
    const [userName, setUserName] = useState("User");
    const webcamRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = "/models";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setStatus("Scanner ready. Please look at the camera.");
                
                // Try to get user name from local storage if available
                const storedEmail = localStorage.getItem("userEmail");
                if (storedEmail) {
                    setUserName(storedEmail.split('@')[0]);
                }
            } catch (err) {
                setError("Scanner hardware initialization failed.");
                console.error(err);
            }
        };
        loadModels();
    }, []);

    const performMatch = async () => {
        if (!webcamRef.current) return;
        
        setMatching(true);
        setError("");
        setStatus("Analyzing facial features...");

        try {
            const image = webcamRef.current.getScreenshot();
            if (!image) throw new Error("Camera capture failed");

            const img = await faceapi.fetchImage(image);
            const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setError("Face not detected. Ensure you are well lit.");
                setMatching(false);
                return;
            }

            setStatus("Verifying identity against profile...");
            
            const token = localStorage.getItem("faceMatchToken");
            const res = await API.post("/user-auth/user/match-face", {
                token,
                liveFaceData: Array.from(detection.descriptor)
            });

            if (res.data.success) {
                setStatus("Access Granted!");
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("userToken", res.data.token);
                localStorage.removeItem("faceMatchToken");
                localStorage.setItem("role", "user");
                setTimeout(() => navigate("/editor"), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Biometric authentication failed.");
        } finally {
            setMatching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-[#1e293b]/50 backdrop-blur-3xl border border-slate-700/50 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
                {/* Decorative glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="text-center mb-8 relative z-10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                        <ShieldCheck className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Identity Scan</h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Hello, <span className="text-indigo-400 capitalize font-bold">{userName}</span>. Please align your face for <span className="text-white">login</span>.
                    </p>
                </div>

                <div className="relative aspect-square mb-8 bg-black rounded-[2.5rem] overflow-hidden border-2 border-slate-700/50 group shadow-2xl">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover opacity-90 brightness-110"
                        videoConstraints={{ facingMode: "user" }}
                    />
                    
                    {/* Scanning Animation */}
                    <AnimatePresence>
                        {modelsLoaded && !error && (
                            <motion.div 
                                initial={{ top: "0%" }}
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-indigo-500/60 z-20 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                            />
                        )}
                    </AnimatePresence>

                    {/* Frame overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[85%] h-[85%] border border-white/10 rounded-[2rem]"></div>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={performMatch}
                        disabled={!modelsLoaded || matching}
                        className="w-full group relative flex items-center justify-center py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                        {matching ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Securing Session...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5" />
                                <span>Secure Verify & Access</span>
                            </div>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 py-2">
                        <div className={`w-2 h-2 rounded-full ${modelsLoaded ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}></div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            {modelsLoaded ? "Bio & System Ready" : "System Initializing"}
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700/30 text-center">
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
                        Enterprise Biometric Security v2.5
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

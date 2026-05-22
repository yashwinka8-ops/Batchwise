
import React, { useEffect, useRef } from 'react';
import { BatchWiseLogo, GoogleIcon } from './Icons';

interface LoginViewProps {
    onLogin: () => void;
    onGuestMode: () => void;
    onInfoOpen: () => void;
    loading: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestMode, onInfoOpen, loading }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll('.reveal');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const features = [
        {
            title: "Playlist Intelligence",
            desc: "Stop getting lost in folders. Our system parses and organizes your YouTube curriculum with semantic precision.",
            icon: "playlist_play",
            color: "rose"
        },
        {
            title: "Dynamic Roadmaps",
            desc: "Real-time tracking that adapts to your pace. Know exactly what's next in your learning journey.",
            icon: "route",
            color: "blue"
        },
        {
            title: "Performance Analytics",
            desc: "Visualise your study sessions with granular data. Track completion rates and session intensity.",
            icon: "analytics",
            color: "emerald"
        },
        {
            title: "Collective Intelligence",
            desc: "Share batches, invite peers, and sync progress across the community nexus.",
            icon: "hub",
            color: "white"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-rose-500/30">
            {/* SaaS Aurora Background */}
            <div className="aurora-blur opacity-20">
                <div className="aurora-blob aurora-1"></div>
                <div className="aurora-blob aurora-2"></div>
                <div className="aurora-blob aurora-3"></div>
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
            </div>

            {/* Navigation Header */}
            <header className="relative z-50 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
                        <BatchWiseLogo className="w-6 h-6 invert" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase">BatchWise</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <button onClick={onInfoOpen} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Documentation</button>
                    <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Changelog</button>
                    <button
                        onClick={onLogin}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <div className="flex-1 text-center lg:text-left">
                    <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        The Operating System for All Aspirants
                    </div>

                    <h1 className="reveal delay-100 text-5xl md:text-8xl font-black leading-[0.95] tracking-tighter mb-8">
                        Precision <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300">Curriculum</span> <br />
                        Management
                    </h1>

                    <p className="reveal delay-200 text-slate-400 text-lg md:text-xl font-medium max-w-xl mb-12 leading-relaxed">
                        Stop juggling tabs and playlists. BatchWise transforms chaotic study resources into a streamlined, high-performance roadmap.
                    </p>

                    <div className="reveal delay-300 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-16">
                        <button
                            onClick={onLogin}
                            disabled={loading}
                            className="btn-shine-container w-full sm:w-auto px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-rose-600/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <GoogleIcon className="w-5 h-5" />
                                    Initialize Portal
                                </>
                            )}
                        </button>
                        <button
                            onClick={onGuestMode}
                            className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined text-lg">terminal</span>
                            Guest Shell
                        </button>
                    </div>

                    <div className="reveal delay-400 flex items-center justify-center lg:justify-start gap-12 pt-8 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter">✅✅+</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Batches</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter">99.9%</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Uptime Sync</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter">24/7</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">*Ad free </span>
                        </div>
                    </div>
                </div>

                {/* Floating Graphic: High-end SaaS Dashboard Mockup */}
                <div className="reveal flex-1 relative w-full perspective-2000">
                    <div className="animate-float relative z-20 glass-card rounded-[2.5rem] p-8 w-full max-w-lg mx-auto transform rotate-x-6 rotate-y--6 border-white/20 shadow-rose-500/10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex gap-2">
                                <div className="size-3 rounded-full bg-rose-500"></div>
                                <div className="size-3 rounded-full bg-amber-500"></div>
                                <div className="size-3 rounded-full bg-emerald-500"></div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                Global Sync: Active
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inorganic Chemistry</span>
                                    <span className="text-[10px] font-black text-rose-500">68% Complete</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-600 w-[68%] transition-all duration-1000"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Study Hours</div>
                                    <div className="text-2xl font-black text-white tracking-tighter">12.4h</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">XP Earned</div>
                                    <div className="text-2xl font-black text-rose-500 tracking-tighter">1,240</div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-4 overflow-hidden">
                                <div className="size-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-2 w-24 bg-white/10 rounded-full"></div>
                                    <div className="h-2 w-full bg-white/5 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 size-40 bg-rose-600/20 blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 size-40 bg-blue-600/20 blur-3xl animate-pulse delay-500"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-white/5 blur-[120px] -z-10 animate-rotate-slow"></div>
                </div>
            </section>

            {/* Feature Bento Box Section */}
            <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-20 reveal">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 uppercase">Unified Control Plane</h2>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto">Every tool you need to master your curriculum, integrated into a single high-performance interface.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className={`reveal glass-card p-8 rounded-[2rem] border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 group shadow-xl`} style={{ transitionDelay: `${i * 100}ms` }}>
                            <div className={`size-14 rounded-2xl mb-8 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6
                                ${f.color === 'rose' ? 'bg-rose-500/20 text-rose-500 shadow-rose-500/20' :
                                    f.color === 'blue' ? 'bg-blue-500/20 text-blue-500 shadow-blue-500/20' :
                                        f.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-500 shadow-emerald-500/20' :
                                            'bg-purple-500/20 text-purple-500 shadow-purple-500/20 text-purple-500 shadow-purple-500/20'} shadow-lg`}>
                                <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-4 group-hover:text-rose-500 transition-colors uppercase">{f.title}</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Deep Feature Showcase: Playlist Sync */}
            <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
                <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col lg:flex-row border-white/10">
                    <div className="flex-1 p-12 lg:p-20 flex flex-col justify-center">
                        <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest mb-8">
                            Experimental Tech
                        </div>
                        <h2 className="reveal text-4xl md:text-6xl font-black leading-[0.95] tracking-tighter mb-8 uppercase">
                            YouTube Link <br />
                            <span className="text-slate-500">Autophagy</span>
                        </h2>
                        <ul className="reveal space-y-6 mb-12">
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-rose-500 font-black">check_circle</span>
                                <span className="text-slate-400 font-medium pt-0.5">Automated timestamp extraction from video descriptions.</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-rose-500 font-black">check_circle</span>
                                <span className="text-slate-400 font-medium pt-0.5">One-click batch generation from any public playlist URL.</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-rose-500 font-black">check_circle</span>
                                <span className="text-slate-400 font-medium pt-0.5">Direct Google Drive integration for associated PDF materials.</span>
                            </li>
                        </ul>
                        <button onClick={onLogin} className="reveal w-max px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.05] transition-all">
                            Experience the Engine
                        </button>
                    </div>
                    <div className="flex-1 bg-slate-900/50 relative min-h-[400px] border-l border-white/5 flex items-center justify-center p-12">
                        {/* Abstract Motion Graphic for Code/Logic */}
                        <div className="relative w-full aspect-square max-w-sm">
                            <div className="absolute inset-0 border-2 border-white/5 rounded-full animate-rotate-slow"></div>
                            <div className="absolute inset-4 border border-white/10 rounded-full animate-rotate-slow reverse"></div>
                            <div className="absolute inset-10 border-2 border-rose-500/20 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl font-black text-rose-500 tracking-tighter animate-pulse">0101</div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Neural Sync</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-8 rounded-lg bg-rose-600 flex items-center justify-center">
                                <BatchWiseLogo className="w-5 h-5 invert" />
                            </div>
                            <span className="text-lg font-black tracking-tighter uppercase">BatchWise</span>
                        </div>
                        <p className="text-slate-500 font-medium max-w-xs mb-8">Building the future of competitive exam preparation through architectural precision.</p>
                        <div className="flex gap-4">
                            <a href="https://www.reddit.com/r/BatchWise_Official/" target="_blank" rel="noreferrer" className="size-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-600 transition-all">
                                <span className="material-symbols-outlined text-white">group</span>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">System</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500">
                            <li><button onClick={onInfoOpen} className="hover:text-white transition-colors">Architecture</button></li>
                            <li><button className="hover:text-white transition-colors">Vapor Protocol</button></li>
                            <li><button className="hover:text-white transition-colors">Privacy Shield</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Company</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500">
                            <li><button className="hover:text-white transition-colors">Project Logos</button></li>
                            <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                            <li><button className="hover:text-white transition-colors">Security Manifest</button></li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-8 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                    <span>© 2026 BatchWise </span>
                    <span>All Transmission Encrypted</span>
                </div>
            </footer>
        </div>
    );
};

export default LoginView;

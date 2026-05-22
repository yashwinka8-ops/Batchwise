
import React, { useEffect } from 'react';
import { BatchWiseLogo, GoogleIcon, ArrowUpIcon, SparklesIcon, BookOpenIcon, CalendarIcon } from './Icons';
import heroMockup from '../assets/hero_mockup.png';

interface PublicLandingViewProps {
    onLogin: () => void;
    onGuestMode: () => void;
    onExplore: () => void;
    onPrivacyOpen: () => void;
    onDisclaimerOpen: () => void;
    loading?: boolean;
}

const PublicLandingView: React.FC<PublicLandingViewProps> = ({ onLogin, onGuestMode, onExplore, onPrivacyOpen, onDisclaimerOpen, loading }) => {

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

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[var(--primary)] selection:text-black overflow-x-hidden relative">
            <style>{`
                :root {
                    --primary: #f43f5e; /* Vibrant Red/Rose */
                    --primary-glow: rgba(244, 63, 94, 0.5);
                    --amber: #f59e0b;
                    --amber-glow: rgba(245, 158, 11, 0.5);
                    --electric-blue: #3b82f6;
                }

                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; filter: blur(40px); }
                    50% { opacity: 0.8; filter: blur(60px); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                .tactical-grid {
                    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                .reveal {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
                }

                .reveal.active {
                    opacity: 1;
                    transform: translateY(0);
                }

                .glass-panel {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .glow-btn {
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .glow-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, var(--primary-glow), transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .glow-btn:hover::after {
                    opacity: 1;
                }

                .perspective-container {
                    perspective: 1500px;
                }

                .dashboard-mockup {
                    transform: rotateY(-15deg) rotateX(5deg);
                    transition: transform 0.5s ease;
                }

                .dashboard-mockup:hover {
                    transform: rotateY(-5deg) rotateX(2deg);
                }

                .feature-icon-box {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .feature-icon-box:hover {
                    border-color: var(--primary);
                    background: rgba(244, 63, 94, 0.05);
                    transform: translateY(-5px);
                }

                .status-widget {
                    animation: float 4s ease-in-out infinite;
                }
            const scrollToSection = (id: string) => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            };
            `}</style>

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-900/20 rounded-full blur-[120px] animate-[pulse-glow_8s_infinite]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px] animate-[pulse-glow_12s_infinite]"></div>
                <div className="absolute inset-0 tactical-grid opacity-40"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 h-20 z-50 flex items-center justify-between px-8 lg:px-16 border-b border-white/5 backdrop-blur-md bg-black/20">
                <div className="flex items-center gap-4 cursor-pointer group">
                    <div className="size-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-2xl relative">
                        <BatchWiseLogo className="w-6 h-6 transition-transform duration-500 group-hover:rotate-[360deg]" />
                        <div className="absolute inset-0 bg-rose-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Batch<span className="text-[var(--primary)]">Wise</span></h1>
                </div>

                <div className="hidden lg:flex items-center gap-10">
                    {[
                        { name: 'Dashboard', id: 'hero' },
                        { name: 'Library', id: 'library' },
                        { name: 'Marketplace', id: 'marketplace' }
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => scrollToSection(item.id)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors relative group"
                        >
                            {item.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-[var(--primary)] transition-all group-hover:w-full"></span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:opacity-80 transition-opacity hidden sm:block">Sign In</button>
                    <button onClick={onLogin} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]">Initialize</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="relative pt-32 lg:pt-48 pb-20 px-8 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-16 overflow-visible">
                {/* Left Side */}
                <div className="lg:w-1/2 z-10">
                    <div className="flex items-center gap-3 mb-6 reveal">
                        <div className="h-px w-8 bg-rose-500"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500">Skill Learning Platform v5.0</span>
                    </div>

                    <h2 className="text-5xl lg:text-8xl font-black text-white leading-none tracking-tight mb-8 reveal">
                        Learn Any <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-500 to-amber-500">Skill, Your Way.</span> <br />
                        <span className="text-white italic">Structure Your Learning Journey.</span>
                    </h2>

                    <p className="text-slate-400 font-medium text-lg lg:text-xl max-w-xl leading-relaxed mb-10 reveal [transition-delay:200ms]">
                        BatchWise organizes tutorials, courses, and resources into structured learning paths. Master AI tools, video editing, coding, design, and more — all in one place.
                    </p>

                    <div className="flex flex-wrap gap-6 mb-16 reveal [transition-delay:400ms]">
                        <button
                            onClick={onLogin}
                            disabled={loading}
                            className="px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl shadow-[0_20px_50px_rgba(225,29,72,0.3)] transition-all hover:-translate-y-1 active:scale-95 glow-btn flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <GoogleIcon className="w-5 h-5" />
                                    Initialize Portal
                                </>
                            )}
                        </button>
                        <button
                            onClick={onGuestMode}
                            className="px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined text-lg">terminal</span>
                            Guest Shell
                        </button>
                    </div>

                    {/* Features Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 reveal [transition-delay:600ms]">
                        {[
                            { label: 'Course Builder', icon: 'auto_stories' },
                            { label: 'Track Progress', icon: 'query_stats' },
                            { label: 'Cloud Synced', icon: 'cloud_sync' },
                            { label: 'Project Portfolio', icon: 'folder_open' }
                        ].map((item, i) => (
                            <div key={i} className="feature-icon-box p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center gap-3 group text-center">
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-rose-500 transition-colors">{item.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Perspective Dashboard */}
                <div className="lg:w-1/2 perspective-container reveal [transition-delay:400ms]">
                    <div className="relative dashboard-mockup">
                        {/* Status Widgets */}
                        <div className="absolute -top-10 -left-10 z-20 status-widget [animation-delay:0s]">
                            <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-4">
                                <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Cloud Synced</span>
                            </div>
                        </div>

                        <div className="absolute top-1/4 -right-12 z-20 status-widget [animation-delay:1s]">
                            <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col gap-1 border-rose-500/30">
                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Critical Streak</span>
                                <span className="text-xl font-black text-white italic">2 DAYS</span>
                            </div>
                        </div>

                        <div className="absolute -bottom-6 left-1/4 z-20 status-widget [animation-delay:2s]">
                            <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-4 border-blue-500/30">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Global Progress</span>
                                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[65%]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-rose-600/50 to-amber-500/50 rounded-[2.5rem] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <img
                                src={heroMockup}
                                alt="BatchWise Tactical Interface"
                                className="relative rounded-[2.5rem] border border-white/10 shadow-2xl glass-panel"
                            />

                            {/* Dashboard Glints */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Elite Library Section */}
            <section id="library" className="px-8 lg:px-16 py-32 bg-gradient-to-b from-transparent to-black/40">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="lg:w-1/2 reveal">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Resource Repository</span>
                        </div>
                        <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-8">
                            The Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Library</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-lg mb-10 leading-relaxed">
                            A curated nexus of learning resources. From AI tool guides to video editing tutorials to community-sourced templates, the Library is engineered to accelerate your skill mastery.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-blue-500/20">
                                <span className="material-symbols-outlined text-blue-500 mb-4">description</span>
                                <h4 className="text-white font-bold mb-2 italic text-sm">PDF Archives</h4>
                                <p className="text-slate-500 text-[10px] uppercase tracking-widest leading-relaxed">Structured documents for offline study.</p>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl border-emerald-500/20">
                                <span className="material-symbols-outlined text-emerald-500 mb-4">share</span>
                                <h4 className="text-white font-bold mb-2 italic text-sm">Community Pulse</h4>
                                <p className="text-slate-500 text-[10px] uppercase tracking-widest leading-relaxed">Resources shared by lead students.</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-1/2 reveal [transition-delay:200ms]">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="aspect-video rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center overflow-hidden">
                                <img src="/library_mockup.png" alt="Library Interface Placeholder" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20"> </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Governance Protocols (Privacy & Content Integrity) */}
            <section className="px-8 lg:px-16 py-20 border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-rose-900/5 blur-[120px] pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center reveal">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-px w-8 bg-slate-700"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Nexus Security & Legal</span>
                        <div className="h-px w-8 bg-slate-700"></div>
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-black text-white mb-12 tracking-tight">Governance <span className="text-rose-500 italic">Protocols</span></h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div onClick={onPrivacyOpen} className="glass-panel p-10 rounded-[2.5rem] border-rose-500/20 text-left relative overflow-hidden group cursor-pointer hover:bg-white/[0.04] transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/40"></div>
                            <h3 className="text-xl font-bold text-white mb-4 italic flex items-center gap-3">
                                <span className="material-symbols-outlined text-rose-500">privacy_tip</span>
                                Privacy Directive
                            </h3>
                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed uppercase tracking-widest mb-6">
                                Your data is your property. We employ high-level encryption for your study logs and personal metadata. Click to review the full Privacy Protocol.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                READ DIRECTIVE <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </div>
                        </div>

                        <div onClick={onDisclaimerOpen} className="glass-panel p-10 rounded-[2.5rem] border-slate-500/20 text-left relative overflow-hidden group cursor-pointer hover:bg-white/[0.04] transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-500/40"></div>
                            <h3 className="text-xl font-bold text-white mb-4 italic flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500">gavel</span>
                                Content Integrity
                            </h3>
                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed uppercase tracking-widest mb-6">
                                BatchWise respects intellectual property. Direct piracy is prohibited. Click to review our Content Integrity & DMCA guidelines.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                REVIEW TERMS <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Info Cards (Marketplace Preview) */}
            <section id="marketplace" className="px-8 lg:px-16 pb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Cloud Synced', desc: 'Your curriculum nodes synchronized across all cloud instances.', icon: 'cloud_sync', color: 'rose' },
                    { title: 'Global Progress', desc: 'Real-time synchronization of completion vectors across cohorts.', icon: 'hub', color: 'blue' },
                    { title: 'Distraction-Free Learning', desc: 'Incinerate YouTube noise and focus purely on strategic lectures.', icon: 'visibility_off', color: 'amber' },
                    { title: 'Tactical Focus', desc: 'Designed for learners who demand structured, efficient skill development.', icon: 'track_changes', color: 'rose' }
                ].map((card, i) => (
                    <div key={i} className="reveal p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group hover:-translate-y-2 duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                        <div className={`size-12 rounded-2xl mb-6 flex items-center justify-center transition-all group-hover:scale-110 duration-500 ${card.color === 'rose' ? 'bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : card.color === 'blue' ? 'bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
                            <span className="material-symbols-outlined">{card.icon}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3 tracking-tight group-hover:text-rose-500 transition-colors italic">{card.title}</h4>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed uppercase tracking-wider">{card.desc}</p>
                    </div>
                ))}
            </section>

            {/* Tactical Footer */}
            <footer className="border-t border-white/5 py-12 px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
                <div className="flex items-center gap-3">
                    <BatchWiseLogo className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">BatchWise Nexus v2.0.4 • 2026</span>
                </div>
                <div className="flex gap-10">
                    <button onClick={onPrivacyOpen} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Privacy Policy</button>
                    <button onClick={onDisclaimerOpen} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Terms of Condition</button>
                    <button className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Security Node</button>
                </div>
            </footer>
        </div>
    );
};

export default PublicLandingView;

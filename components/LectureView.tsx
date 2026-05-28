
import React, { useState, useEffect } from 'react';
import { Lecture, Chapter, Subject, Doubt, DoubtReply, BatchResource } from '../types';
import { fetchVideoDescription } from '../services/youtubeService';
import { submitDoubt, subscribeToDoubts, submitDoubtReply, subscribeToReplies, addResource, subscribeToLectureResources, deleteResource } from '../services/firestoreService';
import { MarksPracticeView } from './MarksPracticeView';
import NotesPanel from './NotesPanel';
import { XIcon, PlusIcon, TrashIcon } from './Icons';
import { queryGroq, reRenderMathJax } from '../services/groqService';

interface LectureViewProps {
    subject: Subject;
    chapter: Chapter;
    lecture: Lecture;
    currentUser: any;
    isInstructor: boolean;
    onLectureNavigate: (chapterId: string, lectureId: string) => void;
    onToggleComplete: (lectureId: string) => void;
    onBack: () => void;
    genre?: string;
    onYoutubeImport?: () => void;
}

const FloatingWatermark = ({ text }: { text: string }) => {
    const [position, setPosition] = React.useState({ top: '10%', left: '10%' });

    React.useEffect(() => {
        const interval = setInterval(() => {
            const top = Math.floor(Math.random() * 80) + 10;
            const left = Math.floor(Math.random() * 80) + 10;
            setPosition({ top: `${top}%`, left: `${left}%` });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div 
            className="fixed pointer-events-none z-[200] text-[10px] sm:text-xs font-black text-white/5 uppercase tracking-[0.5em] transition-all duration-[2000ms] ease-in-out whitespace-nowrap rotate-12"
            style={{ top: position.top, left: position.left }}
        >
            {text} • {text}
        </div>
    );
};

const DoubtItem = ({ doubt, currentUser, formatTime }: { doubt: Doubt, currentUser: any, formatTime: (s: number) => string }) => {
    const [replies, setReplies] = useState<DoubtReply[]>([]);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);

    useEffect(() => {
        const unsub = subscribeToReplies(doubt.id, setReplies);
        return () => unsub();
    }, [doubt.id]);

    const handleReply = async () => {
        if (!replyText.trim() || !currentUser) return;
        setIsSubmitting(true);
        try {
            await submitDoubtReply({
                doubtId: doubt.id,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || 'Peer',
                authorPhoto: currentUser.photoURL,
                text: replyText,
                isVerified: false
            });
            setReplyText('');
            setShowReplyInput(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`p-4 rounded-2xl border transition-all ${doubt.status === 'resolved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5 shadow-xl'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="size-6 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white italic">
                        {doubt.studentName.charAt(0)}
                    </div>
                    <span className="text-[10px] font-black text-white italic">{doubt.studentName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {doubt.timestamp !== undefined ? `At ${formatTime(doubt.timestamp)}` : 'General'}
                    </span>
                </div>
            </div>
            
            <p className="text-xs text-slate-300 font-medium mb-3 pl-8 leading-relaxed italic">"{doubt.text}"</p>

            {/* Replies List */}
            {replies.length > 0 && (
                <div className="space-y-3 mt-4 ml-8 pl-4 border-l border-white/5">
                    {replies.map(reply => (
                        <div key={reply.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{reply.authorName}</span>
                                {reply.isVerified && <span className="material-symbols-outlined text-emerald-500 text-[10px]">verified</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">{reply.text}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 pl-8 flex items-center justify-between">
                <button 
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className="text-[9px] font-black text-amber-500 uppercase tracking-widest hover:brightness-125 transition-all flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[12px]">reply</span>
                    {showReplyInput ? 'Cancel' : 'Contribute Resolution'}
                </button>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${doubt.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {doubt.status}
                </span>
            </div>

            {showReplyInput && (
                <div className="mt-4 pl-8 space-y-3">
                    <textarea 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Contribute your solution…"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/30 transition-all resize-none"
                        rows={2}
                    />
                    <button 
                        disabled={isSubmitting || !replyText.trim()}
                        onClick={handleReply}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Transmitting…' : 'Post Resolution'}
                    </button>
                </div>
            )}
        </div>
    );
};

const LectureView: React.FC<LectureViewProps> = ({
    subject,
    chapter,
    lecture,
    currentUser,
    isInstructor,
    onLectureNavigate,
    onToggleComplete,
    onBack,
    genre,
    onYoutubeImport
}) => {
    const [search, setSearch] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [availableQualities, setAvailableQualities] = useState<string[]>([]);
    const [currentQuality, setCurrentQuality] = useState('medium');
    const [showControls, setShowControls] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    const playerRef = React.useRef<any>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const trackingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    // Video progress persistence states
    const [resumeTime, setResumeTime] = useState(0);
    const [showResumeToast, setShowResumeToast] = useState(false);
    const resumeToastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const [ytDescription, setYtDescription] = useState<string>('');
    const [showDescription, setShowDescription] = useState(false);
    const [showPractice, setShowPractice] = useState(false);
    const [isSwitchingQuality, setIsSwitchingQuality] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDoubtPanelOpen, setIsDoubtPanelOpen] = useState(false);
    const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
    const [isResourcesPanelOpen, setIsResourcesPanelOpen] = useState(false);
    const [resources, setResources] = useState<BatchResource[]>([]);
    const [resTitle, setResTitle] = useState('');
    const [resUrl, setResUrl] = useState('');
    const [resDesc, setResDesc] = useState('');
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [doubtText, setDoubtText] = useState('');
    const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
    const [doubtTimestamp, setDoubtTimestamp] = useState<number | null>(null);
    const [batchId, setBatchId] = useState<string | null>(null);
    const [doubtTab, setDoubtTab] = useState<'all' | 'my'>('all');

    // AI Quiz States
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [isQuizLoading, setIsQuizLoading] = useState(false);
    const [quizData, setQuizData] = useState<any[]>([]);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // Get batchId from URL
    useEffect(() => {
        const path = window.location.pathname;
        if (path.includes('/batch/')) {
            setBatchId(path.split('/batch/')[1].split('/')[0]);
        }
    }, []);

    // Subscribe to doubts
    useEffect(() => {
        if (batchId && lecture.id) {
            const unsubscribe = subscribeToDoubts(batchId, (list) => {
                setDoubts(list.filter(d => d.lectureId === lecture.id));
            });
            return () => unsubscribe();
        }
    }, [batchId, lecture.id]);

    // Subscribe to resources
    useEffect(() => {
        if (lecture.id) {
            const unsub = subscribeToLectureResources(lecture.id, setResources);
            return unsub;
        }
    }, [lecture.id]);

    // Reset state & Fetch YT Description when lecture changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsPlayerReady(false);
        setAvailableQualities([]);
        setCurrentQuality('medium');
        setYtDescription('');
        setShowPractice(false);
        setShowResumeToast(false);
        
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
        }
        if (resumeToastTimeoutRef.current) {
            clearTimeout(resumeToastTimeoutRef.current);
        }

        // Fetch actual YouTube description
        const videoId = getYoutubeId(lecture.youtubeUrl);
        console.log(`[LectureView] Triggering description fetch for ID: ${videoId}`);
        if (videoId) {
            fetchVideoDescription(videoId).then(desc => {
                if (desc && desc.trim().length > 0) {
                    console.log(`[LectureView] Received description (${desc.length} chars)`);
                    setYtDescription(desc);
                } else {
                    console.log("[LectureView] Received empty description, falling back to local.");
                }
            }).catch(err => {
                console.error("[LectureView] Description fetch error:", err);
            });
        }
    }, [lecture.id, lecture.youtubeUrl]);

    // Initialize YouTube API
    React.useEffect(() => {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
            initPlayer();
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayer();
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
            if (resumeToastTimeoutRef.current) {
                clearTimeout(resumeToastTimeoutRef.current);
            }
        };
    }, [lecture.id]);

    const initPlayer = () => {
        const videoId = getYoutubeId(lecture.youtubeUrl);
        if (!videoId) return;

        playerRef.current = new (window as any).YT.Player('cipher-player-frame', {
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                cc_load_policy: 0,
                autohide: 1
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onPlaybackQualityChange: (e: any) => {
                    setCurrentQuality(e.data);
                }
            }
        });
    };

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const renderDescriptionWithLinks = (text: string) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a 
                        key={i} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-rose-500 hover:text-rose-400 underline decoration-rose-500/30 hover:decoration-rose-400 transition-all font-bold"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const onPlayerReady = (event: any) => {
        setIsPlayerReady(true);
        const videoDuration = event.target.getDuration();
        setDuration(videoDuration);
        
        // Force default quality to 360p if possible, else 240p
        const levels = event.target.getAvailableQualityLevels();
        if (levels.includes('medium')) {
            event.target.setPlaybackQuality('medium');
        } else {
            event.target.setPlaybackQuality('small');
        }
        
        setAvailableQualities(levels);
        setCurrentQuality(event.target.getPlaybackQuality());

        // Check for saved progress
        const savedTimeStr = localStorage.getItem(`batchwise_progress_${lecture.id}`);
        if (savedTimeStr) {
            const savedTime = parseFloat(savedTimeStr);
            if (savedTime > 3 && savedTime < videoDuration - 15) {
                event.target.seekTo(savedTime, true);
                setCurrentTime(savedTime);
                setResumeTime(savedTime);
                setShowResumeToast(true);
                
                if (resumeToastTimeoutRef.current) clearTimeout(resumeToastTimeoutRef.current);
                resumeToastTimeoutRef.current = setTimeout(() => {
                    setShowResumeToast(false);
                }, 6000);
            }
        }
    };

    const onPlayerStateChange = (event: any) => {
        const newState = event.data;
        setIsPlaying(newState === (window as any).YT.PlayerState.PLAYING);
        
        if (newState === (window as any).YT.PlayerState.PLAYING) {
            startTracking();
            setAvailableQualities(playerRef.current.getAvailableQualityLevels());
            setCurrentQuality(playerRef.current.getPlaybackQuality());
        } else {
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
            }
        }
    };

    const startTracking = () => {
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
                
                // Save watch progress to localStorage
                const videoDuration = playerRef.current.getDuration ? playerRef.current.getDuration() : duration;
                if (videoDuration > 0 && time >= videoDuration - 15) {
                    localStorage.removeItem(`batchwise_progress_${lecture.id}`);
                } else if (time > 2) {
                    localStorage.setItem(`batchwise_progress_${lecture.id}`, time.toString());
                }
            }
        }, 500);
    };

    const skip = (seconds: number) => {
        if (!playerRef.current) return;
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        playerRef.current.seekTo(newTime);
        setCurrentTime(newTime);
    };

    const handleRestartVideo = () => {
        if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(0);
            setCurrentTime(0);
            localStorage.removeItem(`batchwise_progress_${lecture.id}`);
            setShowResumeToast(false);
        }
    };



    const togglePlay = () => {
        if (!playerRef.current || !isPlayerReady) return;
        
        const state = playerRef.current.getPlayerState();
        if (state === (window as any).YT.PlayerState.PLAYING) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const seekTo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        playerRef.current?.seekTo(time, true);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setVolume(val);
        playerRef.current?.setVolume(val);
        if (val > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume || 50);
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    const changeQuality = (quality: string) => {
        if (!playerRef.current) return;
        
        setIsSwitchingQuality(true);
        setShowQualityMenu(false);
        const currentTime = playerRef.current.getCurrentTime();
        const isPlayingNow = playerRef.current.getPlayerState() === (window as any).YT.PlayerState.PLAYING;
        
        // Strategy: Force a reload with suggested quality for maximum reliability
        try {
            playerRef.current.loadVideoById({
                videoId: getYoutubeId(lecture.youtubeUrl),
                startSeconds: currentTime,
                suggestedQuality: quality
            });
            
            if (!isPlayingNow) {
                setTimeout(() => playerRef.current?.pauseVideo(), 200);
            }
            
            setCurrentQuality(quality);
        } catch (e) {
            console.error("Quality switch failed:", e);
            playerRef.current.setPlaybackQuality(quality);
        }

        setTimeout(() => {
            setIsSwitchingQuality(false);
            if (playerRef.current && playerRef.current.getAvailableQualityLevels) {
                const levels = playerRef.current.getAvailableQualityLevels();
                if (levels && levels.length > 0) setAvailableQualities(levels);
            }
        }, 1500);
    };

    const changePlaybackRate = (rate: number) => {
        setPlaybackRate(rate);
        setShowSpeedMenu(false);
        playerRef.current?.setPlaybackRate(rate);
    };

    const handleGenerateAIQuiz = async () => {
        setIsQuizLoading(true);
        setIsQuizModalOpen(true);
        setQuizSubmitted(false);
        setQuizAnswers([]);
        
        try {
            const lectureIndex = chapter.lectures.findIndex(l => l.id === lecture.id);
            const totalLectures = chapter.lectures.length;
            const isLateInChapter = (lectureIndex + 1) / totalLectures > 0.7;
            const isEarlyInChapter = (lectureIndex + 1) / totalLectures <= 0.3;

            const systemPrompt = `You are a high-fidelity skill assessment quiz generator.
            Generate challenging multiple-choice questions (4 options each) based on the provided content.
            
            - FOR BEGINNER LEVEL: Focus on fundamental concepts, definitions, and basic applications.
            - FOR ADVANCED LEVEL: Focus on complex problem-solving, multi-step reasoning, and creative applications.
            
            Current Target Difficulty: ${isEarlyInChapter ? 'Beginner (Conceptual)' : 'Advanced (Expert)'}.
            
            FORMATTING & LaTeX:
            - Use standard LaTeX ($...$ for inline, $$...$$ for display).
            - Use proper scientific notation: e.g., use \\Omega for Ohm, \\mu F for microfarad, \\vec{E} for field. 
            - IMPORTANT: Ensure double-escaped backslashes in JSON (e.g., "\\\\Omega").
            
            Output ONLY a JSON object: { "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..." } ] }`;
            
            const prompt = `Topic: ${lecture.title}. Chapter: ${chapter.name}. Subject: ${subject.name}.`;
            
            const result = await queryGroq(prompt, systemPrompt);
            if (result.success) {
                const parsed = JSON.parse(result.content);
                setQuizData(parsed.questions);
                reRenderMathJax();
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            alert("Quiz Generation Failed: " + e.message);
            setIsQuizModalOpen(false);
        } finally {
            setIsQuizLoading(false);
        }
    };

    const handleSeekTo = (time: number) => {
        if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(time);
            setCurrentTime(time);
        }
    };

    const handleAddResource = async () => {
        if (!resTitle.trim() || !resUrl.trim()) return;
        const url = resUrl.trim();
        const type = url.match(/\.(pdf|png|jpg|jpeg|gif|webp)$/i) ? (url.match(/\.(pdf)/i) ? 'pdf' : 'image') : 'link';
        if (currentUser) {
            await addResource({
                lectureId: lecture.id,
                chapterId: chapter.id,
                subjectId: subject.id,
                batchId: batchId || '',
                userId: currentUser.uid,
                title: resTitle.trim(),
                url,
                type: type as BatchResource['type'],
                description: resDesc.trim(),
            });
        }
        setResTitle('');
        setResUrl('');
        setResDesc('');
    };

    const formatQuality = (q: string) => {
        if (!q || q === 'unknown') return 'Auto';
        const map: Record<string, string> = {
            'highres': '4K / 5K',
            'hd2160': '2160p (4K)',
            'hd1440': '1440p (2K)',
            'hd1080': '1080p HD',
            'hd720': '720p HD',
            'large': '480p',
            'medium': '360p',
            'small': '240p',
            'tiny': '144p',
            'auto': 'Auto',
            'default': 'Auto'
        };
        const normalized = q.toLowerCase();
        return map[normalized] || (normalized.startsWith('hd') ? normalized.replace('hd', '') + 'p HD' : normalized);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleDoubleTap = (side: 'left' | 'right') => {
        skip(side === 'left' ? -10 : 10);
        // Visual feedback for skip could be added here
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 2000);
    };

    React.useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'u' || e.key === 's'))
            ) {
                e.preventDefault();
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const filteredLectures = chapter.lectures.filter(l => 
        l.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen h-[100dvh] w-full bg-[#0a0a0a] text-white overflow-hidden selection:bg-rose-500/30">
            {/* Minimal Header */}
            <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-black shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{subject.name}</span>
                        <span className="text-xs font-bold text-white leading-none truncate max-w-[200px]">{chapter.name}</span>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/5 px-3 py-1.5 rounded-full border border-rose-500/10">
                        {chapter.lectures.filter(l => l.completed).length} / {chapter.lectures.length} COMPLETED
                    </span>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Cinema Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-4 lg:p-10 bg-[#050505]">
                    <div className="max-w-6xl mx-auto w-full">
                        {/* Cinema Player Container */}
                        <div 
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            className="bg-black aspect-video md:rounded-3xl rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden border border-white/5 mb-8 md:mb-10 relative group/player select-none cursor-default"
                        >
                            {/* Interaction Layer - Capture Taps/Clicks */}
                            <div 
                                className="absolute inset-0 z-10 cursor-pointer pointer-events-auto" 
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const width = rect.width;
                                    
                                    // Detect double tap logic here if needed, or simple click
                                    if (e.detail === 2) {
                                        if (x < width / 2) handleDoubleTap('left');
                                        else handleDoubleTap('right');
                                    } else {
                                        togglePlay();
                                    }
                                }}
                            />
                            
                            <div 
                                id="cipher-player-frame" 
                                className="w-full h-full relative z-0 scale-[1.01]"
                            />

                            {/* Premium Resume Toast */}
                            {showResumeToast && (
                                <div className="absolute top-4 left-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500 max-w-[280px] sm:max-w-md pointer-events-auto">
                                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4 shadow-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 sm:size-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                                                <span className="material-symbols-outlined text-sm sm:text-base animate-pulse">play_circle</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Welcome Back</span>
                                                <span className="text-xs font-bold text-white leading-tight">
                                                    Resumed from {formatTime(resumeTime)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRestartVideo(); }}
                                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[9px] font-black text-white uppercase tracking-widest border border-white/5 hover:border-white/10 transition-all cursor-pointer pointer-events-auto"
                                            >
                                                Restart
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowResumeToast(false); }}
                                                className="text-white/40 hover:text-white transition-colors cursor-pointer pointer-events-auto"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Center Action Overlay */}
                            <div className={`absolute inset-0 z-20 flex items-center justify-center md:gap-8 gap-4 transition-all duration-500 pointer-events-none ${showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                                <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="md:size-12 size-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-black/60 transition-all pointer-events-auto active:scale-90">
                                    <span className="material-symbols-outlined md:text-xl text-base">replay_10</span>
                                </button>
                                
                                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="md:size-16 size-10 rounded-full bg-rose-600 text-white shadow-2xl shadow-rose-600/30 flex items-center justify-center pointer-events-auto active:scale-95 hover:scale-110 transition-all">
                                    <span className="material-symbols-outlined md:text-4xl text-2xl">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>

                                <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="md:size-12 size-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-black/60 transition-all pointer-events-auto active:scale-90">
                                    <span className="material-symbols-outlined md:text-xl text-base">forward_10</span>
                                </button>
                            </div>

                            {/* Professional Bottom Controls */}
                            <div 
                                className={`absolute md:inset-x-4 md:bottom-4 inset-x-0 bottom-0 z-40 transition-all duration-500 pointer-events-auto ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-0 md:translate-y-4'}`}
                            >
                                <div className="md:bg-[#0c0c0c]/80 bg-black/90 backdrop-blur-3xl md:border border-white/10 md:rounded-xl p-2.5 md:p-4 shadow-2xl flex flex-col md:gap-3 gap-2">
                                    {/* Advanced Seek Bar */}
                                    <div className="group/progress relative h-1 w-full flex items-center">
                                        <input 
                                            type="range"
                                            min="0"
                                            max={duration}
                                            value={currentTime}
                                            onChange={seekTo}
                                            className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                                        />
                                        <div className="absolute inset-x-0 h-1 bg-white/10 rounded-full overflow-hidden transition-all group-hover/progress:h-1.5">
                                            <div 
                                                className="h-full bg-rose-600 relative transition-none" 
                                                style={{ width: `${(currentTime / duration) * 100}%` }}
                                            >
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <button onClick={togglePlay} className="text-white hover:text-rose-500 transition-colors">
                                                <span className="material-symbols-outlined text-2xl leading-none">
                                                    {isPlaying ? 'pause' : 'play_arrow'}
                                                </span>
                                            </button>

                                            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-xl">
                                                    {isMuted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                                                </span>
                                            </button>

                                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest tabular-nums font-mono">
                                                <span className="text-white/80">{formatTime(currentTime)}</span>
                                                <span className="mx-1.5">/</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Quality Label */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 group/settings relative cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                                            >
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none">
                                                    {formatQuality(currentQuality)}
                                                </span>
                                                {showQualityMenu && (
                                                    <div className="absolute bottom-full right-0 mb-4 z-[60] w-40 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2">
                                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest p-2 border-b border-white/5 mb-1">Select Quality</p>
                                                                {(availableQualities.length > 0 ? availableQualities : ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny']).map(q => (
                                                                    <button 
                                                                        key={q}
                                                                        onClick={(e) => { e.stopPropagation(); changeQuality(q); }}
                                                                        className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 rounded-lg transition-colors ${currentQuality === q ? 'text-rose-500 bg-rose-500/5' : 'text-slate-400'}`}
                                                                    >
                                                                        {formatQuality(q)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Speed Label */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 group/speed relative cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                                            >
                                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none">
                                                    {playbackRate}x
                                                </span>
                                                {showSpeedMenu && (
                                                    <div className="absolute bottom-full right-0 mb-4 z-[60] w-32 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest p-2 border-b border-white/5 mb-1">Playback Speed</p>
                                                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                                                <button 
                                                                    key={rate}
                                                                    onClick={(e) => { e.stopPropagation(); changePlaybackRate(rate); }}
                                                                    className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 rounded-lg transition-colors ${playbackRate === rate ? 'text-rose-500 bg-rose-500/5' : 'text-slate-400'}`}
                                                                >
                                                                    {rate}x
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={toggleFullscreen} className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95">
                                                <span className="material-symbols-outlined text-lg">fullscreen</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Simple Loader */}
                            {!isPlayerReady && (
                                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                                    <div className="size-10 border-2 border-white/10 border-t-white/80 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                            {/* Information Watermark */}
                            <div className="flex items-center justify-between opacity-20 pointer-events-none select-none mb-4">
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">
                                    UID: {currentUser?.uid?.substring(0, 8) || 'GUEST'}
                                </span>
                                {isSwitchingQuality && (
                                    <span className="text-[9px] font-black text-rose-500 uppercase animate-pulse">Switching Quality...</span>
                                )}
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">
                                    {new Date().toLocaleDateString()}
                                </span>
                            </div>

                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b border-white/5">
                            <div className="flex-1">
                                <h1 className="text-base md:text-xl lg:text-3xl font-black text-white uppercase tracking-tighter mb-4 italic leading-tight">
                                    {lecture.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-md border border-white/5">
                                        <span className="material-symbols-outlined text-xs md:text-sm text-rose-500">schedule</span>
                                        {formatTime(duration)}
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-md border border-white/5">
                                        <span className="material-symbols-outlined text-xs md:text-sm text-emerald-500">verified</span>
                                        {subject.name}
                                    </div>
                                    <button 
                                        onClick={() => setShowDescription(!showDescription)}
                                        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-md border border-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xs md:text-sm text-rose-500">
                                            {showDescription ? 'visibility_off' : 'visibility'}
                                        </span>
                                        {showDescription ? 'Hide Details' : 'Show Details'}
                                    </button>
                                    <a 
                                        href={lecture.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-md border border-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xs md:text-sm text-rose-500">open_in_new</span>
                                        Watch on YouTube
                                    </a>
                                    {lecture.notesPdfUrl && (
                                        <a 
                                            href={lecture.notesPdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 bg-emerald-500 text-white rounded-md hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">description</span>
                                            Download Notes (PDF)
                                        </a>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setDoubtTimestamp(currentTime);
                                            setIsDoubtPanelOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-md bg-[#111] text-white hover:bg-[#1a1a1a] border border-white/10 transition-all shadow-lg active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[14px] text-amber-500">question_answer</span>
                                        <span className="font-black text-[10px] md:text-xs text-amber-500">Ask Doubt</span>
                                    </button>
                                    {(!genre || genre === 'study') && (
                                    <button 
                                        onClick={handleGenerateAIQuiz}
                                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-md transition-all shadow-lg active:scale-95 border bg-[#111] text-white hover:bg-[#1a1a1a] border-white/10`}
                                    >
                                        <span className="material-symbols-outlined text-[14px] text-purple-500">bolt</span>
                                        <span className="font-black text-[10px] md:text-xs">AI Quick Quiz</span>
                                    </button>
                                    )}
                                    {(!genre || genre === 'study') && (
                                    <button 
                                        onClick={() => setShowPractice(!showPractice)}
                                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-md transition-all shadow-lg active:scale-95 border ${
                                            showPractice 
                                            ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20' 
                                            : 'bg-[#111] text-white hover:bg-[#1a1a1a] border-white/10'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px] text-rose-500">model_training</span>
                                        <span className="font-black text-[10px] md:text-xs">Practice 15 Qs</span>
                                    </button>
                                    )}
                                    <button
                                        onClick={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
                                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-md transition-all shadow-lg active:scale-95 border ${isNotesPanelOpen ? 'bg-purple-600 text-white border-purple-500' : 'bg-[#111] text-white hover:bg-[#1a1a1a] border-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-[14px] text-purple-500">sticky_note_2</span>
                                        <span className="font-black text-[10px] md:text-xs">Notes</span>
                                    </button>
                                    <button
                                        onClick={() => setIsResourcesPanelOpen(!isResourcesPanelOpen)}
                                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-md transition-all shadow-lg active:scale-95 border ${isResourcesPanelOpen ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-[#111] text-white hover:bg-[#1a1a1a] border-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-[14px] text-cyan-500">attachment</span>
                                        <span className="font-black text-[10px] md:text-xs">Resources</span>
                                    </button>
                                 </div>
                             </div>
                             <button 
                                 onClick={() => onToggleComplete(lecture.id)}
                                className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-5 md:px-8 py-2 md:py-4 rounded-lg md:rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all ${
                                    lecture.completed 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-rose-600 text-white shadow-2xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base md:text-lg font-bold">
                                    {lecture.completed ? 'check_circle' : 'circle'}
                                </span>
                                {lecture.completed ? 'Completed' : 'Mark as Done'}
                            </button>
                        </div>

                        {/* Practice View */}
                        {showPractice && (
                            <MarksPracticeView 
                                youtubeId={getYoutubeId(lecture.youtubeUrl) || ''} 
                                chapterName={chapter.name}
                                onClose={() => setShowPractice(false)}
                            />
                        )}

                        {/* Session Brief (Description) */}
                        {showDescription && (
                            <div className="bg-[#0c0c0c] rounded-3xl p-8 border border-white/5 shadow-2xl overflow-hidden relative group/desc mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                    <span className="material-symbols-outlined text-9xl">description</span>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="size-8 rounded-lg bg-rose-600/10 border border-rose-600/20 flex items-center justify-center text-rose-600">
                                            <span className="material-symbols-outlined text-sm font-black">info</span>
                                        </div>
                                        <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Session <span className="text-rose-600">Brief</span></h2>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="text-sm text-slate-400 font-medium leading-relaxed border-l-2 border-rose-600/30 pl-6 py-2">
                                            {(ytDescription || lecture.description) ? (
                                                <div className="whitespace-pre-wrap">
                                                    {renderDescriptionWithLinks(ytDescription || lecture.description || '')}
                                                </div>
                                            ) : (
                                                <span className="italic">Synthesizing specialized curriculum assets for this session node. This material includes key concepts, strategic breakdowns, and practical implementation details.</span>
                                            )}
                                        </div>
                                        
                                        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-default">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Module Objective</p>
                                                <p className="text-xs font-bold text-slate-300">Mastery of core concepts within {chapter.name}</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-default">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Strategic Context</p>
                                                <p className="text-xs font-bold text-slate-300">Part of the {subject.name} complete roadmap</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Index on Right (Desktop) / Mobile Drawer */}
                <aside 
                    className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[320px] h-[100dvh] lg:static flex lg:flex lg:w-[380px] border-l border-white/5 bg-[#080808] flex-col shrink-0 transition-transform duration-500 ease-in-out pointer-events-auto ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
                >
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Course <span className="text-rose-600">Index</span></h3>
                        <div className="flex items-center gap-2">
                            {isInstructor && onYoutubeImport && (
                                <button 
                                    onClick={onYoutubeImport}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600/10 border border-rose-600/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95"
                                    title="Import steps from YouTube"
                                >
                                    <span className="material-symbols-outlined text-[12px] font-bold">add</span>
                                    Add Step
                                </button>
                            )}
                            <button 
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="lg:hidden size-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 border-b border-white/5 py-4">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-600 text-sm">search</span>
                            <input 
                                type="text"
                                placeholder="Search lessons..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-rose-600/30 transition-all"
                            />
                        </div>
                    </div>

                    <div 
                        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 touch-pan-y overscroll-contain animate-in fade-in duration-700"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {filteredLectures.map((l, idx) => (
                            <div 
                                key={l.id}
                                onClick={() => onLectureNavigate(chapter.id, l.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                                    l.id === lecture.id 
                                    ? 'bg-rose-600/10 border-rose-600/30 ring-1 ring-rose-600/20' 
                                    : 'bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    l.id === lecture.id ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-600'
                                }`}>
                                    <span className="text-[10px] font-black">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] font-bold truncate ${l.id === lecture.id ? 'text-white' : 'text-slate-400'}`}>
                                        {l.title}
                                    </p>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                        {l.duration ? `${Math.floor(l.duration / 60)}m ${l.duration % 60}s` : '00:00'}
                                    </p>
                                </div>
                                {l.completed && (
                                    <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-black/20">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Lectures</span>
                            <span>{chapter.lectures.length}</span>
                        </div>
                    </div>
                </aside>
            </div>
            
            {/* Mobile Index Bar */}
            <div className="lg:hidden h-16 border-t border-white/5 bg-black flex items-center justify-between px-6 shrink-0 z-50">
                <button 
                    onClick={() => {
                        const currentIndex = chapter.lectures.findIndex(l => l.id === lecture.id);
                        if (currentIndex > 0) onLectureNavigate(chapter.id, chapter.lectures[currentIndex - 1].id);
                    }}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 active:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                    Prev
                </button>
                
                <button 
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="flex flex-col items-center gap-1"
                >
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        Index
                    </span>
                    <div className="flex items-center gap-1">
                        <div className="size-1 rounded-full bg-rose-600 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase">
                            {chapter.lectures.findIndex(l => l.id === lecture.id) + 1} / {chapter.lectures.length}
                        </span>
                    </div>
                </button>

                <button 
                    onClick={() => {
                        const currentIndex = chapter.lectures.findIndex(l => l.id === lecture.id);
                        if (currentIndex < chapter.lectures.length - 1) onLectureNavigate(chapter.id, chapter.lectures[currentIndex + 1].id);
                    }}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-600 active:text-rose-400 transition-colors"
                >
                    Next
                    <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-in fade-in duration-300" 
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Watermark Overlay */}
            {currentUser && <FloatingWatermark text={currentUser.email || currentUser.displayName || 'Authorized'} />}

            {/* Doubt Hub Slide-over */}
            {isDoubtPanelOpen && (
                <div className="fixed inset-0 z-[200] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsDoubtPanelOpen(false)} />
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md animate-in slide-in-from-right duration-500">
                            <div className="h-full flex flex-col bg-[#0d0f14] border-l border-white/10 shadow-2xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <span className="material-symbols-outlined">question_answer</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Doubt Hub</h3>
                                            <p className="text-[10px] text-slate-500 font-medium">Get your concepts cleared</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsDoubtPanelOpen(false)} className="size-10 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-colors">
                                        <XIcon size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                    {/* Tab Toggle */}
                                    <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
                                        <button 
                                            onClick={() => setDoubtTab('all')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${doubtTab === 'all' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Community
                                        </button>
                                        <button 
                                            onClick={() => setDoubtTab('my')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${doubtTab === 'my' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            My Briefings
                                        </button>
                                    </div>

                                    {/* Doubts List */}
                                    <div className="space-y-4">
                                        {(doubtTab === 'my' ? doubts.filter(d => d.studentId === currentUser?.uid) : doubts).length === 0 ? (
                                            <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl">
                                                <p className="text-xs text-slate-600 font-medium italic">No active inquiries in this sector. Initialize one below.</p>
                                            </div>
                                        ) : (
                                            (doubtTab === 'my' ? doubts.filter(d => d.studentId === currentUser?.uid) : doubts).map(doubt => (
                                                <DoubtItem 
                                                    key={doubt.id} 
                                                    doubt={doubt} 
                                                    currentUser={currentUser} 
                                                    formatTime={formatTime} 
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 border-t border-white/5 bg-black/40">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Inquiry</span>
                                        {doubtTimestamp !== null && (
                                            <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[12px] text-amber-500">timer</span>
                                                <span className="text-[9px] font-black text-amber-500">{formatTime(doubtTimestamp)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <textarea 
                                        value={doubtText}
                                        onChange={(e) => setDoubtText(e.target.value)}
                                        placeholder="Explain your conceptual gap…"
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/30 transition-all resize-none mb-4"
                                    />
                                    <button 
                                        disabled={isSubmittingDoubt || !doubtText.trim()}
                                        onClick={async () => {
                                            if (!batchId || !currentUser) return;
                                            setIsSubmittingDoubt(true);
                                            try {
                                                await submitDoubt({
                                                    batchId,
                                                    lectureId: lecture.id,
                                                    lectureTitle: lecture.title,
                                                    studentId: currentUser.uid,
                                                    studentName: currentUser.displayName || 'Student',
                                                    studentPhoto: currentUser.photoURL,
                                                    text: doubtText,
                                                    timestamp: doubtTimestamp || undefined
                                                });
                                                setDoubtText('');
                                                alert("Inquiry successfully transmitted to the instructor console.");
                                            } catch (e) {
                                                alert("Transmission failed. Re-sync and try again.");
                                            } finally {
                                                setIsSubmittingDoubt(false);
                                            }
                                        }}
                                        className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                                    >
                                        {isSubmittingDoubt ? 'Transmitting…' : 'Initialize Inquiry'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Panel */}
            {isNotesPanelOpen && (
                <div className="fixed inset-0 z-[200] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotesPanelOpen(false)} />
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-sm animate-in slide-in-from-right duration-500">
                            <NotesPanel
                                lectureId={lecture.id}
                                chapterId={chapter.id}
                                subjectId={subject.id}
                                batchId={batchId || ''}
                                userId={currentUser?.uid || ''}
                                currentTime={currentTime}
                                onSeek={handleSeekTo}
                                onClose={() => setIsNotesPanelOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Resources Panel */}
            {isResourcesPanelOpen && (
                <div className="fixed inset-0 z-[200] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsResourcesPanelOpen(false)} />
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-sm animate-in slide-in-from-right duration-500">
                            <div className="h-full flex flex-col bg-[#0d0f14] border-l border-white/10 shadow-2xl">
                                <div className="flex items-center justify-between p-4 border-b border-white/10">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-cyan-500 text-sm">attachment</span>
                                        Resources
                                    </h3>
                                    <button onClick={() => setIsResourcesPanelOpen(false)} className="text-slate-500 hover:text-white transition-colors"><XIcon size={16} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                                    {resources.length === 0 && (
                                        <p className="text-[10px] text-slate-600 text-center py-8 font-medium">No resources yet.</p>
                                    )}
                                    {resources.map(r => (
                                        <div key={r.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 group">
                                            <div className="flex items-start justify-between gap-2">
                                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${r.type === 'pdf' ? 'bg-red-500/10 text-red-400' : r.type === 'image' ? 'bg-blue-500/10 text-blue-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{r.type}</span>
                                                        <span className="text-[11px] text-white font-medium truncate">{r.title}</span>
                                                    </div>
                                                    {r.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>}
                                                </a>
                                                <button onClick={() => deleteResource(r.id)} className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"><TrashIcon size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/10 space-y-2">
                                    <input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="Resource title" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40" />
                                    <input value={resUrl} onChange={e => setResUrl(e.target.value)} placeholder="URL or file link" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40" />
                                    <input value={resDesc} onChange={e => setResDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40" />
                                    <button onClick={handleAddResource} className="w-full py-2 bg-cyan-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-cyan-500 transition-all">Add Resource</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Quiz Modal */}
            {isQuizModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500">bolt</span>
                                    AI Conceptual Quiz
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{lecture.title}</p>
                            </div>
                            <button onClick={() => setIsQuizModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                            {isQuizLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="size-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Groq is generating your quiz...</p>
                                </div>
                            ) : (
                                quizData.map((q, qIdx) => (
                                    <div key={qIdx} className="space-y-4">
                                        <div className="flex gap-4">
                                            <span className="size-6 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                0{qIdx + 1}
                                            </span>
                                            <p className="text-xs font-bold text-white leading-relaxed">{q.question}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                                            {q.options.map((opt: string, oIdx: number) => {
                                                const isSelected = quizAnswers[qIdx] === oIdx;
                                                const isCorrect = q.correct === oIdx;
                                                const showResult = quizSubmitted;

                                                let bgColor = 'bg-white/5 border-white/5';
                                                let textColor = 'text-slate-400';

                                                if (showResult) {
                                                    if (isCorrect) {
                                                        bgColor = 'bg-emerald-500/20 border-emerald-500/40';
                                                        textColor = 'text-emerald-500';
                                                    } else if (isSelected) {
                                                        bgColor = 'bg-rose-500/20 border-rose-500/40';
                                                        textColor = 'text-rose-500';
                                                    }
                                                } else if (isSelected) {
                                                    bgColor = 'bg-purple-500/20 border-purple-500/40';
                                                    textColor = 'text-purple-500';
                                                }

                                                return (
                                                    <button
                                                        key={oIdx}
                                                        disabled={quizSubmitted}
                                                        onClick={() => {
                                                            const newAnswers = [...quizAnswers];
                                                            newAnswers[qIdx] = oIdx;
                                                            setQuizAnswers(newAnswers);
                                                        }}
                                                        className={`p-4 rounded-xl border text-left text-[11px] font-bold transition-all ${bgColor} ${textColor} ${!quizSubmitted && 'hover:border-white/20'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {quizSubmitted && (
                                            <div className="pl-10 animate-in fade-in slide-in-from-top-2 duration-500">
                                                <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">info</span>
                                                        Explanation
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                                        {q.explanation}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {!isQuizLoading && (
                            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {quizSubmitted ? `Score: ${quizAnswers.filter((a, i) => a === quizData[i].correct).length} / ${quizData.length}` : `${quizAnswers.filter(a => a !== undefined).length} / ${quizData.length} Answered`}
                                </p>
                                    <button
                                        onClick={() => {
                                            if (quizSubmitted) {
                                                setIsQuizModalOpen(false);
                                            } else {
                                                setQuizSubmitted(true);
                                                reRenderMathJax();
                                            }
                                        }}
                                        disabled={!quizSubmitted && quizAnswers.filter(a => a !== undefined).length < quizData.length}
                                        className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/20"
                                    >
                                        {quizSubmitted ? 'Close' : 'Submit Quiz'}
                                    </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LectureView;

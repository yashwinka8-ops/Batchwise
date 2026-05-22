import React from 'react';
import { QuestionStatus, Question, Section, User } from './types';

interface SidebarProps {
    user: User;
    activeSection: Section;
    currentQuestionIndex: number;
    onQuestionClick: (index: number) => void;
    onSubmit: () => void;
    stats: {
        answered: number;
        notAnswered: number;
        notVisited: number;
        marked: number;
        answeredMarked: number;
    };
}

const StatusShape = ({ status, children, isCurrent, className = "" }: { status?: QuestionStatus, children?: React.ReactNode, isCurrent?: boolean, className?: string }) => {
    let svgContent = null;
    let textColor = "text-white";

    // NTA Colors and Shapes
    switch (status) {
        case QuestionStatus.ANSWERED:
            // Green with pointed top
            svgContent = (
                <path d="M0 25 L50 0 L100 25 V100 H0 Z" fill="#2ca12c" stroke="#258a25" strokeWidth="2" />
            );
            textColor = "text-white";
            break;

        case QuestionStatus.NOT_ANSWERED:
            // Red/Orange with pointed bottom
            svgContent = (
                <path d="M0 0 H100 V75 L50 100 L0 75 Z" fill="#e45228" stroke="#bd4122" strokeWidth="2" />
            );
            textColor = "text-white";
            break;

        case QuestionStatus.MARKED_FOR_REVIEW:
        case QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW:
            // Purple Circle
            svgContent = (
                <circle cx="50" cy="50" r="48" fill="#5b2b91" stroke="#4a2375" strokeWidth="2" />
            );
            textColor = "text-white";
            break;

        case QuestionStatus.NOT_VISITED:
        default:
            // Gray Rounded Rectangle
            svgContent = (
                <rect x="2" y="2" width="96" height="96" rx="12" fill="#f0f0f0" stroke="#cccccc" strokeWidth="2" />
            );
            textColor = "text-black";
            break;
    }

    return (
        <div className={`relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 mx-auto transition-transform ${isCurrent ? 'scale-110 z-10' : ''} ${className}`}>
            {isCurrent && (
                <div className="absolute -inset-1 rounded-full border-2 border-black/80 z-0"></div>
            )}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm filter" preserveAspectRatio="xMidYMid meet">
                {svgContent}
            </svg>
            <span className={`relative z-10 text-[11px] md:text-xs font-bold ${textColor} leading-none`}>
                {children}
            </span>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ user, activeSection, currentQuestionIndex, onQuestionClick, stats, onSubmit }) => {

    return (
        <div className="w-[300px] bg-[#f8f9fa] border-l border-gray-300 flex flex-col h-full shrink-0 select-none shadow-xl z-20">
            {/* User Profile */}
            <div className="flex items-center p-3 bg-white border-b border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={user.imageUrl} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="ml-3 overflow-hidden">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">Candidate</div>
                    <div className="text-sm font-black text-[#006cb7] truncate">{user.name}</div>
                </div>
            </div>

            {/* Legend Grid */}
            <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2 bg-white border-b border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)] relative z-10">
                {/* Legend Items using the same Shape Component, scaled down slightly */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6"><StatusShape status={QuestionStatus.ANSWERED}>{stats.answered}</StatusShape></div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6"><StatusShape status={QuestionStatus.NOT_ANSWERED}>{stats.notAnswered}</StatusShape></div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6"><StatusShape status={QuestionStatus.NOT_VISITED}>{stats.notVisited}</StatusShape></div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6"><StatusShape status={QuestionStatus.MARKED_FOR_REVIEW}>{stats.marked}</StatusShape></div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="w-6 h-6 relative shrink-0">
                        <StatusShape status={QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW}>{stats.answeredMarked}</StatusShape>
                        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-3 h-3 bg-[#2ca12c] rounded-full border border-white flex items-center justify-center z-20 shadow-sm">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                    <span className="text-[9px] font-medium text-gray-500 leading-tight ml-1">Answered & Marked for Review (will be considered for evaluation)</span>
                </div>
            </div>

            {/* Section Title */}
            <div className="bg-[#007cc2] text-white py-2 px-4 font-bold text-xs uppercase tracking-widest shadow-inner">
                {activeSection.name}
            </div>

            {/* Palette Title */}
            <div className="bg-gray-50 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                Question Palette
            </div>

            {/* Question Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 nta-scroll">
                <div className="grid grid-cols-4 gap-4 pb-4">
                    {activeSection.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => onQuestionClick(idx)}
                            className="relative group focus:outline-none"
                        >
                            <StatusShape status={q.status} isCurrent={idx === currentQuestionIndex} className="group-hover:brightness-110 transition-all">
                                {idx + 1}
                            </StatusShape>

                            {/* Overlay Badge for Answered & Marked */}
                            {q.status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW && (
                                <div className="absolute bottom-0 right-[calc(50%-20px)] w-4 h-4 bg-[#2ca12c] rounded-full border-[1.5px] border-white flex items-center justify-center z-20 shadow-sm">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sidebar Footer (Submit) */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <button
                    onClick={onSubmit}
                    className="w-full bg-[#0072bc] hover:bg-[#005a99] text-white py-3 rounded shadow-lg text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-95 border-b-4 border-[#004a80]"
                >
                    Submit Test
                </button>
            </div>

            <style>{`
        .nta-scroll::-webkit-scrollbar { width: 5px; }
        .nta-scroll::-webkit-scrollbar-track { background: transparent; }
        .nta-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .nta-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
        </div>
    );
};

export default Sidebar;

import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface MarksPracticeViewProps {
  youtubeId: string;
  chapterName: string;
  onClose: () => void;
}

export const MarksPracticeView: React.FC<MarksPracticeViewProps> = ({ onClose, chapterName }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const content = (
        <div className={`flex flex-col bg-[#0c0c0c] border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden shadow-2xl relative group transition-all ${
            isFullscreen 
                ? 'fixed inset-0 z-[9999] w-screen h-screen m-0 rounded-none border-none' 
                : 'mt-4 md:mt-8 rounded-xl md:rounded-3xl border h-[600px] md:h-[800px] w-full'
        }`}>
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5 bg-black z-10 shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="size-6 md:size-8 bg-rose-500/10 rounded-lg flex items-center justify-center border border-rose-500/20">
                        <span className="material-symbols-outlined text-rose-500 text-sm">model_training</span>
                    </div>
                    <div>
                        <h2 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">MARKS Environment</h2>
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-widest uppercase">Targeting: <span className="truncate max-w-[120px] md:max-w-xs inline-block align-bottom">{chapterName}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)} 
                        className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        <span className="material-symbols-outlined text-sm md:text-base">
                            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                        </span>
                    </button>
                    <button 
                        onClick={onClose} 
                        className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-sm md:text-base">close</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full bg-[#0a0a0a] relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0c0c] z-0">
                    <div className="size-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Loading MARKS Engine...</p>
                </div>
                
                <iframe 
                    src={`https://web.getmarks.app/`}
                    className="absolute inset-0 w-full h-full border-none z-10 bg-transparent"
                    title="MARKS Full Application"
                    allow="clipboard-write; fullscreen"
                />
            </div>
        </div>
    );

    if (isFullscreen) {
        return ReactDOM.createPortal(content, document.body);
    }

    return content;
};

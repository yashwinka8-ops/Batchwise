import React from 'react';
import { Info, FileText, ZoomIn, Accessibility } from 'lucide-react';

interface HeaderProps {
    onShowInstructions: () => void;
    onShowQuestionPaper: () => void;
    testTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ onShowInstructions, onShowQuestionPaper, testTitle = 'Skill Assessment' }) => {
    return (
        <header className="bg-gray-800 text-white h-12 flex items-center justify-between px-4 text-sm shadow-md z-50 relative overflow-x-auto no-scrollbar">
            <div className="font-medium tracking-wide truncate uppercase text-[11px] font-black shrink-0">
                {testTitle}
            </div>
            <div className="flex items-center space-x-6 shrink-0 ml-4">
                <button className="flex items-center hover:text-blue-300 transition-colors gap-1">
                    <div className="w-5 h-5 bg-[#2ca12c] rounded-full flex items-center justify-center border border-white/20 shadow-sm"><Accessibility size={12} className="text-white" /></div>
                    <span className="text-[10px] font-bold">Accessibility</span>
                </button>
                <button className="flex items-center hover:text-blue-300 transition-colors gap-1">
                    <div className="w-5 h-5 bg-[#e45228] rounded-full flex items-center justify-center border border-white/20 shadow-sm"><ZoomIn size={12} className="text-white" /></div>
                    <span className="text-[10px] font-bold">Screen Magnifier</span>
                </button>
                <button
                    onClick={onShowInstructions}
                    className="flex items-center hover:text-blue-300 transition-colors gap-1"
                >
                    <div className="w-5 h-5 bg-[#006cb7] rounded-full flex items-center justify-center border border-white/20 shadow-sm"><Info size={12} className="text-white" /></div>
                    <span className="text-[10px] font-bold">Instructions</span>
                </button>
                <button
                    onClick={onShowQuestionPaper}
                    className="flex items-center hover:text-blue-300 transition-colors gap-1"
                >
                    <div className="w-5 h-5 bg-[#2ca12c] rounded-full flex items-center justify-center border border-white/20 shadow-sm"><FileText size={12} className="text-white" /></div>
                    <span className="text-[10px] font-bold">Question Paper</span>
                </button>
            </div>
        </header>
    );
};

export default Header;

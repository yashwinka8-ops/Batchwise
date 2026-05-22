import React from 'react';
import { Info } from 'lucide-react';
import { Section } from './types';

interface SectionTabsProps {
    sections: Section[];
    activeSectionId: string;
    onSectionChange: (id: string) => void;
    onShowInfo: (sectionName: string) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({ sections, activeSectionId, onSectionChange, onShowInfo }) => {
    return (
        <div className="flex items-center border-b border-gray-300 bg-white overflow-x-auto no-scrollbar shadow-sm">
            <button className="px-2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`
            flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap border-r border-gray-200 transition-colors
            ${activeSectionId === section.id
                            ? 'bg-blue-600 text-white shadow-inner'
                            : 'bg-white text-blue-500 hover:bg-gray-50'}
          `}
                >
                    <span className="text-[11px] font-black uppercase tracking-tight">{section.name}</span>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowInfo(section.name);
                        }}
                        className={`ml-2 rounded-full p-0.5 border border-white/20 transition-transform active:scale-95 shadow-sm ${activeSectionId === section.id ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}
                    >
                        <Info size={11} fill="currentColor" stroke="none" />
                    </div>
                </button>
            ))}
            <button className="px-2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
};

export default SectionTabs;

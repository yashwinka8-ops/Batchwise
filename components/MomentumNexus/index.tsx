import React from 'react';
import { Batch } from '../../types';

export const StudyHeatmap: React.FC<{ batches: Batch[] }> = () => (
  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Study Activity</h3>
    <div className="flex gap-1">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-sm bg-white/5 hover:bg-white/10 transition-colors"
          title="No activity"
        />
      ))}
    </div>
  </div>
);

export const OneTapResume: React.FC<{ data: Batch[]; onNavigate: (bId: string, sId: string, cId: string, lId: string) => void }> = () => (
  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10">
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resume Learning</h3>
    <p className="text-xs text-slate-400">No in-progress lectures.</p>
  </div>
);



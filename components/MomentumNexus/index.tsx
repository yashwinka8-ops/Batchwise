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

export const OneTapResume: React.FC<{ data: Batch[]; onNavigate: (bId: string, sId: string, cId: string, lId: string) => void }> = ({ data, onNavigate }) => {
  let resumeLecture = null;
  for (const b of data) {
    for (const s of b.subjects) {
      for (const c of s.chapters) {
        for (const l of c.lectures) {
          if (!l.completed && l.studyTime && l.studyTime > 0) {
            resumeLecture = { bId: b.id, sId: s.id, cId: c.id, lId: l.id, lecture: l };
            break;
          }
        }
        if (resumeLecture) break;
      }
      if (resumeLecture) break;
    }
    if (resumeLecture) break;
  }

  if (!resumeLecture) return null;

  return (
    <div 
      onClick={() => onNavigate(resumeLecture.bId, resumeLecture.sId, resumeLecture.cId, resumeLecture.lId)}
      className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 cursor-pointer hover:border-blue-500/30 transition-all"
    >
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resume Learning</h3>
      <p className="text-xs text-white font-bold">{resumeLecture.lecture.title}</p>
    </div>
  );
};



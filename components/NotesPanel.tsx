import React, { useState, useEffect } from 'react';
import { LectureNote } from '../types';
import { createNote, subscribeToLectureNotes, deleteNote } from '../services/firestoreService';
import { XIcon, TrashIcon } from './Icons';

interface NotesPanelProps {
  lectureId: string;
  chapterId: string;
  subjectId: string;
  batchId: string;
  userId: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const NotesPanel: React.FC<NotesPanelProps> = ({ lectureId, chapterId, subjectId, batchId, userId, currentTime, onSeek, onClose }) => {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const unsub = subscribeToLectureNotes(lectureId, setNotes);
    return unsub;
  }, [lectureId]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    await createNote({
      lectureId, chapterId, subjectId, batchId, userId,
      text: text.trim(),
      timestamp: Math.floor(currentTime),
    });
    setText('');
  };

  return (
    <div className="w-80 border-l border-white/10 bg-[#0a0a0a] flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-[11px] font-black uppercase tracking-widest">Notes</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XIcon size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {notes.length === 0 && (
          <p className="text-[10px] text-slate-600 text-center py-8 font-medium">No notes yet. Add one below.</p>
        )}
        {notes.map(note => (
          <div key={note.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 group">
            <div className="flex items-start justify-between gap-2 mb-1">
              <button
                onClick={() => onSeek(note.timestamp)}
                className="text-[9px] font-black text-purple-500 hover:text-purple-400 uppercase tracking-wider shrink-0 mt-0.5"
              >
                {formatTime(note.timestamp)}
              </button>
              <button onClick={() => deleteNote(note.id)} className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"><TrashIcon size={12} /></button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{note.text}</p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Write a note..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40"
        />
        <button onClick={handleAdd} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-purple-500 transition-all shrink-0">Add</button>
      </div>
    </div>
  );
};

export default NotesPanel;

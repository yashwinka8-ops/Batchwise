import React, { useState, useMemo, useCallback } from 'react';
import { Batch, Lecture } from '../types';
import { queryGroq, getAIScheduleConfig } from '../services/groqService';

// ─── Auto-Scheduler ──────────────────────────────────────────────────────────
/**
 * Assigns scheduledDate to every lecture that doesn't have one yet.
 * Respects batch settings: lecturesPerDay, lecturesPerWeek, batchType.
 * Returns a new Batch with updated lectures (original is NOT mutated).
 */
export interface ScheduleConfig {
  activeDays: number[]; // 0=Sun, 1=Mon, etc.
  lecturesPerDay: number;
  strategy: 'interleaved' | 'sequential';
  startDate: string;
  offDays: string[]; // array of YYYY-MM-DD
  clearExisting: boolean;
}

export function autoScheduleBatch(batch: Batch, config: ScheduleConfig): Batch {
  const { activeDays, lecturesPerDay, strategy, startDate, offDays, clearExisting } = config;

  // Collect lectures to schedule
  const subjectQueues: { sId: string; lectures: { cId: string; lId: string }[] }[] = [];
  let totalToSchedule = 0;

  batch.subjects.forEach(s => {
    const queue: { cId: string; lId: string }[] = [];
    s.chapters.forEach(c =>
      c.lectures.forEach(l => {
        if (clearExisting || !l.scheduledDate) {
          queue.push({ cId: c.id, lId: l.id });
          totalToSchedule++;
        }
      })
    );
    if (queue.length > 0) subjectQueues.push({ sId: s.id, lectures: queue });
  });

  if (totalToSchedule === 0) return batch;

  const orderedLectures: { sId: string; cId: string; lId: string }[] = [];

  if (strategy === 'interleaved') {
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const sq of subjectQueues) {
        if (sq.lectures.length > 0) {
          const ref = sq.lectures.shift()!;
          orderedLectures.push({ sId: sq.sId, cId: ref.cId, lId: ref.lId });
          hasMore = true;
        }
      }
    }
  } else {
    // Sequential
    for (const sq of subjectQueues) {
      for (const ref of sq.lectures) {
        orderedLectures.push({ sId: sq.sId, cId: ref.cId, lId: ref.lId });
      }
    }
  }

  const dateMap = new Map<string, string[]>();
  let cursor = parseDate(startDate);
  let slotOnDay = 0;

  for (const ref of orderedLectures) {
    // Find next valid day
    while (!activeDays.includes(cursor.getDay()) || offDays.includes(toISODate(cursor))) {
      cursor = addDays(cursor, 1);
      slotOnDay = 0;
    }

    const key = toISODate(cursor);
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(ref.lId);
    
    slotOnDay++;
    if (slotOnDay >= lecturesPerDay) {
      cursor = addDays(cursor, 1);
      slotOnDay = 0;
    }
  }

  const lIdToDate = new Map<string, string>();
  dateMap.forEach((ids, date) => ids.forEach(id => lIdToDate.set(id, date)));

  return {
    ...batch,
    isDirty: true,
    subjects: batch.subjects.map(s => ({
      ...s,
      chapters: s.chapters.map(c => ({
        ...c,
        lectures: c.lectures.map(l => {
          if (lIdToDate.has(l.id)) {
            return { ...l, scheduledDate: lIdToDate.get(l.id) };
          } else if (clearExisting) {
            const { scheduledDate, ...rest } = l;
            return rest as Lecture;
          }
          return l;
        }),
      })),
    })),
  };
}

// ─── Backlog Distributor ───────────────────────────────────────────────────────
/**
 * Takes incomplete lectures from the past and distributes them as EXTRA (+1) lectures
 * over the upcoming days, without destroying the future schedule.
 */
export function distributeBacklogBatch(batch: Batch, todayStr: string): Batch {
  const activeDays = [1, 2, 3, 4, 5, 6]; // default Mon-Sat for backlog
  
  // 1. Identify backlog lectures
  const backlogLectures: { cId: string; lId: string }[] = [];
  
  batch.subjects.forEach(s =>
    s.chapters.forEach(c =>
      c.lectures.forEach(l => {
        if (!l.completed && l.scheduledDate && l.scheduledDate < todayStr) {
          backlogLectures.push({ cId: c.id, lId: l.id });
        }
      })
    )
  );

  if (backlogLectures.length === 0) return batch;

  // 2. Assign them 1 per day starting today
  const lIdToNewDate = new Map<string, string>();
  let cursor = parseDate(todayStr);

  for (const ref of backlogLectures) {
    // find next active day
    while (!activeDays.includes(cursor.getDay())) {
      cursor = addDays(cursor, 1);
    }
    lIdToNewDate.set(ref.lId, toISODate(cursor));
    // move to next day so we only add 1 extra per day
    cursor = addDays(cursor, 1);
  }

  // 3. Rebuild batch
  return {
    ...batch,
    isDirty: true,
    subjects: batch.subjects.map(s => ({
      ...s,
      chapters: s.chapters.map(c => ({
        ...c,
        lectures: c.lectures.map(l =>
          lIdToNewDate.has(l.id) ? { ...l, scheduledDate: lIdToNewDate.get(l.id) } : l
        ),
      })),
    })),
  };
}

function getActiveDays(batchType: string, perWeek: number): number[] {
  if (batchType === 'Weekend') return [0, 6];
  if (batchType === 'Morning' || batchType === 'Evening') {
    // spread evenly Mon–Sat
    const pool = [1, 2, 3, 4, 5, 6];
    return pool.slice(0, Math.min(perWeek, 6));
  }
  // Custom / default: Mon–Fri + Sat if needed
  const base = [1, 2, 3, 4, 5];
  if (perWeek >= 6) base.push(6);
  return base.slice(0, perWeek);
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
.scv-root { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; max-width:900px; margin:0 auto; padding:1rem 1.25rem 6rem; }
@media(min-width:768px){.scv-root{padding:1.5rem 1.5rem 2rem;}}

.scv-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
.scv-title { font-size:clamp(20px,4vw,30px); font-weight:800; color:#fff; letter-spacing:-.03em; }
.scv-subtitle { font-size:12px; color:rgba(255,255,255,.35); margin-top:3px; }

.scv-auto-btn {
  display:flex; align-items:center; gap:6px; padding:8px 14px;
  background:var(--primary); color:#fff; border:none; border-radius:12px;
  font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
  cursor:pointer; transition:all .15s;
}
@media(min-width:768px){ .scv-auto-btn { padding:10px 18px; font-size:11px; gap:8px; } }
.scv-auto-btn:hover { opacity:.9; transform: translateY(-1px); }
.scv-auto-btn:active { transform: translateY(0); }
.scv-auto-btn:disabled { opacity:.5; cursor:default; }

.scv-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.scv-month-label { font-size:16px; font-weight:800; color:#fff; }
.scv-nav-btn {
  width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.07); color:rgba(255,255,255,.6);
  cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s;
}
.scv-nav-btn:hover { background:rgba(255,255,255,.08); color:#fff; }

.scv-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
.scv-dow { text-align:center; font-size:9px; font-weight:800; text-transform:uppercase;
  letter-spacing:.1em; color:rgba(255,255,255,.2); padding:8px 0; }

.scv-cell {
  min-height:72px; padding:6px; border-radius:10px;
  background:rgba(255,255,255,.015); border:1px solid rgba(255,255,255,.04);
  cursor:pointer; transition:all .15s; position:relative; display:flex; flex-direction:column;
}
.scv-cell:hover { background:rgba(255,255,255,.04); border-color:rgba(255,255,255,.1); }
.scv-cell.today { border-color:var(--primary); background:rgba(218,11,11,.06); }
.scv-cell.selected { border-color:rgba(255,255,255,.3); background:rgba(255,255,255,.06); }
.scv-cell.other-month { opacity:.3; }
.scv-cell.has-lectures { border-color:rgba(16,185,129,.2); }

.scv-day-num {
  font-size:11px; font-weight:700; color:rgba(255,255,255,.4);
  width:22px; height:22px; display:flex; align-items:center; justify-content:center;
  border-radius:6px; margin-bottom:4px; flex-shrink:0;
}
.scv-cell.today .scv-day-num { background:var(--primary); color:#fff; }

.scv-dot-row { display:flex; flex-wrap:wrap; gap:2px; }
.scv-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.scv-dot.done { background:#10b981; }
.scv-dot.upcoming { background:rgba(255,255,255,.25); }

.scv-overflow { font-size:8px; color:rgba(255,255,255,.3); font-weight:700; margin-top:2px; }

/* Side panel */
.scv-panel {
  margin-top:24px; background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.07); border-radius:16px; overflow:hidden;
}
.scv-panel-hdr {
  padding:16px 20px; background:rgba(255,255,255,.02);
  border-bottom:1px solid rgba(255,255,255,.05);
  font-size:13px; font-weight:800; color:#fff; display:flex; align-items:center; gap:10px;
}
.scv-panel-date { font-size:10px; color:rgba(255,255,255,.35); font-weight:600; }

.scv-lecture-row {
  display:flex; align-items:flex-start; gap:12px; padding:14px 20px;
  border-bottom:1px solid rgba(255,255,255,.04); transition:background .12s;
}
.scv-lecture-row:hover { background:rgba(255,255,255,.02); }
.scv-lecture-row:last-child { border-bottom:none; }

.scv-lec-icon {
  width:32px; height:32px; border-radius:8px; display:flex; align-items:center;
  justify-content:center; font-size:16px; flex-shrink:0;
}
.scv-lec-icon.done  { background:rgba(16,185,129,.15); }
.scv-lec-icon.upcoming { background:rgba(255,255,255,.05); }

.scv-lec-title { font-size:13px; font-weight:700; color:#fff; line-height:1.3; margin-bottom:3px; }
.scv-lec-meta  { font-size:10px; color:rgba(255,255,255,.3); font-weight:600; }
.scv-lec-badge {
  margin-left:auto; flex-shrink:0; padding:3px 10px; border-radius:6px; font-size:9px;
  font-weight:800; text-transform:uppercase; letter-spacing:.06em;
}
.scv-lec-badge.done     { background:rgba(16,185,129,.15); color:#10b981; }
.scv-lec-badge.upcoming { background:rgba(255,255,255,.06); color:rgba(255,255,255,.4); }

.scv-empty { padding:40px 20px; text-align:center; color:rgba(255,255,255,.2); font-size:13px; font-weight:600; }

.scv-stats { display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-bottom:20px; }
@media(min-width:768px){ .scv-stats { grid-template-columns: repeat(4, 1fr); gap:12px; } }
.scv-stat {
  background:rgba(255,255,255,.02);
  border:1px solid rgba(255,255,255,.05); border-radius:12px; padding:12px;
}
@media(min-width:768px){ .scv-stat { padding:14px; } }
.scv-stat-val { font-size:20px; font-weight:800; color:#fff; margin-bottom:2px; }
@media(min-width:768px){ .scv-stat-val { font-size:22px; } }
.scv-stat-lbl { font-size:8px; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,.3); font-weight:700; }
@media(min-width:768px){ .scv-stat-lbl { font-size:9px; } }

/* Modal Wizard */
.scv-modal-overlay { position:fixed; inset:0; z-index:999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.8); backdrop-filter:blur(8px); padding:20px; }
.scv-modal { background:#0d0f14; border:1px solid rgba(255,255,255,.1); border-radius:24px; width:100%; max-width:500px; padding:30px; box-shadow:0 20px 40px rgba(0,0,0,.5); }
.scv-modal-hdr { font-size:20px; font-weight:800; color:#fff; margin-bottom:24px; display:flex; align-items:center; gap:10px; }
.scv-label { font-size:11px; font-weight:700; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; display:block; }
.scv-input { width:100%; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); color:#fff; border-radius:12px; padding:12px 16px; font-size:14px; margin-bottom:20px; transition:border .2s; }
.scv-input:focus { outline:none; border-color:var(--primary); }
.scv-days-row { display:flex; gap:8px; margin-bottom:20px; }
.scv-day-btn { flex:1; padding:10px 0; border-radius:8px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.4); font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; }
.scv-day-btn.active { background:var(--primary); color:#fff; border-color:var(--primary); }
.scv-radio-card { display:flex; gap:12px; padding:12px 16px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:12px; cursor:pointer; margin-bottom:12px; transition:all .15s; }
.scv-radio-card:hover { border-color:rgba(255,255,255,.2); }
.scv-radio-card.active { border-color:var(--primary); background:rgba(var(--primary-rgb, 16,185,129), .05); }
.scv-radio-title { font-size:14px; font-weight:700; color:#fff; margin-bottom:4px; }
.scv-radio-desc { font-size:11px; color:rgba(255,255,255,.4); line-height:1.4; }
`;

// ─── Types ───────────────────────────────────────────────────────────────────
interface FlatLecture extends Lecture {
  subjectName: string;
  chapterName: string;
}

interface Props {
  batch: Batch;
  onBack: () => void;
  onAutoSchedule: (updated: Batch) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
const ScheduleCalendarView: React.FC<Props> = ({ batch, onBack, onAutoSchedule }) => {
  const today = new Date();
  const todayStr = toISODate(today);

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selected, setSelected] = useState<string>(todayStr);
  const [scheduling, setScheduling] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAIBacklogLoading, setIsAIBacklogLoading] = useState(false);

  // ── Flatten all lectures ──
  const allLectures = useMemo<FlatLecture[]>(() => {
    const list: FlatLecture[] = [];
    batch.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.lectures.forEach(l =>
          list.push({ ...l, subjectName: s.name, chapterName: c.name })
        )
      )
    );
    return list;
  }, [batch]);

  // ── date→lectures map ──
  const dateMap = useMemo(() => {
    const m = new Map<string, FlatLecture[]>();
    allLectures.forEach(l => {
      if (l.scheduledDate) {
        if (!m.has(l.scheduledDate)) m.set(l.scheduledDate, []);
        m.get(l.scheduledDate)!.push(l);
      }
    });
    return m;
  }, [allLectures]);

  const scheduledTotal  = allLectures.filter(l => l.scheduledDate).length;
  const completedTotal  = allLectures.filter(l => l.completed).length;
  const totalLectures   = allLectures.length;

  // ── Calendar grid ──
  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDow = first.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Pad from previous month
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevDays - i);
      days.push({ date: toISODate(d), day: d.getDate(), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: toISODate(new Date(year, month, d)), day: d, isCurrentMonth: true });
    }
    // Pad to full rows
    const rem = 7 - (days.length % 7);
    if (rem < 7) {
      for (let d = 1; d <= rem; d++) {
        const nd = new Date(year, month + 1, d);
        days.push({ date: toISODate(nd), day: nd.getDate(), isCurrentMonth: false });
      }
    }
    return days;
  }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }, [month]);

  const executeSchedule = useCallback(async (config: ScheduleConfig) => {
    setScheduling(true);
    setShowWizard(false);
    setShowAIInput(false);
    await new Promise(r => setTimeout(r, 100)); // let UI update
    const updated = autoScheduleBatch(batch, config);
    onAutoSchedule(updated);
    setScheduling(false);
  }, [batch, onAutoSchedule]);

  const handleAISchedule = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const batchMeta = {
        name: batch.name,
        totalLectures,
        scheduledCount: scheduledTotal,
        completedCount: completedTotal,
        subjects: batch.subjects.map(s => ({
          name: s.name,
          chapters: s.chapters.length,
          totalLectures: s.chapters.reduce((acc, c) => acc + c.lectures.length, 0)
        }))
      };

      const config = await getAIScheduleConfig(aiPrompt, batchMeta);
      
      if (confirm(`AI Suggestion: ${config.reasoning}\n\nApply this schedule?`)) {
        await executeSchedule(config);
        setAiPrompt('');
      }
    } catch (e: any) {
      alert("AI Error: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const coverBacklog = useCallback(async () => {
    if (!confirm("This will take all unfinished past lectures and distribute them as 1 extra lecture per day starting today. Future lectures will NOT be shifted. Proceed?")) return;
    setScheduling(true);
    await new Promise(r => setTimeout(r, 100)); // UI update
    const updated = distributeBacklogBatch(batch, todayStr);
    onAutoSchedule(updated);
    setScheduling(false);
  }, [batch, todayStr, onAutoSchedule]);

  const handleAIBacklog = async () => {
    const backlogLectures: any[] = [];
    batch.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.lectures.forEach(l => {
          if (!l.completed && l.scheduledDate && l.scheduledDate < todayStr) {
            backlogLectures.push({ id: l.id, title: l.title, subject: s.name, chapter: c.name });
          }
        })
      )
    );

    if (backlogLectures.length === 0) {
      alert("No backlog detected!");
      return;
    }

    setIsAIBacklogLoading(true);
    try {
      const systemPrompt = `You are a skill learning prioritization engine. 
      Assign each provided backlog lecture a NEW date starting from today (${todayStr}).
      Goal: Prioritize high-weightage or difficult chapters first.
      Output ONLY a JSON object: { "assignments": { "lectureId": "YYYY-MM-DD" } }
      Assume Mon-Sat are active days. Use dates in YYYY-MM-DD format.`;

      const promptStr = `Backlog Lectures: ${JSON.stringify(backlogLectures)}`;
      
      const result = await queryGroq(promptStr, systemPrompt);
      if (result.success) {
        const parsed = JSON.parse(result.content);
        const lIdToNewDate = new Map<string, string>(Object.entries(parsed.assignments));
        
        const updatedBatch: Batch = {
          ...batch,
          isDirty: true,
          subjects: batch.subjects.map(s => ({
            ...s,
            chapters: s.chapters.map(c => ({
              ...c,
              lectures: c.lectures.map(l =>
                lIdToNewDate.has(l.id) ? { ...l, scheduledDate: lIdToNewDate.get(l.id) } : l
              ),
            })),
          })),
        };
        onAutoSchedule(updatedBatch);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      alert("AI Prioritization Failed: " + e.message);
    } finally {
      setIsAIBacklogLoading(false);
    }
  };

  const isHoliday = batch.settings?.offDays?.includes(selected) ?? false;

  const toggleHoliday = useCallback(async () => {
    const currentOffDays = batch.settings?.offDays ?? [];
    const newOffDays = isHoliday 
      ? currentOffDays.filter(d => d !== selected)
      : [...currentOffDays, selected];
    
    const tempBatch = { ...batch, settings: { ...batch.settings, offDays: newOffDays } as any };
    
    if (selected >= todayStr && !isHoliday) {
      if (!confirm("Marking this day as a leave will push all upcoming lectures forward. Proceed?")) return;
      setScheduling(true);
      await new Promise(r => setTimeout(r, 100));
      
      const updated = autoScheduleBatch(tempBatch, {
        activeDays: getActiveDays(batch.settings?.batchType ?? 'Custom', batch.settings?.lecturesPerWeek ?? 6),
        lecturesPerDay: batch.settings?.lecturesPerDay ?? 3,
        strategy: 'interleaved',
        startDate: selected,
        offDays: newOffDays,
        clearExisting: true
      });
      onAutoSchedule(updated);
      setScheduling(false);
    } else {
      // Just save the new offDays
      onAutoSchedule(tempBatch);
    }
  }, [batch, selected, isHoliday, todayStr, onAutoSchedule]);

  const selectedLectures = dateMap.get(selected) ?? [];

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOWS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="scv-root">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="scv-hdr">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <button
              onClick={onBack}
              style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.6)', cursor:'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize:18 }}>arrow_back</span>
            </button>
            <div>
              <h1 className="scv-title">📅 Schedule</h1>
              <p className="scv-subtitle">{batch.name}</p>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          {scheduledTotal > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="scv-auto-btn"
                style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                onClick={coverBacklog}
                disabled={scheduling || isAIBacklogLoading}
                title="Distribute missed lectures as +1 extra per day"
              >
                <span className="material-symbols-outlined" style={{ fontSize:16 }}>update</span>
                Backlog
              </button>
              <button
                className="scv-auto-btn"
                style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.2)' }}
                onClick={handleAIBacklog}
                disabled={scheduling || isAIBacklogLoading}
                title="AI Optimized Recovery"
              >
                <span className="material-symbols-outlined" style={{ fontSize:16 }}>bolt</span>
                AI Recover
              </button>
            </div>
          )}
          <button
            className="scv-auto-btn"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)', border: 'none' }}
            onClick={() => setShowAIInput(!showAIInput)}
            disabled={scheduling || isAiLoading}
          >
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>auto_awesome</span>
            AI Schedule
          </button>
          <button
            className="scv-auto-btn"
            onClick={() => setShowWizard(true)}
            disabled={scheduling || isAiLoading}
          >
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>tune</span>
            {scheduling ? 'Scheduling…' : scheduledTotal === 0 ? 'Auto-Schedule' : 'Configure'}
          </button>
        </div>
      </div>

      {/* AI Input Area */}
      {showAIInput && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: 'rgba(139, 92, 246, 0.05)', 
          border: '1px solid rgba(139, 92, 246, 0.2)', 
          borderRadius: 20,
          animation: 'slideDown 0.3s ease'
        }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            AI Planner 🪄
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="text" 
              placeholder="e.g., I want to finish Physics by July, keeping Sundays free..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAISchedule()}
              style={{ 
                flex: 1, 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 12, 
                padding: '12px 16px', 
                color: '#fff',
                fontSize: 14,
                outline: 'none'
              }}
            />
            <button 
              onClick={handleAISchedule}
              disabled={isAiLoading || !aiPrompt.trim()}
              style={{ 
                padding: '0 20px', 
                borderRadius: 12, 
                background: '#8B5CF6', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 700, 
                cursor: 'pointer',
                opacity: (isAiLoading || !aiPrompt.trim()) ? 0.5 : 1
              }}
            >
              {isAiLoading ? 'Analyzing...' : 'Generate'}
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }}>info</span>
            AI will automatically calculate lectures per day and strategy based on your goal.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="scv-stats">
        {[
          { val: totalLectures,   lbl: 'Total Lectures' },
          { val: scheduledTotal,  lbl: 'Scheduled' },
          { val: completedTotal,  lbl: 'Completed' },
          { val: totalLectures - scheduledTotal, lbl: 'Unscheduled' },
        ].map(s => (
          <div key={s.lbl} className="scv-stat">
            <div className="scv-stat-val">{s.val}</div>
            <div className="scv-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {scheduledTotal === 0 && (
        <div style={{ textAlign:'center', padding:'32px 20px', background:'rgba(255,255,255,.02)', border:'1px dashed rgba(255,255,255,.08)', borderRadius:16, marginBottom:24 }}>
          <span className="material-symbols-outlined" style={{ fontSize:40, color:'rgba(255,255,255,.1)', display:'block', marginBottom:12 }}>calendar_month</span>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.3)', fontWeight:600 }}>No lectures scheduled yet.</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,.18)', marginTop:6 }}>Hit <strong style={{ color:'rgba(255,255,255,.4)' }}>Auto-Schedule</strong> to distribute lectures based on your batch settings.</p>
        </div>
      )}

      {/* Month Navigation */}
      <div className="scv-nav">
        <button className="scv-nav-btn" onClick={prevMonth}>
          <span className="material-symbols-outlined" style={{ fontSize:18 }}>chevron_left</span>
        </button>
        <span className="scv-month-label">{MONTHS[month]} {year}</span>
        <button className="scv-nav-btn" onClick={nextMonth}>
          <span className="material-symbols-outlined" style={{ fontSize:18 }}>chevron_right</span>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="scv-grid">
        {DOWS.map(d => <div key={d} className="scv-dow">{d}</div>)}

        {calendarDays.map(({ date, day, isCurrentMonth }) => {
          const lectures = dateMap.get(date) ?? [];
          const isToday    = date === todayStr;
          const isSelected = date === selected;
          const hasLectures = lectures.length > 0;
          const visible = lectures.slice(0, 4);
          const overflow = lectures.length - visible.length;

          return (
            <div
              key={date}
              className={[
                'scv-cell',
                isToday    ? 'today' : '',
                isSelected ? 'selected' : '',
                !isCurrentMonth ? 'other-month' : '',
                hasLectures ? 'has-lectures' : '',
              ].join(' ')}
              onClick={() => setSelected(date)}
            >
              <div className="scv-day-num">{day}</div>
              <div className="scv-dot-row">
                {visible.map(l => (
                  <div key={l.id} className={`scv-dot ${l.completed ? 'done' : 'upcoming'}`} title={l.title} />
                ))}
              </div>
              {overflow > 0 && <div className="scv-overflow">+{overflow}</div>}
            </div>
          );
        })}
      </div>

      {/* Day Detail Panel */}
      <div className="scv-panel">
        <div className="scv-panel-hdr">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:18, color: isHoliday ? '#ef4444' : 'var(--primary)' }}>{isHoliday ? 'event_busy' : 'event'}</span>
              <div>
                <div>
                  {new Date(selected + 'T12:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </div>
                <div className="scv-panel-date">
                  {selectedLectures.length === 0 ? 'No lectures' : `${selectedLectures.length} lecture${selectedLectures.length > 1 ? 's' : ''}`}
                  {isHoliday && <span style={{ color: '#ef4444', marginLeft: '8px', fontWeight: 'bold' }}>• Holiday</span>}
                </div>
              </div>
            </div>
            {selected >= todayStr && (
              <button 
                onClick={toggleHoliday}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: `1px solid ${isHoliday ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`, 
                  background: isHoliday ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', 
                  color: isHoliday ? '#ef4444' : '#94a3b8', 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isHoliday ? 'Remove Leave' : 'Mark as Leave'}
              </button>
            )}
          </div>
        </div>

        {selectedLectures.length === 0 ? (
          <div className="scv-empty">
            {selected < todayStr ? 'No lectures were scheduled here.' : 'Nothing scheduled for this day.'}
          </div>
        ) : (
          selectedLectures.map((l, i) => (
            <div key={l.id} className="scv-lecture-row">
              <div className={`scv-lec-icon ${l.completed ? 'done' : 'upcoming'}`}>
                {l.completed ? '✅' : '🎥'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="scv-lec-title">{l.title}</div>
                <div className="scv-lec-meta">{l.subjectName} · {l.chapterName}</div>
              </div>
              <div className={`scv-lec-badge ${l.completed ? 'done' : 'upcoming'}`}>
                {l.completed ? 'Done' : 'Pending'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <ScheduleWizardModal 
          onClose={() => setShowWizard(false)} 
          onApply={executeSchedule} 
          hasExisting={scheduledTotal > 0} 
        />
      )}
    </div>
  );
};

const ScheduleWizardModal: React.FC<{
  onClose: () => void;
  onApply: (config: ScheduleConfig) => void;
  hasExisting: boolean;
}> = ({ onClose, onApply, hasExisting }) => {
  const [activeDays, setActiveDays] = useState<number[]>([1,2,3,4,5,6]); // Mon-Sat
  const [lecturesPerDay, setLecturesPerDay] = useState(3);
  const [strategy, setStrategy] = useState<'interleaved' | 'sequential'>('interleaved');
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [offDatesInput, setOffDatesInput] = useState('');
  const [clearExisting, setClearExisting] = useState(true);

  const toggleDay = (d: number) => {
    setActiveDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleApply = () => {
    const offDays = offDatesInput.split(',')
      .map(s => s.trim())
      .filter(s => s.match(/^\d{4}-\d{2}-\d{2}$/)); // basic validation
      
    if (activeDays.length === 0) {
      alert("Please select at least one study day.");
      return;
    }

    onApply({
      activeDays,
      lecturesPerDay,
      strategy,
      startDate,
      offDays,
      clearExisting
    });
  };

  const DOW = ['S','M','T','W','T','F','S'];

  return (
    <div className="scv-modal-overlay" onClick={onClose}>
      <div className="scv-modal" onClick={e => e.stopPropagation()}>
        <div className="scv-modal-hdr">
          <span className="material-symbols-outlined text-[var(--primary)] text-2xl">magic_button</span>
          Schedule Configuration
        </div>

        <label className="scv-label">Study Days</label>
        <div className="scv-days-row">
          {DOW.map((label, i) => (
            <button 
              key={i} 
              className={`scv-day-btn ${activeDays.includes(i) ? 'active' : ''}`}
              onClick={() => toggleDay(i)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label className="scv-label">Lectures per day</label>
            <input 
              type="number" 
              className="scv-input" 
              min={1} max={10} 
              value={lecturesPerDay} 
              onChange={e => setLecturesPerDay(Number(e.target.value))} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="scv-label">Start Date</label>
            <input 
              type="date" 
              className="scv-input" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
        </div>

        <label className="scv-label">Subject Strategy</label>
        <div 
          className={`scv-radio-card ${strategy === 'interleaved' ? 'active' : ''}`}
          onClick={() => setStrategy('interleaved')}
        >
          <span className="material-symbols-outlined" style={{ color: strategy==='interleaved'?'var(--primary)':'rgba(255,255,255,0.3)' }}>shuffle</span>
          <div>
            <div className="scv-radio-title">Interleaved (Balanced)</div>
            <div className="scv-radio-desc">Mix subjects daily (e.g. 1 Physics, 1 Chem, 1 Math per day). Best for retention.</div>
          </div>
        </div>
        <div 
          className={`scv-radio-card ${strategy === 'sequential' ? 'active' : ''}`}
          onClick={() => setStrategy('sequential')}
        >
          <span className="material-symbols-outlined" style={{ color: strategy==='sequential'?'var(--primary)':'rgba(255,255,255,0.3)' }}>view_stream</span>
          <div>
            <div className="scv-radio-title">Block Scheduling (Deep Focus)</div>
            <div className="scv-radio-desc">Finish an entire subject before moving to the next one.</div>
          </div>
        </div>

        <label className="scv-label">Holidays / Excluded Dates</label>
        <input 
          type="text" 
          className="scv-input" 
          placeholder="YYYY-MM-DD, YYYY-MM-DD (Comma separated)"
          value={offDatesInput}
          onChange={e => setOffDatesInput(e.target.value)}
        />

        {hasExisting && (
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, cursor:'pointer' }}>
            <input 
              type="checkbox" 
              checked={clearExisting} 
              onChange={e => setClearExisting(e.target.checked)} 
              style={{ width:16, height:16, accentColor:'var(--primary)' }}
            />
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>Reset previously scheduled lectures</span>
          </label>
        )}

        <div style={{ display:'flex', gap:12, marginTop:10 }}>
          <button 
            onClick={onClose}
            style={{ flex:1, padding:14, borderRadius:12, background:'rgba(255,255,255,0.05)', color:'#fff', border:'none', fontWeight:700, cursor:'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            style={{ flex:1, padding:14, borderRadius:12, background:'var(--primary)', color:'#fff', border:'none', fontWeight:700, cursor:'pointer' }}
          >
            Generate Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendarView;

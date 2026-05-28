import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { createGoal, subscribeToUserGoals, updateGoalProgress, deleteGoal } from '../services/firestoreService';
import { PlusIcon, TrashIcon } from './Icons';

interface GoalDashboardProps {
  userId: string;
  completedCount: number;
}

const GoalDashboard: React.FC<GoalDashboardProps> = ({ userId, completedCount }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(5);
  const [type, setType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');

  useEffect(() => {
    const unsub = subscribeToUserGoals(userId, setGoals);
    return unsub;
  }, [userId]);

  useEffect(() => {
    goals.forEach(goal => {
      if (!goal.completed && completedCount >= goal.targetCount) {
        updateGoalProgress(goal.id, goal.targetCount, true);
      } else if (!goal.completed) {
        updateGoalProgress(goal.id, Math.min(completedCount, goal.targetCount), false);
      }
    });
  }, [completedCount, goals]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGoal({ userId, title: title.trim(), targetCount: target, currentCount: 0, type });
    setTitle('');
    setShowForm(false);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Learning Goals</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Track your progress milestones</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center justify-center">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete 5 lectures" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
          <div className="flex gap-3">
            <input type="number" value={target} onChange={e => setTarget(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-emerald-500/40" />
            <select value={type} onChange={e => setType(e.target.value as any)} className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40">
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="custom">Ongoing</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition-all">Set Goal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[10px] text-slate-500 hover:text-white transition-all">Cancel</button>
          </div>
        </div>
      )}

      {activeGoals.length === 0 && !showForm && (
        <p className="text-[10px] text-slate-600 text-center py-6 font-medium">No active goals. Set a goal to track your progress.</p>
      )}

      <div className="space-y-3">
        {activeGoals.map(goal => {
          const progress = goal.targetCount > 0 ? Math.min(completedCount / goal.targetCount, 1) : 0;
          return (
            <div key={goal.id} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-white truncate">{goal.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500">{Math.min(completedCount, goal.targetCount)}/{goal.targetCount}</span>
                  <button onClick={() => deleteGoal(goal.id)} className="text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 bg-emerald-500" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <span className="text-[8px] text-slate-600 font-medium uppercase tracking-wider">{goal.type === 'weekly' ? 'This Week' : goal.type === 'monthly' ? 'This Month' : 'Ongoing'}</span>
            </div>
          );
        })}
      </div>

      {completedGoals.length > 0 && (
        <details className="mt-4">
          <summary className="text-[9px] text-slate-600 cursor-pointer hover:text-slate-400 font-medium uppercase tracking-wider">{completedGoals.length} completed</summary>
          <div className="mt-3 space-y-2">
            {completedGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="text-emerald-500">✓</span>
                <span className="line-through">{goal.title}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default GoalDashboard;

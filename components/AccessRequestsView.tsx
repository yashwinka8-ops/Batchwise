import React, { useEffect, useState } from 'react';
import { subscribeToIncomingRequests, updateAccessRequestStatus, getBatchByInviteCode } from '../services/firestoreService';
import { AccessRequest, Batch } from '../types';

interface AccessRequestsViewProps {
    currentUser: any;
    onBack: () => void;
}

const AccessRequestsView: React.FC<AccessRequestsViewProps> = ({ currentUser, onBack }) => {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        
        const unsubscribe = subscribeToIncomingRequests(currentUser.uid, (data) => {
            setRequests(data as AccessRequest[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            await updateAccessRequestStatus(requestId, status);
        } catch (error) {
            console.error('Failed to update request status', error);
            alert("Failed to update status.");
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-7xl mx-auto p-4 md:p-8 pb-32">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 text-[10px] font-black uppercase tracking-widest transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Workspace
            </button>

            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                    Access <span className="text-[var(--primary)]">Requests</span>
                </h1>
                <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed max-w-2xl">
                    Approve or reject users who purchased your locked batches.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-white animate-spin"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-white/5 bg-[#0b0f1a]">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-4">inbox</span>
                    <h3 className="text-xl font-bold text-white mb-2">Inbox Empty</h3>
                    <p className="text-xs text-slate-500 max-w-sm">You have no pending access requests at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map(request => (
                        <div key={request.id} className="bg-[#0b0f1a] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[50px] rounded-full pointer-events-none" />
                            
                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <h4 className="text-sm font-black text-white">{request.userName || 'Student'}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{request.userEmail || 'No Email'}</p>
                                </div>
                                <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded font-black uppercase tracking-widest">
                                    Pending
                                </span>
                            </div>

                            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 relative z-10">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Requested Node</p>
                                <p className="text-xs font-bold text-white uppercase italic">{request.batchName || request.batchId}</p>
                            </div>

                            <div className="flex items-center gap-3 mt-2 relative z-10 pointer-events-auto">
                                <button 
                                    onClick={() => handleAction(request.id!, 'approved')}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest py-4 min-h-[48px] rounded-xl transition-all shadow-lg active:scale-95"
                                >
                                    Approve Access
                                </button>
                                <button 
                                    onClick={() => handleAction(request.id!, 'rejected')}
                                    className="px-6 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all border border-rose-500/20 active:scale-95"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccessRequestsView;

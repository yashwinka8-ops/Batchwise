import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { auth } from './services/firebase';
import { Batch } from './types';
import { checkIsAdmin, subscribeToBatches } from './services/firestoreService';
import { BatchWiseLogo } from './components/Icons';

// Admin Views
import AdminPage from './components/AdminPage';
import InstructorConsoleView from './components/InstructorConsoleView';
import AccessRequestsView from './components/AccessRequestsView';
import MockTestAdmin from './components/MockTestAdmin';
import BatchAdminView from './components/BatchAdminView';

const AdminLayout: React.FC<{ children: React.ReactNode, user: any }> = ({ children, user }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { id: 'requests', label: 'Access Requests', icon: 'group_add', path: '/requests' },
    { id: 'instructor', label: 'Instructor Panel', icon: 'shield_person', path: '/instructor' },
    { id: 'management', label: 'Management Portal', icon: 'admin_panel_settings', path: '/management' },
    { id: 'mock', label: 'Mock Test Admin', icon: 'quiz', path: '/mock-admin' },
    { id: 'guide', label: 'System Guide', icon: 'auto_book', path: '/guide.html' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#000000] text-[#f4f4f5] overflow-hidden transition-all duration-700 animate-apple">
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 flex flex-col bg-[#0b0f1a] shrink-0">
          <div className="p-8 flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="size-10 bg-slate-950 border border-white/5 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <BatchWiseLogo className="w-8 h-8 text-[#da0b0b]" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Admin<span className="text-[#da0b0b]">Center</span></h1>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
            <p className="px-4 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Strategic Console</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { 
                  if (item.path.endsWith('.html')) {
                    window.location.href = item.path;
                  } else {
                    navigate(item.path); 
                  }
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  window.location.pathname === item.path ? 'bg-white/5 text-[#da0b0b] shadow-inner' : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined scale-110">{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6 mt-auto">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="size-10 rounded-xl bg-slate-900 overflow-hidden ring-1 ring-white/10 relative">
                <img src={user?.photoURL || `https://media-cldnry.s-nbcnews.com/image/upload/t_nbcnews-fp-1024-512,f_auto,q_auto:best/rockcms/2023-06/230601-jeffrey-epstein-2005-ac-547p-94aa33.jpg?seed=${user?.uid}`} alt="User Profile" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all cursor-pointer" />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-white truncate">{user?.displayName || "Lead Instructor"}</p>
                <p className="text-[8px] text-[#da0b0b] font-black uppercase tracking-[0.1em]">ADMINISTRATOR</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#000000] lg:rounded-l-[2.5rem] lg:border-l lg:border-white/5 shadow-2xl relative">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-[40]">
             <div className="flex items-center gap-2">
                <span className="text-white font-bold opacity-90 uppercase tracking-widest text-[10px]">Security Node Alpha</span>
             </div>
             <div className="flex items-center gap-4">
                <button onClick={() => auth.signOut()} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors py-2 px-4 rounded-lg bg-white/5">Terminate Session</button>
             </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    try {
      await auth.signInWithPopup();
    } catch (e) {
      console.error(e);
      alert("Encryption failure: Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black p-6">
      <div className="apple-card w-full max-w-sm animate-apple text-center border-white/10">
        <div className="size-16 bg-slate-900 border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <BatchWiseLogo className="w-8 h-8 text-[#da0b0b]" />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">Command<span className="text-[#da0b0b]">Center</span></h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Strategic Intelligence Portal v1.0</p>
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="apple-button-primary w-full py-4 text-[11px] font-black uppercase tracking-[0.2em]"
        >
          {loading ? "Decrypting..." : "Authenticate Admin"}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u: any) => {
      setUser(u);
      if (u) {
        const adminStatus = await checkIsAdmin(u.email || '');
        setIsAdmin(adminStatus || u.email === 'yashwinka8@gmail.com');
        
        // Subscribe to all batches for instructor views
        const unsubBatches = subscribeToBatches(u.uid, (data) => {
          setBatches(data);
        });
        return () => unsubBatches();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="apple-spinner"></div>
    </div>
  );

  if (!user || !isAdmin) {
    return (
      <>
        <LoginPage />
        {user && !isAdmin && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-xl animate-apple">
            Unauthorized Node Detected. Access Revoked.
          </div>
        )}
      </>
    );
  }

  return (
    <AdminLayout user={user}>
      <Routes>
        <Route path="/" element={
          <div className="animate-apple">
            <h2 className="text-3xl font-black mb-8 uppercase italic">System <span className="text-[#da0b0b]">OVERVIEW</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="apple-card hover:border-[#da0b0b]/30">
                <span className="material-symbols-outlined text-[#da0b0b] mb-4">analytics</span>
                <h3 className="text-lg font-bold mb-2">Live Statistics</h3>
                <p className="text-slate-500 text-xs">Real-time performance monitoring across all active nodes.</p>
              </div>
              <div className="apple-card hover:border-[#da0b0b]/30">
                <span className="material-symbols-outlined text-[#da0b0b] mb-4">security</span>
                <h3 className="text-lg font-bold mb-2">Security Hub</h3>
                <p className="text-slate-500 text-xs">Manage access requests and administrative permissions.</p>
              </div>
            </div>
          </div>
        } />
        <Route path="/requests" element={<AccessRequestsView currentUser={user} onBack={() => navigate('/')} />} />
        <Route path="/instructor" element={<InstructorConsoleView batches={batches} onManageBatch={(id) => navigate(`/batch/${id}/admin`)} onAccessRequests={() => navigate('/requests')} onBack={() => navigate('/')} />} />
        <Route path="/management" element={<AdminPage onBack={() => navigate('/')} libraryResources={[]} />} />
        <Route path="/mock-admin" element={<MockTestAdmin onBack={() => navigate('/')} />} />
        <Route path="/batch/:id/admin" element={<BatchAdminWrapper batches={batches} onBack={() => navigate('/instructor')} />} />
      </Routes>
    </AdminLayout>
  );
};

const BatchAdminWrapper: React.FC<{ batches: Batch[], onBack: () => void }> = ({ batches, onBack }) => {
  const { id } = useParams();
  const batch = batches.find(b => b.id === id);
  if (!batch) return <div className="p-12 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Initializing Neural Link to Batch...</div>;
  return <BatchAdminView batch={batch} onBack={onBack} setLoading={() => {}} />;
};

export default App;

import React, { useState, useEffect } from 'react';
import { Certificate, Batch } from '../types';
import { generateCertificate, subscribeToUserCertificates } from '../services/firestoreService';
import { XIcon } from './Icons';

interface CertificateViewProps {
  batch: Batch;
  userId: string;
  userName: string;
  onClose: () => void;
}

const bwsLogo = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#da0b0b"/>
      <stop offset="100%" stopColor="#8b0000"/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="12" fill="none" stroke="#da0b0b" stroke-width="3" opacity="0.3"/>
  <rect x="12" y="12" width="76" height="76" rx="8" fill="none" stroke="#da0b0b" stroke-width="1.5" opacity="0.2"/>
  <path d="M32 20 V80 H40 V45 L62 20 H32Z" fill="#f8fafc"/>
  <path d="M32 80 L50 55 H42 L58 35 L52 50 H60 L40 80 Z" fill="url(#cg)"/>
  <path d="M40 80 H60 C75 80 75 50 60 50 H55 L40 70 V80Z" fill="#f8fafc"/>
  <path d="M60 20 C70 20 75 35 65 45 L58 35 L62 20 H60Z" fill="#f8fafc" opacity="0.8"/>
</svg>`;

const CertificateView: React.FC<CertificateViewProps> = ({ batch, userId, userName, onClose }) => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [generating, setGenerating] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const total = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.length, 0), 0);
  const done = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.filter(l => l.completed).length, 0), 0);
  const isComplete = total > 0 && done >= total;
  const existingCert = certs.find(c => c.batchId === batch.id);
  const genre = batch.genre || 'study';
  const label = genre === 'skill' ? 'Course' : genre === 'creative' ? 'Project' : 'Batch';

  useEffect(() => {
    const unsub = subscribeToUserCertificates(userId, setCerts);
    return unsub;
  }, [userId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateCertificate({
        batchId: batch.id, batchName: batch.name, userId,
        userName: userName || 'Learner', genre,
        completedAt: Date.now(),
      });
      setPrintReady(true);
    } catch {
      alert('Failed to generate certificate');
    }
    setGenerating(false);
  };

  const certId = existingCert?.id || `cert_${Date.now()}`;
  const completionDate = existingCert
    ? new Date(existingCert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const certNumber = certId.slice(-8).toUpperCase();

  const openPrintWindow = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Completion - BatchWise</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            display:flex; align-items:center; justify-content:center;
            min-height:100vh; background:#1a1a2e; font-family:'Inter',sans-serif;
            -webkit-print-color-adjust:exact; print-color-adjust:exact;
          }
          .cert-wrapper {
            width:900px; padding:40px; position:relative;
          }
          .certificate {
            background:linear-gradient(145deg,#0f0f1a 0%,#1a0f2e 40%,#0f172a 100%);
            border:2px solid rgba(218,11,11,0.3);
            border-radius:16px; padding:60px 70px;
            position:relative; overflow:hidden;
            box-shadow:
              0 0 80px rgba(218,11,11,0.08),
              0 0 160px rgba(218,11,11,0.04),
              inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .certificate::before {
            content:''; position:absolute; inset:0;
            background:
              radial-gradient(ellipse at 30% 20%, rgba(218,11,11,0.06) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 80%, rgba(139,0,0,0.04) 0%, transparent 50%);
            pointer-events:none;
          }
          .border-frame {
            position:absolute; inset:20px;
            border:1px solid rgba(218,11,11,0.15);
            border-radius:8px; pointer-events:none;
          }
          .border-frame-inner {
            position:absolute; inset:24px;
            border:1px solid rgba(218,11,11,0.08);
            border-radius:6px; pointer-events:none;
          }
          .corner {
            position:absolute; width:30px; height:30px; pointer-events:none;
          }
          .corner-tl { top:24px; left:24px; border-top:2px solid rgba(218,11,11,0.3); border-left:2px solid rgba(218,11,11,0.3); border-radius:2px 0 0 0; }
          .corner-tr { top:24px; right:24px; border-top:2px solid rgba(218,11,11,0.3); border-right:2px solid rgba(218,11,11,0.3); border-radius:0 2px 0 0; }
          .corner-bl { bottom:24px; left:24px; border-bottom:2px solid rgba(218,11,11,0.3); border-left:2px solid rgba(218,11,11,0.3); border-radius:0 0 0 2px; }
          .corner-br { bottom:24px; right:24px; border-bottom:2px solid rgba(218,11,11,0.3); border-right:2px solid rgba(218,11,11,0.3); border-radius:0 0 2px 0; }
          .watermark {
            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            font-size:140px; font-weight:900; color:rgba(218,11,11,0.02);
            letter-spacing:8px; white-space:nowrap; pointer-events:none;
            font-family: 'Inter', sans-serif;
          }
          .logo-area { text-align:center; margin-bottom:28px; position:relative; z-index:1; }
          .logo-area svg { width:56px; height:56px; display:inline-block; }
          .logo-text { font-size:20px; font-weight:900; color:#f1f5f9; letter-spacing:6px; text-transform:uppercase; margin-top:6px; }
          .logo-text span { color:#da0b0b; }
          .divider {
            width:180px; height:2px;
            background:linear-gradient(90deg,transparent,rgba(218,11,11,0.5),transparent);
            margin:12px auto 20px;
          }
          h1 {
            font-family:'Playfair Display',serif;
            font-size:44px; font-weight:900;
            background:linear-gradient(135deg,#da0b0b 0%,#f43f5e 50%,#a78bfa 100%);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent;
            background-clip:text;
            text-align:center; letter-spacing:2px; margin-bottom:4px;
            position:relative; z-index:1;
          }
          .subtitle {
            text-align:center; font-size:13px; font-weight:500;
            color:#64748b; letter-spacing:8px; text-transform:uppercase;
            position:relative; z-index:1; margin-bottom:32px;
          }
          .presented {
            text-align:center; font-size:13px; color:#94a3b8; font-weight:300;
            position:relative; z-index:1; margin-bottom:4px;
            font-family:'Cormorant Garamond',serif; font-style:italic;
          }
          .recipient-name {
            text-align:center; font-family:'Playfair Display',serif;
            font-size:40px; font-weight:700; color:#f1f5f9;
            position:relative; z-index:1; margin-bottom:4px;
            text-shadow:0 0 40px rgba(218,11,11,0.1);
          }
          .recipient-underline {
            width:300px; height:1px;
            background:linear-gradient(90deg,transparent,rgba(241,245,249,0.2),transparent);
            margin:0 auto 16px;
          }
          .for-text {
            text-align:center; font-size:13px; color:#94a3b8; font-weight:300;
            position:relative; z-index:1; margin-bottom:4px;
            font-family:'Cormorant Garamond',serif; font-style:italic;
          }
          .course-name {
            text-align:center; font-size:24px; font-weight:800; color:#e2e8f0;
            position:relative; z-index:1; margin-bottom:4px;
            letter-spacing:0.5px;
          }
          .course-label {
            text-align:center; font-size:11px; font-weight:600; color:#64748b;
            text-transform:uppercase; letter-spacing:3px; position:relative; z-index:1; margin-bottom:28px;
          }
          .divider2 {
            width:120px; height:1px;
            background:linear-gradient(90deg,transparent,rgba(218,11,11,0.3),transparent);
            margin:0 auto 24px;
          }
          .details {
            display:flex; justify-content:center; gap:48px;
            position:relative; z-index:1; margin-bottom:28px;
          }
          .detail-item { text-align:center; }
          .detail-label { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px; }
          .detail-value { font-size:13px; font-weight:600; color:#cbd5e1; }
          .seal {
            width:72px; height:72px; margin:0 auto 20px;
            border:3px solid rgba(218,11,11,0.3);
            border-radius:50%; display:flex; align-items:center; justify-content:center;
            position:relative; z-index:1;
            background:radial-gradient(circle,rgba(218,11,11,0.06),transparent);
          }
          .seal-inner {
            width:58px; height:58px; border-radius:50%;
            border:1.5px solid rgba(218,11,11,0.2);
            display:flex; align-items:center; justify-content:center;
            font-size:22px;
          }
          .signatures {
            display:flex; justify-content:center; gap:64px;
            position:relative; z-index:1; margin-bottom:20px;
          }
          .sig-item { text-align:center; min-width:160px; }
          .sig-line { width:140px; height:1px; background:rgba(148,163,184,0.3); margin:0 auto 8px; }
          .sig-role { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:2px; }
          .sig-name { font-size:11px; color:#94a3b8; font-family:'Cormorant Garamond',serif; font-style:italic; }
          .footer-line {
            width:100%; height:1px;
            background:linear-gradient(90deg,transparent,rgba(218,11,11,0.15),transparent);
            margin:0 auto 16px;
          }
          .footer-text {
            text-align:center; font-size:10px; color:#475569;
            letter-spacing:4px; text-transform:uppercase; font-weight:500;
            position:relative; z-index:1;
          }
          .footer-text span { color:#da0b0b; font-weight:700; }
          .cert-number {
            text-align:center; font-size:8px; color:#334155;
            margin-top:8px; letter-spacing:2px; font-family:monospace;
          }
          @media print {
            body { background:#fff; }
            .cert-wrapper { padding:0; }
            .certificate { box-shadow:none; border-color:rgba(0,0,0,0.15); }
            .certificate::before { display:none; }
            .recipient-name { color:#1a1a2e; }
            .course-name { color:#1a1a2e; }
            .logo-text { color:#1a1a2e; }
            .seal { border-color:rgba(218,11,11,0.4); }
            .detail-value { color:#334155; }
          }
        </style>
      </head>
      <body>
        <div class="cert-wrapper">
          <div class="certificate">
            <div class="border-frame"></div>
            <div class="border-frame-inner"></div>
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
            <div class="watermark">BATCHWISE</div>

            <div class="logo-area">
              ${bwsLogo}
              <div class="logo-text">Batch<span>Wise</span></div>
            </div>

            <div class="divider"></div>

            <h1>CERTIFICATE</h1>
            <div class="subtitle">OF COMPLETION</div>

            <p class="presented">Presented to</p>
            <div class="recipient-name">${userName || 'Learner'}</div>
            <div class="recipient-underline"></div>

            <p class="for-text">for successfully completing the ${label.toLowerCase()}</p>
            <div class="course-name">${batch.name}</div>
            <div class="course-label">${label} Completion</div>

            <div class="divider2"></div>

            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Date Issued</div>
                <div class="detail-value">${completionDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Certificate ID</div>
                <div class="detail-value">BW-${certNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">Verified</div>
              </div>
            </div>

            <div class="seal">
              <div class="seal-inner">&#x2713;</div>
            </div>

            <div class="signatures">
              <div class="sig-item">
                <div class="sig-line"></div>
                <div class="sig-role">Authorized Signatory</div>
                <div class="sig-name">BatchWise Learning</div>
              </div>
              <div class="sig-item">
                <div class="sig-line"></div>
                <div class="sig-role">Issuing Authority</div>
                <div class="sig-name">Digital Credentials</div>
              </div>
            </div>

            <div class="footer-line"></div>
            <div class="footer-text">Verified by <span>BatchWise</span> &mdash; Learn Smarter</div>
            <div class="cert-number">BW-${certNumber} &bull; ${completionDate}</div>
          </div>
        </div>
        <script>window.onload=function(){setTimeout(function(){window.print();},500)}</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#0d0f14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest">Certificate</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XIcon size={18} /></button>
        </div>

        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-4xl">
            🏆
          </div>
          <h4 className="text-lg font-bold text-white mb-2">{batch.name}</h4>
          <p className="text-xs text-slate-500 mb-6">{done}/{total} completed</p>

          {isComplete ? (
            existingCert && !printReady ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-500 text-[11px] font-bold">Certificate Ready</p>
                  <p className="text-[10px] text-slate-500 mt-1">Issued on {new Date(existingCert.issuedAt).toLocaleDateString()}</p>
                </div>
                <button onClick={openPrintWindow} className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/20">View & Print Certificate</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-500 text-[11px] font-bold">{printReady ? 'Certificate Generated!' : 'All lectures completed'}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{printReady ? 'Your certificate is ready to view and print.' : 'Generate your official certificate below.'}</p>
                </div>
                {generating ? (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="size-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-[10px] text-slate-500 font-medium">Generating certificate...</span>
                  </div>
                ) : printReady ? (
                  <button onClick={openPrintWindow} className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/20">View & Print Certificate</button>
                ) : (
                  <button onClick={handleGenerate} className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/20">Generate Certificate</button>
                )}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/30 border border-white/5 rounded-xl">
                <p className="text-xs text-slate-400">Complete all lectures to unlock your official certificate.</p>
                <div className="mt-3 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-purple-500 transition-all" style={{ width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }} />
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-medium">{total - done} remaining</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateView;

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
    } catch (error) {
      console.error('Certificate generation error:', error);
      alert('Failed to generate certificate: ' + (error as Error).message);
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
            min-height:100vh; background:#f1f5f9; font-family:'Inter',sans-serif;
            -webkit-print-color-adjust:exact; print-color-adjust:exact;
          }
          .cert-wrapper {
            width:900px; padding:40px; position:relative;
          }
          .certificate {
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:12px; padding:60px 70px;
            position:relative; overflow:hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          }
          .certificate::before {
            content:''; position:absolute; inset:0;
            background:
              radial-gradient(circle at 100% 0%, rgba(212,175,55,0.06) 0%, transparent 40%),
              radial-gradient(circle at 0% 100%, rgba(212,175,55,0.06) 0%, transparent 40%);
            pointer-events:none;
          }
          .border-frame {
            position:absolute; inset:20px;
            border:2px solid #d4af37;
            border-radius:4px; pointer-events:none;
            opacity: 0.7;
          }
          .border-frame-inner {
            position:absolute; inset:26px;
            border:1px solid #d4af37;
            border-radius:2px; pointer-events:none;
            opacity: 0.3;
          }
          .corner {
            position:absolute; width:40px; height:40px; pointer-events:none;
          }
          .corner-tl { top:16px; left:16px; border-top:3px solid #d4af37; border-left:3px solid #d4af37; }
          .corner-tr { top:16px; right:16px; border-top:3px solid #d4af37; border-right:3px solid #d4af37; }
          .corner-bl { bottom:16px; left:16px; border-bottom:3px solid #d4af37; border-left:3px solid #d4af37; }
          .corner-br { bottom:16px; right:16px; border-bottom:3px solid #d4af37; border-right:3px solid #d4af37; }
          .watermark {
            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            font-size:140px; font-weight:900; color:rgba(0,0,0,0.02);
            letter-spacing:8px; white-space:nowrap; pointer-events:none;
            font-family: 'Inter', sans-serif;
          }
          .logo-area { text-align:center; margin-bottom:28px; position:relative; z-index:1; }
          .logo-area svg { width:56px; height:56px; display:inline-block; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
          .logo-text { font-size:20px; font-weight:900; color:#0f172a; letter-spacing:6px; text-transform:uppercase; margin-top:6px; }
          .logo-text span { color:#da0b0b; }
          .divider {
            width:180px; height:2px;
            background:linear-gradient(90deg,transparent,#d4af37,transparent);
            margin:12px auto 20px;
          }
          h1 {
            font-family:'Playfair Display',serif;
            font-size:48px; font-weight:900;
            color:#0f172a;
            text-align:center; letter-spacing:4px; margin-bottom:4px;
            position:relative; z-index:1;
          }
          .subtitle {
            text-align:center; font-size:14px; font-weight:600;
            color:#64748b; letter-spacing:10px; text-transform:uppercase;
            position:relative; z-index:1; margin-bottom:32px;
          }
          .presented {
            text-align:center; font-size:16px; color:#475569; font-weight:400;
            position:relative; z-index:1; margin-bottom:12px;
            font-family:'Cormorant Garamond',serif; font-style:italic;
          }
          .recipient-name {
            text-align:center; font-family:'Playfair Display',serif;
            font-size:44px; font-weight:700; color:#1e293b;
            position:relative; z-index:1; margin-bottom:8px;
          }
          .recipient-underline {
            width:400px; height:1px;
            background:linear-gradient(90deg,transparent,#94a3b8,transparent);
            margin:0 auto 20px;
          }
          .for-text {
            text-align:center; font-size:16px; color:#475569; font-weight:400;
            position:relative; z-index:1; margin-bottom:12px;
            font-family:'Cormorant Garamond',serif; font-style:italic;
          }
          .course-name {
            text-align:center; font-size:26px; font-weight:800; color:#0f172a;
            position:relative; z-index:1; margin-bottom:8px;
            letter-spacing:0.5px;
          }
          .course-label {
            text-align:center; font-size:12px; font-weight:700; color:#64748b;
            text-transform:uppercase; letter-spacing:4px; position:relative; z-index:1; margin-bottom:32px;
          }
          .divider2 {
            width:120px; height:2px;
            background:linear-gradient(90deg,transparent,#d4af37,transparent);
            margin:0 auto 28px;
          }
          .details {
            display:flex; justify-content:center; gap:64px;
            position:relative; z-index:1; margin-bottom:32px;
          }
          .detail-item { text-align:center; }
          .detail-label { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px; }
          .detail-value { font-size:14px; font-weight:600; color:#334155; }
          .seal {
            width:80px; height:80px; margin:0 auto 24px;
            border:2px dashed #d4af37;
            border-radius:50%; display:flex; align-items:center; justify-content:center;
            position:relative; z-index:1;
            background:#fffaf0;
            box-shadow: 0 4px 6px rgba(212,175,55,0.1);
          }
          .seal-inner {
            width:64px; height:64px; border-radius:50%;
            border:2px solid #d4af37;
            display:flex; align-items:center; justify-content:center;
            font-size:28px; color: #d4af37; font-weight: bold;
          }
          .signatures {
            display:flex; justify-content:center; gap:80px;
            position:relative; z-index:1; margin-bottom:24px;
          }
          .sig-item { text-align:center; min-width:180px; }
          .sig-line { width:160px; height:1px; background:#94a3b8; margin:0 auto 10px; }
          .sig-role { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:2px; }
          .sig-name { font-size:14px; color:#475569; font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:600; }
          .footer-line {
            width:100%; height:1px;
            background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
            margin:0 auto 16px;
          }
          .footer-text {
            text-align:center; font-size:11px; color:#64748b;
            letter-spacing:4px; text-transform:uppercase; font-weight:600;
            position:relative; z-index:1;
          }
          .footer-text span { color:#da0b0b; font-weight:800; }
          .cert-number {
            text-align:center; font-size:10px; color:#94a3b8;
            margin-top:8px; letter-spacing:2px; font-family:monospace;
          }
          @media print {
            body { background:#fff; }
            .cert-wrapper { padding:0; }
            .certificate { box-shadow:none; border-color:rgba(0,0,0,0.15); }
            .certificate::before { display:none; }
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

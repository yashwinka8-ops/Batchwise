import React, { useState, useEffect, useMemo } from 'react';
import { Subject, QuestionStatus, UserResponse, QuestionType, Question } from '../types';
import {
  Info,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  Search,
  Accessibility,
  X,
  ChevronLeft,
  ArrowDown
} from 'lucide-react';

interface QuizInterfaceProps {
  onSubmit: (responses: Record<string | number, UserResponse>) => void;
  questions: Question[];
}

// Question Status Palette Shape Component
interface StatusIconProps {
  status: QuestionStatus;
  number?: number;
  isCurrent?: boolean;
  onClick?: () => void;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, number, isCurrent, onClick }) => {
  let shapeClass = "";
  let colorClass = "";
  let textColor = "text-white";
  let content: React.ReactNode = number;

  switch (status) {
    case QuestionStatus.ANSWERED:
      shapeClass = "nta-answered";
      colorClass = "bg-[#2ca12c]";
      break;
    case QuestionStatus.NOT_ANSWERED:
      shapeClass = "nta-not-answered";
      colorClass = "bg-[#e45228]";
      break;
    case QuestionStatus.MARKED_FOR_REVIEW:
      shapeClass = "nta-marked";
      colorClass = "bg-[#5b2b91]";
      break;
    case QuestionStatus.ANSWERED_MARKED_FOR_REVIEW:
      shapeClass = "nta-marked-answered";
      colorClass = "bg-[#5b2b91]";
      content = (
        <div className="relative w-full h-full flex items-center justify-center">
          {number}
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#2ca12c] border-[0.5px] border-white rounded-full flex items-center justify-center">
            <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
          </div>
        </div>
      );
      break;
    default:
      shapeClass = "nta-not-visited";
      colorClass = "bg-[#eeeeee]";
      textColor = "text-black";
      break;
  }

  // Active question highlight in the palette according to screenshot
  const activeClass = isCurrent ? "ring-[1.5px] ring-blue-500 ring-offset-[1px] shadow-md z-10" : "";

  return (
    <button
      onClick={onClick}
      className={`w-9 h-8 flex items-center justify-center text-[10px] font-bold ${shapeClass} ${colorClass} ${textColor} transition-all relative group ${activeClass}`}
    >
      {content}
    </button>
  );
};

const QuizInterface: React.FC<QuizInterfaceProps> = ({ onSubmit, questions }) => {
  // State
  const [currentSubject, setCurrentSubject] = useState<Subject>(Subject.PHYSICS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string | number, UserResponse>>({});

  const [tempSelectedOption, setTempSelectedOption] = useState<number | null>(null);
  const [tempNumericAnswer, setTempNumericAnswer] = useState<string>('');

  const [timeLeft, setTimeLeft] = useState(180 * 60);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoModal, setInfoModal] = useState<{ type: 'TEST' | 'SECTION'; section?: string } | null>(null);
  const [isGuidelineCollapsed, setIsGuidelineCollapsed] = useState(false);

  // Derived State
  const questionsBySubject = useMemo(() => {
    return {
      [Subject.PHYSICS]: questions.filter(q => q.subject === Subject.PHYSICS),
      [Subject.CHEMISTRY]: questions.filter(q => q.subject === Subject.CHEMISTRY),
      [Subject.MATHEMATICS]: questions.filter(q => q.subject === Subject.MATHEMATICS),
    };
  }, [questions]);

  const currentQuestions = questionsBySubject[currentSubject] || [];
  const activeQuestion = currentQuestions[currentQuestionIndex];

  // Sync temp selection from responses when question changes
  useEffect(() => {
    if (!activeQuestion) return;
    const existing = responses[activeQuestion.id];
    if (existing) {
      setTempSelectedOption(existing.selectedOptionIndex);
      setTempNumericAnswer(existing.numericAnswer || '');
    } else {
      setTempSelectedOption(null);
      setTempNumericAnswer('');

      // Auto-mark as NOT_ANSWERED when visited for the first time
      setResponses(prev => ({
        ...prev,
        [activeQuestion.id]: {
          questionId: activeQuestion.id,
          selectedOptionIndex: null,
          numericAnswer: null,
          status: QuestionStatus.NOT_ANSWERED
        }
      }));
    }

    const timer = setTimeout(() => {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise().catch((err: any) => console.log('MathJax Error:', err));
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [activeQuestion?.id, currentSubject]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onSubmit(responses);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onSubmit, responses]);

  // Handlers
  const handleOptionSelect = (index: number) => setTempSelectedOption(index);
  const handleNumericChange = (val: string) => {
    if (/^[\d.]*$/.test(val)) setTempNumericAnswer(val);
  };

  const hasAnswer = () => {
    if (!activeQuestion) return false;
    if (activeQuestion.type === QuestionType.MCQ) return tempSelectedOption !== null;
    return tempNumericAnswer.trim() !== '';
  };

  const updateResponse = (status: QuestionStatus) => {
    if (!activeQuestion) return;
    setResponses(prev => ({
      ...prev,
      [activeQuestion.id]: {
        questionId: activeQuestion.id,
        selectedOptionIndex: activeQuestion.type === QuestionType.MCQ ? tempSelectedOption : null,
        numericAnswer: activeQuestion.type === QuestionType.NUMERICAL ? tempNumericAnswer : null,
        status: status
      }
    }));
  };

  const handleSaveNext = () => {
    const status = hasAnswer() ? QuestionStatus.ANSWERED : QuestionStatus.NOT_ANSWERED;
    updateResponse(status);
    moveToNext();
  };

  const handleClearResponse = () => {
    setTempSelectedOption(null);
    setTempNumericAnswer('');
    updateResponse(QuestionStatus.NOT_ANSWERED);
  };

  const handleMarkReviewNext = () => {
    const status = hasAnswer() ? QuestionStatus.ANSWERED_MARKED_FOR_REVIEW : QuestionStatus.MARKED_FOR_REVIEW;
    updateResponse(status);
    moveToNext();
  };

  const moveToNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Find next subject if available
      const subjects = Object.values(Subject);
      const currentIdx = subjects.indexOf(currentSubject);
      if (currentIdx < subjects.length - 1) {
        setCurrentSubject(subjects[currentIdx + 1]);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSectionStats = (sectionType: 'MCQ' | 'NUMERICAL') => {
    const sectionQuestions = questions.filter(q =>
      q.subject === currentSubject &&
      (sectionType === 'MCQ' ? q.type === QuestionType.MCQ : q.type === QuestionType.NUMERICAL)
    );
    const stats = {
      answered: 0,
      notAnswered: 0,
      notVisited: 0,
      marked: 0,
      ansMarked: 0,
      total: sectionQuestions.length
    };

    sectionQuestions.forEach(q => {
      const resp = responses[q.id];
      if (!resp) stats.notVisited++;
      else if (resp.status === QuestionStatus.ANSWERED) stats.answered++;
      else if (resp.status === QuestionStatus.NOT_ANSWERED) stats.notAnswered++;
      else if (resp.status === QuestionStatus.MARKED_FOR_REVIEW) stats.marked++;
      else if (resp.status === QuestionStatus.ANSWERED_MARKED_FOR_REVIEW) stats.ansMarked++;
    });

    stats.notVisited = stats.total - (stats.answered + stats.notAnswered + stats.marked + stats.ansMarked);
    return stats;
  };

  const getCount = (status: QuestionStatus) => {
    return (Object.values(responses) as UserResponse[]).filter(r => r.status === status).length;
  };

  const visitedCount = Object.keys(responses).length;
  const notVisitedCount = questions.length - visitedCount;

  if (!activeQuestion) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white font-sans text-sm select-none nta-watermark">
      {/* 1. Top Navbar (Black) */}
      <div className="bg-[#333333] text-white h-9 flex items-center justify-between px-3 text-[11px] shrink-0 border-b border-black">
        <div className="font-bold flex items-center gap-2">
          <span className="text-[#ffee00] font-black uppercase tracking-tight">QUIZRR FULL TEST QFT 6 WITH VIDEO SOLUTIONS</span>
        </div>
        <div className="flex items-center gap-5 text-[10px] font-bold">
          <button className="flex items-center gap-1 hover:text-[#ffee00] transition-colors">
            <div className="w-5 h-5 bg-[#2ca12c] rounded-full flex items-center justify-center"><Accessibility size={12} className="text-white" /></div> Accessibility
          </button>
          <button className="flex items-center gap-1 hover:text-[#ffee00] transition-colors">
            <div className="w-5 h-5 bg-[#e45228] rounded-full flex items-center justify-center"><Search size={12} className="text-white" /></div> Screen Magnifier
          </button>
          <button onClick={() => setShowInstructions(true)} className="flex items-center gap-1 hover:text-[#ffee00] transition-colors">
            <div className="w-5 h-5 bg-[#006cb7] rounded-full flex items-center justify-center"><Info size={12} className="text-white" /></div> Instructions
          </button>
          <button onClick={() => setShowQuestionPaper(true)} className="flex items-center gap-1 hover:text-[#ffee00] transition-colors">
            <div className="w-5 h-5 bg-[#2ca12c] rounded-full flex items-center justify-center"><FileText size={12} className="text-white" /></div> Question Paper
          </button>
        </div>
      </div>

      {/* 2. Test Name Bar (Blue) */}
      <div className="bg-[#006cb7] text-white h-10 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-[#ffffff20] px-4 py-1.5 rounded-t-lg border-b-2 border-white flex items-center gap-2">
            <span className="text-[12px] font-bold">Quizrr Full Test (...</span>
            <button onClick={() => setInfoModal({ type: 'TEST' })} className="w-5 h-5 bg-white text-[#006cb7] rounded-full flex items-center justify-center"><Info size={12} /></button>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-white/10 rounded"><ChevronRight size={16} /></div>
        </div>
      </div>

      {/* 3. Subject/Sections Tab Bar */}
      <div className="bg-white border-b border-gray-300 flex justify-between items-center px-3 h-10 shrink-0">
        <div className="flex items-center h-full gap-2">
          <span className="text-xs font-bold text-gray-500 mr-2">Sections</span>
          <div className="flex items-end h-full gap-0.5">
            {[
              { id: 'math-mcq', label: 'Mathematics Single Correct', subj: Subject.MATHEMATICS },
              { id: 'math-num', label: 'Mathematics Numerical', subj: Subject.MATHEMATICS },
              { id: 'phys-mcq', label: 'Physics Single Correct', subj: Subject.PHYSICS },
              { id: 'phys-num', label: 'Physics Numerical', subj: Subject.PHYSICS },
              { id: 'chem-mcq', label: 'Chemistry Single Correct', subj: Subject.CHEMISTRY },
              { id: 'chem-num', label: 'Chemistry Numerical', subj: Subject.CHEMISTRY },
            ].map((tab, i) => {
              const isActive = (tab.subj === currentSubject); // Simplified local mapping
              return (
                <button
                  key={tab.id}
                  onClick={() => { setCurrentSubject(tab.subj); setCurrentQuestionIndex(0); }}
                  className={`flex items-center gap-1.5 px-4 h-[85%] transition-all font-bold text-[10px] uppercase border border-gray-200 border-b-0 rounded-t-sm whitespace-nowrap ${isActive
                    ? 'bg-white text-[#006cb7] border-blue-200 border-t-2 border-t-blue-500'
                    : 'bg-[#f7f7f7] text-[#337ab7] hover:bg-gray-100'}`}
                >
                  {tab.label}
                  <div onClick={(e) => { e.stopPropagation(); setInfoModal({ type: 'SECTION', section: tab.label }); }} className="w-4 h-4 bg-[#006cb7] text-white rounded-full flex items-center justify-center hover:scale-110"><Info size={10} /></div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-gray-700 uppercase">Time Left : {formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Question Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
          {/* Question Type Header */}
          <div className="shrink-0 px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-800">Question Type: Single Correct</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-gray-800">
              <div className="flex items-center gap-1">Marks for correct answer: <span className="text-green-600">4</span> | Negative Marks: <span className="text-red-600">-1.0</span></div>
            </div>
          </div>

          <div className="shrink-0 px-4 py-3 bg-[#f0f0f0] border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-800">Question No. {currentQuestionIndex + 1}</span>
              <span className="text-[11px] text-gray-400 font-medium">#{activeQuestion.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-6 h-6 bg-[#006cb7] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"><ArrowDown size={14} /></button>
            </div>
          </div>

          {/* Collapsible Guideline Box */}
          <div className="shrink-0 px-4 mt-4">
            <div className="border border-gray-300 rounded overflow-hidden">
              <div
                onClick={() => setIsGuidelineCollapsed(!isGuidelineCollapsed)}
                className="bg-[#f8f9fa] px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100"
              >
                <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">{currentSubject} Single Correct (Maximum Marks: 80)</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isGuidelineCollapsed ? '-rotate-90' : ''}`} />
              </div>
              {!isGuidelineCollapsed && (
                <div className="bg-white p-4 text-[10.5px] text-gray-700 space-y-2 border-t border-gray-200">
                  <ul className="list-disc ml-4 space-y-1 font-medium">
                    <li>This section contains <span className="font-bold uppercase tracking-tight">TWENTY (20)</span> questions.</li>
                    <li>Each question has <span className="font-bold uppercase tracking-tight">FOUR</span> options (A), (B), (C) and (D). <span className="font-bold uppercase tracking-tight">ONLY ONE</span> of these four options is the correct answer.</li>
                    <li>For each question, choose the option corresponding to the correct answer.</li>
                    <li>Answer to each question will be evaluated according to the following marking scheme:</li>
                    <div className="ml-4 space-y-0.5 mt-2">
                      <div><span className="italic">Full Marks</span> : <span className="font-bold text-green-600">+4</span> If <span className="font-bold uppercase tracking-tight">ONLY</span> the correct option is chosen</div>
                      <div><span className="italic">Zero Marks</span> : <span className="font-bold text-gray-800">0</span> If none of the options is chosen (i.e. the question is unanswered)</div>
                      <div><span className="italic">Negative Marks</span> : <span className="font-bold text-red-600">-1</span> In all other cases.</div>
                    </div>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 nta-scroll bg-white">
            <div className="max-w-4xl">

              {activeQuestion.text && (
                <div className="text-[17px] font-medium leading-relaxed MathJax text-gray-800 mb-10 selection:bg-blue-100 selection:text-blue-900">
                  {activeQuestion.text}
                </div>
              )}

              {activeQuestion.imageUrl && (
                <div className="my-8 flex justify-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <img src={activeQuestion.imageUrl} alt="Question Graphic" className="max-w-full max-h-[400px] object-contain shadow-sm rounded-lg" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="space-y-4">
                {activeQuestion.type === QuestionType.MCQ && activeQuestion.options ? (
                  <div className="flex flex-col gap-5 mt-6">
                    {activeQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div
                          onClick={() => handleOptionSelect(idx)}
                          className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center cursor-pointer hover:border-[#337ab7]"
                        >
                          {tempSelectedOption === idx && <div className="w-2 h-2 bg-gray-700 rounded-full"></div>}
                        </div>
                        <span className="text-[14px] font-medium text-gray-800 MathJax flex items-center gap-2">
                          <span className="text-gray-400">({idx + 1})</span>
                          {opt && (opt.startsWith('http') || opt.startsWith('/')) ? (
                            <img src={opt} alt={`Option ${idx + 1}`} className="max-h-12 object-contain bg-white rounded border border-gray-100 p-1" referrerPolicy="no-referrer" />
                          ) : (
                            opt
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Numerical Type Answer</span>
                    <input
                      type="text"
                      value={tempNumericAnswer}
                      onChange={(e) => handleNumericChange(e.target.value)}
                      className="w-full max-w-sm border-2 border-gray-300 focus:border-[#337ab7] outline-none px-6 py-4 rounded-xl text-3xl font-black text-center tracking-widest text-[#337ab7] bg-white shadow-sm"
                      placeholder="00.00"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="h-14 border-t border-gray-200 flex justify-between items-center px-6 bg-white shrink-0">
            <div className="flex gap-2">
              <button
                onClick={handleMarkReviewNext}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm text-[11px] font-medium shadow-sm transition-all"
              >
                Mark for Review & Next
              </button>
              <button
                onClick={handleClearResponse}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm text-[11px] font-medium shadow-sm transition-all"
              >
                Clear Response
              </button>
            </div>
            <button
              onClick={handleSaveNext}
              className="bg-[#006cb7] hover:bg-[#005a99] text-white px-8 py-2.5 rounded-sm text-[11px] font-bold shadow-md transition-all flex items-center gap-2"
            >
              Save & Next
            </button>
          </div>
        </div>

        {/* Right Sidebar: Profile & Palette */}
        <div className={`w-[290px] bg-[#f8f9fa] flex flex-col shrink-0 relative border-l border-gray-300 transition-transform duration-300 ${sidebarCollapsed ? 'translate-x-[290px]' : ''}`}>
          {/* Collapse Toggle */}
          <div
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-[40%] -left-4 w-4 h-10 bg-[#333333] text-white flex items-center justify-center cursor-pointer rounded-l-sm shadow-sm border border-white/10"
          >
            {sidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </div>

          {/* User Profile Info */}
          <div className="p-3 flex items-start gap-3 bg-white border-b border-gray-100">
            <div className="w-16 h-20 bg-white border border-gray-200 rounded p-0.5 shadow-sm shrink-0">
              <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=yashwin" alt="User" className="w-full h-full object-cover grayscale opacity-80" />
              </div>
            </div>
            <div className="flex flex-col pt-0.5">
              <span className="text-[14px] font-bold text-[#006cb7] tracking-tight mb-0.5">Yashwin</span>
            </div>
          </div>

          {/* Stats Summary Legend */}
          <div className="p-3 grid grid-cols-2 gap-x-1 gap-y-3 bg-[#f8f9fa] border-b border-gray-200">
            <div className="flex items-center gap-1.5 leading-none">
              <StatusIcon status={QuestionStatus.ANSWERED} />
              <div className="text-[10px] font-medium text-gray-700 flex flex-col">
                <span className="text-sm font-bold">{getCount(QuestionStatus.ANSWERED)}</span>
                <span>Answered</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <StatusIcon status={QuestionStatus.NOT_ANSWERED} />
              <div className="text-[10px] font-medium text-gray-700 flex flex-col">
                <span className="text-sm font-bold">{getCount(QuestionStatus.NOT_ANSWERED)}</span>
                <span>Not Answered</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <StatusIcon status={QuestionStatus.NOT_VISITED} />
              <div className="text-[10px] font-medium text-gray-700 flex flex-col">
                <span className="text-sm font-bold">{notVisitedCount}</span>
                <span>Not Visited</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <StatusIcon status={QuestionStatus.MARKED_FOR_REVIEW} />
              <div className="text-[10px] font-medium text-gray-700 flex flex-col">
                <span className="text-sm font-bold">{getCount(QuestionStatus.MARKED_FOR_REVIEW)}</span>
                <span>Marked for review</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 leading-none">
              <StatusIcon status={QuestionStatus.ANSWERED_MARKED_FOR_REVIEW} />
              <div className="text-[10px] font-medium text-gray-700 flex flex-col">
                <span className="text-sm font-bold">{getCount(QuestionStatus.ANSWERED_MARKED_FOR_REVIEW)}</span>
                <span>Answered and Marked for Review (will also be evaluated)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#007cc2] text-white p-1.5 font-bold text-[10px] uppercase tracking-tight">
            {currentSubject} Single Correct
          </div>

          {/* Choose a Question label */}
          <div className="px-3 py-1.5 text-[10.5px] font-bold text-gray-700 italic border-b border-gray-200 bg-white">
            Choose a Question
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-white/50 nta-scroll">
            <div className="grid grid-cols-4 gap-x-2 gap-y-3">
              {currentQuestions.map((q, idx) => (
                <StatusIcon
                  key={q.id}
                  status={responses[q.id]?.status || QuestionStatus.NOT_VISITED}
                  number={idx + 1}
                  isCurrent={idx === currentQuestionIndex}
                  onClick={() => setCurrentQuestionIndex(idx)}
                />
              ))}
            </div>
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to submit the test?')) {
                  onSubmit(responses);
                }
              }}
              className="w-full bg-[#007cc2] hover:bg-[#005a99] text-white py-2.5 font-bold text-[11px] uppercase tracking-widest rounded-sm shadow transition-all"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Info Modals for Subject/Test details */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-96 rounded shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#006cb7] text-white p-3 flex justify-between items-center text-xs font-bold uppercase">
              <span>{infoModal.type === 'TEST' ? 'Total Test Summary' : infoModal.section}</span>
              <button onClick={() => setInfoModal(null)} className="hover:text-red-200"><X size={16} /></button>
            </div>
            <div className="bg-[#white] p-6 space-y-4">
              {/* Summary Table Logic */}
              <div className="space-y-3">
                {[
                  { label: 'Answered', status: QuestionStatus.ANSWERED, color: '#2ca12c' },
                  { label: 'Not Answered', status: QuestionStatus.NOT_ANSWERED, color: '#e45228' },
                  { label: 'Not Visited', status: QuestionStatus.NOT_VISITED, color: '#eeeeee' },
                  { label: 'Marked Review', status: QuestionStatus.MARKED_FOR_REVIEW, color: '#5b2b91' },
                  { label: 'Ans & Marked', status: QuestionStatus.ANSWERED_MARKED_FOR_REVIEW, color: '#5b2b91' },
                ].map(stat => {
                  let count = 0;
                  if (infoModal.type === 'TEST') {
                    count = (stat.status === QuestionStatus.NOT_VISITED ? notVisitedCount : (Object.values(responses) as UserResponse[]).filter(r => r.status === stat.status).length);
                  } else {
                    const sectionType = infoModal.section?.includes('Numerical') ? 'NUMERICAL' : 'MCQ';
                    const sStats = getSectionStats(sectionType);
                    if (stat.status === QuestionStatus.ANSWERED) count = sStats.answered;
                    else if (stat.status === QuestionStatus.NOT_ANSWERED) count = sStats.notAnswered;
                    else if (stat.status === QuestionStatus.NOT_VISITED) count = sStats.notVisited;
                    else if (stat.status === QuestionStatus.MARKED_FOR_REVIEW) count = sStats.marked;
                    else if (stat.status === QuestionStatus.ANSWERED_MARKED_FOR_REVIEW) count = sStats.ansMarked;
                  }

                  return (
                    <div key={stat.label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{stat.label} :</span>
                      <span className="text-[13px] font-black text-gray-900 pr-2">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-3 bg-gray-50 flex justify-end">
              <button onClick={() => setInfoModal(null)} className="bg-[#006cb7] text-white px-6 py-1.5 rounded text-[10px] font-bold uppercase">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Modals for Instructions and Paper */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded-lg shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-[#333333] text-white p-4 flex justify-between items-center font-black text-xs uppercase tracking-widest">
              <span>General Instructions</span>
              <button onClick={() => setShowInstructions(false)} className="hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 text-gray-700 text-sm leading-relaxed nta-scroll">
              <h3 className="font-bold text-xl mb-6 text-gray-900 border-b pb-4">Please read the instructions carefully :</h3>
              <div className="space-y-6">
                <section>
                  <h4 className="font-bold text-gray-800 mb-2">General Instructions:</h4>
                  <p>1. Total duration of examination is 180 minutes.</p>
                  <p>2. The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</p>
                </section>
                <section>
                  <h4 className="font-bold text-gray-800 mb-2">Navigating to a Question:</h4>
                  <p>To answer a question, do the following:</p>
                  <ul className="list-disc ml-5 space-y-2 mt-2">
                    <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly.</li>
                    <li>Click on <b>Save & Next</b> to save your answer for the current question and then go to the next question.</li>
                    <li>Click on <b>Mark for Review & Next</b> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                  </ul>
                </section>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowInstructions(false)} className="bg-[#337ab7] text-white px-10 py-2 rounded font-black text-xs uppercase tracking-widest shadow-md">I understand</button>
            </div>
          </div>
        </div>
      )}

      {showQuestionPaper && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[90vh] flex flex-col rounded-lg shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-[#333333] text-white p-4 flex justify-between items-center font-black text-xs uppercase tracking-widest">
              <span>Question Paper Preview</span>
              <button onClick={() => setShowQuestionPaper(false)} className="hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 nta-scroll space-y-12">
              {questions.map((q, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-12 last:border-0">
                  <div className="flex gap-4 mb-6">
                    <span className="font-black text-[#337ab7] text-xl">Q{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="text-lg MathJax font-medium text-gray-800 leading-relaxed">{q.text}</div>
                      {q.imageUrl && (
                        <div className="mt-4 mb-4 bg-gray-50 border border-gray-100 p-3 rounded flex justify-center text-center">
                          <img
                            src={q.imageUrl}
                            alt="Graphic"
                            className="max-h-[250px] object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-4 ml-10">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded">
                          <span className="font-bold mr-2">({String.fromCharCode(65 + oIdx)})</span>
                          <span className="MathJax">
                            {opt && (opt.startsWith('http') || opt.startsWith('/')) ? (
                              <img src={opt} alt={`Opt ${oIdx + 1}`} className="max-h-8 object-contain bg-white rounded p-0.5" referrerPolicy="no-referrer" />
                            ) : (
                              opt
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nta-answered { clip-path: polygon(0% 25%, 50% 0%, 100% 25%, 100% 100%, 0% 100%); }
        .nta-not-answered { clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%); }
        .nta-marked { border-radius: 9999px; }
        .nta-marked-answered { border-radius: 9999px; }
        .nta-not-visited { border-radius: 4px; }
        .nta-scroll::-webkit-scrollbar { width: 4px; }
        .nta-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .nta-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .nta-watermark { 
            position: relative; 
        }
        .nta-watermark::after {
            content: "yashwinka8@gmail.com";
            position: fixed;
            top: 0;
            left: 0;
            width: 500%;
            height: 500%;
            pointer-events: none;
            z-index: 1000;
            opacity: 0.05;
            font-size: 14px;
            font-weight: 500;
            color: #000;
            transform: rotate(-35deg) translate(-20%, -20%);
            display: grid;
            grid-template-columns: repeat(20, 1fr);
            gap: 150px;
            white-space: nowrap;
        }
        mjx-container { 
            font-size: 1.1em !important; 
            margin: 0.5em 0 !important; 
            max-width: 100% !important; 
            overflow-x: auto !important; 
            overflow-y: hidden !important; 
        }
        .MathJax { font-family: inherit !important; }
      `}</style>
    </div>
  );
};

export default QuizInterface;
import React, { useState, useEffect } from 'react';
import { ViewMode, MockTest, MockQuestion, MockQuestionType, QuestionSubject } from '../types';
import {
    ChevronLeftIcon,
    PlusIcon,
    TrashIcon,
    EditIcon,
    SaveIcon,
    EyeIcon,
    CloudIcon,
    SparklesIcon,
    BookOpenIcon,
    StarIcon,
    CheckIcon,
    XIcon
} from './Icons';
import { mockTestService } from '../services/mockTestService';
import { firestore } from '../services/firebase';

const MockTestAdmin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [tests, setTests] = useState<MockTest[]>([]);
    const [activeTest, setActiveTest] = useState<MockTest | null>(null);
    const [questions, setQuestions] = useState<MockQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showTestForm, setShowTestForm] = useState(false);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<MockQuestion> | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

    // Live form state for real-time preview
    const [formState, setFormState] = useState<Partial<MockQuestion>>({});

    useEffect(() => {
        loadTests();
    }, []);

    useEffect(() => {
        if (activeTest) {
            loadQuestions(activeTest.id);
        }
    }, [activeTest]);

    useEffect(() => {
        if (showQuestionForm && currentQuestion) {
            setFormState(currentQuestion);
        } else if (showQuestionForm) {
            setFormState({
                type: MockQuestionType.MCQ,
                subject: QuestionSubject.PHYSICS,
                text: '',
                options: ['', '', '', ''],
                correctOptionIndex: 0,
                difficulty: 'Advanced',
                isTopPYQ: false
            });
        }
    }, [showQuestionForm, currentQuestion]);

    // Trigger MathJax typesetting
    useEffect(() => {
        const timer = setTimeout(() => {
            if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
                (window as any).MathJax.typesetPromise().catch((err: any) => console.error('MathJax error:', err));
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [questions, currentQuestion, isPreviewMode, formState, showQuestionForm, selectedQuestionId]);

    // Handle Image Paste
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (!showQuestionForm || !activeTest) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        e.preventDefault(); // Prevent double pasting if cursor is in an input
                        // Optimistic feedback could go here
                        try {
                            const url = await mockTestService.uploadImage(activeTest.id, blob);
                            setFormState(prev => ({ ...prev, imageUrl: url }));
                        } catch (err) {
                            console.error('Paste upload failed', err);
                            alert('Failed to upload pasted image');
                        }
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [showQuestionForm, activeTest]);

    const loadTests = async () => {
        setLoading(true);
        try {
            const data = await mockTestService.getAllTests();
            setTests(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const loadQuestions = async (testId: string) => {
        try {
            const data = await mockTestService.getQuestionsByTestId(testId);
            setQuestions(data);
            if (data.length > 0 && !selectedQuestionId) {
                setSelectedQuestionId(data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveTest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const htmlFile = (e.currentTarget.elements.namedItem('htmlFile') as HTMLInputElement)?.files?.[0];

        let externalHtmlUrl = activeTest?.externalHtmlUrl;

        if (htmlFile) {
            try {
                // We need a temporary ID if it's a new test
                const tempId = activeTest?.id || firestore.collection('mock_tests').doc().id;
                externalHtmlUrl = await mockTestService.uploadHtmlFile(tempId, htmlFile);
                formData.set('id', tempId); // Ensure we use the same ID
            } catch (err) {
                console.error('HTML upload failed', err);
                alert('Failed to upload HTML file');
                setLoading(false);
                return;
            }
        }

        const testData: Partial<MockTest> = {
            id: activeTest?.id || formData.get('id') as string,
            title: formData.get('title') as string,
            category: formData.get('category') as 'pyq' | 'mocks',
            date: formData.get('date') as string,
            duration: parseInt(formData.get('duration') as string),
            level: formData.get('level') as string,
            isSample: (formData.get('isSample') === 'on'),
            published: (formData.get('published') === 'on'),
            isExternalHtml: (formData.get('isExternalHtml') === 'on'),
            externalHtmlUrl: externalHtmlUrl
        };

        await mockTestService.saveTest(testData);
        setLoading(false);
        setShowTestForm(false);
        loadTests();
    };

    const handleSaveQuestion = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!activeTest) return;

        await mockTestService.saveQuestion(activeTest.id, formState);
        setShowQuestionForm(false);
        setCurrentQuestion(null);
        setFormState({});
        loadQuestions(activeTest.id);
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeTest) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r?\n/);
            if (lines.length < 2) return;

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const parseCSVLine = (line: string) => {
                const result = [];
                let cur = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        if (inQuotes && line[i + 1] === '"') {
                            cur += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        result.push(cur.trim());
                        cur = '';
                    } else {
                        cur += char;
                    }
                }
                result.push(cur.trim());
                return result;
            };

            setLoading(true);
            try {
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const values = parseCSVLine(lines[i]);
                    const row: any = {};
                    headers.forEach((h, idx) => {
                        row[h] = values[idx];
                    });

                    const question: Partial<MockQuestion> = {
                        type: (row.type?.toUpperCase() === 'NUMERICAL') ? MockQuestionType.NUMERICAL : MockQuestionType.MCQ,
                        subject: (row.subject?.toLowerCase() === 'chemistry') ? QuestionSubject.CHEMISTRY :
                            (row.subject?.toLowerCase() === 'mathematics') ? QuestionSubject.MATHEMATICS : QuestionSubject.PHYSICS,
                        text: row.text || '',
                        options: [row.option1 || '', row.option2 || '', row.option3 || '', row.option4 || ''],
                        correctOptionIndex: parseInt(row.correctoptionindex) || 0,
                        correctNumericAnswer: row.correctnumericanswer || '',
                        solution: row.solution || '',
                        imageUrl: row.imageurl || '',
                        difficulty: (row.difficulty === 'Advanced' || row.difficulty === 'Mains' || row.difficulty === 'Foundation') ? row.difficulty : 'Mains',
                        isTopPYQ: row.istoppyq?.toLowerCase() === 'true',
                        order: questions.length + i
                    };

                    await mockTestService.saveQuestion(activeTest.id, question);
                }
                loadQuestions(activeTest.id);
                alert('Bulk upload complete!');
            } catch (err) {
                console.error(err);
                alert('Error parsing CSV. Please check the format.');
            }
            setLoading(false);
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const handleDeleteTest = async (id: string) => {
        if (confirm('Delete this test and all questions?')) {
            await mockTestService.deleteTest(id);
            loadTests();
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (activeTest && confirm('Delete this question?')) {
            await mockTestService.deleteQuestion(activeTest.id, id);
            loadQuestions(activeTest.id);
        }
    };

    const TestList = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-[var(--apple-card-bg)] backdrop-blur-xl px-8 py-6 rounded-[32px] border border-[var(--apple-border)] shadow-2xl">
                <div>
                    <h2 className="text-2xl font-black text-[var(--apple-text)] italic tracking-tighter">Mock Test <span className="text-[var(--primary)]">Command Center</span></h2>
                    <p className="text-[var(--apple-text-secondary)] text-[10px] font-black uppercase tracking-[0.4em] mt-2">Professional Examination Management Suite</p>
                </div>
                <button
                    onClick={() => { setActiveTest(null); setShowTestForm(true); }}
                    className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-[var(--primary)]/30 hover:-translate-y-1 active:translate-y-0"
                >
                    <PlusIcon /> Create Master Test
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map(test => (
                    <div key={test.id} className="bg-[var(--apple-card-bg)] backdrop-blur-xl rounded-[2rem] border border-[var(--apple-border)] p-6 border-b-4 border-b-transparent hover:border-b-[var(--primary)] hover:border-white/10 transition-all group flex flex-col shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${test.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                {test.published ? 'Active' : 'Draft'}
                            </span>
                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setActiveTest(test); setShowTestForm(true); }} className="p-2 bg-white/5 hover:bg-[var(--primary)] rounded-xl text-slate-400 hover:text-white transition-all"><EditIcon /></button>
                                <button onClick={() => handleDeleteTest(test.id)} className="p-2 bg-white/5 hover:bg-red-600 rounded-xl text-slate-400 hover:text-white transition-all"><TrashIcon /></button>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-white mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2">{test.title}</h3>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 flex flex-wrap items-center gap-y-2 gap-x-3">
                            <span className="flex items-center gap-1"><div className="w-1 h-1 bg-[var(--primary)] rounded-full"></div> {test.category}</span>
                            <span className="flex items-center gap-1"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> {test.duration}m</span>
                            <span className="flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500 rounded-full"></div> {test.questionsCount || 0} Qs</span>
                        </div>

                        <button
                            onClick={() => setActiveTest(test)}
                            className="mt-auto w-full py-4 bg-white/5 hover:bg-white text-slate-400 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"
                        >
                            Open Question Editor
                        </button>
                    </div>
                ))}
            </div>
            {tests.length === 0 && (
                <div className="py-20 text-center bg-[#161e2d] border border-white/5 rounded-[32px] shadow-2xl">
                    <CloudIcon className="w-12 h-12 text-white/5 mx-auto" />
                    <p className="text-slate-600 font-black uppercase tracking-widest text-[10px] mt-6">No tests available.</p>
                </div>
            )}
        </div>
    );

    const QuestionEditor = () => {
        const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

        return (
            <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
                {/* Compact Header */}
                <div className="bg-[var(--apple-card-bg)] backdrop-blur-xl px-8 py-4 rounded-[28px] border border-[var(--apple-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl shrink-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-slate-500 to-slate-800"></div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTest(null)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 border border-white/5"><ChevronLeftIcon /></button>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">{activeTest?.title}</h2>
                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Manage Chapter, Difficulty, and Priority.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <label className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl cursor-pointer">
                            <CloudIcon /> Bulk Import
                            <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
                        </label>
                        <button
                            onClick={() => { setCurrentQuestion(null); setShowQuestionForm(true); }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-500 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl"
                        >
                            <PlusIcon /> Add Question
                        </button>
                        <button
                            onClick={() => {
                                if ((window as any).MathJax?.typesetPromise) {
                                    (window as any).MathJax.typesetPromise();
                                }
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 text-slate-400 hover:bg-white/10 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/10"
                        >
                            <SparklesIcon className="w-3 h-3" /> Sync Math
                        </button>
                        <button
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${isPreviewMode ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                        >
                            <EyeIcon /> View Live
                        </button>
                    </div>
                </div>

                {!isPreviewMode ? (
                    <div className="flex-1 flex gap-6 overflow-hidden mt-6 pb-2">
                        {/* LEFT: QUESTION LIST TABLE */}
                        <div className="flex-[1.8] bg-[#161e2d] rounded-[28px] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 bg-[#0b0f1a] border border-white/5 rounded-xl px-3 py-2 flex-1">
                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest shrink-0 border-r border-white/10 pr-2">Filter Context:</span>
                                    <select className="bg-transparent text-white text-[9px] font-black uppercase tracking-widest outline-none w-full cursor-pointer appearance-none">
                                        <option>{activeTest?.title} - {questions.length} Qs</option>
                                    </select>
                                </div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-3 py-2 bg-purple-500/5 rounded-lg border border-purple-500/10 whitespace-nowrap">
                                    Default Category: <span className="text-purple-400">General</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-[80px_1fr_80px_60px_100px] gap-2 px-4 py-2 border-b border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/10">
                                <div>ID</div>
                                <div>Question Content</div>
                                <div className="text-center">Diff</div>
                                <div className="text-center">Top</div>
                                <div className="text-center">Status</div>
                            </div>

                            <div className="flex-1 overflow-y-auto nta-scroll p-2 space-y-1.5">
                                {questions.map((q, idx) => (
                                        <div
                                        key={q.id}
                                        onClick={() => setSelectedQuestionId(q.id)}
                                        className={`grid grid-cols-[80px_1fr_80px_60px_100px] gap-2 items-center px-4 py-2 rounded-xl border transition-all cursor-pointer group ${selectedQuestionId === q.id ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="text-[8px] font-bold text-slate-500 truncate bg-black/40 px-2 py-1 rounded-lg">q_{q.id.slice(-6)}</div>
                                        <div className="text-[11px] text-slate-300 truncate font-medium MathJax pr-4">{q.text}</div>
                                        <div className="flex justify-center">
                                            <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${q.difficulty === 'Advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : q.difficulty === 'Mains' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
                                                {q.difficulty || 'Mains'}
                                            </span>
                                        </div>
                                        <div className="flex justify-center">
                                            <StarIcon fill={q.isTopPYQ ? "currentColor" : "none"} className={`w-3 h-3 ${q.isTopPYQ ? 'text-[var(--primary)]' : 'text-slate-600'}`} />
                                        </div>
                                        <div className="flex justify-center gap-1.5">
                                            <button onClick={(e) => { e.stopPropagation(); setCurrentQuestion(q); setShowQuestionForm(true); }} className="p-1.5 bg-white/5 hover:bg-[var(--primary)] rounded-lg text-slate-500 hover:text-white transition-all opacity-40 group-hover:opacity-100"><EditIcon /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }} className="p-1.5 bg-white/5 hover:bg-red-600 rounded-lg text-slate-500 hover:text-white transition-all opacity-40 group-hover:opacity-100"><TrashIcon /></button>
                                            <div className="p-1.5 text-emerald-500/40"><CheckIcon /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: LIVE PREVIEW PANEL */}
                        <div className="flex-1 bg-[#161e2d] rounded-[28px] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-white/5 bg-black/20">
                                <h3 className="text-[9px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live Preview
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 nta-scroll">
                                {selectedQuestion ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">q_{selectedQuestion.id.slice(-6)}</span>
                                            <span className="text-[8px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">{selectedQuestion.difficulty || 'Advanced'}</span>
                                        </div>

                                        <div className="bg-black/30 rounded-[24px] border border-white/5 p-6 relative overflow-hidden group">
                                            <div className="mb-3">
                                                <span className="px-2 py-0.5 bg-purple-600/10 text-purple-400 text-[7px] font-black uppercase tracking-widest rounded-md border border-purple-500/20">
                                                    {selectedQuestion.subject} • {selectedQuestion.difficulty || 'Advanced'}
                                                </span>
                                            </div>

                                            {selectedQuestion.text && (
                                                <div className="text-base text-slate-200 font-medium leading-relaxed MathJax mb-6 border-l-2 border-purple-500/20 pl-4">
                                                    {selectedQuestion.text}
                                                </div>
                                            )}

                                            {selectedQuestion.imageUrl && (
                                                <div className="mb-6 rounded-xl overflow-hidden bg-white p-4 shadow-inner">
                                                    <img
                                                        src={selectedQuestion.imageUrl}
                                                        alt="Asset"
                                                        className="max-h-[150px] mx-auto object-contain"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                </div>
                                            )}

                                            {selectedQuestion.type === MockQuestionType.MCQ ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedQuestion.options?.map((opt, i) => (
                                                        <div key={i} className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedQuestion.correctOptionIndex === i ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]' : 'bg-black/40 border-white/5 text-slate-500'}`}>
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black shrink-0 ${selectedQuestion.correctOptionIndex === i ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'bg-white/5 text-slate-600'}`}>{String.fromCharCode(65 + i)}</div>
                                                            <div className="text-[10px] truncate MathJax">
                                                                {opt && (opt.startsWith('http') || opt.startsWith('/')) ? (
                                                                    <img src={opt} alt={`Opt ${i + 1}`} className="max-h-8 object-contain bg-white rounded" referrerPolicy="no-referrer" />
                                                                ) : (
                                                                    opt || '...'
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 flex flex-col items-center">
                                                    <span className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Answer Key</span>
                                                    <div className="text-2xl font-black text-emerald-400 tracking-tighter">{selectedQuestion.correctNumericAnswer || '--.---'}</div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedQuestion.solution && (
                                            <div className="bg-[#1a2133] border border-white/5 p-5 rounded-[24px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <SparklesIcon className="w-2.5 h-2.5 text-emerald-500" />
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Resolution Path</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 leading-relaxed font-medium MathJax italic">
                                                    {selectedQuestion.solution}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                                        <EyeIcon className="w-10 h-10 mb-3" />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Asset stream offline</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto nta-scroll mt-6 space-y-8 pb-32">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="bg-[#161e2d] px-8 py-10 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6">
                                        <span className="text-[40px] font-black text-white/5 italic">#{idx + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 px-2.5 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest">Question {idx + 1}</span>
                                        <span className="h-3 w-px bg-white/10 mx-1"></span>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{q.subject}</span>
                                    </div>
                                    {q.text && <div className="text-base text-white font-medium leading-relaxed mb-8 MathJax">{q.text}</div>}
                                    {q.imageUrl && (
                                        <div className="mb-8 rounded-2xl overflow-hidden bg-white p-6 border border-white/10">
                                            <img src={q.imageUrl} alt="Asset" className="max-h-[300px] mx-auto object-contain" />
                                        </div>
                                    )}

                                    {q.type === MockQuestionType.MCQ ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options?.map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-4 rounded-[18px] border transition-all flex items-start gap-4 ${q.correctOptionIndex === oIdx ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-black/30 border-white/5 text-slate-400'}`}>
                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${q.correctOptionIndex === oIdx ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-500'}`}>{String.fromCharCode(65 + oIdx)}</div>
                                                    <div className="text-sm pt-0.5 MathJax leading-relaxed">{opt}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500/10 p-6 rounded-[18px] border border-emerald-500/20 flex flex-col items-center">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2 opacity-50">Numerical Answer</p>
                                            <div className="text-emerald-400 font-black text-3xl tracking-tighter">{q.correctNumericAnswer}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--apple-bg)] p-4 md:p-10 font-sans selection:bg-[var(--primary)] selection:text-white">
            <div className="max-w-7xl mx-auto">
                {!activeTest ? <TestList /> : <QuestionEditor />}
            </div>

            {/* Modal: Test Form */}
            {showTestForm && (
                <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#161e2d] w-full max-w-2xl rounded-[40px] border border-white/10 p-10 shadow-2xl relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-[var(--primary)] rounded-[24px] flex items-center justify-center shadow-2xl rotate-12"><BookOpenIcon className="w-8 h-8 text-white" /></div>
                        <h3 className="text-2xl font-black mb-8 italic text-white text-center mt-4">Configure <span className="text-[var(--primary)]">Test Node</span></h3>
                        <form onSubmit={handleSaveTest} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Title</label>
                                    <input name="title" defaultValue={activeTest?.title} required className="w-full bg-black/60 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-[var(--primary)] transition-all font-bold text-base text-white placeholder:text-slate-700" placeholder="e.g. ADVANCED SKILL ASSESSMENT 01" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                    <select name="category" defaultValue={activeTest?.category} className="w-full bg-black/60 border border-white/5 rounded-xl px-5 py-4 outline-none focus:border-[var(--primary)] transition-all font-black text-[10px] uppercase text-white appearance-none">
                                        <option value="mocks">FULL MOCK EXAM</option>
                                        <option value="pyq">OFFICIAL PYQ ARCHIVE</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tag</label>
                                    <input name="date" defaultValue={activeTest?.date || 'Live'} className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-[var(--primary)] transition-all font-black text-[10px] uppercase text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration (Min)</label>
                                    <input name="duration" type="number" defaultValue={activeTest?.duration || 180} required className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-[var(--primary)] transition-all font-black text-base text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Level</label>
                                    <input name="level" defaultValue={activeTest?.level || 'Advanced'} className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-[var(--primary)] transition-all font-black text-[10px] uppercase text-white" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 py-4 bg-black/20 rounded-2xl border border-white/5 px-8">
                                <div className="flex justify-center gap-8">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="published" defaultChecked={activeTest?.published} className="w-4 h-4 accent-emerald-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-500">Live</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="isSample" defaultChecked={activeTest?.isSample} className="w-4 h-4 accent-[var(--primary)]" />
                                        <span className="text-[9px] font-black uppercase text-slate-500">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="isExternalHtml" defaultChecked={activeTest?.isExternalHtml} className="w-4 h-4 accent-slate-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-500">HTML Mode</span>
                                    </label>
                                </div>

                                <div className="space-y-2 border-t border-white/5 pt-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">HTML Test Asset (Optional)</label>
                                    <input type="file" name="htmlFile" accept=".html" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-slate-400 outline-none focus:border-[var(--primary)] transition-all" />
                                    {activeTest?.externalHtmlUrl && (
                                        <p className="text-[8px] text-[var(--primary)] truncate bg-[var(--primary)]/5 px-3 py-1.5 rounded-lg border border-[var(--primary)]/10 mt-2">Active Path: {activeTest.externalHtmlUrl}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowTestForm(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/10">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 py-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl disabled:opacity-50">
                                    {loading ? 'Saving Module...' : 'Commit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FULL SCREEN Question Form with LIVE PREVIEW ON RIGHT */}
            {showQuestionForm && (
                <div className="fixed inset-0 z-[2000] bg-[#0b0f1a] flex flex-col animate-in fade-in duration-300">
                    <div className="h-14 bg-[#161e2d] border-b border-white/5 flex justify-between items-center px-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                            <h3 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{currentQuestion ? 'Refine' : 'Architect'} <span className="text-purple-500">Node Asset</span></h3>
                        </div>
                        <button onClick={() => { setShowQuestionForm(false); setCurrentQuestion(null); setFormState({}); }} className="p-2 hover:bg-red-600/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"><XIcon size={16} /></button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* LEFT: FORM INPUTS */}
                        <div className="w-full md:w-[400px] bg-[#161e2d] border-r border-white/5 overflow-y-auto p-6 space-y-6 nta-scroll z-10">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Asset Category</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setFormState({ ...formState, type: MockQuestionType.MCQ })} className={`py-3 rounded-xl text-[9px] font-black border transition-all ${formState.type === MockQuestionType.MCQ ? 'bg-purple-600 text-white border-purple-500' : 'bg-black/40 text-slate-500 border-white/5'}`}>MCQ</button>
                                        <button onClick={() => setFormState({ ...formState, type: MockQuestionType.NUMERICAL })} className={`py-3 rounded-xl text-[9px] font-black border transition-all ${formState.type === MockQuestionType.NUMERICAL ? 'bg-purple-600 text-white border-purple-500' : 'bg-black/40 text-slate-500 border-white/5'}`}>NUMERICAL</button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Domain</label>
                                    <select
                                        value={formState.subject}
                                        onChange={(e) => setFormState({ ...formState, subject: e.target.value as QuestionSubject })}
                                        className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white font-black text-[9px] uppercase appearance-none cursor-pointer"
                                    >
                                        <option value={QuestionSubject.PHYSICS}>PHYSICS</option>
                                        <option value={QuestionSubject.CHEMISTRY}>CHEMISTRY</option>
                                        <option value={QuestionSubject.MATHEMATICS}>MATHEMATICS</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Difficulty</label>
                                        <select
                                            value={formState.difficulty || 'Advanced'}
                                            onChange={(e) => setFormState({ ...formState, difficulty: e.target.value as any })}
                                            className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-white font-black text-[9px] uppercase appearance-none cursor-pointer"
                                        >
                                            <option value="Mains">Mains</option>
                                            <option value="Advanced">Advanced</option>
                                            <option value="Foundation">Foundation</option>
                                        </select>
                                    </div>
                                    <div className="pt-5">
                                        <button
                                            onClick={() => setFormState({ ...formState, isTopPYQ: !formState.isTopPYQ })}
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${formState.isTopPYQ ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]' : 'bg-black/60 border-white/5 text-slate-500'}`}
                                        >
                                            <StarIcon fill={formState.isTopPYQ ? "currentColor" : "none"} className="w-3 h-3" /> Top PYQ
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Question Payload</label>
                                    {/* Question Text */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Question Content (Supports LaTeX)</label>
                                            <div className="bg-[var(--primary)]/10 px-2 py-1 rounded-md border border-[var(--primary)]/20 text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">Wrap formulas in $...$</div>
                                        </div>
                                        <textarea
                                            value={formState.text || ''}
                                            onChange={(e) => setFormState({ ...formState, text: e.target.value })}
                                            onBlur={() => setTimeout(() => (window as any).MathJax?.typesetPromise?.(), 100)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-white placeholder:text-slate-700 focus:border-[var(--primary)]/50 outline-none transition-all min-h-[140px] nta-scroll resize-none"
                                            placeholder="Enter question text... (Leave blank if text is in image)"
                                        />

                                        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-2">Math Shortcuts:</span>
                                            {[
                                                { label: 'Root', code: '$\\sqrt{x}$' },
                                                { label: 'Sq', code: '$x^2$' },
                                                { label: 'Div', code: '$\\frac{a}{b}$' },
                                                { label: 'Int', code: '$\\int x dx$' },
                                                { label: 'Sum', code: '$\\sum x$' },
                                                { label: 'Vec', code: '$\\vec{x}$' },
                                                { label: '[]', code: '$(x)$' },
                                                { label: 'Inf', code: '$\\infty$' },
                                                { label: 'Th', code: '$\\theta$' },
                                                { label: 'Pi', code: '$\\pi$' },
                                                { label: 'Lim', code: '$\\lim$' }
                                            ].map(item => (
                                                <button
                                                    key={item.label}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFormState({ ...formState, text: (formState.text || '') + ' ' + item.code });
                                                    }}
                                                    className="px-2 py-1 bg-black/40 hover:bg-black/60 text-[9px] text-slate-400 font-bold border border-white/10 rounded-md transition-all active:scale-95"
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Image Asset</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={formState.imageUrl || ''}
                                            onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                                            placeholder="Paste URL or Image (Ctrl+V)..."
                                            className="flex-1 bg-black/60 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-[10px] font-medium text-slate-400"
                                        />
                                        <label className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all flex items-center gap-2 hover:border-[var(--primary)]/30">
                                            <CloudIcon className="w-4 h-4 text-[var(--primary)]" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file || !activeTest) return;

                                                    try {
                                                        const url = await mockTestService.uploadImage(activeTest.id, file);
                                                        setFormState(prev => ({ ...prev, imageUrl: url }));
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Upload failed');
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Upload</span>
                                        </label>
                                    </div>
                                    <div className="text-[7px] font-bold text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <SparklesIcon className="w-2 h-2 text-emerald-500" />
                                        Tip: You can paste screenshots (Ctrl+V) directly into this form!
                                    </div>
                                </div>

                                {formState.type === MockQuestionType.MCQ && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Options Matrix</label>
                                            <button type="button" onClick={() => setFormState({ ...formState, options: ['', '', '', ''] })} className="text-[8px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors uppercase tracking-wider">Clear Text</button>
                                        </div>
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className="relative group">
                                                    <input
                                                        value={formState.options?.[i] || ''}
                                                        onChange={(e) => {
                                                            const newOpts = [...(formState.options || ['', '', '', ''])];
                                                            newOpts[i] = e.target.value;
                                                            setFormState({ ...formState, options: newOpts });
                                                        }}
                                                        placeholder="Text (Optional if in image)..."
                                                        className={`w-full bg-black/60 border rounded-xl pl-10 pr-10 py-3 outline-none transition-all font-medium text-[10px] ${formState.correctOptionIndex === i ? 'border-emerald-500/50' : 'border-white/5 focus:border-[var(--primary)]'} text-slate-400`}
                                                    />
                                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black ${formState.correctOptionIndex === i ? 'text-emerald-500' : 'text-slate-600'}`}>{String.fromCharCode(65 + i)}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormState({ ...formState, correctOptionIndex: i })}
                                                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${formState.correctOptionIndex === i ? 'bg-emerald-500 border-emerald-500' : 'border-white/10 bg-black/40'}`}
                                                    >
                                                        {formState.correctOptionIndex === i && <div className="w-1 h-1 bg-black rounded-full"></div>}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formState.type === MockQuestionType.NUMERICAL && (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Numerical Key</label>
                                        <input
                                            value={formState.correctNumericAnswer || ''}
                                            onChange={(e) => setFormState({ ...formState, correctNumericAnswer: e.target.value })}
                                            required
                                            className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 text-2xl font-black text-emerald-400 tracking-tighter text-center"
                                            placeholder="00.00"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Solution / Logic</label>
                                    <textarea
                                        value={formState.solution || ''}
                                        onChange={(e) => setFormState({ ...formState, solution: e.target.value })}
                                        rows={3}
                                        className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-[var(--primary)] text-[10px] font-medium leading-relaxed text-slate-400 resize-none italic"
                                    />
                                </div>
                            </div>

                            <button onClick={() => handleSaveQuestion()} className="w-full py-4 bg-[var(--primary)] hover:bg-white text-white hover:text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 border border-white/10">
                                <SaveIcon /> Commit Asset
                            </button>
                        </div>

                        {/* RIGHT: LIVE PREVIEW */}
                        <div className="flex-1 bg-white overflow-y-auto p-12 nta-scroll selection:bg-purple-600 selection:text-white">
                            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center gap-3">
                                    <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-widest border border-[var(--primary)]/20">Live Rendering</span>
                                    <span className="h-4 w-px bg-gray-200"></span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{formState.subject} | {formState.type}</span>
                                </div>

                                <div className="text-2xl font-medium text-gray-900 leading-relaxed MathJax min-h-[80px] border-l-4 border-gray-100 pl-6">
                                    {formState.text || <span className="text-gray-200 italic">No Content...</span>}
                                </div>

                                {formState.imageUrl && (
                                    <div className="rounded-2xl overflow-hidden border border-gray-100 p-6 bg-gray-50 flex justify-center shadow-inner">
                                        <img src={formState.imageUrl} alt="Asset" className="max-h-[300px] object-contain rounded-lg" />
                                    </div>
                                )}

                                {formState.type === MockQuestionType.MCQ ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {(formState.options || []).map((opt, i) => (
                                            <div key={i} className={`p-5 rounded-[20px] border-2 transition-all flex items-start gap-4 ${formState.correctOptionIndex === i ? 'bg-[var(--primary)]/5 border-[var(--primary)]/40 ring-1 ring-[var(--primary)]/20' : 'bg-white border-gray-100'}`}>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${formState.correctOptionIndex === i ? 'bg-[var(--primary)] text-white' : 'bg-gray-50 text-gray-400'}`}>{String.fromCharCode(65 + i)}</div>
                                                <div className={`text-base font-medium pt-1.5 MathJax ${formState.correctOptionIndex === i ? 'text-[var(--primary)]' : 'text-gray-700'}`}>{opt || <span className="opacity-20">Empty...</span>}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/5 p-8 rounded-[32px] border-2 border-dashed border-emerald-500/30 flex flex-col items-center">
                                        <span className="text-[8px] font-black text-[#5cb85c] uppercase tracking-widest mb-3">Answer Key</span>
                                        <div className="text-6xl font-black text-[#449d44] tracking-tighter">{formState.correctNumericAnswer || '--'}</div>
                                    </div>
                                )}

                                {formState.solution && (
                                    <div className="mt-12 pt-10 border-t border-gray-50 bg-gray-50/30 p-8 rounded-[32px]">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-[#337ab7]/10 rounded-lg flex items-center justify-center"><SparklesIcon className="text-[#337ab7] w-4 h-4" /></div>
                                            <span className="text-[9px] font-black text-[#337ab7] uppercase tracking-widest">Solution Path</span>
                                        </div>
                                        <div className="text-lg text-gray-500 leading-relaxed MathJax italic">{formState.solution}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .nta-scroll::-webkit-scrollbar { width: 4px; }
                .nta-scroll::-webkit-scrollbar-track { background: transparent; }
                .nta-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .nta-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
                mjx-container { 
                    font-size: 1.15em !important; 
                    margin: 0.5em 0 !important; 
                    max-width: 100% !important; 
                    overflow-x: auto !important; 
                    overflow-y: hidden !important; 
                    outline: none !important;
                }
                .MathJax { font-family: inherit !important; }
            `}</style>
        </div>
    );
};

export default MockTestAdmin;

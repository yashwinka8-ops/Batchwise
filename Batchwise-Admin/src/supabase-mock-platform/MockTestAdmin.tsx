import React, { useState, useEffect } from 'react';
import { ViewMode, MockTest, MockQuestion, MockQuestionType, QuestionSubject } from './types';
import {
    ChevronLeftIcon,
    PlusIcon,
    TrashIcon,
    EditIcon,
    CloudIcon,
    SparklesIcon,
    BookOpenIcon,
    StarIcon,
    CheckIcon,
    XIcon,
    EyeIcon
} from '../components/Icons';
import { supabaseMockService as mockTestService } from './services/supabaseMockService';

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
                        e.preventDefault();
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

        const testId = activeTest?.id || `test_${Date.now()}`;

        if (htmlFile) {
            try {
                externalHtmlUrl = await mockTestService.uploadHtmlFile(testId, htmlFile);
            } catch (err) {
                console.error('HTML upload failed', err);
                alert('Failed to upload HTML file');
                setLoading(false);
                return;
            }
        }

        const testData: Partial<MockTest> = {
            id: testId,
            title: formData.get('title') as string,
            category: formData.get('category') as 'pyq' | 'mocks',
            date: formData.get('date') as string,
            duration: parseInt(formData.get('duration') as string),
            level: formData.get('level') as string,
            isSample: (formData.get('isSample') === 'on'),
            published: (formData.get('published') === 'on'),
            isExternalHtml: (formData.get('isExternalHtml') === 'on'),
            externalHtmlUrl: externalHtmlUrl,
            createdAt: activeTest?.createdAt || Date.now()
        };

        await mockTestService.saveTest(testData);
        setLoading(false);
        setShowTestForm(false);
        loadTests();
    };

    const handleSaveQuestion = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!activeTest) return;

        const qId = formState.id || `q_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await mockTestService.saveQuestion(activeTest.id, { ...formState, id: qId });
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
                        id: `q_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
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
            e.target.value = '';
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
            <div className="flex justify-between items-center bg-[#161e2d] px-8 py-6 rounded-[32px] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 border border-white/5"><ChevronLeftIcon /></button>
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter">Supabase <span className="text-emerald-500">Mock Portal</span></h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Next-Gen Examination Management</p>
                    </div>
                </div>
                <button
                    onClick={() => { setActiveTest(null); setShowTestForm(true); }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/30 hover:-translate-y-1 active:translate-y-0"
                >
                    <PlusIcon /> Create Master Test
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map(test => (
                    <div key={test.id} className="bg-[#161e2d] rounded-[2rem] border border-white/5 p-6 border-b-4 border-b-transparent hover:border-b-emerald-500 hover:border-white/10 transition-all group flex flex-col shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${test.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                {test.published ? 'Active' : 'Draft'}
                            </span>
                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setActiveTest(test); setShowTestForm(true); }} className="p-2 bg-white/5 hover:bg-emerald-600 rounded-xl text-slate-400 hover:text-white transition-all"><EditIcon /></button>
                                <button onClick={() => handleDeleteTest(test.id)} className="p-2 bg-white/5 hover:bg-red-600 rounded-xl text-slate-400 hover:text-white transition-all"><TrashIcon /></button>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{test.title}</h3>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 flex flex-wrap items-center gap-y-2 gap-x-3">
                            <span className="flex items-center gap-1"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> {test.category}</span>
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
                    <p className="text-slate-600 font-black uppercase tracking-widest text-[10px] mt-6">No Supabase tests found.</p>
                </div>
            )}
        </div>
    );

    const QuestionEditor = () => {
        const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

        return (
            <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
                <div className="bg-[#161e2d] px-8 py-4 rounded-[28px] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl shrink-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600"></div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTest(null)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 border border-white/5"><ChevronLeftIcon /></button>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">{activeTest?.title}</h2>
                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Supabase Content Management</p>
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
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${isPreviewMode ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                        >
                            <EyeIcon /> View Live
                        </button>
                    </div>
                </div>

                {!isPreviewMode ? (
                    <div className="flex-1 flex gap-6 overflow-hidden mt-6 pb-2">
                        {/* LEFT: LIST */}
                        <div className="flex-[1.8] bg-[#161e2d] rounded-[28px] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between gap-4">
                                <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-3 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                    {questions.length} Questions in Repository
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
                                        className={`grid grid-cols-[80px_1fr_80px_60px_100px] gap-2 items-center px-4 py-2 rounded-xl border transition-all cursor-pointer group ${selectedQuestionId === q.id ? 'bg-emerald-600/10 border-emerald-500/40' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="text-[8px] font-bold text-slate-500 truncate bg-black/40 px-2 py-1 rounded-lg">q_{q.id.slice(-6)}</div>
                                        <div className="text-[11px] text-slate-300 truncate font-medium pr-4">{q.text}</div>
                                        <div className="flex justify-center">
                                            <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${q.difficulty === 'Advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : q.difficulty === 'Mains' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                {q.difficulty || 'Mains'}
                                            </span>
                                        </div>
                                        <div className="flex justify-center">
                                            <StarIcon fill={q.isTopPYQ ? "currentColor" : "none"} className={`w-3 h-3 ${q.isTopPYQ ? 'text-purple-400' : 'text-slate-600'}`} />
                                        </div>
                                        <div className="flex justify-center gap-1.5">
                                            <button onClick={(e) => { e.stopPropagation(); setCurrentQuestion(q); setShowQuestionForm(true); }} className="p-1.5 bg-white/5 hover:bg-emerald-600 rounded-lg text-slate-500 hover:text-white transition-all opacity-40 group-hover:opacity-100"><EditIcon /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }} className="p-1.5 bg-white/5 hover:bg-red-600 rounded-lg text-slate-500 hover:text-white transition-all opacity-40 group-hover:opacity-100"><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: PREVIEW */}
                        <div className="flex-1 bg-[#161e2d] rounded-[28px] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-white/5 bg-black/20">
                                <h3 className="text-[9px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Asset Inspector
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 nta-scroll">
                                {selectedQuestion ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">q_{selectedQuestion.id.slice(-6)}</span>
                                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Supabase Node</span>
                                        </div>

                                        <div className="bg-black/30 rounded-[24px] border border-white/5 p-6 relative overflow-hidden group">
                                            {selectedQuestion.text && (
                                                <div className="text-base text-slate-200 font-medium leading-relaxed mb-6 border-l-2 border-emerald-500/20 pl-4">
                                                    {selectedQuestion.text}
                                                </div>
                                            )}

                                            {selectedQuestion.imageUrl && (
                                                <div className="mb-6 rounded-xl overflow-hidden bg-white p-4 shadow-inner">
                                                    <img src={selectedQuestion.imageUrl} alt="Asset" className="max-h-[150px] mx-auto object-contain" />
                                                </div>
                                            )}

                                            {selectedQuestion.type === MockQuestionType.MCQ ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedQuestion.options?.map((opt, i) => (
                                                        <div key={i} className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedQuestion.correctOptionIndex === i ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300' : 'bg-black/40 border-white/5 text-slate-500'}`}>
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black shrink-0 ${selectedQuestion.correctOptionIndex === i ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white/5 text-slate-600'}`}>{String.fromCharCode(65 + i)}</div>
                                                            <div className="text-[10px] truncate">{opt || '...'}</div>
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
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                                        <EyeIcon className="w-10 h-10 mb-3" />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Select a node to inspect</p>
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
                                        <span className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest">Question {idx + 1}</span>
                                    </div>
                                    {q.text && <div className="text-base text-white font-medium leading-relaxed mb-8">{q.text}</div>}
                                    {q.imageUrl && (
                                        <div className="mb-8 rounded-2xl overflow-hidden bg-white p-6">
                                            <img src={q.imageUrl} alt="Asset" className="max-h-[300px] mx-auto object-contain" />
                                        </div>
                                    )}
                                    {q.type === MockQuestionType.MCQ ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options?.map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-4 rounded-[18px] border transition-all flex items-start gap-4 ${q.correctOptionIndex === oIdx ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-black/30 border-white/5 text-slate-400'}`}>
                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${q.correctOptionIndex === oIdx ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-500'}`}>{String.fromCharCode(65 + oIdx)}</div>
                                                    <div className="text-sm pt-0.5 leading-relaxed">{opt}</div>
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
        <div className="min-h-screen bg-[#0b0f1a] p-4 md:p-10 font-sans selection:bg-emerald-500 selection:text-white">
            <div className="max-w-7xl mx-auto">
                {!activeTest ? <TestList /> : <QuestionEditor />}
            </div>

            {/* Modal: Test Form */}
            {showTestForm && (
                <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#161e2d] w-full max-w-2xl rounded-[40px] border border-white/10 p-10 shadow-2xl relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-emerald-600 rounded-[24px] flex items-center justify-center shadow-2xl rotate-12"><BookOpenIcon className="w-8 h-8 text-white" /></div>
                        <h3 className="text-2xl font-black mb-8 italic text-white text-center mt-4">Supabase <span className="text-emerald-500">Node Config</span></h3>
                        <form onSubmit={handleSaveTest} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Title</label>
                                    <input name="title" defaultValue={activeTest?.title} required className="w-full bg-black/60 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold text-base text-white placeholder:text-slate-700" placeholder="e.g. SKILL ASSESSMENT 01" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                    <select name="category" defaultValue={activeTest?.category} className="w-full bg-black/60 border border-white/5 rounded-xl px-5 py-4 outline-none focus:border-emerald-500 transition-all font-black text-[10px] uppercase text-white appearance-none">
                                        <option value="mocks">FULL MOCK EXAM</option>
                                        <option value="pyq">OFFICIAL PYQ ARCHIVE</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tag</label>
                                    <input name="date" defaultValue={activeTest?.date || 'Live'} className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-black text-[10px] uppercase text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration (Min)</label>
                                    <input name="duration" type="number" defaultValue={activeTest?.duration || 180} required className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-black text-base text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Level</label>
                                    <input name="level" defaultValue={activeTest?.level || 'Advanced'} className="w-full bg-black/60 border border-white/5 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-black text-[10px] uppercase text-white" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 py-4 bg-black/20 rounded-2xl border border-white/5 px-8">
                                <div className="flex justify-center gap-8">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="published" defaultChecked={activeTest?.published} className="w-4 h-4 accent-emerald-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-500">Live</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="isSample" defaultChecked={activeTest?.isSample} className="w-4 h-4 accent-blue-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-500">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="isExternalHtml" defaultChecked={activeTest?.isExternalHtml} className="w-4 h-4 accent-emerald-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-500">HTML Mode</span>
                                    </label>
                                </div>

                                <div className="space-y-2 border-t border-white/5 pt-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">HTML Test Asset (Supabase Storage)</label>
                                    <input type="file" name="htmlFile" accept=".html" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-slate-400 outline-none focus:border-emerald-500 transition-all" />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowTestForm(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/10">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl disabled:opacity-50">
                                    {loading ? 'Saving to Supabase...' : 'Sync with Database'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showQuestionForm && (
                <div className="fixed inset-0 z-[2000] bg-[#0b0f1a] flex flex-col animate-in fade-in duration-300">
                    <div className="h-14 bg-[#161e2d] border-b border-white/5 flex justify-between items-center px-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                            <h3 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{currentQuestion ? 'Refine' : 'Architect'} <span className="text-emerald-500">Supabase Node</span></h3>
                        </div>
                        <button onClick={() => { setShowQuestionForm(false); setCurrentQuestion(null); setFormState({}); }} className="p-2 hover:bg-red-600/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"><XIcon size={16} /></button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-full md:w-[405px] bg-[#161e2d] border-r border-white/5 overflow-y-auto p-6 space-y-6 nta-scroll">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Asset Category</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setFormState({ ...formState, type: MockQuestionType.MCQ })} className={`py-3 rounded-xl text-[9px] font-black border transition-all ${formState.type === MockQuestionType.MCQ ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/40 text-slate-500 border-white/5'}`}>MCQ</button>
                                        <button onClick={() => setFormState({ ...formState, type: MockQuestionType.NUMERICAL })} className={`py-3 rounded-xl text-[9px] font-black border transition-all ${formState.type === MockQuestionType.NUMERICAL ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/40 text-slate-500 border-white/5'}`}>NUMERICAL</button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Payload Content</label>
                                    <textarea
                                        value={formState.text || ''}
                                        onChange={(e) => setFormState({ ...formState, text: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-white focus:border-emerald-500/50 outline-none transition-all min-h-[140px]"
                                        placeholder="Question Content..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Resource Asset</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={formState.imageUrl || ''}
                                            onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                                            placeholder="Asset URL..."
                                            className="flex-1 bg-black/60 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-[10px] text-slate-400"
                                        />
                                        <label className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all">
                                            <CloudIcon className="w-4 h-4 text-emerald-400" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file || !activeTest) return;
                                                    const url = await mockTestService.uploadImage(activeTest.id, file);
                                                    setFormState(prev => ({ ...prev, imageUrl: url }));
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {formState.type === MockQuestionType.MCQ && (
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Options Matrix</label>
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className="relative">
                                                    <input
                                                        value={formState.options?.[i] || ''}
                                                        onChange={(e) => {
                                                            const newOpts = [...(formState.options || ['', '', '', ''])];
                                                            newOpts[i] = e.target.value;
                                                            setFormState({ ...formState, options: newOpts });
                                                        }}
                                                        className={`w-full bg-black/60 border rounded-xl pl-10 pr-10 py-3 outline-none text-[10px] ${formState.correctOptionIndex === i ? 'border-emerald-500/50' : 'border-white/5 focus:border-emerald-500'}`}
                                                    />
                                                    <button type="button" onClick={() => setFormState({ ...formState, correctOptionIndex: i })} className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md border ${formState.correctOptionIndex === i ? 'bg-emerald-500 border-emerald-500' : 'border-white/10'}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => handleSaveQuestion()} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all">Save Node</button>
                        </div>
                        <div className="flex-1 bg-black/20 p-10 overflow-y-auto">
                            {/* Simple Preview */}
                            <div className="max-w-2xl mx-auto bg-[#161e2d] p-10 rounded-[40px] border border-white/5">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-8">Draft Preview</h4>
                                {formState.text && <div className="text-xl text-white font-medium mb-8 leading-relaxed">{formState.text}</div>}
                                {formState.imageUrl && <img src={formState.imageUrl} alt="Asset" className="max-h-[300px] mb-8 rounded-2xl mx-auto" />}
                                {/* Options list... */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockTestAdmin;

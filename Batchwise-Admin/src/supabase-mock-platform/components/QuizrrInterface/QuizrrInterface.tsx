import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import SectionTabs from './SectionTabs';
import QuestionArea from './QuestionArea';
import Sidebar from './Sidebar';
import { Subject as GlobalSubject, QuestionType, QuestionStatus as GlobalStatus, UserResponse, Question as InternalQuestion } from '../../types';
import { Section, Question, QuestionStatus, User } from './types';
import { Info, X } from 'lucide-react';

interface QuizrrInterfaceProps {
    onSubmit: (responses: Record<string | number, UserResponse>) => void;
    questions: InternalQuestion[];
    testTitle?: string;
}

const QuizrrInterface: React.FC<QuizrrInterfaceProps> = ({ onSubmit, questions, testTitle = 'Skill Assessment' }) => {
    // State compatible with the new UI flow
    const [activeSectionId, setActiveSectionId] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(180 * 60); // 3 hours
    const [responses, setResponses] = useState<Record<string | number, UserResponse>>({});

    // Local state for the current question editing
    const [tempSelectedOption, setTempSelectedOption] = useState<number | null>(null);
    const [tempNumericAnswer, setTempNumericAnswer] = useState<string>('');

    // Modal states
    const [showInstructions, setShowInstructions] = useState(false);
    const [showQuestionPaper, setShowQuestionPaper] = useState(false);
    const [infoModal, setInfoModal] = useState<{ type: 'TEST' | 'SECTION'; sectionName?: string } | null>(null);

    // 1. Group questions into Sections (Subject + Type)
    const sections = useMemo(() => {
        const subjects = [GlobalSubject.PHYSICS, GlobalSubject.CHEMISTRY, GlobalSubject.MATHEMATICS];
        const result: Section[] = [];

        subjects.forEach(subj => {
            const subjQs = questions.filter(q => q.subject === subj);
            if (subjQs.length > 0) {
                // 1. MCQs - Section A
                const mcqs = subjQs.filter(q => q.type === QuestionType.MCQ);
                if (mcqs.length > 0) {
                    result.push({
                        id: `${subj}-MCQ`,
                        name: `${subj} (SEC A)`,
                        type: subj,
                        subType: 'Single Correct',
                        questions: mcqs.map((q, idx) => ({
                            id: q.id.toString(),
                            number: idx + 1,
                            text: q.text,
                            imageUrl: q.imageUrl,
                            options: q.options || [],
                            type: 'Single Correct',
                            correctMarks: 4,
                            negativeMarks: 1.0,
                            status: QuestionStatus.NOT_VISITED,
                            _originalId: q.id
                        }))
                    });
                }

                // 2. Numerical - Section B
                const nums = subjQs.filter(q => q.type === QuestionType.NUMERICAL);
                if (nums.length > 0) {
                    result.push({
                        id: `${subj}-NUM`,
                        name: `${subj} (SEC B)`,
                        type: subj,
                        subType: 'Numerical',
                        questions: nums.map((q, idx) => ({
                            id: q.id.toString(),
                            number: idx + 1,
                            text: q.text,
                            imageUrl: q.imageUrl,
                            options: [],
                            type: 'Numerical',
                            correctMarks: 4,
                            negativeMarks: 0.0,
                            status: QuestionStatus.NOT_VISITED,
                            _originalId: q.id
                        }))
                    });
                }
            }
        });
        return result;
    }, [questions]);

    // Set initial active section
    useEffect(() => {
        if (sections.length > 0 && !activeSectionId) {
            setActiveSectionId(sections[0].id);
        }
    }, [sections]);

    // Timer Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // 3. Sync local state when question changes
    const activeSection = sections.find(s => s.id === activeSectionId);
    const currentQuestion = activeSection?.questions[currentQuestionIndex];

    useEffect(() => {
        if (currentQuestion) {
            const resp = responses[currentQuestion._originalId!];
            if (resp) {
                setTempSelectedOption(resp.selectedOptionIndex ?? null);
                setTempNumericAnswer(resp.numericAnswer ?? '');
            } else {
                setTempSelectedOption(null);
                setTempNumericAnswer('');
                // Mark as visited (Not Answered) if not already
                setResponses(prev => ({
                    ...prev,
                    [currentQuestion._originalId!]: {
                        questionId: currentQuestion._originalId!,
                        status: GlobalStatus.NOT_ANSWERED
                    }
                }));
            }
        }
    }, [currentQuestion?._originalId, activeSectionId, currentQuestionIndex]);

    // 4. Handlers
    const handleSectionChange = (id: string) => {
        setActiveSectionId(id);
        setCurrentQuestionIndex(0);
    };

    const handleQuestionNavigation = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const handleOptionSelect = (idx: number) => {
        setTempSelectedOption(idx);
    };

    const handleNumericChange = (val: string) => {
        setTempNumericAnswer(val);
    };

    const handleSaveAndNext = () => {
        if (currentQuestion) {
            const hasValue = tempSelectedOption !== null || (tempNumericAnswer && tempNumericAnswer.trim() !== '');
            const status = hasValue ? GlobalStatus.ANSWERED : GlobalStatus.NOT_ANSWERED;

            setResponses(prev => ({
                ...prev,
                [currentQuestion._originalId!]: {
                    questionId: currentQuestion._originalId!,
                    selectedOptionIndex: tempSelectedOption,
                    numericAnswer: tempNumericAnswer,
                    status: status
                }
            }));

            // Move next
            if (currentQuestionIndex < (activeSection?.questions.length || 0) - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                // Next subject?
                const currentIdx = sections.findIndex(s => s.id === activeSectionId);
                if (currentIdx < sections.length - 1) {
                    setActiveSectionId(sections[currentIdx + 1].id);
                    setCurrentQuestionIndex(0);
                }
            }
        }
    };

    const handleClearResponse = () => {
        setTempSelectedOption(null);
        setTempNumericAnswer('');
        if (currentQuestion) {
            setResponses(prev => ({
                ...prev,
                [currentQuestion._originalId!]: {
                    questionId: currentQuestion._originalId!,
                    status: GlobalStatus.NOT_ANSWERED
                }
            }));
        }
    };

    const handleMarkForReview = () => {
        if (currentQuestion) {
            const hasValue = tempSelectedOption !== null || (tempNumericAnswer && tempNumericAnswer.trim() !== '');
            const status = hasValue ? GlobalStatus.ANSWERED_MARKED_FOR_REVIEW : GlobalStatus.MARKED_FOR_REVIEW;

            setResponses(prev => ({
                ...prev,
                [currentQuestion._originalId!]: {
                    questionId: currentQuestion._originalId!,
                    selectedOptionIndex: tempSelectedOption,
                    numericAnswer: tempNumericAnswer,
                    status: status
                }
            }));

            // Move next
            if (currentQuestionIndex < (activeSection?.questions.length || 0) - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }
    };

    const calculateStats = (qs: Question[]) => {
        const stats = {
            answered: 0,
            notAnswered: 0,
            notVisited: 0,
            marked: 0,
            answeredMarked: 0,
        };

        qs.forEach(q => {
            const r = responses[q._originalId!];
            if (!r) stats.notVisited++;
            else if (r.status === GlobalStatus.ANSWERED) stats.answered++;
            else if (r.status === GlobalStatus.NOT_ANSWERED) stats.notAnswered++;
            else if (r.status === GlobalStatus.MARKED_FOR_REVIEW) stats.marked++;
            else if (r.status === GlobalStatus.ANSWERED_MARKED_FOR_REVIEW) stats.answeredMarked++;
        });

        return stats;
    };

    // Global stats for total test
    const totalStats = useMemo(() => {
        const allQs = sections.flatMap(s => s.questions);
        return calculateStats(allQs);
    }, [responses, sections]);

    // Map components to the new architecture
    if (!activeSection || !currentQuestion) return null;

    // Enrich current questions with statuses from responses
    const enrichedActiveSection = {
        ...activeSection,
        questions: activeSection.questions.map(q => {
            const r = responses[q._originalId!];
            let status = QuestionStatus.NOT_VISITED;
            if (r) {
                if (r.status === GlobalStatus.ANSWERED) status = QuestionStatus.ANSWERED;
                if (r.status === GlobalStatus.NOT_ANSWERED) status = QuestionStatus.NOT_ANSWERED;
                if (r.status === GlobalStatus.MARKED_FOR_REVIEW) status = QuestionStatus.MARKED_FOR_REVIEW;
                if (r.status === GlobalStatus.ANSWERED_MARKED_FOR_REVIEW) status = QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW;
            }
            return { ...q, status };
        })
    };

    const currentEnrichedQuestion = enrichedActiveSection.questions[currentQuestionIndex];
    // Inject current temp state into active question for rendering
    const questionForRender = {
        ...currentEnrichedQuestion,
        selectedOption: tempSelectedOption,
        numericAnswer: tempNumericAnswer
    };

    const stats = calculateStats(activeSection.questions);

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans overflow-hidden select-none">
            <Header
                onShowInstructions={() => setShowInstructions(true)}
                onShowQuestionPaper={() => setShowQuestionPaper(true)}
                testTitle={testTitle}
            />

            {/* Sub-Header: Title & Timer */}
            <div className="bg-white border-b border-gray-300 px-4 py-2 flex justify-between items-center shadow-sm z-40">
                <div className="flex items-center">
                    <div className="bg-[#0072bc] text-white px-3 py-1 rounded-sm text-sm font-bold flex items-center shadow border-b-2 border-white/20">
                        <span className="truncate max-w-[200px] uppercase font-black">{testTitle}</span>
                        <Info
                            onClick={() => setInfoModal({ type: 'TEST' })}
                            className="ml-2 w-4 h-4 cursor-pointer hover:text-blue-200 transition-colors flex-shrink-0"
                        />
                    </div>
                </div>
                <div className="text-gray-800 font-bold text-lg tabular-nums">
                    Time Left : <span className="bg-[#f0f2f5] px-3 py-1 border border-gray-300 rounded shadow-inner text-[#006cb7]">{formatTime(timeLeft)}</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Main Content: Tabs + Question */}
                <div className="flex-1 flex flex-col min-w-0 bg-white shadow-xl">
                    <div className="bg-[#f0f2f5] px-4 py-2 flex items-center border-b border-gray-200">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sections Palette</span>
                    </div>

                    <SectionTabs
                        sections={sections}
                        activeSectionId={activeSectionId}
                        onSectionChange={handleSectionChange}
                        onShowInfo={(name) => setInfoModal({ type: 'SECTION', sectionName: name })}
                    />

                    <QuestionArea
                        question={questionForRender as any}
                        sectionName={`${activeSection.name} Single Correct`}
                        onOptionSelect={handleOptionSelect}
                        onNumericChange={handleNumericChange}
                    />

                    {/* Footer Actions */}
                    <div className="h-16 border-t border-gray-300 bg-white flex items-center justify-between px-6 z-30 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <div className="flex space-x-3">
                            <button
                                onClick={handleMarkForReview}
                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 rounded shadow-sm transition-all active:scale-95 uppercase tracking-tight"
                            >
                                Mark for Review & Next
                            </button>
                            <button
                                onClick={handleClearResponse}
                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 rounded shadow-sm transition-all active:scale-95 uppercase tracking-tight"
                            >
                                Clear Response
                            </button>
                        </div>

                        <button
                            onClick={handleSaveAndNext}
                            className="px-12 py-3 bg-[#0072bc] hover:bg-blue-700 text-white text-sm font-black rounded shadow-md transition-all active:scale-95 uppercase tracking-widest border-b-4 border-black/10"
                        >
                            Save & Next
                        </button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <Sidebar
                    user={{ name: 'Yashwin', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yashwin' }}
                    activeSection={enrichedActiveSection as any}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionClick={handleQuestionNavigation}
                    onSubmit={() => {
                        if (window.confirm('Are you sure you want to submit the test?')) {
                            onSubmit(responses);
                        }
                    }}
                    stats={stats}
                />
            </div>

            {/* Modals */}
            {infoModal && (
                <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white w-96 rounded shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#006cb7] text-white p-3 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                            <span>{infoModal.type === 'TEST' ? 'Total Test Summary' : infoModal.sectionName}</span>
                            <button onClick={() => setInfoModal(null)} className="hover:text-red-200"><X size={16} /></button>
                        </div>
                        <div className="bg-white p-6 space-y-4">
                            <div className="space-y-3">
                                {[
                                    { label: 'Answered', key: 'answered', color: '#2ca12c' },
                                    { label: 'Not Answered', key: 'notAnswered', color: '#e45228' },
                                    { label: 'Not Visited', key: 'notVisited', color: '#eeeeee' },
                                    { label: 'Marked Review', key: 'marked', color: '#5b2b91' },
                                    { label: 'Ans & Marked', key: 'answeredMarked', color: '#5b2b91' },
                                ].map(stat => {
                                    const currentStats = infoModal.type === 'TEST' ? totalStats : calculateStats(sections.find(s => s.name === infoModal.sectionName)?.questions || []);
                                    return (
                                        <div key={stat.label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{stat.label} :</span>
                                            <span className="text-[13px] font-black text-gray-900 pr-2">{(currentStats as any)[stat.key]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 flex justify-end">
                            <button onClick={() => setInfoModal(null)} className="bg-[#006cb7] text-white px-8 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showInstructions && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded shadow-2xl overflow-hidden border border-gray-200">
                        <div className="bg-[#333333] text-white p-4 flex justify-between items-center font-black text-xs uppercase tracking-widest">
                            <span>General Instructions</span>
                            <button onClick={() => setShowInstructions(false)} className="hover:text-red-400 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 text-gray-700 text-sm leading-relaxed nta-scroll">
                            <h3 className="font-bold text-xl mb-6 text-gray-900 border-b pb-4">Please read the instructions carefully :</h3>
                            <div className="space-y-6">
                                <section>
                                    <h4 className="font-bold text-gray-800 mb-2 underline">General Instructions:</h4>
                                    <p>1. Total duration of examination is 180 minutes.</p>
                                    <p>2. The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</p>
                                </section>
                                <section>
                                    <h4 className="font-bold text-gray-800 mb-2 underline">Navigating to a Question:</h4>
                                    <p>To answer a question, do the following:</p>
                                    <ul className="list-disc ml-5 space-y-2 mt-2">
                                        <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly.</li>
                                        <li>Click on <span className="font-bold text-blue-600">Save & Next</span> to save your answer for the current question and then go to the next question.</li>
                                        <li>Click on <span className="font-bold text-purple-600">Mark for Review & Next</span> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                                    </ul>
                                </section>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-100 flex justify-end">
                            <button onClick={() => setShowInstructions(false)} className="bg-[#337ab7] text-white px-12 py-3 rounded font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">I understand</button>
                        </div>
                    </div>
                </div>
            )}

            {showQuestionPaper && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-[90vh] flex flex-col rounded shadow-2xl overflow-hidden border border-gray-200">
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
                                                <div className="mt-4 mb-4 bg-gray-50 border border-gray-100 p-3 rounded flex justify-center">
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
                                                <div key={oIdx} className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded border border-gray-100 italic">
                                                    <span className="font-bold mr-2 text-blue-500">({String.fromCharCode(65 + oIdx)})</span>
                                                    <span className="MathJax">{opt}</span>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        mjx-container { 
            font-size: 1.1em !important; 
            margin: 0.5em 0 !important; 
            max-width: 100% !important; 
            overflow-x: auto !important; 
            overflow-y: hidden !important; 
        }
        .nta-scroll::-webkit-scrollbar { width: 6px; }
        .nta-scroll::-webkit-scrollbar-track { background: transparent; }
        .nta-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
      `}</style>
        </div>
    );
};

export default QuizrrInterface;

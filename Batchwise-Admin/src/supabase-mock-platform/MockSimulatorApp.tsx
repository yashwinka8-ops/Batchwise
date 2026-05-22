import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Instructions from './components/Instructions';
import QuizrrInterface from './components/QuizrrInterface/QuizrrInterface';
import { UserResponse, QuestionStatus, QuestionType, Subject, Question } from './types';
import { MOCK_QUESTIONS as ALL_QUESTIONS_STATIC } from './constants';
import { supabaseMockService as mockTestService } from './services/supabaseMockService';

type Screen = 'LOGIN' | 'INSTRUCTIONS' | 'QUIZ' | 'SUMMARY';

interface MockSimulatorAppProps {
    testId?: string | null;
    user?: any;
    onBack?: () => void;
}

const MockSimulatorApp: React.FC<MockSimulatorAppProps> = ({ testId, user, onBack }) => {
    const [screen, setScreen] = useState<Screen>('LOGIN');
    const [examResponses, setExamResponses] = useState<Record<string | number, UserResponse>>({});
    const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [testTitle, setTestTitle] = useState<string>('NTA Mock Test');

    // Analysis State
    const [activeAnalysisSubject, setActiveAnalysisSubject] = useState<Subject | 'OVERALL'>('OVERALL');

    useEffect(() => {
        const loadTest = async () => {
            if (testId && !testId.startsWith('m0')) {
                setIsLoading(true);
                try {
                    // Fetch test details
                    const testInfo = await mockTestService.getTestById(testId);
                    if (testInfo) setTestTitle(testInfo.title);

                    // Fetch questions
                    const qs = await mockTestService.getQuestionsByTestId(testId);
                    const mappedQs: Question[] = qs.map(q => ({
                        id: q.id,
                        subject: q.subject as any as Subject,
                        type: q.type as any as QuestionType,
                        text: q.text,
                        options: q.options,
                        correctOptionIndex: q.correctOptionIndex,
                        correctNumericAnswer: q.correctNumericAnswer,
                        solution: q.solution,
                        imageUrl: q.imageUrl
                    }));
                    setDynamicQuestions(mappedQs);

                    // Check for existing attempt
                    if (user) {
                        const attempt = await mockTestService.getAttempt(user.uid, testId);
                        if (attempt) {
                            setExamResponses(attempt.responses || {});
                            setScreen('SUMMARY');
                        }
                    }

                } catch (e) {
                    console.error("Failed to load dynamic test from Supabase", e);
                }
                setIsLoading(false);
            } else {
                setTestTitle('Sample Skill Assessment');
                setDynamicQuestions(ALL_QUESTIONS_STATIC as any);
            }
        };
        loadTest();
    }, [testId, user]);

    // Typeset MathJax
    useEffect(() => {
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            (window as any).MathJax.typesetPromise();
        }
    }, [dynamicQuestions, screen, activeAnalysisSubject]);

    const activeQuestions = dynamicQuestions;

    const handleLogin = () => {
        setScreen('INSTRUCTIONS');
    };

    const handleProceed = () => {
        setScreen('QUIZ');
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen denied", e));
        }
    };

    const handleSubmit = async (responses: Record<string | number, UserResponse>) => {
        setExamResponses(responses);

        try {
            if (user && testId && !testId.startsWith('m0')) {
                await mockTestService.submitAttempt(user.uid, testId, responses, {});
            }
        } catch (error) {
            console.error("Submission error:", error);
        }

        setScreen('SUMMARY');
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(e => console.log("Exit fullscreen failed", e));
        }
    };

    const renderSummary = () => {
        const stats = {
            [Subject.PHYSICS]: { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 },
            [Subject.CHEMISTRY]: { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 },
            [Subject.MATHEMATICS]: { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 },
            OVERALL: { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 }
        };

        activeQuestions.forEach(q => {
            const subj = q.subject;
            if (!stats[subj]) return;
            stats[subj].total++;
            stats.OVERALL.total++;

            const resp = examResponses[q.id];

            if (resp && (resp.status === QuestionStatus.ANSWERED || resp.status === QuestionStatus.ANSWERED_MARKED_FOR_REVIEW)) {
                stats[subj].attempted++;
                stats.OVERALL.attempted++;

                let isCorrect = false;
                if (q.type === QuestionType.MCQ) {
                    isCorrect = resp.selectedOptionIndex === q.correctOptionIndex;
                    if (isCorrect) {
                        stats[subj].correct++;
                        stats[subj].score += 4;
                        stats.OVERALL.correct++;
                        stats.OVERALL.score += 4;
                    } else {
                        stats[subj].incorrect++;
                        stats[subj].score -= 1;
                        stats.OVERALL.incorrect++;
                        stats.OVERALL.score -= 1;
                    }
                } else if (q.type === QuestionType.NUMERICAL) {
                    isCorrect = resp.numericAnswer === q.correctNumericAnswer;
                    if (isCorrect) {
                        stats[subj].correct++;
                        stats[subj].score += 4;
                        stats.OVERALL.correct++;
                        stats.OVERALL.score += 4;
                    } else {
                        stats[subj].incorrect++;
                        stats.OVERALL.incorrect++;
                    }
                }
            }
        });

        const getAccuracy = (correct: number, attempted: number) => {
            if (attempted === 0) return 0;
            return Math.round((correct / attempted) * 100);
        };

        const renderAnalysisTab = () => {
            if (activeAnalysisSubject === 'OVERALL') {
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Score Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl text-center shadow-sm">
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Score</div>
                                <div className="text-4xl font-black text-[#005ba3] mt-2">{stats.OVERALL.score}</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center shadow-sm">
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Accuracy</div>
                                <div className="text-4xl font-black text-green-600 mt-2">{getAccuracy(stats.OVERALL.correct, stats.OVERALL.attempted)}%</div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl text-center shadow-sm">
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Attempted</div>
                                <div className="text-4xl font-black text-purple-600 mt-2">{stats.OVERALL.attempted}</div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl text-center shadow-sm">
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Correct</div>
                                <div className="text-4xl font-black text-orange-600 mt-2">{stats.OVERALL.correct}</div>
                            </div>
                        </div>

                        {/* Subject Table */}
                        <div>
                            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-3">
                                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                Detailed Performance Log
                            </h3>
                            <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="px-6 py-5">Subject</th>
                                            <th className="px-6 py-5 text-center">Qs</th>
                                            <th className="px-6 py-5 text-center">Done</th>
                                            <th className="px-6 py-5 text-center text-green-600">Right</th>
                                            <th className="px-6 py-5 text-center text-red-600">Wrong</th>
                                            <th className="px-6 py-5 text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-bold">
                                        {[Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map(subj => {
                                            const s = stats[subj];
                                            if (!s) return null;
                                            return (
                                                <tr key={subj} className="bg-white hover:bg-gray-50/50">
                                                    <td className="px-6 py-5 text-gray-900">{subj}</td>
                                                    <td className="px-6 py-5 text-center">{s.total}</td>
                                                    <td className="px-6 py-5 text-center">{s.attempted}</td>
                                                    <td className="px-6 py-5 text-center text-green-600">{s.correct}</td>
                                                    <td className="px-6 py-5 text-center text-red-500">{s.incorrect}</td>
                                                    <td className="px-6 py-5 text-right text-gray-900">{s.score}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            } else {
                // SUBJECT WISE SOLUTIONS
                const filteredQuestions = activeQuestions.filter(q => q.subject === activeAnalysisSubject);

                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredQuestions.map((q, idx) => {
                            const resp = examResponses[q.id];
                            const isAttempted = resp && (resp.status === QuestionStatus.ANSWERED || resp.status === QuestionStatus.ANSWERED_MARKED_FOR_REVIEW);
                            let isCorrect = false;
                            let userAnswerDisplay = "Not Answered";

                            if (isAttempted) {
                                if (q.type === QuestionType.MCQ) {
                                    isCorrect = resp.selectedOptionIndex === q.correctOptionIndex;
                                    userAnswerDisplay = `Option ${String.fromCharCode(65 + (resp.selectedOptionIndex || 0))}`;
                                } else {
                                    isCorrect = resp.numericAnswer === q.correctNumericAnswer;
                                    userAnswerDisplay = resp.numericAnswer || "-";
                                }
                            }

                            let statusColor = "bg-gray-100 text-gray-500 border-gray-200";
                            let statusText = "UNATTEMPTED";
                            if (isAttempted) {
                                if (isCorrect) {
                                    statusColor = "bg-emerald-100 text-emerald-600 border-emerald-200";
                                    statusText = "CORRECT (+4)";
                                } else {
                                    statusColor = "bg-red-100 text-red-600 border-red-200";
                                    statusText = "INCORRECT (-1)";
                                }
                            }

                            return (
                                <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">{idx + 1}</span>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${statusColor}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {q.type === QuestionType.MCQ ? 'Single Correct' : 'Numerical'}
                                        </div>
                                    </div>

                                    <div className="mb-6 font-medium text-gray-800 leading-relaxed MathJax text-sm">
                                        {q.text}
                                    </div>

                                    {q.imageUrl && (
                                        <div className="mb-6 rounded-xl overflow-hidden bg-white p-4 border border-gray-100 shadow-sm flex justify-center">
                                            <img
                                                src={q.imageUrl}
                                                alt="Question"
                                                className="max-h-[300px] object-contain"
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    )}

                                    {q.type === QuestionType.MCQ && q.options && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                            {q.options.map((opt, oIdx) => {
                                                const isCorrectOpt = oIdx === q.correctOptionIndex;
                                                const isSelectedOpt = isAttempted && resp.selectedOptionIndex === oIdx;

                                                let optClass = "bg-gray-50 border-gray-200 text-gray-600";
                                                if (isCorrectOpt) optClass = "bg-green-50 border-green-300 text-green-700 ring-1 ring-green-300";
                                                else if (isSelectedOpt && !isCorrectOpt) optClass = "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-300";

                                                return (
                                                    <div key={oIdx} className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${optClass}`}>
                                                        <span className="font-bold opacity-70">({String.fromCharCode(65 + oIdx)})</span>
                                                        <span className="MathJax">
                                                            {opt && (opt.startsWith('http') || opt.startsWith('/')) ? (
                                                                <img src={opt} alt={`Opt ${oIdx + 1}`} className="max-h-10 object-contain bg-white p-1 rounded" referrerPolicy="no-referrer" />
                                                            ) : (
                                                                opt
                                                            )}
                                                        </span>
                                                        {isCorrectOpt && <span className="ml-auto text-green-600 font-bold text-xs">✔</span>}
                                                        {isSelectedOpt && !isCorrectOpt && <span className="ml-auto text-red-600 font-bold text-xs">✖</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            Explanation & Solution
                                        </h4>
                                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap MathJax font-medium">
                                            {q.solution || <span className="italic text-gray-400">Solution explanation not available for this question.</span>}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-100 flex gap-6 text-xs">
                                            <div>
                                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Correct Answer</span>
                                                <span className="font-black text-green-600">
                                                    {q.type === QuestionType.MCQ ? `Option ${String.fromCharCode(65 + q.correctOptionIndex)}` : q.correctNumericAnswer}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Your Answer</span>
                                                <span className={`font-black ${isCorrect ? 'text-green-600' : isAttempted ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {userAnswerDisplay}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
        }

        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 md:p-8 font-sans">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in duration-500 min-h-[85vh] flex flex-col">
                    <div className="bg-[#005ba3] text-white p-6 pb-0">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold italic">Score Card & Analysis</h1>
                                <p className="opacity-80 text-sm mt-1 uppercase tracking-widest font-bold">{testTitle}</p>
                            </div>
                                <button 
                                    onClick={() => {
                                        if (onBack) {
                                            onBack();
                                        } else {
                                            window.location.reload();
                                        }
                                    }}
                                    className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-[var(--primary)] text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                                >
                                Back to Dashboard
                            </button>
                        </div>

                        {/* Analysis Tabs */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {['OVERALL', Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveAnalysisSubject(tab as any)}
                                    className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-lg ${activeAnalysisSubject === tab
                                        ? 'bg-white text-[#005ba3]'
                                        : 'bg-[#004a85] text-white/60 hover:text-white hover:bg-[#004278]'
                                        }`}
                                >
                                    {tab === 'OVERALL' ? 'Summary Dashboard' : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 md:p-8 bg-gray-50 flex-1 overflow-y-auto">
                        {renderAnalysisTab()}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 border-[#005ba3] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-[#005ba3] font-black uppercase tracking-widest text-xs">Forging Supabase Simulation Assets...</p>
        </div>
    );

    return (
        <div className="mock-simulator-container">
            {screen === 'LOGIN' && <Login onLogin={handleLogin} />}
            {screen === 'INSTRUCTIONS' && <Instructions onProceed={handleProceed} />}
            {screen === 'QUIZ' && <QuizrrInterface testTitle={testTitle} onSubmit={handleSubmit} questions={activeQuestions} />}
            {screen === 'SUMMARY' && renderSummary()}
        </div>
    );
};

export default MockSimulatorApp;

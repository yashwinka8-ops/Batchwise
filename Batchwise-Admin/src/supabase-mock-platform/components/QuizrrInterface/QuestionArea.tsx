import React, { useEffect } from 'react';
import { ArrowDownCircle } from 'lucide-react';
import Watermark from './Watermark';
import { Question } from './types';

interface QuestionAreaProps {
    question: Question;
    sectionName: string;
    onOptionSelect: (optionIndex: number) => void;
    onNumericChange: (value: string) => void;
}

const QuestionArea: React.FC<QuestionAreaProps> = ({
    question,
    sectionName,
    onOptionSelect,
    onNumericChange
}) => {

    useEffect(() => {
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            (window as any).MathJax.typesetPromise();
        }
    }, [question.id]);

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {/* Info Strip */}
            <div className="flex items-center justify-between px-4 py-1 border-b border-gray-300 bg-gray-50 text-sm">
                <div className="text-gray-700 font-medium tracking-tight uppercase text-[11px]">Question Type: <span className="font-bold">{question.type}</span></div>
                <div className="flex items-center text-gray-600 text-[11px] font-medium">
                    <span className="mr-0">Marks for correct answer: <span className="text-green-600 font-bold">{question.correctMarks}</span> | Negative Marks: <span className="text-red-600 font-bold">{question.negativeMarks.toFixed(1)}</span></span>
                </div>
            </div>

            {/* Question ID Strip */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white text-sm">
                <div className="text-gray-800">
                    <span className="font-bold">Question No. {question.number}</span>
                    <span className="ml-2 text-gray-300 text-[10px] font-mono whitespace-nowrap overflow-hidden">#{question.id}</span>
                </div>
                <ArrowDownCircle className="w-6 h-6 text-blue-500 cursor-pointer" />
            </div>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 relative nta-scroll bg-white">
                <Watermark />

                {/* Instructions Box */}
                <div className="border border-black p-3 mb-6 bg-white relative z-10 transition-all">
                    <div className="flex justify-between items-center cursor-pointer">
                        <h3 className="font-bold text-sm text-black">{sectionName} (Maximum Marks: 80)</h3>
                        <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="text-[12px] mt-2 space-y-1 text-black font-medium leading-relaxed">
                        <p>• This section contains <span className="font-bold">TWENTY (20)</span> questions.</p>
                        <p>• Each question has <span className="font-bold">FOUR</span> options (A), (B), (C) and (D). <span className="font-bold">ONLY ONE</span> of these four options is the correct answer.</p>
                        <p>• For each question, choose the option corresponding to the correct answer.</p>
                        <p>• Answer to each question will be evaluated according to the following marking scheme:</p>
                        <div className="ml-4 italic text-[11px] space-y-0.5 mt-1 border-l-2 border-black/10 pl-3">
                            <p>Full Marks : +4 If <span className="font-bold not-italic">ONLY</span> the correct option is chosen</p>
                            <p>Zero Marks : 0 If none of the options is chosen (i.e. the question is unanswered)</p>
                            <p>Negative Marks : -1 In all other cases.</p>
                        </div>
                    </div>
                </div>

                {/* Question Text */}
                {question.text && (
                    <div className="text-[17px] text-gray-900 mb-6 relative z-10 leading-relaxed font-serif MathJax">
                        {question.text}
                    </div>
                )}

                {question.imageUrl && (
                    <div className="mb-6 relative z-10 flex justify-center bg-gray-50 border border-gray-100 p-4 rounded shadow-inner">
                        <img
                            src={question.imageUrl}
                            alt="Graphic"
                            className="max-w-full max-h-[400px] object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}

                {/* Options or Numerical Input */}
                {question.type.includes('Numerical') ? (
                    <div className="relative z-10 mt-8 flex flex-col items-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Enter your answer below</p>
                        <input
                            type="text"
                            value={question.numericAnswer || ''}
                            onChange={(e) => onNumericChange(e.target.value)}
                            className="w-full max-w-[200px] border-2 border-gray-300 p-4 text-3xl font-black text-center text-blue-600 focus:border-blue-500 outline-none rounded shadow-sm"
                            placeholder="0.00"
                        />
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10 ml-2">
                        {question.options?.map((option, idx) => (
                            <div key={idx} className="flex items-start group">
                                <div className="relative h-5 w-5 flex items-center justify-center mr-3 mt-1">
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        id={`opt-${idx}`}
                                        className="peer w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer appearance-none border-2 rounded-full checked:border-blue-600 checked:bg-blue-600"
                                        checked={question.selectedOption === idx}
                                        onChange={() => onOptionSelect(idx)}
                                    />
                                    <div className="absolute hidden peer-checked:block w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                                <label htmlFor={`opt-${idx}`} className="text-[15px] text-gray-800 cursor-pointer font-serif leading-tight group-hover:text-blue-600 transition-colors pt-0.5 MathJax flex items-center">
                                    <span className="font-bold mr-2 text-[13px] text-gray-400 shrink-0">({String.fromCharCode(65 + idx)})</span>
                                    {option && (option.startsWith('http') || option.startsWith('/')) ? (
                                        <img src={option} alt={`Opt ${idx + 1}`} className="max-h-12 object-contain bg-white p-1 rounded border border-gray-100" referrerPolicy="no-referrer" />
                                    ) : (
                                        option
                                    )}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionArea;

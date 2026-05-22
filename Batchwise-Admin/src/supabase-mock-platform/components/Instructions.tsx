import React, { useState } from 'react';

interface InstructionsProps {
  onProceed: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onProceed }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-[#0072bc] text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="text-lg font-black uppercase tracking-widest">General Instructions</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 nta-scroll bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white p-10 shadow-lg border border-gray-200 text-sm text-gray-800 leading-relaxed font-medium">
          <h2 className="text-2xl font-black text-center mb-8 uppercase tracking-[0.2em] border-b-2 border-gray-100 pb-4 text-[#333]">
            Instructions to Candidates
          </h2>

          <div className="space-y-8">
            <section>
              <h3 className="font-black text-gray-900 mb-4 uppercase tracking-tight underline decoration-[#0072bc] decoration-2 underline-offset-4">General Instructions</h3>
              <ul className="list-disc pl-5 space-y-3">
                <li>Total duration of the paper is 180 minutes.</li>
                <li>
                  The on-screen computer clock will be set at the server. The countdown timer in the top right corner of the computer screen will display the remaining time (in minutes) available for you to complete the examination. When the timer reaches zero, the examination will end by itself automatically. You will not be required to end or submit the answers of examination. Please note that only the answers that you have saved will be recorded and submitted.
                </li>
                <li>
                  The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols. You can view the summary of your actions on the questions of any section above the question palette.
                </li>
              </ul>

              {/* Palette Image Section */}
              <div className="my-8 border border-gray-200 p-4 rounded-xl bg-[#f9f9f9] flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Question Palette Symbols Legend</p>
                <img
                  src="/instructions_palette.png"
                  alt="Question Palette Symbols"
                  className="max-w-full h-auto shadow-sm rounded border border-gray-200"
                />
              </div>

              <ul className="list-disc pl-5 space-y-3 mt-4">
                <li>The Marked for Review status for a question simply indicates that you would like to look at question again.</li>
                <li>You can click on the "›" arrow which appears to the left of question palette to collapse question palette thereby maximizing the question window. To view the question palette again you can click on the "‹" arrow which appears on the right side of question window.</li>
                <li>At the end of this "INSTRUCTIONS TO CANDIDATES", click on the checkbox beside the "I HAVE READ ALL THE INSTRUCTIONS AND SHALL ABIDE BY THEM" and then you will be able to proceed to and answer the questions at the designated time.</li>
                <li>A Test Summary page will be displayed before final submission. It will help student in reconciling the result and in case of any discrepancy.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-black text-gray-900 mb-4 uppercase tracking-tight underline decoration-[#0072bc] decoration-2 underline-offset-4">Navigating to a Question</h3>
              <p className="mb-3">To navigate between questions, you need to do the following:</p>
              <ul className="list-disc pl-5 space-y-3">
                <li>Click on the question number in the Question Palette at the right of the screen to go to that numbered question directly. Note that using this procedure does NOT save the answer to the current question.</li>
                <li>Click on <span className="font-black text-[#0072bc]">Save and Next</span> to save the answer for the current question and then go to the next question.</li>
                <li>Click on <span className="font-black text-[#6d4da3]">Mark for Review & Next</span> to save your answer for the current question, mark it for review, and then go to the next question.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-black text-gray-900 mb-4 uppercase tracking-tight underline decoration-[#0072bc] decoration-2 underline-offset-4">Answering a Question</h3>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-black text-[11px] uppercase tracking-widest mb-3 text-[#333]">Multiple Choice (Single Correct):</h4>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>To select the option, using the mouse, click on the corresponding button of the option.</li>
                    <li>To deselect the chosen answer, click on the <span className="font-bold">Clear Response</span> button.</li>
                    <li>To change the chosen answer, click on the button of another option.</li>
                    <li>To save the answer and go to the next question, you MUST click on the <span className="font-bold">Save & Next</span> button.</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-black text-[11px] uppercase tracking-widest mb-3 text-[#333]">Multiple Select (One or More Correct):</h4>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>To select the option(s), using the mouse, click on the corresponding button(s) of the option(s).</li>
                    <li>To deselect the chosen answer(s), click on the button(s) of the chosen option(s) again or click on the <span className="font-bold">Clear Response</span> button.</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-black text-[11px] uppercase tracking-widest mb-3 text-[#333]">Numerical Value Type:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>For each question, enter the correct numerical value using the on-screen virtual numeric keypad.</li>
                    <li>To change the chosen answer, first click on the <span className="font-bold">Clear Response</span> button and then enter the new answer.</li>
                    <li>To mark the question for review, click on the <span className="font-bold text-[#6d4da3]">Mark for Review and Next</span> button. If an answer is entered for a question that is Marked for Review, that answer will be considered in evaluation.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-black text-gray-900 mb-4 uppercase tracking-tight underline decoration-[#0072bc] decoration-2 underline-offset-4">Parts of Question Paper</h3>
              <ul className="list-disc pl-5 space-y-3">
                <li>The question paper has three parts: <span className="font-black">MATHEMATICS, PHYSICS and CHEMISTRY</span>.</li>
                <li>Parts in the question paper are displayed on the top bar of the screen. Questions within a part can be viewed by clicking on the part name. The part which you will be viewing will be highlighted.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Footer Acknowledgement */}
      <div className="bg-white border-t border-gray-300 p-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <input
              type="checkbox"
              id="ack"
              className="mt-1 w-6 h-6 text-[#337ab7] rounded border-gray-300 focus:ring-[#337ab7] cursor-pointer"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <label htmlFor="ack" className="text-sm font-black text-[#286090] cursor-pointer select-none leading-relaxed uppercase tracking-tight">
              I HAVE READ ALL THE INSTRUCTIONS AND SHALL ABIDE BY THEM. I also declare that I am not in possession of any restricted materials such as Calculators, Mobile Phones, etc.
            </label>
          </div>
          <div className="flex justify-between items-center">
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">NTA Assessment Portal</p>
              <p className="text-[8px] font-bold text-gray-300 italic">High-Fidelity Skill Assessment Environment</p>
            </div>
            <button
              onClick={onProceed}
              disabled={!isChecked}
              className={`px-20 py-4 rounded-sm text-white font-black text-sm tracking-[0.2em] shadow-2xl transition-all active:scale-95 border-b-4 border-black/20 ${isChecked ? 'bg-[#337ab7] hover:bg-[#286090] cursor-pointer' : 'bg-gray-400 cursor-not-allowed opacity-50'}`}
            >
              I AM READY TO BEGIN
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .nta-scroll::-webkit-scrollbar { width: 8px; }
        .nta-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .nta-scroll::-webkit-scrollbar-thumb { background: #bbb; border-radius: 4px; border: 2px solid #f1f1f1; }
        .nta-scroll::-webkit-scrollbar-thumb:hover { background: #999; }
      `}</style>
    </div>
  );
};

export default Instructions;

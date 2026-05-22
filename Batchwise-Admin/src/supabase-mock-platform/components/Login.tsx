import React from 'react';
import { User, Monitor, Laptop } from 'lucide-react';

interface LoginProps {
   onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
   return (
      <div className="min-h-screen flex flex-col font-sans">
         {/* 1. Top Navigation Bar */}
         <div className="bg-[#005ba3] h-8 flex justify-end items-center px-4 md:px-12 text-white text-xs md:text-sm shadow-sm">
            <button className="flex items-center gap-1 hover:text-gray-200 transition-colors font-medium">
               <User size={14} fill="white" /> Home
            </button>
         </div>

         {/* 2. Logos Header */}
         <div className="bg-white py-2 px-4 md:px-12 flex flex-col md:flex-row justify-between items-center shadow-md relative z-20 gap-4 md:gap-0">
            <div className="flex items-center gap-4">
               <img
                  src="https://upload.wikimedia.org/wikipedia/en/4/4c/National_Testing_Agency_logo.svg"
                  alt="National Testing Agency"
                  className="h-10 md:h-14 object-contain"
                  onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://placehold.co/150x60?text=NTA+Logo";
                  }}
               />
            </div>
            <div className="flex items-center gap-6">
               <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                  alt="Ministry of Education"
                  className="h-8 md:h-12 object-contain opacity-90"
               />
               <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Azadi-Ka-Amrit-Mahotsav-Logo.png/800px-Azadi-Ka-Amrit-Mahotsav-Logo.png"
                  alt="Azadi Ka Amrit Mahotsav"
                  className="h-8 md:h-12 object-contain"
               />
            </div>
         </div>

         {/* 3. Candidate & System Info Strip */}
         <div className="bg-[#fcfcfc] border-b border-gray-300 py-4 px-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm relative z-10 shadow-sm">
            {/* System Info (Left) */}
            <div className="flex items-start md:items-center gap-4 w-full md:w-1/2">
               <div className="p-2 border border-gray-400 rounded bg-white shrink-0">
                  <Laptop size={40} className="text-gray-700" strokeWidth={1.5} />
               </div>
               <div>
                  <div className="text-gray-800 font-bold text-sm md:text-base">
                     System Name : <span className="text-[#d9534f]">[C0001]</span>
                  </div>
                  <div className="text-[#d9534f] font-bold text-xs md:text-[11px] mt-1 leading-tight">
                     [Contact Invigilator if the Name and Photograph displayed on the screen is not yours]
                  </div>
               </div>
            </div>

            {/* Candidate Info (Right) */}
            <div className="flex items-center justify-end gap-3 w-full md:w-1/2">
               <div className="text-right">
                  <div className="text-gray-800 font-bold text-sm">
                     Candidate Name : <span className="text-[#d9534f]">[Your Name]</span>
                  </div>
                  <div className="text-gray-800 font-bold text-sm mt-0.5">
                     Subject Name : <span className="text-[#d9534f]">[Practice Paper]</span>
                  </div>
               </div>
               <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded overflow-hidden shrink-0">
                  <User size={48} className="text-gray-400 translate-y-2" />
               </div>
            </div>
         </div>

         {/* 4. Main Login Area */}
         <div className="flex-1 bg-[#23527c] relative flex items-center justify-center p-4 min-h-[400px]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{
                  backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
               }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f4e79] to-[#23527c]"></div>

            {/* Login Modal */}
            <div className="bg-white rounded shadow-2xl w-full max-w-[400px] overflow-hidden z-10 relative">
               <div className="bg-[#f5f5f5] px-6 py-3 border-b border-gray-300 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800">Login (Demo)</h2>
               </div>

               <div className="p-8 space-y-6">
                  <div>
                     <label className="block text-sm text-gray-600 mb-1.5 font-semibold">Username</label>
                     <input
                        type="text"
                        value="106.217.59.105"
                        disabled
                        className="w-full bg-[#e9ecef] border border-gray-300 px-3 py-2.5 rounded-sm text-gray-500 text-sm focus:outline-none cursor-not-allowed font-mono"
                     />
                  </div>
                  <div>
                     <label className="block text-sm text-gray-600 mb-1.5 font-semibold">Password</label>
                     <input
                        type="password"
                        value="password123"
                        disabled
                        className="w-full bg-[#e9ecef] border border-gray-300 px-3 py-2.5 rounded-sm text-gray-500 text-sm focus:outline-none cursor-not-allowed font-mono tracking-widest"
                     />
                  </div>

                  <button
                     onClick={onLogin}
                     className="w-full bg-[#337ab7] hover:bg-[#286090] text-white font-bold py-2.5 rounded-sm shadow-md transition-all active:scale-[0.99] text-sm uppercase tracking-wide border border-[#2e6da4]"
                  >
                     Login
                  </button>

                  <div className="text-center pt-2">
                     <span className="text-[#d9534f] font-bold text-sm">Click Login To proceed</span>
                  </div>
               </div>
            </div>
         </div>

         {/* 5. Footer */}
         <div className="bg-[#1f4e79] text-white text-center py-3 text-xs border-t border-[#153a5b]">
            &copy; All Rights Reserved - National Testing Agency
         </div>
      </div>
   );
};

export default Login;
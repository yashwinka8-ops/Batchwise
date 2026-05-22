import React from 'react';

const Watermark: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-[0.03]">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-20">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="watermark-text whitespace-nowrap">
                        yashwinka8@gmail.com
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Watermark;

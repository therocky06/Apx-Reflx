
import React from 'react';
import { LIGHT_COUNT } from '../constants';

interface F1LightStripProps {
  activeLights: number;
  allOff: boolean;
}

const F1LightStrip: React.FC<F1LightStripProps> = ({ activeLights, allOff }) => {
  return (
    <div className="flex justify-center items-center gap-4 md:gap-8 bg-[#1a1a1a] p-6 rounded-lg border border-[#333] shadow-2xl">
      {Array.from({ length: LIGHT_COUNT }).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-2">
          {/* Top Row Lights */}
          <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-[#111] border-2 border-[#222] relative overflow-hidden flex items-center justify-center">
             <div 
                className={`w-full h-full transition-all duration-75 ${
                  !allOff && idx < activeLights 
                    ? 'bg-[#E10600] shadow-[0_0_30px_#E10600] opacity-100' 
                    : 'bg-[#1a1a1a] opacity-30'
                }`}
             />
             {/* LED Pattern Overlay */}
             <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20"></div>
                ))}
             </div>
          </div>
          {/* Bottom Row (Double stacked effect) */}
          <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-[#111] border-2 border-[#222] relative overflow-hidden flex items-center justify-center">
             <div 
                className={`w-full h-full transition-all duration-75 ${
                  !allOff && idx < activeLights 
                    ? 'bg-[#E10600] shadow-[0_0_30px_#E10600] opacity-100' 
                    : 'bg-[#1a1a1a] opacity-30'
                }`}
             />
             <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20"></div>
                ))}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default F1LightStrip;

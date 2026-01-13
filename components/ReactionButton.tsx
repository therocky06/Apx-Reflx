
import React from 'react';

interface ReactionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  isReady?: boolean; // When the game is in progress (waiting for reaction)
  isActive?: boolean; // When the button is used to start/retry
}

const ReactionButton: React.FC<ReactionButtonProps> = ({ onPress, disabled, label = "REACTION AREA", isReady, isActive }) => {
  return (
    <button
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        onPress();
      }}
      disabled={disabled}
      style={{ touchAction: 'none' }}
      className={`
        w-full h-48 md:h-64 rounded-xl flex flex-col items-center justify-center transition-all duration-75
        border-2 select-none active:scale-[0.98]
        ${isReady 
          ? 'bg-[#0a0a0a] border-f1-red shadow-[inset_0_0_20px_rgba(225,6,0,0.1)]' 
          : isActive
            ? 'bg-[#1a1a1a] border-white shadow-lg active:bg-white active:text-black'
            : 'bg-[#111] border-[#333] opacity-40'}
      `}
    >
      <span className={`text-2xl md:text-3xl font-black tracking-widest transition-colors duration-75 ${isReady ? 'text-white' : isActive ? 'text-white' : 'text-[#444]'}`}>
        {label}
      </span>
      {isReady && (
        <span className="text-xs text-[#E10600] font-bold mt-4 tracking-[0.3em] uppercase animate-pulse">
          Lights Pending
        </span>
      )}
      {isActive && (
        <span className="text-[10px] text-gray-500 font-bold mt-4 tracking-[0.2em] uppercase">
          Tap to Initiate
        </span>
      )}
    </button>
  );
};

export default ReactionButton;

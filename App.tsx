
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Attempt } from './types';
import { LIGHT_COUNT, getRating, getRandomDelay } from './constants';
import F1LightStrip from './components/F1LightStrip';
import ReactionButton from './components/ReactionButton';
import { getAIFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(GameState.IDLE);
  const [activeLights, setActiveLights] = useState(0);
  const [allOff, setAllOff] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [currentResult, setCurrentResult] = useState<number | null>(null);
  const [aiCritique, setAiCritique] = useState<string | null>(null);
  const [liveTimer, setLiveTimer] = useState<number>(0);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);

  const startTimeRef = useRef<number>(0);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<number | null>(null);
  const lightsCountRef = useRef<number>(0);

  // High-precision live stopwatch update
  const animateTimer = useCallback(() => {
    if (startTimeRef.current > 0) {
      setLiveTimer(performance.now() - startTimeRef.current);
      requestRef.current = requestAnimationFrame(animateTimer);
    }
  }, []);

  // Sync best time with persistent storage
  useEffect(() => {
    const stored = localStorage.getItem('apx_best');
    if (stored) setBestTime(parseInt(stored, 10));
    
    const storedCount = localStorage.getItem('apx_total_count');
    if (storedCount) setTotalAttempts(parseInt(storedCount, 10));

    return () => {
      clearAllTimeouts();
    };
  }, []);

  const clearAllTimeouts = () => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  const startSequence = useCallback(() => {
    clearAllTimeouts();
    setState(GameState.SEQUENCING);
    setActiveLights(0);
    lightsCountRef.current = 0;
    setAllOff(false);
    setCurrentResult(null);
    setAiCritique(null);
    setLiveTimer(0);
    startTimeRef.current = 0;

    const nextLight = () => {
      if (lightsCountRef.current < LIGHT_COUNT) {
        lightsCountRef.current += 1;
        setActiveLights(lightsCountRef.current);
        const delay = getRandomDelay(800, 1000);
        sequenceTimeoutRef.current = setTimeout(nextLight, delay);
      } else {
        setState(GameState.WAITING_FOR_GO);
        const randomWait = getRandomDelay(200, 3200);
        sequenceTimeoutRef.current = setTimeout(() => {
          setAllOff(true);
          startTimeRef.current = performance.now();
          setState(GameState.REACTION);
          requestRef.current = requestAnimationFrame(animateTimer);
          sequenceTimeoutRef.current = null;
        }, randomWait);
      }
    };

    sequenceTimeoutRef.current = setTimeout(nextLight, 600);
  }, [animateTimer]);

  const handleAction = useCallback(async () => {
    if (state === GameState.IDLE || state === GameState.RESULT || state === GameState.FALSE_START) {
      startSequence();
      return;
    }

    if (state === GameState.SEQUENCING || state === GameState.WAITING_FOR_GO) {
      clearAllTimeouts();
      setState(GameState.FALSE_START);
      setAllOff(false); 
      return;
    }

    if (state === GameState.REACTION) {
      const endTime = performance.now();
      const diff = Math.round(endTime - startTimeRef.current);
      
      clearAllTimeouts();
      setCurrentResult(diff);
      setLiveTimer(diff);
      setState(GameState.RESULT);

      if (bestTime === null || diff < bestTime) {
        setBestTime(diff);
        localStorage.setItem('apx_best', diff.toString());
      }

      const newCount = totalAttempts + 1;
      setTotalAttempts(newCount);
      localStorage.setItem('apx_total_count', newCount.toString());

      const newAttempt: Attempt = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        timeMs: diff,
        category: getRating(diff).label
      };
      
      setAttempts(prev => [newAttempt, ...prev].slice(0, 5));

      getAIFeedback(diff, bestTime || diff).then(feedback => {
        if (feedback) setAiCritique(feedback);
      });
    }
  }, [state, bestTime, startSequence, totalAttempts]);

  const reset = () => {
    clearAllTimeouts();
    setState(GameState.IDLE);
    setAllOff(true);
    setActiveLights(0);
    lightsCountRef.current = 0;
    setCurrentResult(null);
    setAiCritique(null);
    setLiveTimer(0);
    startTimeRef.current = 0;
  };

  const currentStats = currentResult ? getRating(currentResult) : null;

  const getButtonLabel = () => {
    switch (state) {
      case GameState.IDLE: return "START ENGINE";
      case GameState.SEQUENCING: 
      case GameState.WAITING_FOR_GO: return "STAY READY";
      case GameState.REACTION: return "RELEASE!";
      case GameState.RESULT: return "RETRY";
      case GameState.FALSE_START: return "RESTART";
      default: return "READY";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] flex flex-col p-4 md:p-6 max-w-4xl mx-auto overflow-y-auto font-sans relative">
      
      {/* Floating Records Button */}
      <button 
        onClick={() => setIsRecordsOpen(true)}
        className="fixed top-20 right-0 z-40 bg-[#1a1a1a] hover:bg-[#222] border-l-2 border-y-2 border-[#333] px-3 py-4 rounded-l-xl flex flex-col items-center gap-2 transition-all active:scale-95 group"
        title="View Performance Records"
      >
        <span className="[writing-mode:vertical-lr] text-[9px] font-black tracking-[0.3em] uppercase text-gray-400 group-hover:text-white">Records</span>
        <div className="w-1.5 h-1.5 rounded-full bg-f1-red animate-pulse"></div>
      </button>

      {/* App Header */}
      <header className="flex justify-between items-center mb-6 border-b border-[#222] pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic text-white flex items-center gap-2">
            APX <span className="text-[#E10600]">REFLX</span>
          </h1>
          <p className="text-[10px] font-bold text-[#555] tracking-[0.4em] uppercase">High Performance Cognitive Lab</p>
        </div>
        <div className="flex gap-4 md:gap-8">
          <div className="text-right border-r border-[#222] pr-4 md:pr-8 hidden sm:block">
            <p className="text-[9px] font-black text-[#444] tracking-widest uppercase mb-1">Live Feed</p>
            <p className={`text-2xl font-mono font-bold ${(state === GameState.REACTION) ? 'text-green-400' : 'text-white'}`}>
              {(liveTimer / 1000).toFixed(3)}s
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-[#444] tracking-widest uppercase mb-1">Session Best</p>
            <p className="text-2xl font-mono font-bold text-[#E10600]">
              {bestTime ? `${(bestTime / 1000).toFixed(3)}s` : '--.---'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Experience */}
      <main className="flex-1 flex flex-col gap-6">
        
        {/* Signal Matrix Row */}
        <section className="w-full">
           <div className="flex justify-between items-end mb-4 h-6">
              <h2 className="text-[10px] font-black tracking-[0.2em] text-[#444] uppercase">Signal Matrix</h2>
              <div className="flex gap-4 items-center">
                {state === GameState.FALSE_START && (
                  <span className="text-xs font-black text-f1-red animate-pulse">FALSE START</span>
                )}
                {state === GameState.REACTION && (
                  <span className="text-xs font-black text-green-500 animate-pulse uppercase tracking-widest">Lights Out!</span>
                )}
                <div className="sm:hidden">
                  <span className={`text-sm font-mono font-bold ${(state === GameState.REACTION) ? 'text-green-400' : 'text-white'}`}>
                    {(liveTimer / 1000).toFixed(3)}s
                  </span>
                </div>
              </div>
           </div>
           <F1LightStrip activeLights={activeLights} allOff={allOff} />
        </section>

        {/* Dynamic Display Area */}
        <section className="h-28 flex flex-col items-center justify-center relative">
           {state === GameState.RESULT && currentResult && (
             <div className="flex flex-col items-center animate-in zoom-in duration-300">
               <div className="flex items-baseline gap-2">
                 <span className={`text-5xl md:text-6xl font-mono font-black ${currentStats?.color}`}>
                   {(currentResult / 1000).toFixed(3)}
                 </span>
                 <span className={`text-xl font-mono font-bold ${currentStats?.color}`}>s</span>
               </div>
               <span className={`text-sm font-black tracking-[0.3em] uppercase mt-1 ${currentStats?.color}`}>
                 {currentStats?.label}
               </span>
             </div>
           )}

           {state === GameState.FALSE_START && (
             <div className="text-center animate-in slide-in-from-top duration-200">
               <p className="text-2xl font-black text-f1-red italic tracking-[0.2em] uppercase">Jump Start</p>
               <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mt-1">Wait for Signal Extinguish</p>
             </div>
           )}

           {state === GameState.IDLE && (
             <div className="text-center opacity-30">
               <p className="text-[10px] font-black tracking-[0.4em] uppercase">Systems Nominal • Ready for Input</p>
             </div>
           )}
        </section>

        {/* Interactive Zone */}
        <section className="flex flex-col gap-6">
           <ReactionButton 
             onPress={handleAction} 
             isReady={state !== GameState.IDLE && state !== GameState.RESULT && state !== GameState.FALSE_START}
             isActive={state === GameState.IDLE || state === GameState.RESULT || state === GameState.FALSE_START}
             label={getButtonLabel()}
           />

           {/* Feedback Module */}
           <div className="h-16 flex items-center justify-center">
             {aiCritique ? (
               <div className="bg-[#111] p-3 rounded border border-[#222] border-l-4 border-f1-red animate-in fade-in slide-in-from-bottom duration-500 w-full">
                  <h4 className="text-[9px] font-black text-f1-red tracking-[0.2em] uppercase mb-1">Engineer Note</h4>
                  <p className="text-xs italic text-gray-400 font-medium leading-relaxed">"{aiCritique}"</p>
               </div>
             ) : (
                <div className="text-[9px] font-bold text-[#222] tracking-[0.4em] uppercase">Apex Performance Lab v1.0.4</div>
             )}
           </div>

           {/* Tactical Controls */}
           <div className="flex gap-4">
              <button 
                onClick={state === GameState.IDLE || state === GameState.RESULT || state === GameState.FALSE_START ? startSequence : undefined}
                className={`flex-1 font-black py-4 rounded-lg text-sm tracking-[0.2em] transition-all shadow-xl uppercase ${
                  state === GameState.IDLE || state === GameState.RESULT || state === GameState.FALSE_START 
                  ? 'bg-white text-black hover:bg-gray-200 active:scale-95' 
                  : 'bg-[#111] text-[#333] cursor-not-allowed opacity-50'
                }`}
              >
                {state === GameState.IDLE ? "Start Sequence" : "New Attempt"}
              </button>
              
              {state !== GameState.IDLE && (
                <button 
                  onClick={reset}
                  className="px-6 border border-[#333] text-[#777] font-bold rounded-lg text-[10px] tracking-widest hover:text-white transition-colors uppercase"
                >
                  Clear
                </button>
              )}
           </div>
        </section>
      </main>

      {/* Session Records Dialog */}
      {isRecordsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-[#333] w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-200">
            <div className="bg-[#1a1a1a] p-4 border-b border-[#333] flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black tracking-[0.3em] text-white uppercase">Last 5 Chances</h3>
                <p className="text-[8px] font-bold text-[#555] uppercase mt-1">Telemetry Comparison</p>
              </div>
              <button 
                onClick={() => setIsRecordsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-[#0d0d0d]">
              {attempts.length === 0 ? (
                <div className="py-12 text-center text-[10px] font-black text-[#333] uppercase tracking-[0.3em]">
                  No Data Recorded
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex text-[9px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-2 px-2">
                    <div className="w-10">SN</div>
                    <div className="flex-1">Timing (S)</div>
                    <div className="text-right">Delta</div>
                  </div>
                  {attempts.map((attempt, index) => {
                    // Logic: Compare attempt[index] (newer) with attempt[index + 1] (chronologically previous in the last 5)
                    const previousAttempt = attempts[index + 1];
                    let colorClass = 'text-white';
                    let deltaSymbol = '';

                    if (previousAttempt) {
                      if (attempt.timeMs < previousAttempt.timeMs) {
                        colorClass = 'text-green-400';
                        deltaSymbol = '▼ BETTER';
                      } else if (attempt.timeMs > previousAttempt.timeMs) {
                        colorClass = 'text-f1-red';
                        deltaSymbol = '▲ SLOWER';
                      } else {
                        deltaSymbol = '=';
                      }
                    }

                    return (
                      <div key={attempt.id} className="flex items-center p-3 rounded bg-[#111] border border-[#1a1a1a] hover:border-[#333] transition-colors">
                        <div className="w-10 text-[10px] font-mono font-bold text-[#333]">
                          {(totalAttempts - index).toString().padStart(2, '0')}
                        </div>
                        <div className={`flex-1 font-mono font-black text-base ${colorClass}`}>
                          {(attempt.timeMs / 1000).toFixed(3)}
                        </div>
                        <div className={`text-[8px] font-black tracking-tighter ${colorClass} text-right w-16`}>
                          {deltaSymbol}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333]">
              <button 
                onClick={() => setIsRecordsOpen(false)}
                className="w-full bg-white text-black font-black py-4 rounded text-[10px] tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors"
              >
                Return to Cockpit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Branding Footer */}
      <footer className="mt-8 text-center pb-6 opacity-20">
        <div className="inline-block border-t border-[#222] pt-4">
          <p className="text-[8px] font-bold tracking-[0.6em] uppercase">Motorsport Standard • Carbon Integrated Systems</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

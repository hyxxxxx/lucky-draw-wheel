import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play } from 'lucide-react';
import { Prize } from '../types';
import { audioEngine } from '../utils/audio';

interface LuckyWheelProps {
  prizes: Prize[];
  isSpinning: boolean;
  onSpinStart: (winnerId: string) => void;
  onSpinComplete: (winnerId: string) => void;
  soundEffectsOn: boolean;
  isLarge?: boolean;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  prizes,
  isSpinning,
  onSpinStart,
  onSpinComplete,
  soundEffectsOn,
  isLarge = false,
}) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [ledPhase, setLedPhase] = useState(0);
  const [hoveredPrize, setHoveredPrize] = useState<Prize | null>(null);
  const animFrameId = useRef<number | null>(null);
  const angleRef = useRef(0);

  // Filter valid prizes (quantity > 0)
  const activePrizes = useMemo(() => {
    return prizes.filter((p) => p.currentQuantity > 0);
  }, [prizes]);

  // Aggregate quantity to compute proportions
  const totalQuantity = useMemo(() => {
    return activePrizes.reduce((sum, p) => sum + p.currentQuantity, 0);
  }, [activePrizes]);

  // Generate sector segments with start and end angles
  const sectors = useMemo(() => {
    if (totalQuantity === 0) return [];
    let accumulatedAngle = 0;
    return activePrizes.map((prize) => {
      const angleSweep = (prize.currentQuantity / totalQuantity) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angleSweep;
      accumulatedAngle = endAngle;

      return {
        prize,
        startAngle,
        endAngle,
        angleSweep,
        midAngle: startAngle + angleSweep / 2,
      };
    });
  }, [activePrizes, totalQuantity]);

  // Rhythmically blink LED light decorations
  useEffect(() => {
    let intervalId: any;
    if (isSpinning) {
      // Faster blinking when spinning
      intervalId = setInterval(() => {
        setLedPhase((prev) => (prev + 1) % 4);
      }, 100);
    } else {
      intervalId = setInterval(() => {
        setLedPhase((prev) => (prev + 1) % 2);
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [isSpinning]);

  // Draw SVG Arc path
  const getArcPath = (startAngle: number, endAngle: number, radius: number): string => {
    // Convert polar coordinates to Cartesian
    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    const start = polarToCartesian(200, 200, radius, endAngle);
    const end = polarToCartesian(200, 200, radius, startAngle);

    // If arc is 360 degrees, return complete circle path
    if (endAngle - startAngle >= 359.99) {
      return `M 200 200 m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`;
    }

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', 200, 200,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z',
    ].join(' ');
  };

  const handleSpinClick = () => {
    if (isSpinning || totalQuantity === 0) return;

    // 1. Roll winning prize using cumulative counts
    const randomVal = Math.random() * totalQuantity;
    let sum = 0;
    let selectedSect = sectors[0];

    for (let s of sectors) {
      sum += s.prize.currentQuantity;
      if (randomVal <= sum) {
        selectedSect = s;
        break;
      }
    }

    const winnerPrize = selectedSect.prize;
    onSpinStart(winnerPrize.id);

    // 2. Compute final landing spot aligning the pointer at 360 (or 0) degrees (12 o'clock)
    // Pick somewhere inside the sector, away from boundaries
    const targetInsideSector = selectedSect.startAngle + (0.2 + Math.random() * 0.6) * selectedSect.angleSweep;
    const finalAlignRotation = (360 - targetInsideSector + 360) % 360;

    // Complete revolutions
    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const startAngle = angleRef.current % 360;
    const targetAngleTotal = angleRef.current + (extraSpins * 360) + (finalAlignRotation - startAngle + 360) % 360;

    // 3. Programmatic Easement Loop
    const duration = 4800; // 4.8 seconds
    const startTime = performance.now();
    let lastSectorIndex = -1;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Quintic ease out formula
      const easeProgress = 1 - Math.pow(1 - progress, 5);
      const currentAngle = startAngle + (targetAngleTotal - startAngle) * easeProgress;
      angleRef.current = currentAngle;
      setRotationAngle(currentAngle);

      // Sound trigger
      if (soundEffectsOn) {
        const adjustedAngleForPointer = (360 - (currentAngle % 360) + 360) % 360;
        const activeSectIdx = sectors.findIndex(
          (s) => adjustedAngleForPointer >= s.startAngle && adjustedAngleForPointer < s.endAngle
        );
        if (activeSectIdx !== lastSectorIndex && activeSectIdx !== -1) {
          audioEngine.playTick();
          lastSectorIndex = activeSectIdx;
        }
      }

      if (progress < 1) {
        animFrameId.current = requestAnimationFrame(animateSpin);
      } else {
        // Complete!
        onSpinComplete(winnerPrize.id);
      }
    };

    animFrameId.current = requestAnimationFrame(animateSpin);
  };

  useEffect(() => {
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Generate dynamic lights on rim
  const rimLights = useMemo(() => {
    const lights = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const angleRad = ((angle - 90) * Math.PI) / 180.0;
      const x = 200 + 188 * Math.cos(angleRad);
      const y = 200 + 188 * Math.sin(angleRad);
      
      // Determine glowing color based on phase
      const isGlowing = (i + ledPhase) % 2 === 0;
      lights.push({ id: i, x, y, isGlowing });
    }
    return lights;
  }, [ledPhase]);

  return (
    <div 
      id="lucky-wheel-container" 
      className={`relative flex flex-col items-center justify-center w-full mx-auto select-none transition-all duration-300 ${
        isLarge 
          ? 'max-w-[460px] sm:max-w-[500px] md:max-w-[530px]' 
          : 'max-w-[360px] sm:max-w-[380px] md:max-w-[400px]'
      }`}
    >
      {/* Dynamic ambient halo behind wheel */}
      <div className={`absolute inset-0 rounded-full bg-orange-500/10 blur-3xl transition-all duration-1000 ${isSpinning ? 'scale-110 opacity-70 blur-4xl' : 'scale-95 opacity-40'}`} />

      {/* Pointer (Pointer is styled at top center pointing downwards) */}
      <div className="absolute top-1 z-30 flex flex-col items-center">
        <div 
          id="wheel-pointer"
          className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-rose-600 drop-shadow-md transition-transform duration-100"
          style={{ transform: isSpinning ? 'rotate(5deg)' : 'none' }}
        />
        <div className="w-3 h-3 bg-rose-700 rounded-full -mt-2 shadow-inner border border-rose-500" />
      </div>

      {/* Main Wheel Canvas */}
      <div className="w-full aspect-square relative p-2">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)] overflow-visible"
        >
          {/* External Deep Frame */}
          <circle cx="200" cy="200" r="195" fill="url(#outerRimGrad)" stroke="#E5C158" strokeWidth="3" />
          <circle cx="200" cy="200" r="182" fill="#1C1B1F" />

          {/* Rotating Portion */}
          <g style={{ transform: `rotate(${rotationAngle}deg)`, transformOrigin: '200px 200px' }}>
            {totalQuantity > 0 ? (
              sectors.map((sect, index) => {
                const pathStr = getArcPath(sect.startAngle, sect.endAngle, 180);
                
                // SVG Text label coordinates (place along radial centerline)
                const textAngle = sect.midAngle;
                const radians = ((textAngle - 90) * Math.PI) / 180;
                
                // Place labels about 65% out from center
                const labelRadius = 115;
                const tx = 200 + labelRadius * Math.cos(radians);
                const ty = 200 + labelRadius * Math.sin(radians);

                return (
                  <g 
                    key={sect.prize.id} 
                    id={`sector-${sect.prize.id}`} 
                    className="transition-all duration-300 cursor-help"
                    onMouseEnter={() => setHoveredPrize(sect.prize)}
                    onMouseLeave={() => setHoveredPrize(null)}
                  >
                    <title>{`${sect.prize.name} (数量: ${sect.prize.currentQuantity}, 概率: ${((sect.prize.currentQuantity / totalQuantity) * 100).toFixed(1)}%)`}</title>
                    {/* Color wedge slice */}
                    <path
                      d={pathStr}
                      fill={sect.prize.color}
                      stroke="#1C1B1F"
                      strokeWidth="1.5"
                    />
                    
                    {/* Dynamic Label */}
                    <text
                      transform={`translate(${tx}, ${ty}) rotate(${textAngle})`}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      className="font-sans font-bold text-xs select-none tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      style={{ fontSize: sect.angleSweep < 15 ? '9px' : '11px' }}
                    >
                      {sect.prize.name.length > 8 ? `${sect.prize.name.substring(0, 7)}…` : sect.prize.name}
                    </text>
                  </g>
                );
              })
            ) : (
              // Empty list state placeholder view
              <g>
                <circle cx="200" cy="200" r="180" fill="#EAEAEA" />
                <text
                  x="200"
                  y="200"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill="#71717A"
                  className="font-sans text-sm font-semibold"
                >
                  暂无奖品，请添加奖品！
                </text>
              </g>
            )}

            {/* Hub design lines */}
            <circle cx="200" cy="200" r="48" fill="rgba(28,27,31,0.08)" />
          </g>

          {/* Round perimeter LED bulbs */}
          {rimLights.map((bulb) => (
            <circle
              key={bulb.id}
              cx={bulb.x}
              cy={bulb.y}
              r={bulb.isGlowing ? 4 : 2}
              fill={bulb.isGlowing ? '#FFDE43' : '#F5B041'}
              className="transition-all duration-150"
              style={{
                filter: bulb.isGlowing ? 'drop-shadow(0 0 3px #FFDE43)' : 'none',
              }}
            />
          ))}

          {/* Center clickable bezel */}
          <circle
            cx="200"
            cy="200"
            r="44"
            fill="url(#innerCenterBezel)"
            className="cursor-pointer"
            onClick={handleSpinClick}
          />
          <circle
            cx="200"
            cy="200"
            r="38"
            fill="url(#spinButtonGrad)"
            className="cursor-pointer active:scale-95 transition-transform origin-center"
            style={{ transformOrigin: '200px 200px' }}
            onClick={handleSpinClick}
          />

          {/* Golden bezel shadow */}
          <defs>
            <radialGradient id="outerRimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FBEEAB" />
              <stop offset="60%" stopColor="#DFB23E" />
              <stop offset="100%" stopColor="#9E7618" />
            </radialGradient>
            <radialGradient id="innerCenterBezel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
            <linearGradient id="spinButtonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8A00" />
              <stop offset="100%" stopColor="#E52E71" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center SPIN text label overlay */}
        <div
          id="spin-label-overlay"
          onClick={handleSpinClick}
          className={`absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-white cursor-pointer select-none`}
        >
          <Play size={18} fill="#FFFFFF" className={`text-white transition-all ${isSpinning ? 'scale-0' : 'scale-100 animate-pulse'}`} />
          <span className="text-[14px] font-bold tracking-widest mt-0.5">
            {isSpinning ? '运行中' : '抽奖'}
          </span>
        </div>
      </div>

      {/* Dynamic Hover Prize Fullname tooltip */}
      <div className="h-7 mt-2 flex items-center justify-center w-full z-10">
        {hoveredPrize && totalQuantity > 0 ? (
          <div className="text-xs font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-100/40 px-3 py-0.5 rounded-full flex items-center gap-1.5 animate-fade-in truncate max-w-[95%] shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse-slow shrink-0" style={{ backgroundColor: hoveredPrize.color }} />
            <span className="truncate text-[11px] sm:text-xs">
              <span className="text-slate-800 font-extrabold">{hoveredPrize.name}</span>
              <span className="text-slate-400 font-normal mx-1">|</span>
              数量: <span className="text-indigo-600">{hoveredPrize.currentQuantity}</span>
              <span className="text-slate-400 font-normal mx-1">|</span>
              概率: <span className="text-rose-500 font-extrabold">{((hoveredPrize.currentQuantity / totalQuantity) * 100).toFixed(1)}%</span>
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400/80 font-sans">
            {totalQuantity > 0 ? "💡 鼠标悬停在转盘扇区上，可预览奖品全称及当前胜率" : ""}
          </p>
        )}
      </div>

      {/* Bottom informational bar */}
      <p className="mt-4 text-xs text-slate-500 font-sans text-center">
        {totalQuantity > 0 ? (
          <>
            当前抽奖池共有 <span className="font-semibold text-rose-500">{totalQuantity}</span> 件奖品。
            点击中心开始。
          </>
        ) : (
          <span className="text-rose-500 font-semibold">请在右边添加奖品后即可开始抽奖！</span>
        )}
      </p>
    </div>
  );
};

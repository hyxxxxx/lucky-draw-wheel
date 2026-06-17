import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Award, 
  RotateCcw, 
  Settings, 
  CheckCircle2, 
  Gift, 
  Layout, 
  Sparkle,
  Sparkles,
  Info,
  Play,
  History,
  X,
  AlertTriangle,
  Trash2
} from 'lucide-react';

import { Prize, DrawLog } from './types';
import { LuckyWheel } from './components/LuckyWheel';
import { PrizeManager } from './components/PrizeManager';
import { LogBoard } from './components/LogBoard';
import { ParticleCelebration, ParticleCelebrationRef } from './components/ParticleCelebration';
import { audioEngine } from './utils/audio';
import { DEMO_PRIZES } from './utils/prizes-demo';

export default function App() {
  // State Initialization
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [logs, setLogs] = useState<DrawLog[]>([]);
  const [mode, setMode] = useState<'draw' | 'edit'>('draw');
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  
  // Settings & Toggles
  const [bgmOn, setBgmOn] = useState<boolean>(false);
  const [soundEffectsOn, setSoundEffectsOn] = useState<boolean>(true);
  
  // Spin State Manager
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentWinner, setCurrentWinner] = useState<Prize | null>(null);
  
  // Refs indexers
  const celebrationRef = useRef<ParticleCelebrationRef | null>(null);

  // 1. Initial Load of files from LocalStorage on mount
  useEffect(() => {
    // Prizes
    const savedPrizes = localStorage.getItem('lucky_draw_prizes');
    if (savedPrizes) {
      try { stepAndMigratePrizes(JSON.parse(savedPrizes)); } catch(e) { loadDemoData(true); }
    } else {
      loadDemoData(true);
    }

    // Logs
    const savedLogs = localStorage.getItem('lucky_draw_logs');
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)); } catch (e) { setLogs([]); }
    }

    // Sound states
    const savedSfx = localStorage.getItem('lucky_draw_sfx_on');
    if (savedSfx !== null) {
      setSoundEffectsOn(savedSfx === 'true');
    }
    const savedBgm = localStorage.getItem('lucky_draw_bgm_on');
    if (savedBgm !== null) {
      setBgmOn(savedBgm === 'true');
    }
  }, []);

  // Safe migration of legacy prize lists
  const stepAndMigratePrizes = (loaded: any[]) => {
    const validated = loaded.map((p, idx) => ({
      id: p.id || `prize-${Date.now()}-${idx}`,
      name: p.name || `奖品 ${idx + 1}`,
      initialQuantity: typeof p.initialQuantity === 'number' ? p.initialQuantity : 5,
      currentQuantity: typeof p.currentQuantity === 'number' ? p.currentQuantity : 5,
      color: p.color || '#33FF57',
    }));
    setPrizes(validated);
    localStorage.setItem('lucky_draw_prizes', JSON.stringify(validated));
  };

  // 2. Continuous State Persistance to LocalStorage
  const updateAndSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    localStorage.setItem('lucky_draw_prizes', JSON.stringify(newPrizes));
  };

  const updateAndSaveLogs = (newLogs: DrawLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('lucky_draw_logs', JSON.stringify(newLogs));
  };

  // 3. Audio Handlers & Sync
  useEffect(() => {
    if (bgmOn) {
      audioEngine.startMusic();
    } else {
      audioEngine.stopMusic();
    }
    localStorage.setItem('lucky_draw_bgm_on', bgmOn.toString());
    return () => {
      audioEngine.stopMusic();
    };
  }, [bgmOn]);

  useEffect(() => {
    localStorage.setItem('lucky_draw_sfx_on', soundEffectsOn.toString());
  }, [soundEffectsOn]);

  // Try to play sound engine when user touches anywhere to bypass Chrome's gestures policy
  const handleUserInteracted = () => {
    if (bgmOn) {
      audioEngine.startMusic();
    }
  };

  // 4. Operations & Actions
  const handleAddPrize = (name: string, qty: number, color: string) => {
    const newPrize: Prize = {
      id: `prize-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      initialQuantity: qty,
      currentQuantity: qty,
      color
    };
    updateAndSavePrizes([...prizes, newPrize]);
  };

  const handleDeletePrize = (id: string) => {
    const filtered = prizes.filter((p) => p.id !== id);
    updateAndSavePrizes(filtered);
  };

  const handleUpdateQuantity = (id: string, initial: number, current: number) => {
    const updated = prizes.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          initialQuantity: initial,
          currentQuantity: current
        };
      }
      return p;
    });
    updateAndSavePrizes(updated);
  };

  // Reset all current quantities back to their custom initial values
  const handleResetQuantities = () => {
    setConfirmConfig({
      isOpen: true,
      title: '重置所有奖品数量？',
      message: '确定要把所有奖品的剩余数量恢复为它们设定的初始额度吗？',
      type: 'info',
      onConfirm: () => {
        const reset = prizes.map((p) => ({
          ...p,
          currentQuantity: p.initialQuantity
        }));
        updateAndSavePrizes(reset);
        if (soundEffectsOn) {
          audioEngine.playTick();
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Completely wipe pool clean
  const handleClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: '清空所有配置奖品？',
      message: '此操作将清空大转盘中的全部奖品，你需要重新新增或初始化奖品。',
      type: 'danger',
      onConfirm: () => {
        updateAndSavePrizes([]);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Seed demo templates
  const loadDemoData = (isSilent = false) => {
    if (isSilent) {
      const cloned = DEMO_PRIZES.map((p) => ({ ...p, id: `demo-${Math.random().toString(36).substring(4)}` }));
      updateAndSavePrizes(cloned);
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: '要载入演示数据吗？',
      message: '此操作会使用“特等奖 iPhone、一等奖 iPad”等经典演示奖品列表，覆盖并替换掉你现有的全部奖品。',
      type: 'warning',
      onConfirm: () => {
        const cloned = DEMO_PRIZES.map((p) => ({ ...p, id: `demo-${Math.random().toString(36).substring(4)}` }));
        updateAndSavePrizes(cloned);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Clear log history
  const handleClearLogs = () => {
    setConfirmConfig({
      isOpen: true,
      title: '确定清空全部中奖记录吗？',
      message: '此操作不可恢复，已抽出的全部中奖记录将被永久清空。',
      type: 'danger',
      onConfirm: () => {
        updateAndSaveLogs([]);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setShowLogsModal(false);
      }
    });
  };

  // 5. Spin Lifecycle Integration
  const handleSpinStart = (winnerId: string) => {
    setIsSpinning(true);
    setCurrentWinner(null);
  };

  const handleSpinComplete = (winnerId: string) => {
    setIsSpinning(false);
    
    // Find the drawing winner object
    const winner = prizes.find((p) => p.id === winnerId);
    if (!winner) return;

    // Trigger local audio fanfare
    if (soundEffectsOn) {
      audioEngine.playWin();
    }

    // Burst visual particles!
    celebrationRef.current?.burst(true);

    // Update remaining count on screen
    const updatedPrizes = prizes.map((p) => {
      if (p.id === winnerId) {
        return {
          ...p,
          currentQuantity: Math.max(0, p.currentQuantity - 1)
        };
      }
      return p;
    });
    updateAndSavePrizes(updatedPrizes);

    // Append winner logs
    const nowLocalDate = new Date();
    const formattedTime = nowLocalDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newLog: DrawLog = {
      id: `log-${Date.now()}`,
      prizeId: winnerId,
      prizeName: winner.name,
      timestamp: formattedTime
    };
    updateAndSaveLogs([newLog, ...logs]);

    // Show Celebration modal dialog
    setCurrentWinner(winner);
  };

  return (
    <div 
      id="app-root-shell" 
      onClick={handleUserInteracted}
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased select-none selection:bg-indigo-500/10"
    >
      {/* Particle element */}
      <ParticleCelebration ref={celebrationRef} />

      {/* Primary Top Header */}
      <header id="app-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="relative w-9 h-9 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
              <Award className="text-white transform rotate-3" size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                幸运大抽奖
              </h1>
              <p className="text-[11px] text-slate-400 font-sans tracking-wide">中奖概率随数量实时调整</p>
            </div>
          </div>

          {/* Centered Winner Notice Ticker (in Draw mode) */}
          {mode === 'draw' && (
            <div className="flex items-center justify-center w-full md:w-auto md:flex-1 max-w-sm lg:max-w-md mx-auto my-1 md:my-0">
              <button
                type="button"
                onClick={() => setShowLogsModal(true)}
                className="flex items-center gap-2 bg-amber-50/70 hover:bg-amber-100/85 border border-amber-100/60 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-900 shadow-sm w-full md:w-auto justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group text-left animate-fade-in"
                title="点击展开查看全部中奖记录"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <Sparkles size={13} className="text-amber-500 animate-pulse shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs text-amber-900 leading-none">
                    {logs.length > 0 ? (
                      <>
                        最新中奖: <span className="font-extrabold text-indigo-700">{logs[0].prizeName}</span>
                        <span className="text-slate-400 font-normal px-1">|</span>
                        <span className="text-amber-750 font-mono text-[10px]">{logs[0].timestamp}</span>
                      </>
                    ) : (
                      "暂无中奖记录，快去开启好运吧！"
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/60 hover:bg-white text-amber-700 shrink-0 ml-1 group-hover:scale-110 transition-all">
                  <History size={11} className="stroke-[2.5]" />
                </div>
              </button>
            </div>
          )}

          {/* Mode Switcher & Music Toggles */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Elegant Mode Toggle Segments */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMode('draw')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'draw'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Play size={12} fill={mode === 'draw' ? 'currentColor' : 'none'} />
                抽奖模式
              </button>
              <button
                onClick={() => setMode('edit')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'edit'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Settings size={12} />
                编辑模式
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Ambient BGM trigger */}
              <button
                onClick={() => setBgmOn(!bgmOn)}
                className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                  bgmOn ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="背景音乐"
              >
                {bgmOn ? <Volume2 size={15} className="animate-pulse" /> : <VolumeX size={15} />}
              </button>

              {/* Sound FX click tick trigger */}
              <button
                onClick={() => setSoundEffectsOn(!soundEffectsOn)}
                className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                  soundEffectsOn ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="按键音效"
              >
                {soundEffectsOn ? <CheckCircle2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Arena */}
      <main 
        id="app-main-content" 
        className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center transition-all ${
          mode === 'draw' 
            ? 'max-w-4xl py-6 sm:py-10' 
            : 'max-w-7xl lg:grid lg:grid-cols-12 gap-6 lg:gap-8 lg:items-start'
        }`}
      >
        
        {mode === 'draw' ? (
          /* Draw mode: Wheel is primary center space, enlarged and centered */
          <section id="wheel-column" className="flex flex-col items-center justify-center bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-100 w-full min-h-[500px] max-w-2xl">
            <div className="w-full flex items-center justify-between mb-6 border-b border-slate-50 pb-3">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkle size={13} className="text-indigo-500 animate-pulse" />
                幸运大转盘
              </span>
              <span className="text-xs text-slate-405">点击大转盘中心开始</span>
            </div>

            <LuckyWheel
              prizes={prizes}
              isSpinning={isSpinning}
              onSpinStart={handleSpinStart}
              onSpinComplete={handleSpinComplete}
              soundEffectsOn={soundEffectsOn}
              isLarge={true}
            />
          </section>
        ) : (
          <>
            {/* Edit mode: Wheel is preview element on left (5 columns) */}
            <section id="preview-column" className="lg:col-span-5 flex flex-col items-center justify-center bg-white rounded-3xl p-6 shadow-sm border border-slate-100 w-full min-h-[400px]">
              <div className="w-full flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                  <Sparkle size={12} className="text-indigo-500" />
                  效果预览
                </span>
                <span className="text-xs text-slate-400">设置实时生效</span>
              </div>

              <LuckyWheel
                prizes={prizes}
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
                onSpinComplete={handleSpinComplete}
                soundEffectsOn={soundEffectsOn}
                isLarge={false}
              />
            </section>

            {/* Edit mode: Priest/Prize Editor is primary on right (7 columns) */}
            <section id="edit-tools-column" className="lg:col-span-7 w-full flex flex-col">
              <PrizeManager
                prizes={prizes}
                onAddPrize={handleAddPrize}
                onDeletePrize={handleDeletePrize}
                onUpdateQuantity={handleUpdateQuantity}
                onResetQuantities={handleResetQuantities}
                onClearAll={handleClearAll}
                onLoadDemo={loadDemoData}
              />
            </section>
          </>
        )}

      </main>

      {/* Information Banner Help */}
      <section id="info-section" className="hidden sm:block max-w-7xl w-full mx-auto px-6 pb-6 text-xs text-slate-400">
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-start gap-2.5 max-w-xl mx-auto">
          <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            概率说明：中奖概率 = 剩余数量 / 总数。每次抽中奖品后，此奖品数量扣减，其余奖品的中奖概率自动等比变大。数据保存在本地浏览器 LocalStorage 中。
          </p>
        </div>
      </section>

      {/* Branding Footer */}
      <footer className="py-4 border-t border-slate-100 text-center text-[11px] text-slate-400 mt-auto bg-white/40">
        <p>© 2026 幸运抽奖工具 • 数据储存在本地浏览器缓存中</p>
      </footer>

      {/* Logs Modal Dialog Popup */}
      {showLogsModal && (
        <div 
          id="logs-modal-overlay" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-fade-in text-left" 
          onClick={() => setShowLogsModal(false)}
        >
          <div 
            id="logs-modal-card" 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl relative transform scale-95 animate-scale-up flex flex-col max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Embedded LogBoard container */}
            <div className="flex-1 overflow-hidden h-full flex flex-col">
              <LogBoard 
                logs={logs}
                onClearLogs={handleClearLogs}
              />
              {/* Bottom close action footer bar */}
              <div id="logs-modal-footer" className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogsModal(false);
                    if (soundEffectsOn) audioEngine.playTick();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center"
                >
                  返回大转盘
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Win Presentation Overlay Banner Modal */}
      {currentWinner && (
        <div id="winner-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div 
            id="winner-modal-card" 
            className="w-full max-w-xs bg-white rounded-3xl p-5 text-center shadow-2xl border border-slate-100 relative overflow-hidden transform scale-95 animate-scale-up"
          >
            {/* Visual sparkles header */}
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: currentWinner.color }} />
            
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 relative shadow-md" style={{ backgroundColor: `${currentWinner.color}15` }}>
              <Gift className="stroke-[2]" size={28} style={{ color: currentWinner.color }} />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] text-yellow-850 font-bold shadow-sm animate-ping" />
            </div>

            <h3 className="text-xs font-bold text-rose-500 tracking-widest uppercase mb-1 flex items-center justify-center gap-1">
              <Sparkles className="inline" size={12} />
              恭喜中奖！
              <Sparkles className="inline" size={12} />
            </h3>
            
            <h4 className="text-lg font-extrabold text-slate-800 tracking-tight px-3 py-1.5 bg-slate-50 rounded-xl inline-block max-w-full truncate mb-3 select-text">
              {currentWinner.name}
            </h4>

            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5 leading-relaxed">
              该奖品剩余可抽数量已同步减 1，转盘扇区及中奖概率已实时更新。
            </p>

            <button
              onClick={() => {
                setCurrentWinner(null);
                if (soundEffectsOn) {
                  audioEngine.playTick();
                }
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              确认并继续
            </button>
          </div>
        </div>
      )}

      {/* Custom Elegant React Confirm Dialog Modal */}
      {confirmConfig.isOpen && (
        <div 
          id="custom-confirm-overlay" 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in text-left cursor-default select-none"
          onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            id="custom-confirm-card" 
            className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 relative overflow-hidden transform scale-95 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Accent Top Bar */}
            <div 
              className={`absolute top-0 inset-x-0 h-1.5 ${
                confirmConfig.type === 'danger' ? 'bg-rose-500' : 
                confirmConfig.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
              }`} 
            />

            {/* Styled Circle Icon */}
            <div 
              className={`w-11 h-11 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm ${
                confirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-500' : 
                confirmConfig.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {confirmConfig.type === 'danger' ? (
                <Trash2 size={20} className="stroke-[2.2]" />
              ) : confirmConfig.type === 'warning' ? (
                <AlertTriangle size={20} className="stroke-[2.2]" />
              ) : (
                <RotateCcw size={18} className="stroke-[2.2]" />
              )}
            </div>

            <h3 className="text-sm font-extrabold text-slate-900 mb-2">
              {confirmConfig.title}
            </h3>
            
            <p className="text-[11px] text-slate-500 leading-relaxed mb-6 px-1">
              {confirmConfig.message}
            </p>

            {/* Action buttons side-by-side */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                  if (soundEffectsOn) audioEngine.playTick();
                }}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirm();
                  if (soundEffectsOn) audioEngine.playTick();
                }}
                className={`py-2 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
                  confirmConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10' : 
                  confirmConfig.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' : 
                  'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

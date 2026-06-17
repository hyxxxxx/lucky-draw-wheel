import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { Prize } from '../types';

interface PrizeManagerProps {
  prizes: Prize[];
  onAddPrize: (name: string, quantity: number, color: string) => void;
  onDeletePrize: (id: string) => void;
  onUpdateQuantity: (id: string, initial: number, current: number) => void;
  onResetQuantities: () => void;
  onClearAll: () => void;
  onLoadDemo: () => void;
}

const PRESET_COLORS = [
  '#FF5252', // Coral Red
  '#FF9F43', // Warm Amber
  '#2ECC71', // Emerald Green
  '#0984E3', // Azure Blue
  '#6C5CE7', // Royal Purple
  '#FD79A8', // Rose Pink
  '#00CEC9', // Teal Green
  '#F1C40F', // Sunflower Yellow
  '#E67E22', // Deep Orange
  '#273C75', // Dark Navy
  '#44BD32', // Leaf Green
  '#8C7AE6', // Amethyst Purple
];

export const PrizeManager: React.FC<PrizeManagerProps> = ({
  prizes,
  onAddPrize,
  onDeletePrize,
  onUpdateQuantity,
  onResetQuantities,
  onClearAll,
  onLoadDemo,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(5);
  const [colorIndex, setColorIndex] = useState(0);

  const totalQuantity = prizes.reduce((sum, p) => sum + p.currentQuantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || quantity <= 0) return;

    const chosenColor = PRESET_COLORS[colorIndex % PRESET_COLORS.length];
    onAddPrize(name.trim(), quantity, chosenColor);
    
    setName('');
    // Alternate color for next addition
    setColorIndex((prev) => prev + 1);
  };

  return (
    <div id="prize-manager-container" className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-indigo-500" size={16} />
            配置奖品列表
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">中奖概率随奖品剩余数量动态缩减</p>
        </div>
      </div>

      {/* Form to Add Prize */}
      <div className="p-5 border-b border-slate-100 bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prize-name" className="block text-xs font-medium text-slate-500 mb-1">奖品名称</label>
              <input
                id="prize-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：特等奖 iPhone"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                maxLength={20}
              />
            </div>
            <div>
              <label htmlFor="prize-qty" className="block text-xs font-medium text-slate-500 mb-1">初始数量</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-semibold"
                >
                  -
                </button>
                <input
                  id="prize-qty"
                  type="number"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setQuantity(isNaN(val) ? 1 : Math.max(1, val));
                  }}
                  className="w-full text-center bg-transparent border-none text-sm outline-none font-semibold text-slate-700"
                  min={1}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-semibold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">扇区颜色</label>
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full border border-white shadow-sm flex-shrink-0 transition-all"
                  style={{ backgroundColor: PRESET_COLORS[colorIndex % PRESET_COLORS.length] }}
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c, idx) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorIndex(idx)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${idx === colorIndex % PRESET_COLORS.length ? 'scale-125 ring-2 ring-indigo-500/50' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || quantity <= 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm shadow-indigo-600/10 transition-colors self-end h-10"
            >
              <Plus size={16} />
              添加奖品
            </button>
          </div>
        </form>
      </div>

      {/* Prize List */}
      <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-none p-5 space-y-3">
        {prizes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-450">
            <AlertTriangle size={28} className="text-amber-500 mb-2" />
            <p className="text-sm font-semibold">暂无奖品</p>
            <p className="text-xs text-slate-400 mt-0.5">请添加奖品或点击下方一键初始化</p>
            <button
              onClick={onLoadDemo}
              aria-label="一键初始化演示奖品"
              className="mt-3 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-all"
            >
              一键初始化演示奖品
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prizes.map((p) => {
              const probability = totalQuantity > 0 ? (p.currentQuantity / totalQuantity) * 100 : 0;
              return (
                <div key={p.id} id={`manager-item-${p.id}`} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate leading-snug">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                          概率 {(probability).toFixed(1)}%
                        </span>
                        {p.currentQuantity === 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded">
                            已抽完
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Actions / Operations */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center rounded-md border border-slate-200 bg-slate-50/50 p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(p.id, p.initialQuantity, Math.max(0, p.currentQuantity - 1))}
                        disabled={p.currentQuantity <= 0}
                        aria-label="减少现有数量"
                        className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-500 hover:bg-white active:bg-slate-100 disabled:opacity-45 disabled:hover:bg-transparent transition-all"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-700 min-w-[2.5rem] text-center">
                        {p.currentQuantity}<span className="text-slate-400 font-medium font-mono">/{p.initialQuantity}</span>
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(p.id, p.initialQuantity, p.currentQuantity + 1)}
                        aria-label="增加现有数量"
                        className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-500 hover:bg-white active:bg-slate-100 transition-all"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onDeletePrize(p.id)}
                      aria-label="删除此项奖品"
                      className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Actions footer */}
      {prizes.length > 0 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
          <button
            onClick={onResetQuantities}
            className="px-2 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors group"
          >
            <RotateCcw size={14} className="group-hover:rotate-45 transition-transform" />
            <span>重置数量</span>
          </button>
          
          <button
            onClick={onClearAll}
            className="px-2 py-2 border border-slate-200 bg-white hover:bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-200 text-xs font-bold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
          >
            <Trash2 size={14} />
            <span>清空奖品</span>
          </button>
          
          <button
            onClick={onLoadDemo}
            className="px-2 py-2 border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
          >
            <RefreshCw size={14} />
            <span>初始数据</span>
          </button>
        </div>
      )}
    </div>
  );
};

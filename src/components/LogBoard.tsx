import React from 'react';
import { Gift, Trash2, Clock, Sparkles } from 'lucide-react';
import { DrawLog } from '../types';

interface LogBoardProps {
  logs: DrawLog[];
  onClearLogs: () => void;
}

export const LogBoard: React.FC<LogBoardProps> = ({ logs, onClearLogs }) => {
  const latestLog = logs[0];

  return (
    <div id="log-board-container" className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-amber-500 animate-pulse" size={16} />
            中奖公告与记录
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">展示抽奖出的所有中奖结果</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} />
            清空日志
          </button>
        )}
      </div>

      {/* Live Marquee Scrolling Ticker of the Absolute Latest Winner */}
      {latestLog && (
        <div className="bg-amber-500/10 border-b border-amber-500/15 py-2.5 px-4 overflow-hidden relative flex items-center gap-2">
          <span className="flex h-2 w-2 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex-shrink-0">最新播报:</span>
          <div className="w-full overflow-hidden relative">
            <div className="animate-pulse whitespace-nowrap text-xs font-semibold text-slate-700 font-sans">
              恭喜！在 <span className="text-rose-600 font-bold">{latestLog.timestamp}</span> 抽中了 <span className="text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded shadow-sm border border-indigo-100">{latestLog.prizeName}</span> 🎉
            </div>
          </div>
        </div>
      )}

      {/* Log History list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[300px] sm:max-h-none">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 h-full">
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-slate-350">
              <Gift size={20} />
            </div>
            <p className="text-sm font-semibold">暂无中奖记录</p>
            <p className="text-xs text-slate-400 mt-0.5">转动轮盘进行抽奖</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log, index) => (
              <div
                key={log.id}
                id={`log-item-${log.id}`}
                className={`flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-50 transition-all ${index === 0 ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-slate-50/30'}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Gift size={14} className={index === 0 ? 'animate-bounce' : ''} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${index === 0 ? 'text-indigo-950 font-extrabold' : 'text-slate-700'}`}>
                      {log.prizeName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                      <Clock size={11} />
                      <span className="text-[10px] font-medium font-mono">{log.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    #{logs.length - index} 次抽奖
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

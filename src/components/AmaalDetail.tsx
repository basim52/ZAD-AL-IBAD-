import React, { useState } from 'react';
import { DailyWork } from '../types';
import { 
  X, Type, Copy, CheckCircle2, RotateCcw, Plus, Check, Edit3, Trash2
} from 'lucide-react';

interface AmaalDetailProps {
  work: DailyWork;
  onClose: () => void;
  onToggleComplete: (id: string) => void;
  onEdit?: (work: DailyWork) => void;
  onDelete?: (id: string) => void;
}

export default function AmaalDetail({ 
  work, 
  onClose, 
  onToggleComplete, 
  onEdit, 
  onDelete 
}: AmaalDetailProps) {
  const [fontSize, setFontSize] = useState<number>(22); // default font size for Arabic text
  const [counter, setCounter] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(33); // default Islamic counting goal
  const [copied, setCopied] = useState(false);

  const incrementCounter = () => {
    // Vibrate device if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    setCounter(prev => {
      const next = prev + 1;
      // Play a soft synthetic beep or click
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(next % targetCount === 0 ? 880 : 440, audioCtx.currentTime); // higher frequency at goal
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
      } catch (e) {
        // Fallback if audio context block or not supported
      }
      return next;
    });
  };

  const handleCopy = () => {
    const textToCopy = work.content || work.description;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div 
        id={`amaal-detail-modal-${work.id}`}
        className="w-full max-w-2xl overflow-hidden border bg-stone-50 border-stone-250 shadow-2xl rounded-2xl flex flex-col h-[90vh]"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-900 border-stone-200 text-stone-100">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-400 text-emerald-950 rounded-full">
                {work.type}
              </span>
              <span className="text-xs text-stone-300">
                • {work.time}
              </span>
            </div>
            <h2 className="font-serif text-xl font-bold mt-1 text-white">{work.title}</h2>
          </div>
          <button 
            id="close-detail-btn"
            onClick={onClose} 
            className="p-1 rounded-full text-stone-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Main Body - Split Layout if content exists or simple reading flow */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col md:flex-row gap-6">
          
          {/* Main Text / Supplication Area */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Font Adjuster Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 text-stone-600 mb-4 bg-stone-50/50 sticky top-0">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span className="text-xs font-semibold">حجم الخط: {fontSize}px</span>
              </div>
              <input 
                id="font-size-slider"
                type="range" 
                min="16" 
                max="36" 
                value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-28 accent-emerald-800 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Supplication Reader Core */}
            <div className="flex-1 select-text bg-white border border-stone-200 shadow-inner rounded-xl p-5 md:p-6 overflow-y-auto max-h-[42vh] md:max-h-none">
              {work.content ? (
                <div 
                  className="font-serif text-stone-850 leading-relaxed text-right whitespace-pre-line"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {work.content}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-stone-400">إرشادات الأداء:</div>
                  <div 
                    className="font-serif text-stone-850 leading-loose text-right whitespace-pre-line bg-amber-50/40 p-4 border border-amber-105/50 rounded-lg"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {work.description}
                  </div>
                  <div className="text-xs text-stone-400 mt-6 text-center italic">
                    لا يتوفر نص قراءة كامل لهذا العمل حالياً. يمكنك تتبع الأداء والاستغفار.
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Actions */}
            <div className="mt-4 flex items-center gap-3">
              <button
                id="copy-text-btn"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              {work.isCustom && (
                <>
                  <button
                    id="edit-custom-btn"
                    onClick={() => {
                      if (onEdit) onEdit(work);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    id="delete-custom-btn"
                    onClick={() => {
                      if (onDelete && window.confirm('هل أنت متأكد من حذف هذا العمل نهائياً؟')) {
                        onDelete(work.id);
                        onClose();
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Tasbih & Completion Widget */}
          <div className="w-full md:w-56 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-emerald-900 tracking-wider mb-2 text-center">سبحة الأذكار الرقمية</h3>
              
              {/* Presets */}
              <div className="flex justify-center gap-1.5 mb-4">
                {[33, 34, 100].map(val => (
                  <button
                    key={val}
                    id={`tasbih-preset-${val}`}
                    onClick={() => {
                      setTargetCount(val);
                      setCounter(0);
                    }}
                    className={`px-2 py-0.5 text-xs font-bold rounded-full border transition-all ${
                      targetCount === val
                        ? 'bg-emerald-850 text-white border-transparent'
                        : 'bg-white text-emerald-800 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
                <button
                  id="tasbih-preset-free"
                  onClick={() => {
                    setTargetCount(9999);
                    setCounter(0);
                  }}
                  className={`px-2 py-0.5 text-xs font-bold rounded-full border transition-all ${
                    targetCount === 9999
                      ? 'bg-emerald-850 text-white border-transparent'
                      : 'bg-white text-emerald-800 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  حرّ
                </button>
              </div>

              {/* Central Counter Display Widget */}
              <div className="flex flex-col items-center justify-center py-4 bg-white border border-stone-200 rounded-xl shadow-sm relative">
                <span className="text-stone-400 text-[10px] font-mono leading-none mb-1">Dhikr count</span>
                <span className="text-3xl font-mono font-bold text-emerald-900 leading-none">
                  {counter}
                </span>
                {targetCount !== 9999 && (
                  <span className="text-[10px] font-mono text-stone-500 mt-1">
                    الهدف: {targetCount}
                  </span>
                )}
                
                {/* Visual completion check inside target */}
                {counter >= targetCount && targetCount !== 9999 && (
                  <div className="absolute top-2 right-2 text-emerald-600 animate-bounce">
                    <Check className="w-4 h-4 stroke-[3px]" />
                  </div>
                )}
              </div>

              {/* Large Tap Trigger Bead */}
              <button
                id="tasbih-tap-bead"
                onClick={incrementCounter}
                className="w-full mt-4 h-24 bg-gradient-to-br from-emerald-800 to-emerald-950 active:from-emerald-900 active:to-black text-white rounded-xl shadow-lg border border-emerald-700/50 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Plus className="w-6 h-6 text-amber-400 group-active:scale-125 transition-transform" />
                <span className="text-xs font-semibold mt-1">انقر للتسبيح</span>
              </button>

              <button
                id="reset-counter-btn"
                onClick={() => setCounter(0)}
                className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-800 rounded bg-stone-100 border border-stone-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة تعيين المسبحة</span>
              </button>
            </div>

            {/* Completion Activation Button */}
            <div className="pt-3 border-t border-emerald-100">
              <button
                id={`toggle-complete-detail-${work.id}`}
                onClick={() => onToggleComplete(work.id)}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm shadow transition-all ${
                  work.isCompleted
                    ? 'bg-emerald-100 text-emerald-850 hover:bg-emerald-200 hover:text-emerald-900'
                    : 'bg-emerald-800 text-white hover:bg-emerald-900'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${work.isCompleted ? 'text-emerald-700' : 'text-amber-400'}`} />
                <span>{work.isCompleted ? 'تم إنجاز العمل' : 'وضع علامة إنجاز'}</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

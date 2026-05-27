import React, { useState, useEffect } from 'react';
import { Plus, Minus, Info, CheckCircle2, RotateCcw } from 'lucide-react';

interface QadaItem {
  id: string;
  name: string;
  count: number;
  completed: number;
  color: string;
}

const DEFAULT_QADA_ITEMS: QadaItem[] = [
  { id: 'fajr', name: 'صلاة الفجر', count: 0, completed: 0, color: 'from-amber-500 to-amber-600' },
  { id: 'dhuhr_asr', name: 'صلاتي الظهر والعصر', count: 0, completed: 0, color: 'from-emerald-600 to-emerald-700' },
  { id: 'maghrib_isha', name: 'صلاتي المغرب والعشاء', count: 0, completed: 0, color: 'from-blue-600 to-blue-750' },
  { id: 'fasting', name: 'صيام شهر رمضان المترتب', count: 0, completed: 0, color: 'from-rose-500 to-rose-600' },
  { id: 'ayat', name: 'صلاة الآيات (الكسوف والخسوف)', count: 0, completed: 0, color: 'from-purple-500 to-purple-600' },
];

export default function QadaTracker() {
  const [items, setItems] = useState<QadaItem[]>([]);
  const [dailyRate, setDailyRate] = useState<number>(1); // كم يقضي باليوم
  const [isEditingTargets, setIsEditingTargets] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('daily_amaal_qada_v1');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        setItems(DEFAULT_QADA_ITEMS);
      }
    } else {
      setItems(DEFAULT_QADA_ITEMS);
    }

    const savedRate = localStorage.getItem('daily_amaal_qada_daily_rate_v1');
    if (savedRate) {
      setDailyRate(parseInt(savedRate, 10));
    }
  }, []);

  const saveItems = (updated: QadaItem[]) => {
    setItems(updated);
    localStorage.setItem('daily_amaal_qada_v1', JSON.stringify(updated));
  };

  const handleUpdateTarget = (id: string, val: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const count = Math.max(0, val);
        return { ...item, count };
      }
      return item;
    });
    saveItems(updated);
  };

  const handleUpdateCompleted = (id: string, diff: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const completed = Math.max(0, Math.min(item.count, item.completed + diff));
        return { ...item, completed };
      }
      return item;
    });
    saveItems(updated);
  };

  const handleRateChange = (val: number) => {
    const rate = Math.max(1, val);
    setDailyRate(rate);
    localStorage.setItem('daily_amaal_qada_daily_rate_v1', String(rate));
  };

  // Reset progress only
  const handleResetProgress = (id: string) => {
    if (window.confirm('هل أنت متأكد من تصفير وإعادة تعيين ما تم قضاؤه لهذا البند؟')) {
      const updated = items.map(item => item.id === id ? { ...item, completed: 0 } : item);
      saveItems(updated);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" id="qada-tracker-container">
      {/* Title & Introduction */}
      <div className="text-right space-y-1">
        <h2 className="text-xl md:text-2xl font-serif font-extrabold text-emerald-950 flex items-center gap-2">
          <span>⚖️</span>
          <span>سجل قضاء الصلوات والصيام الفائت</span>
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          تنظيم وجدولة الصلوات والفرائض اليومية الفائتة والصوم المترتب بذمتك لمتابعة أدائها بشكل تدريجي ومستمر.
        </p>
      </div>

      {/* Target Planning Board */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 text-stone-850">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <h4 className="font-bold text-xs md:text-sm">التخطيط ومعدل القضاء اليومي</h4>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed md:max-w-xl">
            حدّد معدل القضاء اليومي (مثلاً صلاة يوم واحد أو يومين في كل يوم حقيقي) لحساب المدة الزمنية التقريبية المطلوبة لإتمام جميع الفوائت بذمتك وإبرام عهدك مع الله.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-bold text-stone-700">معدل قضائي اليومي:</span>
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2 py-1 shadow-sm">
              <button 
                onClick={() => handleRateChange(dailyRate - 1)}
                className="p-1 hover:bg-stone-100 rounded text-stone-500 cursor-pointer text-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-extrabold text-xs px-2 min-w-[20px] text-center">{dailyRate}</span>
              <button 
                onClick={() => handleRateChange(dailyRate + 1)}
                className="p-1 hover:bg-stone-100 rounded text-stone-500 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] text-emerald-800 font-bold">صلوات يومية في اليوم الواحد</span>
          </div>
        </div>

        <button
          onClick={() => setIsEditingTargets(!isEditingTargets)}
          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
            isEditingTargets 
              ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950' 
              : 'bg-emerald-900 hover:bg-emerald-800 text-white'
          }`}
        >
          {isEditingTargets ? '✅ حفظ الأهداف والفوائت الكلية' : '⚙️ تعديل حجم الفوائت الكلي'}
        </button>
      </div>

      {/* Grid of trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => {
          const remaining = Math.max(0, item.count - item.completed);
          const percent = item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0;
          const daysToComplete = remaining > 0 ? Math.ceil(remaining / dailyRate) : 0;

          return (
            <div 
              key={item.id}
              className="bg-white border border-stone-200/80 rounded-2xl p-4.5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Row: Info and Title */}
              <div className="space-y-1.5 relative z-10 text-right">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-lg bg-gradient-to-r ${item.color} text-white shadow-sm`}>
                    {item.name}
                  </span>
                  
                  {item.count > 0 && remaining === 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>قُضي بالكامل 🎉</span>
                    </span>
                  )}
                </div>

                {isEditingTargets ? (
                  <div className="pt-2 flex items-center gap-2 justify-start">
                    <span className="text-xs text-stone-600 font-bold">العدد الإجمالي المطلوب (بالأيام):</span>
                    <input 
                      type="number"
                      value={item.count}
                      onChange={(e) => handleUpdateTarget(item.id, parseInt(e.target.value, 10) || 0)}
                      className="w-20 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-black font-mono text-center focus:outline-emerald-800"
                    />
                  </div>
                ) : (
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-bold font-serif text-stone-850">{item.completed}</span>
                      <span className="text-xs text-stone-400 mx-1">/</span>
                      <span className="text-xs text-stone-500 font-bold">{item.count} يوم مطلوب</span>
                    </div>
                    {item.count > 0 && remaining > 0 && (
                      <span className="text-[10px] text-stone-400 font-medium">
                        متبقي: {remaining} يوم (ينتهي في {daysToComplete} يوم تقريباً)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {item.count > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-stone-500 font-bold font-mono">
                    <span>نسبة الإنجاز: {percent}%</span>
                    <span>{item.completed} من {item.count}</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} transition-all duration-505`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Counters (Only when not setup edit mode) */}
              {!isEditingTargets && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResetProgress(item.id)}
                      className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-500 rounded-lg transition-all cursor-pointer"
                      title="إعادة تعيين وبدء من الصفر"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Big controls */}
                    <button
                      onClick={() => handleUpdateCompleted(item.id, -5)}
                      disabled={item.completed <= 0}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-600 rounded-lg text-[10px] font-bold cursor-pointer select-none"
                    >
                      -٥
                    </button>
                    <button
                      onClick={() => handleUpdateCompleted(item.id, -1)}
                      disabled={item.completed <= 0}
                      className="p-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-600 rounded-lg cursor-pointer max-h-8"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      onClick={() => handleUpdateCompleted(item.id, 1)}
                      disabled={item.completed >= item.count}
                      className="p-1 px-2.5 bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 min-h-[30px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>قضيت صلاة يوم</span>
                    </button>

                    <button
                      onClick={() => handleUpdateCompleted(item.id, 5)}
                      disabled={item.completed >= item.count}
                      className="px-2 py-1 bg-emerald-100 text-emerald-950 hover:bg-emerald-200 disabled:opacity-50 rounded-lg text-[10px] font-bold cursor-pointer select-none"
                    >
                      +٥ أيام
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guide Card */}
      <div className="bg-gradient-to-br from-stone-50 to-stone-100/60 rounded-2xl border border-stone-200 p-4 space-y-2">
        <h4 className="font-serif font-black text-xs md:text-sm text-emerald-950">💡 فقه وفضل قضاء الفوائت</h4>
        <ul className="text-stone-600 text-[11px] list-disc list-inside space-y-1 text-right leading-relaxed pr-1">
          <li>يجب قضاء الصلوات اليومية المفروضة التي فاتت في أوقاتها للبالغ العاقل باتفاق الفقهاء.</li>
          <li>صلاة القضاء تؤدّى بنفس هيئة الصلاة الفائتة المقصرة قصراً والكاملة تماماً.</li>
          <li>يُنصح بالالتزام بجدول مريح (مثال: قضاء فريضة فائتة مع كل فريضة حاضرة) لتجنّب المشقّة وضمان ثبات الالتزام العبادي.</li>
        </ul>
      </div>
    </div>
  );
}

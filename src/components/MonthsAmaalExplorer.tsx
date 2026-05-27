import React, { useState } from 'react';
import { MonthlyWork, DailyWork } from '../types';
import { MONTHLY_RAJAB_AMAAL } from '../data/monthlyRajabAmaal';
import { MONTHLY_SHABAN_AMAAL } from '../data/monthlyShabanAmaal';
import { MONTHLY_RAMADAN_AMAAL } from '../data/monthlyRamadanAmaal';
import { 
  BookOpen, Search, CheckCircle, Circle, Sparkles, Moon, Sun, 
  Calendar, ChevronDown, ChevronUp, RotateCcw, Trophy, AlignRight, Type, Feather
} from 'lucide-react';

interface MonthsAmaalExplorerProps {
  selectedDateStr: string;
  history: Record<string, string[]>;
  onToggleComplete: (id: string) => void;
}

export default function MonthsAmaalExplorer({ 
  selectedDateStr, 
  history, 
  onToggleComplete 
}: MonthsAmaalExplorerProps) {
  // Configured Months
  const [selectedMonth, setSelectedMonth] = useState<'رجب' | 'شعبان' | 'رمضان'>('رجب');
  
  // Search and view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('الكل');
  const [dayTypeFilter, setDayTypeFilter] = useState<'الكل' | 'يوم' | 'ليلة'>('الكل');
  const [dayNumberFilter, setDayNumberFilter] = useState<string>('الكل');
  
  // Card Expansion states
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Local font sizing for the full texts
  const [textFontSize, setTextFontSize] = useState<number>(18);
  
  // Local Tasbih support in-card
  const [activeTasbihId, setActiveTasbihId] = useState<string | null>(null);
  const [tasbihValue, setTasbihValue] = useState<number>(0);
  const [tasbihGoal, setTasbihGoal] = useState<number>(100);

  // Get current active works array
  const getActiveArray = (): MonthlyWork[] => {
    switch (selectedMonth) {
      case 'رجب':
        return MONTHLY_RAJAB_AMAAL;
      case 'شعبان':
        return MONTHLY_SHABAN_AMAAL;
      case 'رمضان':
        return MONTHLY_RAMADAN_AMAAL;
      default:
        return [];
    }
  };

  const activeArray = getActiveArray();

  // Unique list of day numbers available for filtering
  const availableDays = Array.from(new Set(activeArray.map(w => w.day_number))).sort((a, b) => a - b);

  // Helper to generate a deterministic stable ID for tracking completions
  const getWorkId = (work: MonthlyWork, idx: number) => {
    return `monthly-${work.month}-${work.day_number}-${work.day_type}-${idx}`;
  };

  // Filter the items list
  const filteredWorks = activeArray.filter((work, idx) => {
    // 1. Month verification
    if (work.month !== selectedMonth) return false;

    // 2. Search Text
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const inTitle = work.title.toLowerCase().includes(q);
      const inHowTo = work.how_to.toLowerCase().includes(q);
      const inVirtue = work.virtue.toLowerCase().includes(q);
      const inFullText = work.full_text?.toLowerCase().includes(q) || false;
      const inNotes = work.notes?.toLowerCase().includes(q) || false;
      if (!inTitle && !inHowTo && !inVirtue && !inFullText && !inNotes) return false;
    }

    // 3. Action Type
    if (typeFilter !== 'الكل' && work.work_type !== typeFilter) {
      return false;
    }

    // 4. Day Time Type
    if (dayTypeFilter !== 'الكل' && work.day_type !== dayTypeFilter) {
      return false;
    }

    // 5. Day Number
    if (dayNumberFilter !== 'الكل' && String(work.day_number) !== dayNumberFilter) {
      return false;
    }

    return true;
  });

  // Calculate monthly stats
  const completedIdsForToday = history[selectedDateStr] || [];
  const completedThisMonthTotal = activeArray.filter((w, idx) => 
    completedIdsForToday.includes(getWorkId(w, idx))
  ).length;

  const handleToggle = (id: string) => {
    onToggleComplete(id);
  };

  const startTasbihCounter = (id: string, initialGoal: number) => {
    setActiveTasbihId(id);
    setTasbihValue(0);
    setTasbihGoal(initialGoal);
  };

  const incrementTasbih = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    setTasbihValue(prev => {
      const next = prev + 1;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(next % tasbihGoal === 0 ? 880 : 440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
      return next;
    });
  };

  return (
    <div className="space-y-6" id="months-amaal-explorer">
      
      {/* Upper Month Cards Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* rAJAB */}
        <button
          onClick={() => {
            setSelectedMonth('رجب');
            setExpandedIndex(null);
            setDayNumberFilter('الكل');
          }}
          className={`relative p-5 rounded-2xl text-right overflow-hidden border transition-all duration-300 shadow-md ${
            selectedMonth === 'رجب'
              ? 'bg-gradient-to-br from-emerald-950 to-emerald-900 text-white border-amber-400 scale-[1.02] ring-2 ring-amber-400/30'
              : 'bg-white text-stone-850 hover:bg-stone-100 border-stone-200'
          }`}
        >
          {selectedMonth === 'رجب' && (
            <div className="absolute left-4 top-4 text-amber-400/20 text-5xl font-bold font-serif pointer-events-none">٠٧</div>
          )}
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                selectedMonth === 'رجب' ? 'text-amber-300' : 'text-stone-400'
              }`}>
                الشهر السابع هجرياً 🌙
              </span>
              <h3 className="font-serif text-lg font-extrabold flex items-center gap-1.5">
                <span>رجب الأصبّ</span>
              </h3>
              <p className={`text-xs ${
                selectedMonth === 'رجب' ? 'text-emerald-200/90' : 'text-stone-500'
              }`}>
                صب الغفران فيه صبّاً، وهو أول الأشهر الثلاثة المتصلة بالعبادة.
              </p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              selectedMonth === 'رجب' ? 'bg-emerald-800 text-amber-300' : 'bg-stone-100 text-[#2E7D32]'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* sHABAN */}
        <button
          onClick={() => {
            setSelectedMonth('شعبان');
            setExpandedIndex(null);
            setDayNumberFilter('الكل');
          }}
          className={`relative p-5 rounded-2xl text-right overflow-hidden border transition-all duration-300 shadow-md ${
            selectedMonth === 'شعبان'
              ? 'bg-gradient-to-br from-emerald-950 to-emerald-900 text-white border-amber-400 scale-[1.02] ring-2 ring-amber-400/30'
              : 'bg-white text-stone-850 hover:bg-stone-100 border-stone-200'
          }`}
        >
          {selectedMonth === 'شعبان' && (
            <div className="absolute left-4 top-4 text-amber-400/20 text-5xl font-bold font-serif pointer-events-none">٠٨</div>
          )}
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                selectedMonth === 'شعبان' ? 'text-amber-300' : 'text-stone-400'
              }`}>
                الشهر الثامن هجرياً ✨
              </span>
              <h3 className="font-serif text-lg font-extrabold flex items-center gap-1.5">
                <span>شعبان المعظّم</span>
              </h3>
              <p className={`text-xs ${
                selectedMonth === 'شعبان' ? 'text-emerald-200/90' : 'text-stone-500'
              }`}>
                شجر منشعب بالخير والطاعات، وهو شهر رسول الله صلى الله عليه وآله.
              </p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              selectedMonth === 'شعبان' ? 'bg-emerald-800 text-amber-300' : 'bg-stone-100 text-[#2E7D32]'
            }`}>
              <Feather className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* rAMADAN */}
        <button
          onClick={() => {
            setSelectedMonth('رمضان');
            setExpandedIndex(null);
            setDayNumberFilter('الكل');
          }}
          className={`relative p-5 rounded-2xl text-right overflow-hidden border transition-all duration-300 shadow-md ${
            selectedMonth === 'رمضان'
              ? 'bg-gradient-to-br from-emerald-950 to-emerald-900 text-white border-amber-400 scale-[1.02] ring-2 ring-amber-400/30'
              : 'bg-white text-stone-850 hover:bg-stone-100 border-stone-200'
          }`}
        >
          {selectedMonth === 'رمضان' && (
            <div className="absolute left-4 top-4 text-amber-400/20 text-5xl font-bold font-serif pointer-events-none">٠٩</div>
          )}
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                selectedMonth === 'رمضان' ? 'text-amber-300' : 'text-stone-400'
              }`}>
                الشهر التاسع هجرياً 🌟
              </span>
              <h3 className="font-serif text-lg font-extrabold flex items-center gap-1.5">
                <span>رمضان المبارك</span>
              </h3>
              <p className={`text-xs ${
                selectedMonth === 'رمضان' ? 'text-emerald-200/90' : 'text-stone-500'
              }`}>
                ربيع القرآن ونزول الملائكة، شهر الضيافة الإلهية والرحمة الواسعة.
              </p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              selectedMonth === 'رمضان' ? 'bg-emerald-800 text-amber-300' : 'bg-stone-100 text-[#2E7D32]'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </button>

      </div>

      {/* Progress Sync Banner */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="font-serif font-bold text-xs text-emerald-950">إنجاز اليوم من أعمال شهر {selectedMonth}</h4>
          </div>
          <p className="text-[10px] text-[#2E7D32]">أكملت اليوم <strong>{completedThisMonthTotal} أعمال</strong> مستحبة من هذا الورد الشهري المبرك.</p>
        </div>
        
        {/* Progress Bar inside */}
        <div className="w-full sm:w-48 bg-emerald-200/40 h-2.5 rounded-full overflow-hidden self-center border border-emerald-100">
          <div 
            className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, activeArray.length > 0 ? (completedThisMonthTotal / activeArray.length) * 1000 : 0)}%` }}
          />
        </div>
      </div>

      {/* Dynamic Advanced Filter Area */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Quick Search Input */}
          <div className="flex-1 relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 select-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={`ابحث في أعمال شهر ${selectedMonth} (صلاة، دعاء، فضل...)`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pr-10 pl-4 text-xs bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white rounded-xl outline-none transition-all text-right"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Type Filter Selector */}
          <div className="w-full md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-amber-400 focus:bg-white text-xs text-stone-700 cursor-pointer"
            >
              <option value="الكل">جميع أنواع الأعمال</option>
              <option value="صلاة">صلوات مستحبة</option>
              <option value="دعاء">أدعية يومية ومخصوصة</option>
              <option value="ذكر">أذكار وتعقيبات</option>
              <option value="صيام">صيام الأيام المقررة</option>
              <option value="غسل">أغسال وأوراد طهارة</option>
              <option value="زيارة">زيارات المشاهد المضيئة</option>
              <option value="عبادة">شؤون عبادية عامة</option>
            </select>
          </div>
        </div>

        {/* Triple parameters configuration pills layout */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          
          {/* Day types filter */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-bold shrink-0">الوقت:</span>
            <div className="flex gap-1 bg-stone-105 p-1 rounded-xl">
              {(['الكل', 'يوم', 'ليلة'] as const).map(dt => (
                <button
                  key={`day-type-${dt}`}
                  onClick={() => setDayTypeFilter(dt)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    dayTypeFilter === dt 
                      ? 'bg-emerald-900 text-white shadow-sm' 
                      : 'hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  {dt === 'الكل' ? 'الجميع' : dt === 'يوم' ? 'النهار ☀️' : 'الليلة 🌙'}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:inline text-stone-300">|</div>

          {/* Individual Day Selectors */}
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <span className="text-stone-400 font-bold shrink-0">رقم اليوم:</span>
            <div className="flex-grow min-w-0 flex items-center gap-1">
              <select
                value={dayNumberFilter}
                onChange={(e) => setDayNumberFilter(e.target.value)}
                className="h-8 px-2 bg-stone-55 border border-stone-200 rounded-lg outline-none focus:border-amber-400 text-[10px] text-stone-700 cursor-pointer flex-grow-0"
              >
                <option value="الكل">كافة الأيام</option>
                {availableDays.map(num => (
                  <option key={`day-option-${num}`} value={String(num)}>اليوم {num}</option>
                ))}
              </select>

              <div className="flex gap-1 overflow-x-auto select-none no-scrollbar flex-1 pb-1">
                <button
                  onClick={() => setDayNumberFilter('الكل')}
                  className={`px-2.5 py-1 whitespace-nowrap rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                    dayNumberFilter === 'الكل'
                      ? 'bg-amber-400 border-amber-400 text-emerald-950 font-extrabold shadow-sm'
                      : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  كافة أيام الشهر
                </button>
                {availableDays.slice(0, 10).map(num => (
                  <button
                    key={`fast-day-${num}`}
                    onClick={() => setDayNumberFilter(String(num))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                      dayNumberFilter === String(num)
                        ? 'bg-amber-400 border-amber-400 text-emerald-900 font-extrabold shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    يوم {num}
                  </button>
                ))}
                {availableDays.length > 10 && (
                  <span className="text-stone-300 self-center text-xs px-1">...</span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Monthly Devotion Cards List */}
      <div className="space-y-4">
        {filteredWorks.length === 0 ? (
          <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl space-y-2">
            <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="font-serif font-bold text-stone-700">لم نثبت أعمال متطابقة للمحدد</h4>
            <p className="text-stone-400 text-xs">جرب تصفية الأيام أو تفريغ كلمات البحث للعثور على الأوراد المطلوبة.</p>
          </div>
        ) : (
          filteredWorks.map((work, idx) => {
            const rawIdx = activeArray.indexOf(work);
            const wId = getWorkId(work, rawIdx);
            const isDone = completedIdsForToday.includes(wId);
            const isExpanded = expandedIndex === rawIdx;

            return (
              <div
                key={`monthly-card-${wId}`}
                id={`monthly-card-${wId}`}
                className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden flex flex-col ${
                  isDone 
                    ? 'border-emerald-100 opacity-90' 
                    : isExpanded 
                      ? 'border-amber-400 shadow-md ring-2 ring-amber-400/5'
                      : 'border-stone-200 hover:border-emerald-900/40'
                }`}
              >
                
                {/* Upper compact banner */}
                <div className="px-5 py-4 flex items-start gap-4 justify-between select-none">
                  
                  {/* Completeting checkbox handler */}
                  <button
                    onClick={() => handleToggle(wId)}
                    className="p-1.5 focus:outline-none transition-transform active:scale-90 select-none cursor-pointer"
                    title={isDone ? 'تراجع عن الإتمام' : 'تعليق كمنجز اليوم'}
                  >
                    {isDone ? (
                      <CheckCircle className="w-6 h-6 text-[#4CAF50] fill-[#E8F5E9]" />
                    ) : (
                      <Circle className="w-6 h-6 text-stone-300 hover:text-emerald-800" />
                    )}
                  </button>

                  {/* Text descriptions */}
                  <div className="flex-1 text-right space-y-1 py-0.5" onClick={() => setExpandedIndex(isExpanded ? null : rawIdx)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        work.work_type === 'صلاة' ? 'bg-indigo-50 text-indigo-700' :
                        work.work_type === 'دعاء' ? 'bg-amber-50 text-amber-800' :
                        work.work_type === 'ذكر' ? 'bg-emerald-50 text-emerald-800' :
                        work.work_type === 'صيام' ? 'bg-rose-50 text-rose-700' :
                        work.work_type === 'غسل' ? 'bg-sky-50 text-sky-700' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {work.work_type}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold font-mono">
                        {work.day_type === 'ليلة' ? '🌙 ليلة' : '☀️ نهار'} اليوم {work.day_number}
                      </span>
                    </div>

                    <h4 className={`font-serif text-sm sm:text-base font-extrabold cursor-pointer hover:text-emerald-800 transition-colors ${
                      isDone ? 'text-stone-400 line-through' : 'text-stone-850'
                    }`}>
                      {work.title}
                    </h4>

                    {/* How to summary snippet */}
                    {!isExpanded && (
                      <p className="text-stone-500 text-xs line-clamp-1 leading-normal">
                        {work.how_to}
                      </p>
                    )}
                  </div>

                  {/* Expanded trigger button */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : rawIdx)}
                    className="p-1 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-400 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                </div>

                {/* Expanded Details Core Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-stone-100 bg-stone-50/20 space-y-4">
                    
                    {/* Character parameters inside columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-stone-100/30 p-3 rounded-xl space-y-1">
                        <span className="font-bold text-stone-500 block">كيفية الأداء والصفة:</span>
                        <p className="text-stone-700 leading-relaxed font-sans">{work.how_to}</p>
                      </div>

                      {work.virtue && (
                        <div className="bg-amber-50/20 p-3 rounded-xl space-y-1 border border-amber-100/40">
                          <span className="font-bold text-amber-900 block flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span>فضل العمل وثوابه:</span>
                          </span>
                          <p className="text-stone-700 leading-relaxed font-sans">{work.virtue}</p>
                        </div>
                      )}
                    </div>

                    {/* Full text reader option */}
                    {work.full_text ? (
                      <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-inner">
                        <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-150 flex items-center justify-between text-xs text-stone-500">
                          <span className="font-serif font-bold text-stone-700">📜 النص الـكامل للـتلاوة والقـراءة</span>
                          
                          {/* Sizing Controller */}
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-[10px]">الخط:</span>
                            <button 
                              onClick={() => setTextFontSize(Math.max(14, textFontSize - 2))} 
                              className="px-2 py-0.5 bg-stone-200 rounded text-[10px]"
                            >
                              -
                            </button>
                            <span className="font-mono text-[10px] w-6 text-center">{textFontSize}px</span>
                            <button 
                              onClick={() => setTextFontSize(Math.min(32, textFontSize + 2))} 
                              className="px-2 py-0.5 bg-stone-200 rounded text-[10px]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Immersive interactive arabic typography container */}
                        <div className="p-5 md:p-6 text-center bg-[#FBF9F4] select-text">
                          <p 
                            className="font-serif leading-loose text-emerald-950 font-medium whitespace-pre-line tracking-wide selection:bg-amber-100"
                            style={{ fontSize: `${textFontSize}px` }}
                          >
                            {work.full_text}
                          </p>
                        </div>

                        {/* Tasbih counter quick start button */}
                        {work.title.includes('استغفار') || work.title.includes('تهليل') || work.title.includes('تسبيح') || work.work_type === 'ذكر' ? (
                          <div className="px-4 py-3 bg-stone-50 border-t border-stone-150 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-stone-500 font-sans">هذا العمل يتضمن ورداً مكرراً، يمكنك استعمال المسبحة المدمجة أدناه للعد التيسيري:</span>
                            <button
                              onClick={() => startTasbihCounter(wId, work.title.includes('١٠٠') || work.how_to.includes('100') ? 100 : 70)}
                              className="px-3 py-1.5 bg-emerald-900 text-amber-300 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-emerald-800"
                            >
                              📿 فتح مسبحة الورد المخصصة
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Dynamic Floating Tasbih module within the container Card */}
                    {activeTasbihId === wId && (
                      <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-amber-300 rounded-2xl p-4 text-white space-y-3 relative">
                        <button
                          onClick={() => setActiveTasbihId(null)}
                          className="absolute left-3 top-3 text-emerald-300/60 hover:text-white text-xs select-none"
                        >
                          إغلاق المسبحة ×
                        </button>

                        <div className="text-right">
                          <span className="text-[9px] text-amber-300 font-extrabold uppercase">مسبحة الورد التفاعلية الخاصة بالعمل 📿</span>
                          <h5 className="font-serif text-xs font-bold text-stone-100">{work.title}</h5>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="text-center shrink-0">
                            <div className="text-2xl font-mono text-amber-300 font-black">{tasbihValue}</div>
                            <div className="text-[9px] text-emerald-200">الدورات {Math.floor(tasbihValue / tasbihGoal)}</div>
                          </div>

                          {/* Huge Clicker Button */}
                          <button
                            onClick={incrementTasbih}
                            className="flex-1 h-14 bg-amber-400 hover:bg-amber-300 active:scale-[0.97] transition-all rounded-xl text-emerald-950 flex items-center justify-center font-serif font-black text-sm cursor-pointer shadow-lg"
                          >
                            <span>اضغط للعد والتسبيح 📿</span>
                          </button>

                          <button
                            onClick={() => setTasbihValue(0)}
                            className="p-3 bg-emerald-850 hover:bg-emerald-800 text-emerald-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                            title="إعادة تصفير"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-emerald-300 pt-1 border-t border-emerald-900">
                          <span>الهدف المقترح: {tasbihGoal} مرة</span>
                          <span>المتبقي للدورة الحالية: {Math.max(0, tasbihGoal - (tasbihValue % tasbihGoal))}</span>
                        </div>
                      </div>
                    )}

                    {work.notes ? (
                      <div className="text-[11px] text-stone-400 italic font-sans flex items-start gap-1">
                        <span>• ملاحظة:</span>
                        <span>{work.notes}</span>
                      </div>
                    ) : null}

                    {/* Quick Complete Action Indicator inside expanded card for mobile accessibility */}
                    <div className="flex justify-end pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleToggle(wId)}
                        className={`px-4 py-2 rounded-xl text-xs font-serif font-black transition-all cursor-pointer ${
                          isDone 
                            ? 'bg-stone-200 text-stone-500 hover:bg-stone-250' 
                            : 'bg-gradient-to-r from-amber-400 to-amber-300 text-emerald-950 hover:from-amber-300'
                        }`}
                      >
                        {isDone ? '标记为未完成 (تراجع عن الإتمام)' : 'علامة كمكتمل لليوم ✅'}
                      </button>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

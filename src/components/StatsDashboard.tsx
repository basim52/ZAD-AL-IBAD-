import React from 'react';
import { DailyWork } from '../types';
import { Award, Calendar, CheckSquare, Flame, TrendingUp } from 'lucide-react';
import DatabaseExplorer from './DatabaseExplorer';

interface StatsDashboardProps {
  works: DailyWork[];
  history: Record<string, string[]>;
  streak: number;
  onImportData: (importedWorks: DailyWork[], importedHistory: Record<string, string[]>) => void;
  onClearAllData: () => void;
}

export default function StatsDashboard({ 
  works, 
  history, 
  streak,
  onImportData,
  onClearAllData
}: StatsDashboardProps) {
  // Calculate completed works for Today
  const totalWorks = works.length;
  const completedTodayCount = works.filter(w => w.isCompleted).length;
  const todayPercentage = totalWorks > 0 ? Math.round((completedTodayCount / totalWorks) * 100) : 0;

  // Let's get the last 7 days of history to generate a weekly checklist display
  const getPastNDays = (n: number) => {
    const list = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      list.push({
        dateStr: str,
        label: d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' }),
        numDay: d.getDate(),
      });
    }
    return list;
  };

  const last7Days = getPastNDays(7);

  // Inspirational Islamic quotes on self-reckoning (المحاسبة والعبادة)
  const SPIRITUAL_QUOTES = [
    { text: "«حاسِبُوا أنْفُسَكُمْ قَبْلا أنْ تُحاسَبُوا، وَزِنُوها قَبْلَ أنْ تُوزَنُوا»", author: "أمير المؤمنين (ع)" },
    { text: "«إنّما هِيَ نَفْسِي أَرُوضُها بِالتَّقْوى لِتَأْتِيَ آمِنَةً يَوْمَ الْخَوْفِ الْأَكْبَرِ»", author: "أمير المؤمنين (ع)" },
    { text: "«قَوِّ عَلى خِدْمَتِكَ جَوارِحِي، وَاشْدُدْ عَلَى الْعَزِيمَةِ جَوانِحِي»", author: "من دعاء كميل" },
    { text: "«مَنِ اعْتَدَلَ يَوْماهُ فَهُوَ مَغْبُونٌ»", author: "الرسول الأعظم (ص)" }
  ];

  // Pick a random quote indexed by current date day of month
  const quoteIndex = new Date().getDate() % SPIRITUAL_QUOTES.length;
  const activeQuote = SPIRITUAL_QUOTES[quoteIndex];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Visual KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500 block">إنجاز اليوم</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-900">{completedTodayCount}</span>
              <span className="text-stone-400 text-xs">من {totalWorks}</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium block">بنسـبة {todayPercentage}%</span>
          </div>
          {/* Circular Progress Gauge */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-stone-100 fill-none"
                strokeWidth="5"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-emerald-700 fill-none transition-all duration-550 ease-out"
                strokeWidth="5"
                strokeDasharray={163.3}
                strokeDashoffset={163.3 - (163.3 * todayPercentage) / 100}
              />
            </svg>
            <span className="absolute text-xs font-bold text-emerald-950">{todayPercentage}%</span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-800 block">المحافظة والالتزام</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-900">{streak}</span>
              <span className="text-amber-800 text-xs">أيام متتالية</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium block">دوام العبادة يورث التوفيق المستدام.</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
            <Flame className="w-6 h-6 fill-amber-500 stroke-amber-600 animate-pulse" />
          </div>
        </div>

        {/* Total Devotions Registry Card */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500 block">سجل الأعمال المجدولة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-stone-800">
                {works.filter(w => !w.isCustom).length}
              </span>
              <span className="text-stone-400 text-xs">ثابتة</span>
              <span className="text-stone-305 text-sm">•</span>
              <span className="text-2xl font-bold text-stone-800">
                {works.filter(w => w.isCustom).length}
              </span>
              <span className="text-stone-400 text-xs">مخصصة</span>
            </div>
            <span className="text-[11px] text-stone-500 block">تستطيع تصميم أورادك الخاصة وحفظها.</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <CheckSquare className="w-6 h-6 text-stone-500" />
          </div>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="p-5 bg-stone-100 rounded-2xl border border-stone-200 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <span className="absolute right-4 top-2 text-6xl text-stone-200/60 font-serif font-semibold pointer-events-none select-none">”</span>
        <p className="font-serif text-stone-800 text-sm italic leading-relaxed z-10 max-w-lg mb-2">
          {activeQuote.text}
        </p>
        <span className="text-xs font-semibold text-emerald-800 z-10">
          — {activeQuote.author}
        </span>
      </div>

      {/* Week Grid Analytics */}
      <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span className="font-serif font-bold text-emerald-950 text-sm">سجل الأسبوع الماضي (آخر 7 أيام)</span>
          </div>
          <span className="text-[11px] text-stone-400">تواريخ الإنجازات المتراكمة</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {last7Days.map(dayObj => {
            // Get completed item IDs for this day in history
            const completedOnDay = history[dayObj.dateStr] || [];
            const count = completedOnDay.length;
            
            // Compare against total default works to estimate ratio
            const percentComp = totalWorks > 0 ? Math.min(100, Math.round((count / totalWorks) * 100)) : 0;
            
            // Color shade of green depending on count
            let bgClass = 'bg-stone-50 border-stone-200 text-stone-600';
            if (count > 0) {
              if (percentComp < 30) bgClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
              else if (percentComp < 65) bgClass = 'bg-emerald-100 border-emerald-200 text-emerald-850';
              else bgClass = 'bg-emerald-800 border-transparent text-white';
            }

            return (
              <div 
                key={dayObj.dateStr} 
                className="flex flex-col items-center p-2 rounded-xl border text-center transition-all hover:shadow-xs group"
                title={`${dayObj.dateStr} - تم أداء ${count} عمل`}
              >
                <span className="text-[10px] text-stone-400 font-medium mb-1.5 block group-hover:text-emerald-900 transition-colors">
                  {dayObj.label.split(' ')[0]}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs border ${bgClass} transition-colors shadow-inner`}>
                  {count}
                </div>
                <span className="text-[10px] text-stone-500 font-mono mt-1.5 block">
                  {dayObj.numDay}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database Schema Explorer & Backup Controls */}
      <DatabaseExplorer 
        works={works} 
        history={history} 
        onImportData={onImportData} 
        onClearAllData={onClearAllData} 
      />
    </div>
  );
}

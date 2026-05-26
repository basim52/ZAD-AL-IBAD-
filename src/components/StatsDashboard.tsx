import React from 'react';
import { DailyWork } from '../types';
import { Award, Calendar, CheckSquare, Flame, TrendingUp, Share2, Smartphone, Wifi, Battery, CheckCircle, Circle, Info } from 'lucide-react';
import DatabaseExplorer from './DatabaseExplorer';

interface StatsDashboardProps {
  works: DailyWork[];
  history: Record<string, string[]>;
  streak: number;
  onImportData: (importedWorks: DailyWork[], importedHistory: Record<string, string[]>) => void;
  onClearAllData: () => void;
  hijriFormatted?: string;
  occasion?: string;
  onToggleComplete?: (id: string) => void;
}

export default function StatsDashboard({ 
  works, 
  history, 
  streak,
  onImportData,
  onClearAllData,
  hijriFormatted = "١ ذو الحجة ١٤٤٧ هـ",
  occasion = "بداية شهر ذي الحجة الحرام 🌙",
  onToggleComplete
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

  // Canvas-based High-Quality Summary Image Export (📤 تصدير الموجز كصورة)
  const handleExportAsImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 650;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#124817'); // Dark Islamic Green
    gradient.addColorStop(0.3, '#1B5E20'); // Premium Emerald Green
    gradient.addColorStop(1, '#0b300f'); // Dark Deep Shadow Green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Islamic Geometric Arch (Watermark/Backing lines)
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(325, -250, 550, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(325, 1150, 550, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Main Title Header (Arabic Calligraphy Style simulated)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📋 موجز الأعمال العيادية اليومية', 325, 65);

    // Dynamic Time Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText('تطبيق حقيبة اليوم والليلة للأعمال والأوراد', 325, 90);

    // Separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 105);
    ctx.lineTo(570, 105);
    ctx.stroke();

    // 3. Date & Occasion Emerald Box (Color 0xFF2E7D32)
    ctx.fillStyle = '#2E7D32';
    // Draw rounded rect
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(40, 125, 570, 125, 20);
    } else {
      ctx.rect(40, 125, 570, 125);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text in Date Box
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`📅 ${hijriFormatted}`, 325, 170);

    const today = new Date();
    const gregorianStr = `الموافق ميلادياً: ${today.getDate()} / ${today.getMonth() + 1} / ${today.getFullYear()} م`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(gregorianStr, 325, 200);

    if (occasion) {
      ctx.fillStyle = '#FFD54F'; // Soft gold
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillText(`🌟 المناسبة: ${occasion}`, 325, 230);
    }

    // 4. Statistics Card (Color 0xFFE8F5E9)
    ctx.fillStyle = '#E8F5E9';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(40, 270, 570, 145, 20);
    } else {
      ctx.rect(40, 270, 570, 145);
    }
    ctx.fill();

    // Stats Title
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('📊 إحصائيات الإنجاز والامتثال', 325, 305);

    // Columns: Total, Completed, Remaining
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${totalWorks}`, 155, 345);
    ctx.fillText(`${completedTodayCount}`, 325, 345);
    ctx.fillText(`${totalWorks - completedTodayCount}`, 495, 345);

    // Labels
    ctx.fillStyle = '#4E704F';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('إجمالي الأعمال', 155, 365);
    ctx.fillText('الأعمال المنجزة', 325, 365);
    ctx.fillText('الأعمال المتبقية', 495, 365);

    // Progress bar background
    ctx.fillStyle = '#C8E6C9';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(80, 385, 490, 8, 4);
    } else {
      ctx.rect(80, 385, 490, 8);
    }
    ctx.fill();

    // Progress bar fill
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    const barWidth = totalWorks > 0 ? (490 * completedTodayCount) / totalWorks : 0;
    if (ctx.roundRect) {
      ctx.roundRect(80, 385, barWidth, 8, 4);
    } else {
      ctx.rect(80, 385, barWidth, 8);
    }
    ctx.fill();

    // Progress label
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`نسبة التمام: %${todayPercentage}`, 325, 405);

    // 5. Lists (Completed & Remaining)
    let listY = 445;

    // Completed Title
    ctx.fillStyle = '#A3E635'; // Lime green
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`✅ الأعمال المنجزة (${completedTodayCount})`, 580, listY);

    listY += 25;
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    const completedList = works.filter(w => w.isCompleted).slice(0, 3);
    if (completedList.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('لا توجد أعمال منجزة بعد في هذا اليوم', 560, listY);
      listY += 35;
    } else {
      completedList.forEach(w => {
        // Draw card
        ctx.fillStyle = 'rgba(232, 245, 233, 0.12)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(40, listY - 18, 570, 34, 10);
        } else {
          ctx.rect(40, listY - 18, 570, 34);
        }
        ctx.fill();

        ctx.fillStyle = '#E8F5E9';
        ctx.fillText(`✔️  ${w.title} (${w.type} • ${w.time})`, 560, listY + 5);
        listY += 45;
      });
    }

    // Remaining Title
    listY += 10;
    ctx.fillStyle = '#FF9800'; // Orange
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`⏳ أعمال متبقية (${totalWorks - completedTodayCount})`, 580, listY);

    listY += 25;
    const remainingList = works.filter(w => !w.isCompleted).slice(0, 4);
    if (remainingList.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('تم إتمام كامل أورادك اليومية بنجاح! هنيئاً لك 🌟', 560, listY);
      listY += 35;
    } else {
      remainingList.forEach(w => {
        // Draw card
        ctx.fillStyle = 'rgba(255, 248, 225, 0.08)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(40, listY - 18, 570, 34, 10);
        } else {
          ctx.rect(40, listY - 18, 570, 34);
        }
        ctx.fill();

        ctx.fillStyle = '#FFF8E1';
        ctx.fillText(`🔘  ${w.title} (${w.type} • ${w.time})`, 560, listY + 5);
        listY += 45;
      });
    }

    // Footer signature
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('«مَن سَلَكَ طريقاً يلتَمِسُ فيه عِلماً سَهَّلَ اللهُ له به طريقاً إلى الجَنّة»', 325, 840);
    ctx.fillText('تم التصدير والاستخراج تلقائياً من تطبيق الأوراد', 325, 860);

    // Save/Download Image
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Daily_Amaal_Summary_${today.toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export Image Error:", e);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Visual KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500 block">إنجاز اليوم</span>
            <div className="flex items-baseline gap-1.5 font-sans">
              <span className="text-2xl font-bold text-emerald-900">{completedTodayCount}</span>
              <span className="text-stone-400 text-xs">من {totalWorks}</span>
            </div>
            <span className="text-[11px] text-emerald-750 font-medium block">بنسـبة {todayPercentage}%</span>
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
            <span className="absolute text-xs font-bold text-emerald-950 font-sans">{todayPercentage}%</span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-800 block">المحافظة والالتزام</span>
            <div className="flex items-baseline gap-1.5 font-sans">
              <span className="text-2xl font-bold text-amber-900">{streak}</span>
              <span className="text-amber-800 text-xs">أيام متتالية</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium block">دوام العبادة يورث التوفيق المستدام.</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
            <Flame className="w-6 h-6 fill-amber-500 stroke-amber-605 animate-pulse" />
          </div>
        </div>

        {/* Total Devotions Registry Card */}
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500 block">سجل الأعمال المجدولة</span>
            <div className="flex items-baseline gap-1.5 font-sans">
              <span className="text-2xl font-bold text-stone-850">
                {works.filter(w => !w.isCustom).length}
              </span>
              <span className="text-stone-400 text-xs">ثابتة</span>
              <span className="text-stone-300 text-sm">•</span>
              <span className="text-2xl font-bold text-stone-850">
                {works.filter(w => w.isCustom).length}
              </span>
              <span className="text-stone-400 text-xs">مخصصة</span>
            </div>
            <span className="text-[11px] text-stone-505 block">تستطيع تصميم أورادك الخاصة وحفظها.</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-105 flex items-center justify-center text-stone-600">
            <CheckSquare className="w-6 h-6 text-stone-500" />
          </div>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="p-5 bg-stone-100 rounded-2xl border border-stone-175 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <span className="absolute right-4 top-2 text-6xl text-stone-200/60 font-serif font-semibold pointer-events-none select-none">”</span>
        <p className="font-serif text-stone-800 text-sm italic leading-relaxed z-10 max-w-lg mb-2">
          {activeQuote.text}
        </p>
        <span className="text-xs font-semibold text-emerald-850 z-10">
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

      {/* Animated Android Composable Screen Live Simulator (DailySummaryScreen Mockup) */}
      <div className="p-6 bg-stone-150/70 border border-stone-200 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-805" />
              <span>محاكي نظام أندرويد: شاشة موجز الأعمال (DailySummaryScreen Simulator)</span>
            </h4>
            <p className="text-xs text-stone-500">تمثيل حي لبيئتك المتأصلة بالـ Jetpack Compose والتقارير المكتوبة لقاعدة البيانات المحلية.</p>
          </div>
          <div className="p-1 px-2.5 bg-emerald-100 text-[10px] text-emerald-900 font-bold rounded-full animate-pulse border border-emerald-150">
            ● مزامنة كاملة بالبيانات
          </div>
        </div>

        <div className="flex justify-center">
          {/* Main Mobile frame */}
          <div className="w-[360px] max-w-full bg-stone-900 p-3 rounded-[38px] shadow-2xl border-4 border-stone-850 relative">
            
            {/* Camera notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-stone-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-blue-950 rounded-full opacity-60"></div>
            </div>

            {/* Inner Phone Screen Panel */}
            <div className="rounded-[28px] overflow-hidden bg-stone-100 flex flex-col font-sans select-none border border-stone-800 min-h-[580px]" dir="rtl">
              
              {/* Phone Status Bar */}
              <div className="bg-[#1B5E20] px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] text-white/90">
                <span className="font-bold tracking-tight">14:06</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  <span className="font-semibold text-[10px]">LTE</span>
                  <Battery className="w-3.5 h-3.5 text-white fill-white/50" />
                </div>
              </div>

              {/* Scaffold TopAppBar (綠色 0xFF1B5E20) */}
              <div className="bg-[#1B5E20] h-12 px-4 shadow-sm flex items-center justify-between relative text-white">
                <span className="text-[15px] font-bold font-serif">📋 موجز الأعمال اليومية</span>
                <div className="w-6"></div>
              </div>

              {/* Scrollable Layout Inside Screen */}
              <div className="flex-1 p-3.5 space-y-4.5 overflow-y-auto max-h-[460px] text-right">

                {/* Card 1: Hijri Date & Today Occasion (Green Color 0xFF2E7D32) */}
                <div className="p-4.5 bg-[#2E7D32] text-white rounded-2xl text-center space-y-1 shadow-sm">
                  <h5 className="font-serif font-bold text-base md:text-lg">📅 {hijriFormatted}</h5>
                  <p className="text-[11px] text-white/80">الموافق: {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                  {occasion && (
                    <div className="mt-2.5 pt-1.5 border-t border-white/10 text-xs font-bold text-amber-300">
                      🌟 {occasion}
                    </div>
                  )}
                </div>

                {/* Card 2: Stats Container (Light Green Color 0xFFE8F5E9) */}
                <div className="p-4 bg-[#E8F5E9] border border-emerald-150/70 rounded-2xl space-y-3.5">
                  <h6 className="font-bold text-xs text-[#1B5E20] text-center flex items-center justify-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>إحصائيات اليوم</span>
                  </h6>
                  
                  <div className="grid grid-cols-3 gap-1 text-center font-sans">
                    <div className="space-y-0.5">
                      <span className="text-lg font-extrabold text-[#1B5E20] block">{totalWorks}</span>
                      <span className="text-[10px] text-stone-500">الأعمال</span>
                    </div>
                    <div className="space-y-0.5 border-x border-emerald-200">
                      <span className="text-lg font-extrabold text-[#1B5E20] block">{completedTodayCount}</span>
                      <span className="text-[10px] text-emerald-850 font-medium">مكتمل</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-lg font-extrabold text-[#1B5E20] block">{totalWorks - completedTodayCount}</span>
                      <span className="text-[10px] text-stone-500">متبقي</span>
                    </div>
                  </div>

                  {/* Linear Progress Indicator matching 0xFF4CAF50 */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#C8E6C9] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#4CAF50] h-full duration-500 ease-in-out transition-all"
                        style={{ width: `${todayPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#1B5E20] font-bold text-left block">% {todayPercentage} مكتمل</span>
                  </div>
                </div>

                {/* Done list with green checks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2E7D32]">✅ الأعمال المنجزة ({completedTodayCount})</span>
                    <span className="text-[9px] text-stone-400">انقر للتعديل السريع</span>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {works.filter(w => w.isCompleted).length === 0 ? (
                      <div className="text-center p-3 border border-dashed border-stone-200 text-[10px] text-stone-400 rounded-xl">
                        لا توجد أعمال منجزة بعد
                      </div>
                    ) : (
                      works.filter(w => w.isCompleted).map(work => (
                        <div 
                          key={`sim-done-${work.id}`}
                          onClick={() => onToggleComplete && onToggleComplete(work.id)}
                          className="flex items-center gap-3 p-2.5 bg-[#E8F5E9] border border-emerald-100/50 hover:bg-emerald-100/40 rounded-xl cursor-pointer transition-colors text-right"
                        >
                          <CheckCircle className="w-4 h-4 text-[#4CAF50] flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-stone-500 block truncate line-through">{work.title}</span>
                            <span className="text-[9px] text-stone-400 block">{work.type} • {work.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Remaining list with warning styles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E65100]">⏳ أعمال متبقية ({totalWorks - completedTodayCount})</span>
                    <span className="text-[9px] text-stone-400">انقر للإكمال الفوري</span>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {works.filter(w => !w.isCompleted).length === 0 ? (
                      <div className="text-center p-4 bg-emerald-50 text-emerald-850 text-[10px] font-bold border border-emerald-150 rounded-xl">
                        🎉 تم إتمام جميع أعمال اليوم! هنيئاً لك بالتوفيق الممتد.
                      </div>
                    ) : (
                      works.filter(w => !w.isCompleted).map(work => (
                        <div 
                          key={`sim-rem-${work.id}`}
                          onClick={() => onToggleComplete && onToggleComplete(work.id)}
                          className="flex items-center gap-3 p-2.5 bg-[#FFF8E1] border border-amber-100/50 hover:bg-amber-100/40 rounded-xl cursor-pointer transition-colors text-right"
                        >
                          <Circle className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-stone-850 block truncate">{work.title}</span>
                            <span className="text-[9px] text-stone-500 block">{work.type} • {work.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Export Card/Image Button matches layout */}
                <button
                  type="button"
                  onClick={handleExportAsImage}
                  className="w-full h-11 bg-[#1B5E20] hover:bg-[#154a19] text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-transform cursor-pointer shadow-md active:scale-[0.98] mt-4"
                >
                  <Share2 className="w-4 h-4" />
                  <span>📤 تصدير الموجز كصورة المبرمجة بالـ Canvas</span>
                </button>

              </div>
            </div>

            {/* Bottom Android Home Indicator bar */}
            <div className="h-5 flex items-center justify-center">
              <div className="w-24 h-1 bg-stone-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Tip Box for Canvas Export Feature */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-650 flex gap-2.5 items-start">
          <Info className="w-4 h-4 text-emerald-805 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-bold text-zinc-800 block">حول تصدير صورة الإنجاز (Image Generating Feature):</span>
            <p>• تعتمد هذه الخاصية ببطاقة الأندرويد على الكابتشر والدمج الصوتي، هُنا في قشرة الويب تماثل كامل الدعم باستعمال <strong>HTML5 Canvas API</strong>.</p>
            <p>• عند نقر زر <strong>تصدير الموجز كصورة</strong> يتم فوراً إخراج ورسم ملخص عائلي عالي الدقة (مع الهجري وولادات الأئمة الأعلام والصلوات المنجزة)، وتحميله على حاسوبك فوراً كبطاقة PNG مشاركة ممتازة.</p>
          </div>
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

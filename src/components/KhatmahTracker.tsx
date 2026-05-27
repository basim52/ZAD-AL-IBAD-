import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Trash2, Plus, Minus, CheckCircle, Flame, ArrowLeftRight, TrendingUp } from 'lucide-react';

interface Khatmah {
  id: string;
  title: string;
  startDate: string;
  targetDays: number;
  currentPage: number;
  targetPages: number; // usually 604 for Medina Mushaf
}

export default function KhatmahTracker() {
  const [khatmahs, setKhatmahs] = useState<Khatmah[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDays, setNewDays] = useState<number>(30);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('daily_amaal_khatmahs_v1');
    if (saved) {
      try {
        setKhatmahs(JSON.parse(saved));
      } catch (e) {
        setKhatmahs([]);
      }
    }
  }, []);

  const saveKhatmahs = (updated: Khatmah[]) => {
    setKhatmahs(updated);
    localStorage.setItem('daily_amaal_khatmahs_v1', JSON.stringify(updated));
  };

  const handleCreateKhatmah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newKhatmah: Khatmah = {
      id: 'khatmah_' + Date.now(),
      title: newTitle,
      startDate: new Date().toISOString().split('T')[0],
      targetDays: newDays,
      currentPage: 0,
      targetPages: 604
    };

    const updated = [...khatmahs, newKhatmah];
    saveKhatmahs(updated);
    setNewTitle('');
    setNewDays(30);
    setIsCreating(false);
  };

  const handleDeleteKhatmah = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الختمة نهائياً؟')) {
      const updated = khatmahs.filter(k => k.id !== id);
      saveKhatmahs(updated);
    }
  };

  const handleUpdatePage = (id: string, page: number) => {
    const updated = khatmahs.map(k => {
      if (k.id === id) {
        const validatedPage = Math.max(0, Math.min(k.targetPages, page));
        return { ...k, currentPage: validatedPage };
      }
      return k;
    });
    saveKhatmahs(updated);
  };

  const handleQuickAddPage = (id: string, amount: number) => {
    const k = khatmahs.find(k => k.id === id);
    if (k) {
      handleUpdatePage(id, k.currentPage + amount);
    }
  };

  const handleJuzChange = (id: string, juzNum: number) => {
    // Standard pages mapping per Juz (Approximate standard Quran page indices)
    // Juz 1: pages 2-21, Juz 2: 22-41, etc.
    const juzToPage = (juzNum - 1) * 20 + 2;
    handleUpdatePage(id, juzToPage);
  };

  return (
    <div className="p-4 md:p-6 space-y-6" id="khatmah-tracker-container">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-right space-y-1">
          <h2 className="text-xl md:text-2xl font-serif font-extrabold text-emerald-950 flex items-center gap-2">
            <span>📖</span>
            <span>منظم ومتابع الختمات القرآنية</span>
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            خطّط لختم القرآن الكريم وتتبّع قراءتك اليومية بانتظام مع مؤشرات ذكيّة لمعرفة حالتك اليومية وسير إنجازك.
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-emerald-900 border border-emerald-800 hover:bg-emerald-855 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            ➕ إنشاء ختمة جديدة
          </button>
        )}
      </div>

      {/* Creation form */}
      {isCreating && (
        <form 
          onSubmit={handleCreateKhatmah}
          className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-4 animate-fade-in"
        >
          <h3 className="font-bold text-xs md:text-sm text-stone-850">🌟 إنشاء ختمة قرآنية مباركة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-stone-700">عنوان الختمة أو النيّة:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: ختمة شهر رمضان، ختمة ثواب لوالدي..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-emerald-850"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-stone-700">المدة الزمنية المستهدفة (بالأيام):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min={1}
                  max={365}
                  value={newDays}
                  onChange={(e) => setNewDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-emerald-800"
                />
                <span className="text-xs text-stone-500 shrink-0">يوم كامل</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-700 text-xs font-bold cursor-pointer transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-950 text-white hover:bg-emerald-900 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              حفظ وتأسيس الختمة
            </button>
          </div>
        </form>
      )}

      {/* List of Khatmahs */}
      {khatmahs.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            لا توجد ختمات قرآنية مضافة حالياً. اضغط على زر "إنشاء ختمة جديدة" في الأعلى لبدء التخطيط والختم المبارك لكتاب الله العظيم.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {khatmahs.map(khatmah => {
            const pagesLeft = khatmah.targetPages - khatmah.currentPage;
            const percentage = Math.round((khatmah.currentPage / khatmah.targetPages) * 100);

            // Calculations based on date
            const start = new Date(khatmah.startDate);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - start.getTime());
            const daysPassed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const daysLeft = Math.max(0, khatmah.targetDays - daysPassed);

            // Plan details
            const targetCompletedSoFar = Math.round((khatmah.targetPages / khatmah.targetDays) * daysPassed);
            const statusType = khatmah.currentPage >= targetCompletedSoFar ? 'ahead' : 'behind';
            const pageDifference = Math.abs(khatmah.currentPage - targetCompletedSoFar);
            const neededPagesPerDay = daysLeft > 0 ? (pagesLeft / daysLeft).toFixed(1) : pagesLeft;

            return (
              <div 
                key={khatmah.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Header line of the card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                  <div className="space-y-1">
                    <h4 className="font-serif font-black text-sm md:text-base text-emerald-950 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-800" />
                      <span>{khatmah.title}</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-stone-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تاريخ البدء: {khatmah.startDate}</span>
                      </span>
                      <span>•</span>
                      <span>المدة الكلية: {khatmah.targetDays} يوم</span>
                      {daysLeft > 0 ? (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700">متبقي: {daysLeft} يوم</span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-serif font-bold">انتهت مدة التخطيط الكلية</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteKhatmah(khatmah.id)}
                    className="p-1.5 self-end sm:self-center hover:bg-stone-50 text-stone-400 hover:text-rose-600 border border-transparent hover:border-stone-100 rounded-lg transition-all cursor-pointer"
                    title="حذف هذه الختمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Indicator Ahead or Behind */}
                {khatmah.currentPage < khatmah.targetPages ? (
                  <div className={`p-3 rounded-xl flex items-center justify-between text-right gap-3 ${
                    statusType === 'ahead' 
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-900 border border-amber-100'
                  }`}>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>{statusType === 'ahead' ? '📈 أنت متقدم بسير القراءة' : '📉 تحتاج لتسريع وتيرة القراءة'}</span>
                        <span className="font-mono text-[10px] bg-white border px-1.5 rounded-md">بفارق {pageDifference} صفحة</span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-normal">
                        مستوى القراءة المستهدف حالياً هو الوصول إلى الصفحة <strong>{targetCompletedSoFar}</strong>. وأنت تقف في الصفحة <strong>{khatmah.currentPage}</strong>.
                      </p>
                    </div>

                    <div className="text-left">
                      <div className="text-[10px] text-stone-400 font-bold">المعدل اليومي الجديد المطلوب:</div>
                      <div className="font-serif font-bold text-xs">
                        {neededPagesPerDay} صفحة / يوم
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950 to-emerald-900 text-white border border-amber-300 text-right flex items-center gap-3 justify-between shadow-sm">
                    <div className="space-y-0.5">
                      <h5 className="font-serif font-black text-xs text-amber-300 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 fill-amber-300 text-emerald-950" />
                        <span>مبارك ختم القرآن الكريم 🎉</span>
                      </h5>
                      <p className="text-[10px] text-stone-200">
                        الحمد لله الذي وفقكم لإتمام تلاوة وختم كتابه العظيم. تقبّل الله منكم صالح الأعمال وكتبه في صحيفة حسناتكم.
                      </p>
                    </div>
                    <Flame className="w-8 h-8 text-amber-300 shrink-0" />
                  </div>
                )}

                {/* Progress Indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-xs">
                    <div className="text-right">
                      <span className="font-bold text-stone-800">الصفحة الحالية: </span>
                      <span className="font-mono font-black text-emerald-950 ">{khatmah.currentPage}</span>
                      <span className="text-stone-400 mx-1">/</span>
                      <span className="text-stone-500 font-mono text-[11px]">{khatmah.targetPages} صفحة كلي</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      إتمام: {percentage}%
                    </span>
                  </div>

                  {/* Standard Progress Bar */}
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-700 to-emerald-900 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Controls and quick page logging */}
                {khatmah.currentPage < khatmah.targetPages && (
                  <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    {/* Quick Juz Select */}
                    <div className="flex items-center gap-2 justify-start w-full sm:w-auto">
                      <span className="text-[11px] font-bold text-stone-600 shrink-0">القراءة بحسب الجزء:</span>
                      <select
                        onChange={(e) => {
                          const juz = parseInt(e.target.value, 10);
                          if (juz > 0) handleJuzChange(khatmah.id, juz);
                        }}
                        className="py-1 px-2.5 rounded-lg border border-stone-200 text-[11px] font-bold bg-stone-55 hover:bg-stone-100 cursor-pointer focus:outline-emerald-800"
                        defaultValue=""
                      >
                        <option value="">-- اختر الجزء --</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => (
                          <option key={juzNum} value={juzNum}>الجزء {juzNum}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Page Logs */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleQuickAddPage(khatmah.id, -5)}
                        disabled={khatmah.currentPage <= 0}
                        className="p-1 px-2.5 hover:bg-stone-150 disabled:opacity-50 text-stone-600 border border-stone-200 bg-stone-50 rounded-lg text-xs font-bold cursor-pointer select-none"
                      >
                        -٥ صفحات
                      </button>
                      <button
                        onClick={() => handleQuickAddPage(khatmah.id, -1)}
                        disabled={khatmah.currentPage <= 0}
                        className="p-1.5 hover:bg-stone-150 disabled:opacity-50 text-stone-650 border border-stone-200 bg-stone-50 rounded-lg cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1 mx-1.5">
                        <span className="text-xs text-stone-500 font-bold">تحديد الصفحة:</span>
                        <input
                          type="number"
                          max={604}
                          min={0}
                          value={khatmah.currentPage}
                          onChange={(e) => handleUpdatePage(khatmah.id, parseInt(e.target.value, 15) || 0)}
                          className="w-16 px-1.5 py-1 text-center font-bold text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-emerald-800"
                        />
                      </div>

                      <button
                        onClick={() => handleQuickAddPage(khatmah.id, 1)}
                        disabled={khatmah.currentPage >= khatmah.targetPages}
                        className="p-1.5 bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickAddPage(khatmah.id, 5)}
                        disabled={khatmah.currentPage >= khatmah.targetPages}
                        className="p-1 px-2.5 bg-emerald-100 text-emerald-950 hover:bg-emerald-250 disabled:opacity-50 rounded-lg text-xs font-bold cursor-pointer select-none"
                      >
                        +٥ صفحات
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recommended Sura Planner */}
      <div className="bg-gradient-to-br from-stone-50 to-stone-100/60 rounded-2xl border border-stone-200 p-4.5 space-y-3 text-right">
        <h4 className="font-serif font-black text-xs md:text-sm text-emerald-950">📋 كم صفحة أحتاج لإنهاء الختمة معينة؟</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white/95 p-3 rounded-xl border border-stone-200 space-y-1">
            <span className="text-xs font-bold text-emerald-950">ختمة الـ ٣٠ يوماً (شهر كامل):</span>
            <p className="text-[10px] text-stone-500 leading-normal">
              تقرأ <strong>٢٠ صفحة يومياً</strong> (أي جزء كامل). بمعدّل ٤ صفحات بعد كل فريضة من الصلوات الخمس اليومية.
            </p>
          </div>
          <div className="bg-white/95 p-3 rounded-xl border border-stone-200 space-y-1">
            <span className="text-xs font-bold text-emerald-950">ختمة الـ ١٥ يوماً (نصف شهر):</span>
            <p className="text-[10px] text-stone-500 leading-normal">
              تقرأ <strong>٤٠ صفحة يومياً</strong> (أي جزأين). بمعدل ٨ صفحات ملحقة بكل فريضة يومية حاضرة ومقررة.
            </p>
          </div>
          <div className="bg-white/95 p-3 rounded-xl border border-stone-200 space-y-1">
            <span className="text-xs font-bold text-emerald-950">ختمة الـ ١٠ أيام (عشر مكرمة):</span>
            <p className="text-[10px] text-stone-500 leading-normal">
              تقرأ <strong>٦٠ صفحة يومياً</strong> (أي ٣ أجزاء كاملة). فريضة ممتعة وهادفة في عشرة شعبان والقران وذي الحجة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

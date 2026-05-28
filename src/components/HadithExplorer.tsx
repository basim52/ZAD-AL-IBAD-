import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Bookmark, Search, Share2, Heart, Sparkles, Plus, Trash2, 
  CheckCircle2, ArrowRightLeft, Info, Calendar, Filter, Copy, Check,
  Smartphone, Image, Download, Star, ExternalLink, RefreshCw, Settings
} from 'lucide-react';
import { getAll360Hadiths, getHadithForDay, Hadith } from '../data/hadithsData';

// Helper to find the day of the year (1-360 mapped)
function getDayOfYearIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay) || 1;
  // Map 1-365 into 1-360 safely
  return ((day - 1) % 360) + 1;
}

interface CustomHadith {
  id: number;
  dayNumber: number;
  text: string;
  source: string;
  book: string;
  category: string;
}

export default function HadithExplorer() {
  const [allHadiths, setAllHadiths] = useState<Hadith[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentHadith, setCurrentHadith] = useState<Hadith | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<number[]>([]); // Array of dayNumbers
  const [completedDays, setCompletedDays] = useState<number[]>([]); // Array of dayNumbers
  const [customHadiths, setCustomHadiths] = useState<CustomHadith[]>([]);
  
  // Custom hadith form state
  const [customText, setCustomText] = useState<string>('');
  const [customSource, setCustomSource] = useState<string>('');
  const [customBook, setCustomBook] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('أخلاق');
  const [customDay, setCustomDay] = useState<number>(1);
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // إعدادات مخصصة لتصدير الصور بخط واضح وكبير جداً
  const [exportFontFamily, setExportFontFamily] = useState<string>('Cairo'); 
  const [exportBaseFontSize, setExportBaseFontSize] = useState<number>(36); // Default to a very large and clear size (36px)

  // View toggles: simple segment or full side-by-side
  const [simulatorTheme, setSimulatorTheme] = useState<'emerald' | 'purple'>('purple');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('12:00');
  const [composeActiveTab, setComposeActiveTab] = useState<'hadiths' | 'summary' | 'works'>('hadiths');

  // Simulated Android Toast states
  const [androidToastText, setAndroidToastText] = useState<string | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Load everything
  useEffect(() => {
    const list = getAll360Hadiths();
    setAllHadiths(list);

    // Get current day of the year
    const todayIndex = getDayOfYearIndex();
    setSelectedDay(todayIndex);
    setCurrentHadith(getHadithForDay(todayIndex));

    // Load from localstorage
    const savedFavs = localStorage.getItem('daily_amaal_hadith_favorites');
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) {}
    }

    const savedCompleted = localStorage.getItem('daily_amaal_hadith_completed');
    if (savedCompleted) {
      try { setCompletedDays(JSON.parse(savedCompleted)); } catch (e) {}
    }

    const savedCustoms = localStorage.getItem('daily_amaal_hadith_customs');
    if (savedCustoms) {
      try { setCustomHadiths(JSON.parse(savedCustoms)); } catch (e) {}
    }

    // Dynamic clock for phone simulator
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Update specific hadith when day changes
  useEffect(() => {
    if (selectedDay >= 1 && selectedDay <= 360) {
      setCurrentHadith(getHadithForDay(selectedDay));
    }
  }, [selectedDay]);

  // Toast trigger representing Toast.makeText(context, ..., Toast.LENGTH_SHORT).show()
  const triggerAndroidToast = (text: string) => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setAndroidToastText(text);
    const id = setTimeout(() => {
      setAndroidToastText(null);
    }, 3000);
    setToastTimeoutId(id);
  };

  // Persists helper
  const saveFavorites = (updated: number[]) => {
    setFavorites(updated);
    localStorage.setItem('daily_amaal_hadith_favorites', JSON.stringify(updated));
  };

  const saveCompleted = (updated: number[]) => {
    setCompletedDays(updated);
    localStorage.setItem('daily_amaal_hadith_completed', JSON.stringify(updated));
  };

  const saveCustoms = (updated: CustomHadith[]) => {
    setCustomHadiths(updated);
    localStorage.setItem('daily_amaal_hadith_customs', JSON.stringify(updated));
  };

  // Actions
  const toggleFavorite = (dayNum: number) => {
    let updated;
    if (favorites.includes(dayNum)) {
      updated = favorites.filter(d => d !== dayNum);
      triggerAndroidToast('❌ تم الإزالة من الأحاديث المفضلة');
    } else {
      updated = [...favorites, dayNum];
      triggerAndroidToast('❤️ تم الإضافة إلى الأحاديث المفضلة');
    }
    saveFavorites(updated);
  };

  const toggleCompleted = (dayNum: number) => {
    let updated;
    if (completedDays.includes(dayNum)) {
      updated = completedDays.filter(d => d !== dayNum);
      triggerAndroidToast('🔄 تم التراجع عن علامة التدبر');
    } else {
      updated = [...completedDays, dayNum];
      triggerAndroidToast('✅ أحسنت! تم تسجيل تدبر وقراءة نصوص اليوم في السجل');
    }
    saveCompleted(updated);
  };

  const currentDayIsToday = selectedDay === getDayOfYearIndex();

  const handleCopyText = (hadithText: string, hadithSource: string, hadithBook: string) => {
    const fullText = `"${hadithText}"\n\nالمصدر: ${hadithSource}\nالكتاب: ${hadithBook}\n— تطبيق حقيبة الأعمال الروحية`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopySuccess(true);
      triggerAndroidToast('📋 تم نسخ النص الكامل للحديث بفضل الله');
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleShareHadith = async (hadith: Hadith) => {
    triggerAndroidToast('جاري تجهيز الصورة للمشاركة...');
    
    // Attempt Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حديث اليوم ${hadith.dayNumber} - حقيبة الأعمال`,
          text: `"${hadith.text}"\n\nـ المصدر: ${hadith.source}\n📖 كتاب: ${hadith.book}\n— تطبيق حقيبة الأعمال الروحية`,
          url: window.location.href
        });
        triggerAndroidToast('📤 تم فتح قائمة المشاركة بنجاح');
        return;
      } catch (e) {
        // Fall back to copy
      }
    }
    
    // Copy fallback
    handleCopyText(hadith.text, hadith.source, hadith.book);
  };

  // HTML Canvas Image Export Generator - Generates beautiful high fidelity calligraphic picture
  const handleSaveAsImage = (hadith: Hadith) => {
    triggerAndroidToast('جاري حفظ الحديث كصورة...');
    
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      triggerAndroidToast('❌ عذراً، لا يدعم متصفحك توليد الصور');
      return;
    }

    // 1. Draw Starry/Plum spiritual premium linear gradient - Lightened Purple (تفتيح اللون البنفسجي)
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#8E24AA'); // Vivid bright violet purple
    gradient.addColorStop(0.5, '#6A1B9A'); // Rich medium royal purple
    gradient.addColorStop(1, '#3F0C70'); // Vibrant deep violet-purple base
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);

    // Subtle radial light glow in the center to make the text pop beautifully and feel lighter
    const radialGlow = ctx.createRadialGradient(400, 400, 50, 400, 400, 480);
    radialGlow.addColorStop(0, 'rgba(234, 128, 252, 0.22)'); // Soft light purple glow
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, 800, 800);

    // 2. Draw luxury geometric gold double border frame
    ctx.strokeStyle = '#D4AF37'; // Golden
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 740);

    ctx.strokeStyle = '#F3E5F5'; // Soft lavender inner lines
    ctx.lineWidth = 1;
    ctx.strokeRect(38, 38, 724, 724);

    // Ornament 4 corner moons/stars
    const corners = [
      { x: 30, y: 30 }, { x: 770, y: 30 },
      { x: 30, y: 770 }, { x: 770, y: 770 }
    ];
    ctx.fillStyle = '#D4AF37';
    corners.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Campaign Header (حملة التكاتف والايمان كترويسة)
    ctx.fillStyle = '#D4AF37';
    ctx.font = `bold 30px "${exportFontFamily}", "Amiri", "Traditional Arabic", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('حَمْلَةُ التَّكَاْتُفِ وَالْإِيْمَانِ', 400, 90);

    // Decorative golden horizontal line under the campaign name
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(280, 110);
    ctx.lineTo(520, 110);
    ctx.stroke();

    // 4. Draw Title: Clean Day Number Indicator WITHOUT "حكمة اليوم"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 20px "${exportFontFamily}", "Amiri", "Traditional Arabic", sans-serif`;
    ctx.fillText(`الحديث الشريف - اليوم الـ ${hadith.dayNumber}`, 400, 155);

    // 5. Draw Hadith text (Centered & wrapped) - Custom elegant font
    ctx.fillStyle = '#FFFFFF';
    
    // Dynamic text size logic to prevent overflow while keeping the font maximally large
    const textLen = hadith.text.length;
    let fontSize = exportBaseFontSize; // Use the configured base font size
    
    if (textLen > 240) {
      fontSize = Math.min(fontSize, 26);
    } else if (textLen > 150) {
      fontSize = Math.min(fontSize, 32);
    }
    
    // Line height is dynamically adjusted relative to the font size
    const textLineHeight = Math.round(fontSize * 1.5);
    
    ctx.font = `bold ${fontSize}px "${exportFontFamily}", "Amiri", "Scheherazade New", sans-serif`;
    const textYStart = 245;
    const textMaxWidth = 640; // Widened outer wrap bounding box so layout utilizes space
    
    // Wrapping text helper
    const words = `"${hadith.text}"`.split(' ');
    let line = '';
    let currentY = textYStart;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > textMaxWidth && n > 0) {
        ctx.fillText(line, 400, currentY);
        line = words[n] + ' ';
        currentY += textLineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 400, currentY);

    // 6. Draw Golden/Lavender Divider
    const dividerY = Math.max(500, currentY + 45);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, dividerY);
    ctx.lineTo(550, dividerY);
    ctx.stroke();

    // Small golden center diamond decoration
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.moveTo(400, dividerY - 6);
    ctx.lineTo(406, dividerY);
    ctx.lineTo(400, dividerY + 6);
    ctx.lineTo(394, dividerY);
    ctx.closePath();
    ctx.fill();

    // 7. Draw Source Info (Attribution) - Enlarged
    ctx.fillStyle = '#F1C40F'; // Vibrant gold-yellow
    ctx.font = `bold 24px "${exportFontFamily}", "Amiri", sans-serif`;
    ctx.fillText(`عن: ${hadith.source}`, 400, dividerY + 45);

    // 8. Draw Document Book - Enlarged
    ctx.fillStyle = '#B3E5FC'; // Vivid very light blue/lavender tone
    ctx.font = `bold 16px "${exportFontFamily}", "Amiri", sans-serif`;
    ctx.fillText(`المصدر: كتاب ${hadith.book}`, 400, dividerY + 80);

    // 9. Draw Footer Branding Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '12px "JetBrains Mono", sans-serif';
    ctx.fillText('تطبيق حقيبة الأعمال الروحية © ۲٠۲٦ • غرس المعارف والفضائل', 400, 740);

    // Trigger physical PNG download
    setTimeout(() => {
      try {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `hadith_day_${hadith.dayNumber}.png`;
        link.href = url;
        link.click();
        triggerAndroidToast('💾 تم حفظ الصورة بجهازك بنجاح! طاب يومك بالتدبر');
      } catch (err) {
        triggerAndroidToast('❌ تعذر إكمال كتابة الملف لمتصفحك المحلي');
      }
    }, 1500);
  };

  const handleAddCustomHadith = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || !customSource.trim()) return;

    const newEntry: CustomHadith = {
      id: Date.now(),
      dayNumber: customDay,
      text: customText,
      source: customSource,
      book: customBook || 'مستند شخصي',
      category: customCategory
    };

    const updated = [...customHadiths, newEntry];
    saveCustoms(updated);
    triggerAndroidToast('📝 تم إدراج الحكمة اليدوية بنجاح في سجلاتك');

    // Reset Form
    setCustomText('');
    setCustomSource('');
    setCustomBook('');
    setCustomDay(prev => Math.min(360, prev + 1));
    setShowCustomForm(false);
  };

  const handleDeleteCustomHadith = (id: number) => {
    if (window.confirm('هل تريد حذف هذا الحديث المُدخل يدوياً من مكتبتك؟')) {
      const updated = customHadiths.filter(h => h.id !== id);
      saveCustoms(updated);
      triggerAndroidToast('🗑️ تم إزالة السجل المخصص من الذاكرة');
    }
  };

  // Filtering list
  const filteredHadiths = allHadiths.filter(hadith => {
    const matchesSearch = hadith.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          hadith.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hadith.book.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const categories = ["أخلاق", "عبادة", "علم", "اجتماع", "رزق", "أهل البيت"];
  const totalCompletedPercent = Math.round((completedDays.length / 360) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6" id="hadith-explorer-tab" dir="rtl">
      
      {/* Title Header */}
      <div className="text-right space-y-2 border-b border-stone-200/50 pb-5">
        <span className="text-[10px] font-sans font-bold px-3 py-1 rounded-full bg-indigo-150 text-indigo-900 border border-indigo-250 uppercase tracking-widest">
          مستكشف الأحاديث الشريفة (٣٦٠ يوماً)
        </span>
        <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-stone-950 flex items-center gap-2 pt-1">
          <span>📜</span>
          <span>دراية الأنوار: ٣٦٠ حديثاً من حكمة العترة الطاهرة</span>
        </h2>
        <p className="text-xs md:text-sm text-stone-550 leading-relaxed max-w-4xl">
          يمتد هذا السجل الشريف على مدار ٣٦٠ يوماً لتوفير جرعة وعظية وتدبرية متكاملة لسالكي طريق الإيمان، مقتبسة من أمهات المصادر الشيعية المعتبرة كالكافي للكليني الشريف، بحار الأنوار للعلامة المجلسي، وتحف العقول عن آل الرسول. تم تحصين هذا المطبوع رقمياً ليتطابق بالكامل مع نظام أندرويد الهيكلي.
        </p>
      </div>

      {/* Progress & Stat Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4.5 border border-emerald-200/60 rounded-2xl text-right flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] text-emerald-800/80 font-bold block">معدل التدبر المكتمل</span>
            <span className="font-mono text-xl font-black text-emerald-950">{completedDays.length} / ٣٦٠ يوماً</span>
          </div>
          <div className="text-left font-mono font-black text-emerald-900 text-xl bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
            {totalCompletedPercent}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4.5 border border-purple-200/60 rounded-2xl text-right flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] text-purple-800/80 font-bold block">الأحاديث المفضلة</span>
            <span className="font-mono text-xl font-black text-purple-950">{favorites.length} حديثاً محفوظاً</span>
          </div>
          <Star className="w-5 h-5 text-amber-500 fill-amber-400 animate-pulse" />
        </div>

        <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-4.5 border border-stone-200 rounded-2xl text-right flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] text-stone-600 font-bold block">حديث اليوم التلقائي</span>
            <span className="font-mono text-[11px] font-black text-stone-800 block">يوم السنة الفعلي الـ {getDayOfYearIndex()}</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              setSelectedDay(getDayOfYearIndex());
              triggerAndroidToast('⚡ تم الانتقال تلقائياً إلى حديث اليوم الفعلي في السنة');
            }}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all border border-stone-950 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3 animate-spin duration-3000" />
            <span>الانتقال لليوم ⚡</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Controls, Search, Map & Creation (Col span 7) */}
        <div className="space-y-6 lg:col-span-7">
          
          {/* Main Web Reader View Option */}
          {currentHadith && (
            <div className="bg-white border border-stone-250 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-right relative overflow-hidden">
              <div className="absolute top-2 left-6 text-stone-100 text-7xl font-serif font-black select-none pointer-events-none">
                {currentHadith.dayNumber}
              </div>

              <div className="flex items-center justify-between gap-3 relative z-10 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-bold px-3 py-1 bg-stone-900 text-white rounded-lg">
                    اليوم {currentHadith.dayNumber} من ٣٦٠
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentHadith.text, currentHadith.source, currentHadith.book)}
                    className="p-2 bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-xl border border-stone-200 cursor-pointer text-xs flex items-center gap-1"
                    title="نسخ النص الكامل للحديث"
                  >
                    {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold">{copySuccess ? 'تم النسخ' : 'نسخ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavorite(currentHadith.dayNumber)}
                    className="p-2 bg-stone-50 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-xl border border-stone-200 cursor-pointer"
                    title="المفضلة"
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(currentHadith.dayNumber) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Master Calligraphic Rendering */}
              <div className="py-6 space-y-4 relative z-10 text-center">
                <p className="font-serif font-extrabold text-[#1A1A1A] text-lg md:text-xl leading-loose px-4 md:px-6">
                  "{currentHadith.text}"
                </p>
                
                <div className="space-y-1.5 pt-3">
                  <div className="w-16 h-0.5 bg-[#4A148C]/30 mx-auto rounded-full" />
                  <h4 className="text-sm md:text-base font-serif font-bold text-[#4A148C]">
                    ـ {currentHadith.source}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-bold font-sans">
                    📖 كتاب المصنف: <span className="text-[#6A1B9A] decoration-[#6A1B9A]/30 underline underline-offset-4 font-semibold">{currentHadith.book}</span>
                  </p>
                </div>
              </div>

              {/* تخصيص وتكبير خط تصدير الصور */}
              <div className="bg-stone-50/90 p-3.5 rounded-2xl border border-stone-150 space-y-3 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-stone-450 font-bold block">التخصيص التلقائي للبطاقات الدعوية</span>
                  <div className="flex items-center gap-1.5 text-[#4A148C]">
                    <Settings className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">إعدادات خط صورة النشر 🎨</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* اختيار نوع الخط المعتمد */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 block">نوع الخط العربي (واضح وعريض):</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'Cairo', label: 'القاهرة العريض 🌟' },
                        { id: 'Almarai', label: 'خط المراعي' },
                        { id: 'Tajawal', label: 'خط تجول' },
                        { id: 'Amiri', label: 'الأميري كلاسيك' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setExportFontFamily(f.id)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border text-center ${
                            exportFontFamily === f.id
                              ? 'bg-[#4A148C] text-white border-[#4A148C] shadow-xs'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* اختيار حجم الخط */}
                  <div className="space-y-1.5 flex flex-col justify-between">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block flex justify-between items-center">
                        <span>حجم الخط بكسل: <span className="text-[#4A148C] font-black">{exportBaseFontSize}px</span></span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExportBaseFontSize(prev => Math.max(24, prev - 2))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 flex items-center justify-center font-bold text-sm text-stone-700 cursor-pointer"
                        title="تصغير"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min={24}
                        max={46}
                        step={2}
                        value={exportBaseFontSize}
                        onChange={(e) => setExportBaseFontSize(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#4A148C] h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setExportBaseFontSize(prev => Math.min(46, prev + 2))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 flex items-center justify-center font-bold text-sm text-stone-700 cursor-pointer"
                        title="تكبير"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setExportBaseFontSize(42)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer ${exportBaseFontSize === 42 ? 'bg-amber-100 text-amber-950 font-black border border-amber-300' : 'bg-stone-100 text-stone-600 hover:bg-stone-150'}`}
                      >
                        كبير جداً 🔥
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportBaseFontSize(36)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer ${exportBaseFontSize === 36 ? 'bg-amber-100 text-amber-950 font-black border border-amber-300' : 'bg-stone-100 text-stone-600 hover:bg-stone-150'}`}
                      >
                        كبير (موصى به)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportBaseFontSize(30)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer ${exportBaseFontSize === 30 ? 'bg-amber-100 text-amber-950 font-black border border-amber-300' : 'bg-stone-100 text-stone-600 hover:bg-stone-150'}`}
                      >
                        متوسط 
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share & Save Canvas Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleShareHadith(currentHadith)}
                  className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200/80 rounded-xl text-xs font-bold text-stone-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة الأثر 📤</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAsImage(currentHadith)}
                  className="py-2.5 px-4 bg-gradient-to-r from-[#4A148C] to-[#6A1B9A] hover:bg-indigo-900 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل كبطاقة للواتس 💾</span>
                </button>
              </div>

              {/* Read Checkbox & Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => toggleCompleted(currentHadith.dayNumber)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    completedDays.includes(currentHadith.dayNumber)
                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-950'
                      : 'bg-[#4A148C]/10 hover:bg-[#4A148C]/20 text-[#4A148C] border border-[#4A148C]/20 shadow-xs'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${completedDays.includes(currentHadith.dayNumber) ? 'text-emerald-700 fill-emerald-100' : ''}`} />
                  <span>
                    {completedDays.includes(currentHadith.dayNumber) 
                      ? '✅ تم قراءة وتدبر الحديث بنجاح' 
                      : '📖 سجل كمدبر ومقروء للمتابعة'}
                  </span>
                </button>

                {/* Quick manual selection slide */}
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-stone-500 font-bold shrink-0">تغيير اليوم اليدوي (١-٣٦٠):</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={selectedDay <= 1}
                      onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 font-extrabold rounded-lg select-none cursor-pointer"
                    >
                      ◀
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={360}
                      value={selectedDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 1 && val <= 360) setSelectedDay(val);
                      }}
                      className="w-14 py-1 text-center font-bold text-xs bg-stone-50 border border-stone-250 rounded-lg text-emerald-950 focus:outline-[#4A148C]"
                    />
                    <button
                      type="button"
                      disabled={selectedDay >= 360}
                      onClick={() => setSelectedDay(Math.min(360, selectedDay + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 font-extrabold rounded-lg select-none cursor-pointer"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid selector representation: 360 Days Map */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-200 pb-3">
              <div className="text-right space-y-0.5">
                <h4 className="font-serif font-black text-sm text-stone-950 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>خريطة الـ ٣٦٠ يوماً الحديثية</span>
                </h4>
                <p className="text-[10px] text-stone-550 leading-relaxed">
                  انقر على أي رقم لتحديث الحديث الحالي المعروض في المستعرض ومحاكي الأندرويد معاً.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>مقروء</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4A148C]" />
                  <span>محدد</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-stone-300" />
                  <span>غير مقروء</span>
                </span>
              </div>
            </div>

            {/* Dynamic grid map */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-[160px] overflow-y-auto scrollbar-thin p-1" id="days-map-scroller">
              {allHadiths.map(h => {
                const isToday = h.dayNumber === getDayOfYearIndex();
                const isSelected = h.dayNumber === selectedDay;
                const isDone = completedDays.includes(h.dayNumber);

                let classes = "h-8 text-[11px] font-black font-mono flex items-center justify-center rounded-lg transition-all cursor-pointer border select-none ";
                if (isSelected) {
                  classes += "bg-[#4A148C] text-white border-[#310A61] scale-102 font-extrabold shadow-xs";
                } else if (isDone) {
                  classes += "bg-emerald-100 text-emerald-900 border-emerald-250 hover:bg-emerald-150";
                } else if (isToday) {
                  classes += "bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-150 ring-1 ring-amber-400";
                } else {
                  classes += "bg-white text-stone-500 border-stone-200 hover:bg-stone-50";
                }

                return (
                  <button
                    key={h.dayNumber}
                    type="button"
                    onClick={() => {
                      setSelectedDay(h.dayNumber);
                      triggerAndroidToast(`📜 تم تحديد اليوم الـ ${h.dayNumber}`);
                    }}
                    className={classes}
                    title={`عرض حديث اليوم ${h.dayNumber}`}
                  >
                    {h.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HADITHS DATABASE BROWSER: Filter and Search of all entries */}
          <div className="space-y-4">
            <div className="text-right">
              <h4 className="font-serif font-black text-sm text-stone-900 flex items-center gap-1.5 justify-end">
                <span>📚</span>
                <span>فهرسة متكاملة والبحث في الأحاديث</span>
              </h4>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالنص الشريف، الراوي (السند)، أو عنوان الكتاب المقتبس..."
                  className="w-full pl-4 pr-10 py-2.5 text-xs bg-white border border-stone-250 rounded-xl focus:outline-[#4A148C] text-right shadow-0"
                />
              </div>
            </div>

            {/* Results view */}
            {filteredHadiths.length === 0 ? (
              <div className="text-center p-8 bg-stone-50 border border-stone-200 rounded-2xl">
                <p className="text-xs text-stone-500 font-sans">لا توجد مرويات تطابق معايير ومصطلحات البحث الحالية.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredHadiths.slice(0, 30).map(hadith => (
                  <div 
                    key={hadith.dayNumber}
                    onClick={() => {
                      setSelectedDay(hadith.dayNumber);
                      triggerAndroidToast(`📜 عرض اليوم الـ ${hadith.dayNumber}`);
                    }}
                    className={`bg-white border text-right hover:shadow-xs rounded-xl p-4 cursor-pointer transition-all space-y-3 flex flex-col justify-between ${
                      hadith.dayNumber === selectedDay 
                        ? 'border-[#4A148C] ring-1 ring-[#4A148C]' 
                        : 'border-stone-200 hover:border-[#4A148C]/40'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-black text-[#4A148C]">اليوم الـ {hadith.dayNumber}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-loose font-serif font-semibold">
                        "{hadith.text.length > 120 ? hadith.text.substring(0, 120) + '...' : hadith.text}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] text-stone-400">
                      <span>{hadith.book}</span>
                      <span className="font-bold text-stone-500">{hadith.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOOKMARK TAB AND CUSTOM ANNOTATIONS */}
          <div className="bg-amber-50/20 border border-amber-200/50 rounded-3xl p-5 space-y-4 text-right">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                <h4 className="font-serif font-black text-sm text-amber-950 flex items-center gap-1 justify-end">
                  <span>✍️</span>
                  <span>توسيع السجل وإدخال مرويات مخصصة</span>
                </h4>
                <p className="text-[10px] text-stone-500 leading-normal">
                  تسمح لك هذه الميزة بكتابة أي أحاديث أو أدعية أو مباحث أخلاقية تود إضافتها محلياً لتتكامل مع مخزنك الخاص.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="px-3.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer transition-all border border-amber-950/20"
              >
                {showCustomForm ? 'إغلاق النموذج' : '➕ إضافة حديث جديد'}
              </button>
            </div>

            {/* Custom Input Form */}
            {showCustomForm && (
              <form onSubmit={handleAddCustomHadith} className="bg-white border border-amber-200/80 rounded-2xl p-4 space-y-4 text-right animate-fade-in shadow-xs">
                <h5 className="text-xs font-bold text-stone-850">نموذج تدوين الأثَر الشريف:</h5>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 block">نص الحديث الشريف كاملاً:</label>
                  <textarea
                    required
                    rows={3}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="اكتب المعثور الشريف بتمامه وضبط حركاته ما أمكن..."
                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:outline-[#4A148C] text-right font-serif"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 block">السند أو قائل الحديث (المصدر):</label>
                    <input
                      type="text"
                      required
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                      placeholder="مثال: الإمام جعفر الصادق (عليه السلام)"
                      className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:outline-[#4A148C] text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 block">الكتاب والمجلد المقتبس منه:</label>
                    <input
                      type="text"
                      value={customBook}
                      onChange={(e) => setCustomBook(e.target.value)}
                      placeholder="مثال: بحار الأنوار - الجزء ١٠ ص١٢"
                      className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:outline-[#4A148C] text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 block">تخصيص لليوم (١ - ٣٦٠):</label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={customDay}
                    onChange={(e) => setCustomDay(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:outline-[#4A148C] text-right font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-3.5 py-1.5 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-bold cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-white bg-amber-950 hover:bg-amber-900 text-xs font-bold cursor-pointer"
                  >
                    تثبيت الحديث في السجلات 📝
                  </button>
                </div>
              </form>
            )}

            {/* Display Custom Entries */}
            {customHadiths.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-stone-600">الحكم والمرويات المضافة المخصصة:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customHadiths.map(ch => (
                    <div key={ch.id} className="bg-white/95 border border-amber-200 rounded-2xl p-4 text-right relative flex flex-col justify-between gap-3 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomHadith(ch.id)}
                        className="absolute top-2 left-2 text-stone-400 hover:text-rose-600 p-1 bg-stone-50 hover:bg-rose-50 rounded transition-colors"
                        title="حذف هذا المدخل المخصص"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="space-y-1 pl-6">
                        <span className="text-[10px] font-mono text-amber-950 font-bold block">مخصصة لليوم {ch.dayNumber}</span>
                        <p className="text-xs font-serif font-black leading-relaxed text-stone-900">
                          "{ch.text}"
                        </p>
                      </div>
                      <div className="text-[10px] text-stone-400 border-t border-stone-1D0 pt-2.5 flex justify-between items-center">
                        <span>كتاب: {ch.book}</span>
                        <span className="font-bold text-stone-500">{ch.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Android Jetpack Compose UI Simulator (Col span 5) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div className="text-center w-full max-w-[340px]">
            <h3 className="font-serif font-extrabold text-sm text-stone-800 flex items-center gap-1.5 justify-center">
              <Smartphone className="w-4 h-4 text-purple-700" />
              <span>محاكي معاينة واجهة الأندرويد (Compose)</span>
            </h3>
            <p className="text-[10px] text-stone-500 leading-relaxed mt-0.5">
              يعرض التصميم الأصلي لـ <code className="font-mono text-amber-900 text-[10px]">HadithScreen.kt</code> كود Jetpack Compose لتطابق حقيقي بنسبة ۱٠٠%.
            </p>
          </div>

          {/* smartphone container frame */}
          <div className="w-full max-w-[340px] aspect-[9/18.5] bg-stone-900 rounded-[38px] p-2.5 shadow-2.5xl border border-stone-800 relative ring-4 ring-stone-950 overflow-hidden shrink-0">
            
            {/* Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-stone-850 absolute right-3" /> {/* Camera lens */}
              <div className="w-8 h-1 rounded-full bg-stone-850 absolute left-4" /> {/* Ear speaker */}
            </div>

            {/* Android Screen body */}
            <div className="w-full h-full rounded-[28px] overflow-hidden bg-[#F3E5F5] select-none flex flex-col relative">
              
              {/* Simulator Status Bar */}
              <div className="w-full h-7 bg-[#4D1590] px-4 pt-1 text-[11px] font-bold text-white flex items-center justify-between z-40">
                <span className="font-mono tracking-tight">{currentTimeStr}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] scale-[0.8] opacity-90">LTE</span>
                  <div className="w-3.5 h-2 border border-white/80 rounded-xs p-0.5 flex items-center justify-start">
                    <div className="bg-white/90 h-full w-[85%] rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Composable TopAppBar equivalent */}
              <div className="w-full h-12 bg-[#4A148C] text-white flex items-center justify-between px-4 shadow-sm z-30">
                <div className="flex items-center gap-3">
                  {/* Composable Back Icon representation */}
                  <span className="text-base cursor-pointer">📜</span>
                  <h4 className="text-right text-[15px] font-sans font-bold tracking-tight text-white select-none pt-0.5">
                    حديث اليوم
                  </h4>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px] text-purple-200">
                  <span>API 34</span>
                </div>
              </div>

              {/* Simulated Screen Content - matches HadithScreen.kt Scaffold */}
              <div className="flex-1 flex flex-col overflow-y-auto px-4 py-4 space-y-4">
                
                {composeActiveTab === 'hadiths' ? (
                  currentHadith ? (
                    <>
                      {/* Beautiful white composable card - Shape: RoundedCornerShape(20.dp), elevation = 8.dp */}
                      <div className="w-full bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-stone-100 p-5 flex flex-col items-center justify-center min-h-[300px] gap-3 relative text-center">
                        
                        {/* Emoji text font-size 48sp */}
                        <span className="text-[44px] block select-none">📜</span>

                        {/* Text text: hadith text, font-size 22sp, medium, textAlign center, lineHeight 36.sp, color Color(0xFF1A1A1A) */}
                        <p className="text-[15px] leading-[26px] font-serif font-semibold text-[#1A1A1A] px-1 select-none">
                          {currentHadith.text}
                        </p>

                        {/* Divider separator card line: background Color(0xFF4A148C).copy(alpha = 0.5f) width 0.5f, height 2dp */}
                        <div className="w-1/2 h-[1.5px] bg-[#420E80]/40 my-1" />

                        {/* Source: text: - h.source, fontSize 18.sp, bold, color Color(0xFF4A148C) */}
                        <h5 className="text-[13px] font-extrabold text-[#4A148C]">
                          ـ {currentHadith.source}
                        </h5>

                        {/* Book: text: 📖 h.book, fontSize 14.sp, color Color.Gray */}
                        <p className="text-[10px] text-stone-500 font-bold">
                          📖 {currentHadith.book}
                        </p>

                      </div>

                      {/* Controller Row - Compartment for Compose Buttons */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* share button onClick -> Toast "جاري تجهيز الصورة للمشاركة..." */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerAndroidToast('جاري تجهيز الصورة للمشاركة...');
                            setTimeout(() => {
                              handleShareHadith(currentHadith);
                            }, 1000);
                          }}
                          className="py-2 px-3 bg-[#4A148C] hover:bg-[#390F70] text-white text-xs font-bold rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-1 cursor-pointer select-none border-0 shadow-sm"
                        >
                          <span>📤 مشاركة</span>
                        </button>

                        {/* save button onClick -> Toast "جاري حفظ الحديث كصورة..." */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerAndroidToast('جاري حفظ الحديث كصورة...');
                            setTimeout(() => {
                              handleSaveAsImage(currentHadith);
                            }, 1000);
                          }}
                          className="py-2 px-3 bg-[#6A1B9A] hover:bg-[#52137B] text-white text-xs font-bold rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-1 cursor-pointer select-none border-0 shadow-sm"
                        >
                          <span>💾 حفظ</span>
                        </button>
                      </div>

                      {/* Day description label */}
                      <p className="text-[10px] text-center text-stone-500 font-bold select-none pt-1">
                        حديث اليوم {currentHadith.dayNumber} من ٣٦٠ يوماً
                      </p>
                    </>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-stone-400">
                      <span>لا توجد مرويات نشطة</span>
                    </div>
                  )
                ) : composeActiveTab === 'summary' ? (
                  <div className="space-y-4 animate-fade-in text-right">
                    <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-xs space-y-2.5">
                      <h4 className="text-sm font-sans font-black text-purple-900 flex items-center gap-1.5 justify-end">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span>منظومة زاد التقوى اليومية</span>
                      </h4>
                      <p className="text-[11px] text-stone-550 leading-relaxed font-sans">
                        مقياس الالتزام التراكمي وتدبر السنن في تطبيق أندرويد الهيكلي.
                      </p>
                      
                      {/* Interactive Progress Indicators */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 text-center">
                          <span className="text-[10px] text-amber-900 block font-bold">الأعمال المكتملة</span>
                          <span className="text-sm font-mono font-black text-amber-950">{completedDays.length}</span>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-2.5 border border-purple-200 text-center">
                          <span className="text-[10px] text-purple-900 block font-bold">المفضلة الشريفة</span>
                          <span className="text-sm font-mono font-black text-purple-950">{favorites.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Chart Representation */}
                    <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-xs space-y-2">
                      <span className="text-[10px] text-stone-400 font-bold block">معدل التدبر والمتابعة الأسبوعي</span>
                      <div className="h-16 flex items-end justify-between px-3 pt-2">
                        {[40, 70, 50, 90, 60, 85, 100].map((val, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1 w-6">
                            <div className="w-1.5 rounded-t-xs bg-[#6A1B9A]/80 hover:bg-[#6A1B9A] transition-all cursor-pointer" style={{ height: `${val * 0.45}px` }} />
                            <span className="text-[7.5px] text-stone-450 font-bold font-mono">ي{idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#4D1590] text-white rounded-2xl p-3.5 border-0 shadow-xs space-y-1.5 text-center">
                      <span className="text-[12px] font-bold block">🌟 {totalCompletedPercent}% نسبة التدبر العام 🌟</span>
                      <p className="text-[9px] text-purple-200 font-sans">ثبّت اللَّهُ وطّد قلبك وسدّد خطاك في مراتب العبادة والطاعة.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-fade-in text-right">
                    <div className="flex items-center justify-between border-b border-purple-200/50 pb-2">
                      <span className="text-[9px] font-sans font-bold text-stone-500">ليوم السنة الـ {getDayOfYearIndex()}</span>
                      <h4 className="text-xs font-sans font-black text-[#4A148C]">برنامج الأعمال والفرائض اليومية</h4>
                    </div>

                    {/* Works Lists */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {[
                        { title: "صلاة الفجر ونافلتها المباركة", done: true, time: "٠٤:١٢ ص", reward: "نور الوجه" },
                        { title: "تعقيبات الصلاه المشتركة والأذكار", done: false, time: "٠٤:٤٥ ص", reward: "سعة الرزق" },
                        { title: "صلاة الظهر وصلاة نافلة الظهر", done: true, time: "١٢:٠٥ م", reward: "دفع البلاء" },
                        { title: "تلاوة سورة يس ودعاء اليوم", done: true, time: "٠١:٢٠ م", reward: "طمأنينة النفس" },
                        { title: "تسبيحة الورد الصغرى (١٠٠ مرة)", done: false, time: "٠٥:٠٠ م", reward: "غرس الجنة" }
                      ].map((work, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => triggerAndroidToast(`✅ تم تحديث حالة العمل: ${work.title}`)}
                          className={`bg-white border rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:border-purple-300 transition-all ${
                            work.done ? 'border-emerald-250 bg-emerald-50/20' : 'border-stone-150'
                          }`}
                        >
                          <span className="text-[8px] font-mono text-stone-400 font-bold shrink-0">{work.time}</span>
                          <div className="flex-1 space-y-0.5">
                            <span className={`text-[10px] font-bold block ${work.done ? 'line-through text-stone-400' : 'text-stone-850'}`}>
                              {work.title}
                            </span>
                            <span className="text-[7.5px] text-purple-600 font-mono bg-purple-50 px-1.5 py-0.2 rounded-xs font-bold border border-purple-100">
                              🎁 الأثر: {work.reward}
                            </span>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            work.done ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-stone-300 bg-stone-50'
                          }`}>
                            {work.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Simulated Jetpack Compose NavigationBar mapping exactly to the Kotlin code */}
              <div className="w-full bg-[#ECE0F8] border-t border-[#D0BCFF]/35 py-1 px-1.5 flex items-center justify-around z-40">
                
                {/* 1. Works Item (selected = showWorks) */}
                <button
                  type="button"
                  onClick={() => {
                    setComposeActiveTab('works');
                    triggerAndroidToast('📋 الانتقال لتبويب الأعمال الكلية في الأندرويد');
                  }}
                  className="flex flex-col items-center gap-0.5 group cursor-pointer border-0 bg-transparent flex-1 focus:outline-none"
                >
                  <div className={`px-4.5 py-0.5 rounded-full transition-all flex items-center justify-center ${
                    composeActiveTab === 'works' ? 'bg-[#D0BCFF] text-[#1D192B]' : 'text-[#49454F] hover:bg-[#E8DEF8]/50'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-sans font-bold tracking-tight ${
                    composeActiveTab === 'works' ? 'text-[#1D192B] font-black' : 'text-[#49454F]'
                  }`}>الأعمال</span>
                </button>

                {/* 2. Summary Item (selected = showSummary) */}
                <button
                  type="button"
                  onClick={() => {
                    setComposeActiveTab('summary');
                    triggerAndroidToast('📊 الانتقال لتبويب ملخص الالتزام في الأندرويد');
                  }}
                  className="flex flex-col items-center gap-0.5 group cursor-pointer border-0 bg-transparent flex-1 focus:outline-none"
                >
                  <div className={`px-4.5 py-0.5 rounded-full transition-all flex items-center justify-center ${
                    composeActiveTab === 'summary' ? 'bg-[#D0BCFF] text-[#1D192B]' : 'text-[#49454F] hover:bg-[#E8DEF8]/50'
                  }`}>
                    <Star className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-sans font-bold tracking-tight ${
                    composeActiveTab === 'summary' ? 'text-[#1D192B] font-black' : 'text-[#49454F]'
                  }`}>الملخص</span>
                </button>

                {/* 3. Hadith Item (Icons.Default.MenuBook -> selected = showHadith) */}
                <button
                  type="button"
                  onClick={() => {
                    setComposeActiveTab('hadiths');
                    triggerAndroidToast('📜 الانتقال لتبويب الأحاديث الشريفة في الأندرويد');
                  }}
                  className="flex flex-col items-center gap-0.5 group cursor-pointer border-0 bg-transparent flex-1 focus:outline-none"
                >
                  <div className={`px-4.5 py-0.5 rounded-full transition-all flex items-center justify-center ${
                    composeActiveTab === 'hadiths' ? 'bg-[#D0BCFF] text-[#1D192B]' : 'text-[#49454F] hover:bg-[#E8DEF8]/50'
                  }`}>
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-[9px] font-sans font-bold tracking-tight ${
                    composeActiveTab === 'hadiths' ? 'text-[#1D192B] font-black' : 'text-[#49454F]'
                  }`}>الأحاديث</span>
                </button>

              </div>

              {/* Android Simulated Native Toast.makeText Pop-up Overlay */}
              {androidToastText && (
                <div className="absolute bottom-16 left-6 right-6 bg-[#323232] text-white text-[10px] py-1.5 px-3 rounded-2xl text-center shadow-lg font-sans z-50 animate-fade-in">
                  <span>{androidToastText}</span>
                </div>
              )}

              {/* Virtual Bottom Navigation Bar (Android System Controls) */}
              <div className="w-full h-11 bg-black/95 flex items-center justify-around px-8 z-40 mt-auto">
                <span className="text-white opacity-95 text-xs font-semibold cursor-pointer select-none">🔲</span> {/* Multitask */}
                <span className="text-white opacity-95 text-sm font-semibold cursor-pointer select-none">⚪</span> {/* Home */}
                <span className="text-white opacity-95 text-xs font-semibold cursor-pointer select-none transform scale-x-[-1]">◀</span> {/* Back */}
              </div>

            </div>
          </div>

          {/* Visual Entity Mapping of Room Database AppDatabase v2 */}
          <div className="w-full max-w-[340px] bg-purple-50/50 border border-purple-200 rounded-3xl p-4.5 space-y-3.5 text-right animate-fade-in shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/50">
              <span className="text-[10px] font-mono bg-purple-100 text-[#4A148C] px-2 py-0.5 rounded-md font-bold">
                AppDatabase v2 Map
              </span>
              <h4 className="font-serif font-black text-xs text-purple-950 flex items-center gap-1.5 justify-end">
                <span>🗄️</span>
                <span>هيكل قاعدة البيانات محليًا (Room)</span>
              </h4>
            </div>

            <p className="text-[10px] text-stone-605 leading-relaxed">
              يرتبط محاكي واجهة الـ Compose بقاعدة البيانات الفرعية لدمج مرويات الأثر الشريف وأحاديث الأخلاق في الإصدار الثاني (Version 2):
            </p>

            <div className="space-y-2">
              {/* Table 1: daily_works */}
              <div className="bg-white border border-stone-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="text-left font-mono text-[9px] text-[#4A148C] font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                  <span>Dao Active</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="font-serif font-semibold text-stone-850 text-[10.5px] block">DailyWorkEntity (جدول الأعمال)</span>
                  <span className="text-[9px] text-emerald-800 font-extrabold block">← dailyWorkDao()</span>
                </div>
              </div>

              {/* Table 2: hadiths */}
              <div className="bg-white border border-purple-300 rounded-xl p-2.5 flex items-center justify-between gap-1.5 ring-1 ring-purple-100 bg-purple-50/20">
                <div className="text-left font-mono text-[9px] text-[#4A148C] font-semibold bg-[#E8DEF8] px-1.5 py-0.5 rounded">
                  <span>✨ New in v2</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="font-serif font-semibold text-purple-950 text-[10.5px] block">HadithEntity (الأحاديث الشريفة)</span>
                  <span className="text-[9px] text-purple-850 font-extrabold block">← hadithDao()</span>
                </div>
              </div>
            </div>

            {/* Quick Kotlin code block */}
            <div className="bg-[#1A102F] p-3 rounded-2xl text-left font-mono text-[9.5px] text-purple-200/90 leading-normal border border-purple-900/40 relative overflow-hidden">
              <span className="absolute top-1 right-2 text-[8px] tracking-wider text-purple-400 font-semibold" dir="rtl">هيكلية الفئة:</span>
              <pre className="pt-2 text-[8.5px] overflow-x-auto text-purple-300 font-mono" dir="ltr">
{`@Database(
    entities = [
        DailyWorkEntity::class, 
        HadithEntity::class
    ], 
    version = 2
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dailyWorkDao(): DailyWorkDao
    abstract fun hadithDao(): HadithDao
}`}
              </pre>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

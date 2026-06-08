import React, { useState, useRef } from 'react';
import { 
  Download, Copy, Share2, Sparkles, RefreshCw, ZoomIn, ZoomOut, Check, AlignCenter, AlignRight, Type, Flame, AppWindow, Eye, CornerDownRight, Flower
} from 'lucide-react';
import { toPng } from 'html-to-image';

// Predefined deep inspiring spiritual quotes/messages
interface PresetQuote {
  title: string;
  category: string;
  text: string;
  source: string;
}

const PRESET_QUOTES: PresetQuote[] = [
  {
    title: 'طمأنينة الروح',
    category: 'آية قرآنية',
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    source: 'سورة الرعد — آية ٢٨'
  },
  {
    title: 'اليسر بعد العسر',
    category: 'آية قرآنية',
    text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    source: 'سورة الشرح — آية ٥-٦'
  },
  {
    title: 'وبشر الصابرين',
    category: 'آية قرآنية',
    text: 'وَبَشِّرِ الصَّابِرِينَ • الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ',
    source: 'سورة البقرة — آية ١٥٥-١٥٦'
  },
  {
    title: 'من علامات الكمال العقلي',
    category: 'حكمة مأثورة',
    text: 'إِذَا تَمَّ الْعَقْلُ نَقَصَ الْكَلاَمُ',
    source: 'الإمام علي بن أبي طالب (ع) — نهج البلاغة'
  },
  {
    title: 'الرضى والتوكل',
    category: 'ذكر وتفويض',
    text: 'إِلٰهِي رِضاً بِقَضَائِكَ وَتَسْلِيماً لِأَمْرِكَ وَلَا مَعْبُودَ سِوَاكَ يَا غِيَاثَ الْمُسْتَغِيثِينَ',
    source: 'من دعاء الإمام الحسين (ع)'
  },
  {
    title: 'مناجاة الغريب',
    category: 'مناجاة روحية',
    text: 'إِلٰهِي لَمْ يَكُنْ لِي حَوْلٌ فَأَنْتَقِلَ بِهِ عَنْ مَعْصِيَتِكَ إِلاَّ فِي وَقْتٍ أَيْقَظْتَنِي لِمَحَبَّتِكَ، وَكَمَا أَرَدْتَ أَنْ أَكُونَ كُنْتُ، فَشَكَرْتُكَ بِإِدْخَالِي فِي كَرَمِكَ',
    source: 'من المناجاة الشعبانية العظيمة'
  },
  {
    title: 'نداء المضطر',
    category: 'آية وتوسل',
    text: 'أَمَّن يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ السُّوءَ وَيَجْعَلُكُمْ خُلَفَاءَ الْأَرْضِ',
    source: 'سورة النمل — آية ٦٢'
  },
  {
    title: 'الأمل العظيم',
    category: 'آية قرآنية',
    text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
    source: 'سورة الزمر — آية ٥٣'
  },
  {
    title: 'التعلق الدائم',
    category: 'مناجاة الاستغفار',
    text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ أَبَداً، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ',
    source: 'أدعيةالصباح المأثورة'
  },
  {
    title: 'شكر النعماء',
    category: 'دعاء مأثور',
    text: 'أَللَّهُمَّ لَكَ الْحَمْدُ حَمْداً كَثِيراً خَالِداً مَعَ خُلُودِكَ، وَلَكَ الْحَمْدُ حَمْداً لاَ حَدَّ لَهُ دُونَ عِلْمِكَ، وَلَكَ الْحَمْدُ حَمْداً لاَ أَمَدَ لَهُ دُونَ مَشِيئَتِكَ',
    source: 'الصحيفة السجادية — الإمام السجاد (ع)'
  }
];

interface BackgroundPreset {
  id: string;
  name: string;
  style: React.CSSProperties;
  textColorClass: string;
  accentClass: string;
}

const BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'midnight-ebony',
    name: 'الوقار الداكن (Obsidian)',
    style: {
      background: 'radial-gradient(ellipse at center, #1b1c1a 0%, #0d0e0d 100%)',
    },
    textColorClass: 'text-stone-100',
    accentClass: 'text-[#e5c56a]' // Warm gold foil
  },
  {
    id: 'spiritual-emerald',
    name: 'الزمردي الروحاني (Spiritual Emerald)',
    style: {
      background: 'radial-gradient(ellipse at center, #023825 0%, #011d13 100%)',
    },
    textColorClass: 'text-emerald-50',
    accentClass: 'text-[#e5c56a]' // Warm gold foil
  },
  {
    id: 'cosmic-sapphire',
    name: 'الأسود الكوني (Cosmic Navy)',
    style: {
      background: 'radial-gradient(ellipse at center, #061e38 0%, #020b16 100%)',
    },
    textColorClass: 'text-blue-50',
    accentClass: 'text-amber-200'
  },
  {
    id: 'ancient-parchment',
    name: 'الرقّ الملكي العتيق (Parchment)',
    style: {
      background: 'linear-gradient(135deg, #FAF5EA 0%, #EFEAD9 100%)',
    },
    textColorClass: 'text-stone-850',
    accentClass: 'text-[#8c6b39]' // Deep bronze gold
  },
  {
    id: 'serene-twilight',
    name: 'سماء الشفق (Royal Twilight)',
    style: {
      background: 'radial-gradient(ellipse at center, #231b33 0%, #0e0a16 100%)',
    },
    textColorClass: 'text-[#f5f0fa]',
    accentClass: 'text-[#ffcfef]' // Soft rose gold
  },
  {
    id: 'pure-white',
    name: 'أثير السلام الأبيض (Minimal White)',
    style: {
      background: 'linear-gradient(135deg, #ffffff 0%, #fdfcf9 100%)',
    },
    textColorClass: 'text-stone-900',
    accentClass: 'text-emerald-800'
  }
];

interface FramePreset {
  id: string;
  name: string;
}

const FRAMES: FramePreset[] = [
  { id: 'royal-double-gold', name: 'الإطار الملكي المزدوج' },
  { id: 'islamic-corners', name: 'الزخارف الركنية الكلاسيكية' },
  { id: 'thin-vignette', name: 'خط كادر نحيف مذهب' },
  { id: 'borderless', name: 'أسلوب معاصر مفرغ (سادة)' }
];

interface FontPreset {
  id: string;
  name: string;
  family: string;
}

const FONTS: FontPreset[] = [
  { id: 'amiri', name: 'الخط النسخي الكلاسيكي (الأميري)', family: 'font-serif' },
  { id: 'cairo', name: 'الخط الحجازي الهندسي (القاهرة)', family: 'font-sans' },
  { id: 'tajawal', name: 'الخط العصري المتوازن (تاجوال)', family: 'font-sans' },
  { id: 'almarai', name: 'الخط التحريري البسيط (المراعي)', family: 'font-sans' }
];

interface BadgePreset {
  id: string;
  name: string;
}

const BADGES: BadgePreset[] = [
  { id: 'arabesque-divider', name: 'فاصل رقرق إسلامي' },
  { id: 'mosque-silhouette', name: 'مئذنة وقبة مسجد' },
  { id: 'holy-lantern', name: 'قنديل النور الروحاني' },
  { id: 'islamic-八角', name: 'نجمة الحزب الثمانية' },
  { id: 'none', name: 'بدون أيقونة وسطية' }
];

export default function CardStudio() {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Custom states
  const [campaignHeader, setCampaignHeader] = useState('حملة الإيمان والتكاتف');
  const [title, setTitle] = useState('نفحات ربّانيّة دافئة');
  const [content, setContent] = useState('الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ');
  const [source, setSource] = useState('سورة الرعد — آية ٢٨');
  
  const [selectedBg, setSelectedBg] = useState('midnight-ebony');
  const [selectedFrame, setSelectedFrame] = useState('royal-double-gold');
  const [selectedFont, setSelectedFont] = useState('amiri');
  const [selectedBadge, setSelectedBadge] = useState('arabesque-divider');
  
  const [fontSize, setFontSize] = useState(24); // px
  const [textAlignment, setTextAlignment] = useState<'right' | 'center'>('center');
  const [spacingScale, setSpacingScale] = useState(4); // spacing multiplier
  
  // Highlighting Foil Selection
  const [foilColor, setFoilColor] = useState('#D4AF37'); // Default gold foil
  const [foilName, setFoilName] = useState('gold');

  // UI status states
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'info' | 'error' | null>(null);

  // Helper to change foil color quickly
  const changeFoil = (hex: string, name: string) => {
    setFoilColor(hex);
    setFoilName(name);
  };

  const showStatus = (msg: string, type: 'success' | 'info' | 'error', duration = 3500) => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage(null);
      setStatusType(null);
    }, duration);
  };

  // Load preset supplication
  const loadPreset = (preset: PresetQuote) => {
    setTitle(preset.category || 'نفحات روحية');
    setContent(preset.text);
    setSource(preset.source);
    showStatus('تم تحميل البطاقة الإيمانية بنجاح! يمكنك الآن تعديل مظهرها.', 'success');
  };

  // Reset controls to beautifully balanced values
  const handleReset = () => {
    setCampaignHeader('حملة الإيمان والتكاتف');
    setTitle('قطوف من نور');
    setContent('اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ، وَاجْعَلْ قَلْبِي بَاراً، وَعَيْشِي صَاراً، وَرِزْقِي دَاراً، وَقَبْرِي مَزَاراً.');
    setSource('أدعية مأثورة');
    setSelectedBg('spiritual-emerald');
    setSelectedFrame('royal-double-gold');
    setSelectedFont('amiri');
    setSelectedBadge('arabesque-divider');
    setFontSize(26);
    setTextAlignment('center');
    setSpacingScale(4);
    setFoilColor('#D4AF37');
    setFoilName('gold');
    showStatus('تم إعادة ضبط معمل التصميم للخلفية الزمردية الكلاسيكية المذهبة.', 'info');
  };

  // Export card to PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    showStatus('جاري معالجة البطاقة وتصديرها بدقة فائقة UHD... يرجى الانتظار لحفظ الملف', 'info', 4000);

    try {
      // Create options with pixelRatio 2 for ultra premium high res images
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#000000',
        style: {
          transform: 'scale(1)',
          borderRadius: '0px'
        }
      });

      const link = document.createElement('a');
      link.download = `Zad-AlIbaad-Card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      showStatus('تم بنجاح تصدير وحفظ البطاقة الإيمانية في ملف التنزيلات لديك! تقبل الله طاعاتكم ✨', 'success');
    } catch (error) {
      console.error('Capturing failed:', error);
      showStatus('عذراً! واجهتنا مشكلة أثناء تصدير الصورة، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  // Copy Image directly to clipboard (perfect for whatsapp/telegram)
  const handleCopyToClipboard = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    showStatus('جاري تصدير البطاقة وتهيئتها للمشاركة السريعة...', 'info', 3000);

    try {
      // Generate standard scaling PNG
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 1.8,
        cacheBust: true,
      });

      // Fetch blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Check if navigator.clipboard supports writing blobs
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        showStatus('تم نسخ البطاقة كصورة بنجاح في حافظة جهازك! يمكنك الآن إرسالها ولصقها (Paste) مباشرة في تيليغرام أو واتساب ✨', 'success');
      } else {
        throw new Error('ClipboardItem API matches unsupported environment');
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      showStatus('عذراً، متصفحك يمنع النسخ المباشر للصور. تم تصدير واستعراض الصورة للتحميل عوضاً عن ذلك، يرجى الضغط على زر "تحميل البطاقة"', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  // Native share sheet
  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);

    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 1.5 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'ZadAlIbaad.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'زاد العباد — بطاقة إيمانية مذهبة',
          text: 'تصميم من تطبيق زاد العباد لمتابعة الأوراد والأعمال اليومية.'
        });
        showStatus('تم فتح قائمة المشاركة بنجاح.', 'success');
      } else {
        showStatus('ميزة المشاركة المباشرة غير مدعومة على متصفحك الحالي، ننصح باستخدام تحميل الصورة أو نسخها', 'info');
      }
    } catch (error) {
      console.error('Sharing failed', error);
      showStatus('تعذر بدء ميزة المشاركة التلقائية لجهازك بشكل تلقائي.', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const activeBg = BACKGROUNDS.find(bg => bg.id === selectedBg) || BACKGROUNDS[0];
  const activeFont = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Dynamic Notifications Alert */}
      {statusMessage && (
        <div id="card-studio-toast" className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-5 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-3 border ${
          statusType === 'success' 
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500' 
            : statusType === 'error' 
              ? 'bg-red-950 text-red-100 border-red-500' 
              : 'bg-stone-900 text-stone-100 border-stone-600'
        }`}>
          <Sparkles className={`w-5 h-5 flex-shrink-0 animate-spin text-amber-400 ${statusType === 'info' ? 'animate-duration-1000' : 'animate-none'}`} />
          <span className="text-sm font-medium leading-relaxed">{statusMessage}</span>
        </div>
      )}

      {/* Main Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-l from-emerald-900/10 via-stone-50 to-stone-50 border border-stone-200">
        <div>
          <h2 className="font-sans text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            معمل تصميم البطاقات الإيمانية الفاخرة 🎨
          </h2>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            أنشئ وصمم بطاقاتك الإيمانية والقرآنية الفاخرة للهواتف ومواقع التواصل بضغطة زر. حدد النصوص والزخارف والنقوش الإسلامية اللامعة وصيّرها كصور بجودة UHD للمشاركة.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 active:scale-95 rounded-xl border border-stone-200 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
          <span>تصفير وإعادة ضبط</span>
        </button>
      </div>

      {/* Instant Release Supplications Gallery (البطاقات السريعة الجاهزة) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold font-sans text-stone-600 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          بطاقات إيمانية ونفحات مأثورة جاهزة للتصميم بضغطة واحدة:
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {PRESET_QUOTES.map((preset, idx) => (
            <button
              key={idx}
              id={`preset-quote-btn-${idx}`}
              onClick={() => loadPreset(preset)}
              className="p-3 text-right bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200 hover:border-emerald-600 rounded-xl transition-all shadow-xs flex flex-col justify-between min-h-[95px] relative group overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-l from-amber-400 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-1">
                <span className="inline-block text-[8px] font-bold text-stone-400 bg-stone-100 px-1 py-[1px] rounded">
                  {preset.category}
                </span>
                <p className="text-[10.5px] text-stone-850 font-serif leading-relaxed line-clamp-2">
                  « {preset.text} »
                </p>
              </div>
              <span className="text-[8.5px] text-stone-400 mt-2 block truncate font-sans text-stone-500">
                {preset.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout: Visual controls on Left, Live interactive preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RIGHT SIDE (Preview Panel - takes 5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between text-xs text-stone-700 font-sans px-2">
            <span className="font-bold text-stone-800 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              منصة المعاينة التفاعلية (نسبة ١ : ١)
            </span>
            <span className="text-[10px] font-mono text-stone-400 truncate max-w-[170px]">
              {fontSize}px • {activeBg.name.split(' ')[0]}
            </span>
          </div>

          {/* HIGH-DENSITY CARD CANVAS ELEMENT TO CONVERT */}
          <div className="w-full aspect-square max-w-sm sm:max-w-md bg-stone-900 rounded-2xl overflow-hidden shadow-2xl relative border-4 border-white">
            
            {/* The Actual Capturable Card Element */}
            <div
              ref={cardRef}
              id="faith-card-element"
              className="w-full h-full aspect-square relative select-none p-5 sm:p-7 flex flex-col justify-between overflow-hidden"
              style={activeBg.style}
            >
              
              {/* Subtle gold floral pattern overlay (can use pure css/svg background details) */}
              <div className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Decorative Frame Options */}
              {selectedFrame === 'royal-double-gold' && (
                <div 
                  className="absolute inset-[10px] sm:inset-[14px] border pointer-events-none transition-all rounded-[6px]"
                  style={{ borderColor: foilColor, opacity: 0.8 }}
                >
                  <div 
                    className="absolute inset-[3px] border pointer-events-none"
                    style={{ borderColor: foilColor, opacity: 0.4 }}
                  />
                  {/* Islamic 8-point stars at corners */}
                  <div className="absolute top-[-5px] right-[-5px] w-2.5 h-2.5 rotate-45" style={{ backgroundColor: foilColor }} />
                  <div className="absolute top-[-5px] left-[-5px] w-2.5 h-2.5 rotate-45" style={{ backgroundColor: foilColor }} />
                  <div className="absolute bottom-[-5px] right-[-5px] w-2.5 h-2.5 rotate-45" style={{ backgroundColor: foilColor }} />
                  <div className="absolute bottom-[-5px] left-[-5px] w-2.5 h-2.5 rotate-45" style={{ backgroundColor: foilColor }} />
                </div>
              )}

              {selectedFrame === 'islamic-corners' && (
                <div className="absolute inset-[10px] sm:inset-[14px] pointer-events-none">
                  {/* Corner ornaments */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: foilColor }}>
                    <div className="w-2.5 h-2.5 absolute top-0.5 right-0.5 border-t border-r" style={{ borderColor: foilColor }} />
                  </div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: foilColor }}>
                    <div className="w-2.5 h-2.5 absolute top-0.5 left-0.5 border-t border-l" style={{ borderColor: foilColor }} />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: foilColor }}>
                    <div className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5 border-b border-r" style={{ borderColor: foilColor }} />
                  </div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: foilColor }}>
                    <div className="w-2.5 h-2.5 absolute bottom-0.5 left-0.5 border-b border-l" style={{ borderColor: foilColor }} />
                  </div>
                </div>
              )}

              {selectedFrame === 'thin-vignette' && (
                <div 
                  className="absolute inset-[15px] sm:inset-[22px] border pointer-events-none opacity-50"
                  style={{ borderColor: foilColor, borderWidth: '1px' }}
                />
              )}

              {/* CARD HEADER DETAILS (Card title + custom category element) */}
              <div 
                className="w-full flex flex-col items-center z-10"
                style={{ marginTop: `${spacingScale * 2}px` }}
              >
                {campaignHeader && (
                  <div 
                    className="font-sans text-[9px] font-extrabold tracking-[0.15em] opacity-90 inline-flex items-center gap-1.5 mb-1 px-2.5 py-0.5"
                    style={{ 
                      color: foilColor
                    }}
                  >
                    <span className="text-[7px]">✦</span>
                    <span>{campaignHeader}</span>
                    <span className="text-[7px]">✦</span>
                  </div>
                )}

                {title && (
                  <h4 
                    className="font-sans text-[11px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-75 inline-block px-3 py-1 rounded-full border border-current mb-2.5"
                    style={{ 
                      color: foilColor, 
                      borderColor: `${foilColor}25`,
                      fontSize: '9.5px'
                    }}
                  >
                    {title}
                  </h4>
                )}

                {/* Central Vignette Icon/SVG Decoration */}
                {selectedBadge === 'arabesque-divider' && (
                  <div className="flex items-center gap-1.5 w-full justify-center opacity-85 my-0.5">
                    <div className="h-[1px] w-8 bg-current opacity-40" style={{ color: foilColor }} />
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" style={{ color: foilColor }} fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M12 2L15 8L22 11L15 14L12 20L9 14L2 11L9 8L12 2Z" fill="currentColor" fillOpacity="0.15" />
                    </svg>
                    <div className="h-[1px] w-8 bg-current opacity-40" style={{ color: foilColor }} />
                  </div>
                )}

                {selectedBadge === 'mosque-silhouette' && (
                  <div className="opacity-90 my-0.5" style={{ color: foilColor }}>
                    <svg viewBox="0 0 100 60" className="w-9 h-8 fill-current">
                      <path d="M50 10 C46 10, 42 14, 40 22 C32 24, 25 28, 25 35 L75 35 C75 28, 68 24, 60 22 C58 14, 54 10, 50 10 Z" />
                      <rect x="47.5" y="2" width="5" height="8" rx="1" />
                      <line x1="50" y1="0" x2="50" y2="4" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="23" y="35" width="54" height="6" rx="1" />
                      <path d="M18 41 L82 41 L80 43 L20 43 Z" />
                    </svg>
                  </div>
                )}

                {selectedBadge === 'holy-lantern' && (
                  <div className="opacity-85 my-0.5" style={{ color: foilColor }}>
                    <svg viewBox="0 0 24 32" className="w-5 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M12 2v4M8 6h8M6 10l2 10h8l2-10H6z" />
                      <path d="M10 20v6a2 2 0 002 2h0a2 2 0 002-2v-6M12 11v6" strokeWidth="2" />
                      <path d="M12 6a4 4 0 014 4H8a4 4 0 014-4z" fill="currentColor" fillOpacity="0.2"/>
                    </svg>
                  </div>
                )}

                {selectedBadge === 'islamic-八角' && (
                  <div className="opacity-95 my-0.5" style={{ color: foilColor }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                      <rect x="4.5" y="4.5" width="15" height="15" rx="1" className="rotate-0 transform origin-center opacity-60" />
                      <rect x="4.5" y="4.5" width="15" height="15" rx="1" className="rotate-45 transform origin-center" />
                      <circle cx="12" cy="12" r="3.5" className="fill-stone-900" style={{ fill: activeBg.id.includes('white') ? '#ffffff' : undefined }} />
                    </svg>
                  </div>
                )}
              </div>

              {/* CARD CORE TEXT CONTENTS (SUPPLICATION / VERSE) */}
              <div 
                className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-2 z-10 my-4"
                style={{ 
                  textAlign: textAlignment,
                  justifyContent: 'center'
                }}
              >
                <p 
                  className={`leading-[2.1] leading-relaxed select-text ${activeBg.textColorClass} ${activeFont.family}`}
                  style={{ 
                    fontSize: `${fontSize}px`,
                    textShadow: activeBg.id.includes('white') 
                      ? 'none' 
                      : `0 2px 14px rgba(0,0,0,0.4)`
                  }}
                >
                  {content || 'يرجى كتابة محتوى أو آية أوSupplication هنا...'}
                </p>
              </div>

              {/* CARD FOOTER (Source citation and application mark) */}
              <div 
                className="w-full flex flex-col items-center gap-2.5 z-10 border-t border-dashed pt-3 pb-1"
                style={{ 
                  borderColor: `${foilColor}20`,
                  marginBottom: `${spacingScale * 1.5}px`
                }}
              >
                {source && (
                  <span 
                    className="font-serif text-[11.5px] italic text-center font-bold tracking-wide opacity-80"
                    style={{ color: foilColor }}
                  >
                    — {source}
                  </span>
                )}

                {/* Secure spiritual fine brand print */}
                <div className="flex items-center gap-1 opacity-[0.45] text-[7.5px] font-sans tracking-widest text-[#9c9a96] uppercase">
                  <span>تطبيق زاد العباد</span>
                  <div className="w-1.5 h-1.5 rounded-full rotate-45 mx-0.5" style={{ backgroundColor: foilColor }} />
                  <span>ZAD AL-IBAAD</span>
                </div>
              </div>

            </div>
          </div>

          {/* QUICK EXPORT ACTION BUTTONS */}
          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 px-1">
            <button
              id="studio-download-btn"
              onClick={handleDownload}
              disabled={isCapturing}
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-850 hover:bg-emerald-950 disabled:bg-stone-400 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex-1"
            >
              <Download className="w-4 h-4" />
              <span>تحميل البطاقة (UHD)</span>
            </button>

            <button
              id="studio-copy-btn"
              onClick={handleCopyToClipboard}
              disabled={isCapturing}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-white hover:bg-stone-50 disabled:bg-stone-50 text-emerald-950 border border-stone-250 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Copy className="w-4 h-4 text-amber-600" />
              <span>نسخ إرسال سريع 📑</span>
            </button>

            <button
              id="studio-native-share-btn"
              onClick={handleNativeShare}
              disabled={isCapturing}
              className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              title="مشاركة مباشرة عبر أجهزة الجوال"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة الجوال</span>
            </button>
          </div>
          
          <p className="text-[10.5px] text-stone-400 text-center leading-normal max-w-sm">
            💡 نصيحة: زر <strong className="text-stone-500">"نسخ إرسال سريع"</strong> يصيّر البطاقة وينسخها مباشرة للحافظة لتلصقها فوراً في مجموعات الواتساب أو تيليغرام دون الحاجة لحفظ ملفات في جهازك!
          </p>
        </div>

        {/* LEFT SIDE (Controls Panel - takes 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-250 p-5 md:p-6 space-y-6">
          <h3 className="font-sans text-sm font-bold text-stone-850 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-500" />
            تخصيص مكونات وتفاصيل البطاقة
          </h3>

          {/* 1. TEXT EDITORS SECTION */}
          <div className="space-y-4">
            <div>
              <label id="input-campaign-label" className="block text-xs font-bold text-stone-600 mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                ترويسة الحملة / الشعار العلوي للبطاقة (ترويسة مذهبة):
              </label>
              <input
                id="input-card-campaign"
                type="text"
                value={campaignHeader}
                onChange={(e) => setCampaignHeader(e.target.value)}
                maxLength={45}
                placeholder="مثال: حملة الإيمان والتكاتف، أو اتركه فارغاً..."
                className="w-full px-3 py-2 text-xs border border-emerald-600/30 ring-1 ring-emerald-600/10 focus:ring-2 focus:ring-emerald-600/20 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 font-sans"
              />
            </div>

            <div>
              <label id="input-category-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                العنوان العلوي (التصنيف):
              </label>
              <input
                id="input-card-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={45}
                placeholder="مثال: من أدعية المناجاة، حكمة إيمانية، آية كريمة..."
                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 font-sans"
              />
            </div>

            <div>
              <label id="input-content-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                نص الآية الكريمة،supplication، أو الحكمة الشريفة:
              </label>
              <textarea
                id="input-card-content"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={320}
                placeholder="اكتب هنا النص الإيماني بالتشكيل الكامل إن أمكن لتظهر البطاقة مبهجة وقوية..."
                className="w-full px-3 py-2.5 text-sm font-serif border border-stone-250 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 leading-relaxed text-right"
              />
              <span className="text-[10px] text-stone-400 block text-left">
                {content.length} / 320 حرف
              </span>
            </div>

            <div>
              <label id="input-source-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                المصدر أو قائل الحكمة والحديث:
              </label>
              <input
                id="input-card-source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                maxLength={50}
                placeholder="مثال: بحار الأنوار، مفاتيح الجنان، الإمام زين العابدين (ع)"
                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 font-sans"
              />
            </div>
          </div>

          {/* 2. BACKGROUND PRESET OPTIONS */}
          <div className="space-y-2.5">
            <span className="block text-xs font-bold text-stone-600">خلفية البطاقة الإيمانية:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  id={`bg-option-${bg.id}`}
                  onClick={() => {
                    setSelectedBg(bg.id);
                    // Match accents
                    if (bg.id.includes('emerald') || bg.id.includes('ebony')) {
                      setFoilColor('#D4AF37');
                      setFoilName('gold');
                    } else if (bg.id.includes('sapphire')) {
                      setFoilColor('#FFFDD0');
                      setFoilName('cream-glow');
                    } else if (bg.id.includes('white')) {
                      setFoilColor('#065f46');
                      setFoilName('emerald');
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-right font-sans text-xs flex flex-col justify-between h-[65px] transition-all relative overflow-hidden cursor-pointer ${
                    selectedBg === bg.id 
                      ? 'border-emerald-800 ring-2 ring-emerald-800/15' 
                      : 'border-stone-200 hover:border-stone-350'
                  }`}
                  style={bg.style}
                >
                  <span className={`text-[10px] font-bold ${bg.textColorClass}`}>{bg.name.split(' ')[0]}</span>
                  <div className="flex items-center justify-between w-full mt-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/20" 
                      style={{ backgroundColor: bg.id.includes('white') ? '#022c22' : bg.accentClass }} 
                    />
                    {selectedBg === bg.id && <Check className="w-3.5 h-3.5 text-amber-500 animate-scale-in" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. FOIL HIGHLIGHT & ACCENT COLORS */}
          <div className="space-y-2.5">
            <span className="block text-xs font-bold text-stone-600">لون المعادن والنقوش الفاخرة (Foil Accent):</span>
            <div className="flex flex-wrap gap-2">
              <button
                id="foil-opt-gold"
                onClick={() => changeFoil('#D4AF37', 'gold')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                  foilName === 'gold' 
                    ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-xs ring-1 ring-amber-400' 
                    : 'bg-white border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] inline-block" />
                <span>الذهب الملكي الدافئ</span>
              </button>
              
              <button
                id="foil-opt-silver"
                onClick={() => changeFoil('#C0C0C0', 'silver')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                  foilName === 'silver' 
                    ? 'bg-slate-50 text-slate-800 border-slate-400 shadow-xs ring-1 ring-slate-400' 
                    : 'bg-white border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#C0C0C0] inline-block" />
                <span>الفضة اللامعة الساطعة</span>
              </button>

              <button
                id="foil-opt-rose"
                onClick={() => changeFoil('#c3808b', 'rose')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                  foilName === 'rose' 
                    ? 'bg-rose-50/50 text-rose-800 border-rose-300 shadow-xs ring-1 ring-rose-300' 
                    : 'bg-white border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#c3808b] inline-block" />
                <span>النحاس الوردي العتيق</span>
              </button>

              <button
                id="foil-opt-emerald"
                onClick={() => changeFoil('#065f46', 'emerald')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                  foilName === 'emerald' 
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400 shadow-xs ring-1 ring-emerald-400' 
                    : 'bg-white border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#065f46] inline-block" />
                <span>الحبر الزمردي الغامق</span>
              </button>

              <button
                id="foil-opt-white"
                onClick={() => changeFoil('#FFFFFF', 'white')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                  foilName === 'white' 
                    ? 'bg-stone-50 text-stone-900 border-stone-300 shadow-xs ring-1-stone-300' 
                    : 'bg-white border-stone-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-stone-300 inline-block" />
                <span>الأبيض الناصع</span>
              </button>
            </div>
          </div>

          {/* 4. DESIGN FRAMES AND CORNER BORDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label id="input-frame-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                تأطير وحدود البطاقة:
              </label>
              <select
                id="select-frame"
                value={selectedFrame}
                onChange={(e) => setSelectedFrame(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 font-sans"
              >
                {FRAMES.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label id="input-badge-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                الفاصل الزخرفي المركزي:
              </label>
              <select
                id="select-badge"
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 font-sans"
              >
                {BADGES.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. FONTS ENGINE SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label id="input-font-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                نوع الخط العربي للشاهد:
              </label>
              <select
                id="select-font"
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg focus:outline-none focus:border-emerald-600 bg-stone-50 font-sans"
              >
                {FONTS.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label id="input-align-label" className="block text-xs font-bold text-stone-600 mb-1.5">
                محاذاة النص والآيات:
              </label>
              <div className="flex gap-2">
                <button
                  id="align-center-btn"
                  onClick={() => setTextAlignment('center')}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    textAlignment === 'center' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-stone-200'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5 text-stone-500" />
                  <span>محاذاة للوسط</span>
                </button>
                <button
                  id="align-right-btn"
                  onClick={() => setTextAlignment('right')}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    textAlignment === 'right' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-stone-200'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5 text-stone-500" />
                  <span>محاذاة لليمين</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. SLIDERS: FONT SIZING & MARGINS */}
          <div className="space-y-4 pt-2 bg-stone-50 p-4 rounded-xl border border-stone-150">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label id="input-fontSize-label" className="text-xs font-bold text-stone-650 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-stone-500" />
                  حجم خط النص الرئيسي الشاهد:
                </label>
                <span className="font-mono text-xs text-stone-600 bg-white border px-1.5 py-0.5 rounded">
                  {fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-stone-400" />
                <input
                  id="slider-font-size"
                  type="range"
                  min="16"
                  max="44"
                  step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1 accent-emerald-800 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                />
                <ZoomIn className="w-4 h-4 text-stone-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label id="input-spacing-label" className="text-xs font-bold text-stone-650 flex items-center gap-1">
                  <AppWindow className="w-3.5 h-3.5 text-stone-500" />
                  هوامش الكادر والحواف الداخلية:
                </label>
                <span className="font-mono text-xs text-stone-600 bg-white border px-1.5 py-0.5 rounded">
                  {spacingScale}x
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-stone-400 font-sans">مدمج</span>
                <input
                  id="slider-spacing"
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={spacingScale}
                  onChange={(e) => setSpacingScale(parseInt(e.target.value))}
                  className="flex-1 accent-emerald-800 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                />
                <span className="text-[10px] text-stone-400 font-sans">فسيح</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

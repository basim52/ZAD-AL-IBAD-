import React, { useState, useEffect } from 'react';
import { DailyWork, AmaalType, AmaalTime } from '../types';
import { 
  Plus, Search, Sun, Sunset, Moon, Sparkles, Filter, CheckSquare, ClipboardList, Eye, Calendar,
  BookOpen, RotateCcw, ChevronDown, ChevronUp, BookText, Copy, ZoomIn, ZoomOut, Check, HelpCircle
} from 'lucide-react';
import { DAILY_OUTLINES } from '../data/dailyZiyaratDua';

interface AmaalListProps {
  works: DailyWork[];
  onToggleComplete: (id: string) => void;
  onSelectWork: (work: DailyWork) => void;
  onOpenAddModal: () => void;
  selectedDateStr: string;
}

const TIMES: { label: string; value: AmaalTime | 'الكل'; icon?: any }[] = [
  { label: 'جميع الأوقات', value: 'الكل' },
  { label: 'الفجر', value: 'الفجر', icon: SunriseIcon },
  { label: 'الصباح', value: 'الصباح', icon: Sun },
  { label: 'الظهر وعصر', value: 'الظهر', icon: Sun },
  { label: 'المغرب وعشاء', value: 'المغرب', icon: Sunset },
  { label: 'الليل', value: 'الليل', icon: Moon },
];

const TYPES: { label: string; value: AmaalType | 'الكل' }[] = [
  { label: 'جميع الأنواع', value: 'الكل' },
  { label: 'صلاة', value: 'صلاة' },
  { label: 'نافلة', value: 'نافلة' },
  { label: 'دعاء', value: 'دعاء' },
  { label: 'زيارة', value: 'زيارة' },
  { label: 'تعقيب', value: 'تعقيب' },
  { label: 'ملخص', value: 'ملخص' },
  { label: 'أخرى', value: 'عام' },
];

// Custom tiny Sunrise Icon since lucide does Sunrise as specific variant
function SunriseIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2500/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 22H6" />
      <path d="m12 18-4-4h8z" />
      <path d="M12 2v8" />
      <path d="m5.22 10.78 1.42-1.42" />
      <path d="m17.36 9.36 1.42 1.42" />
      <path d="M22 22H2" />
    </svg>
  );
}

const getCurrentTimeLabel = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour <= 5) return 'الفجر';
  if (hour >= 6 && hour <= 11) return 'الصباح';
  if (hour >= 12 && hour <= 13) return 'الظهر';
  if (hour >= 14 && hour <= 16) return 'العصر';
  if (hour >= 17 && hour <= 18) return 'المغرب';
  if (hour >= 19 && hour <= 21) return 'العشاء';
  return 'الليل';
};

export default function AmaalList({ 
  works, 
  onToggleComplete, 
  onSelectWork, 
  onOpenAddModal,
  selectedDateStr
}: AmaalListProps) {
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<AmaalTime | 'الكل'>('الكل');
  const [typeFilter, setTypeFilter] = useState<AmaalType | 'الكل'>('الكل');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'غير_منجز' | 'منجز'>('الكل');

  // Daily Recommended Summary states
  const [isOutlineExpanded, setIsOutlineExpanded] = useState<boolean>(true);
  const [dhikrCount, setDhikrCount] = useState<number>(0);
  const [activeReader, setActiveReader] = useState<{ title: string; text: string } | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<number>(16);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Parse date string locally to get exact day of the week (0 = Sunday, 1 = Monday, etc.)
  const getLocalDayIndex = (dateStr: string): number => {
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.getDay();
      }
    } catch (e) {}
    return new Date().getDay();
  };

  const dayIndex = getLocalDayIndex(selectedDateStr);
  const activeOutline = DAILY_OUTLINES[dayIndex];

  // Sync counter on date change
  useEffect(() => {
    const savedCount = localStorage.getItem(`dhikr_count_${selectedDateStr}`);
    setDhikrCount(savedCount ? Number(savedCount) : 0);
  }, [selectedDateStr]);

  const handleIncrementDhikr = () => {
    const nextCount = dhikrCount + 1;
    setDhikrCount(nextCount);
    localStorage.setItem(`dhikr_count_${selectedDateStr}`, String(nextCount));
  };

  const handleResetDhikr = () => {
    setDhikrCount(0);
    localStorage.removeItem(`dhikr_count_${selectedDateStr}`);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Advanced Hijri converter and occasion mapper for the export image
  const getHijriDateAndOccasionForOutline = (dateStr: string) => {
    try {
      const today = new Date(dateStr);
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      // تعديل الانحراف للتاريخ الهجري تماشياً مع رؤية الهلال (اليوم 9 ذو الحجة وليس 11)
      const hijriOffset = -2;
      const jd = Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
                 Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
                 Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4) +
                 day - 32075 + hijriOffset;

      const l = jd - 1948440 + 10632;
      const n = Math.floor((l - 1) / 10631);
      const l2 = l - 10631 * n + 354;
      const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
      const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;

      const hijriMonth = Math.floor((24 * l3) / 709);
      const hijriDay = Math.floor(l3 - Math.floor((709 * hijriMonth) / 24));
      const hijriYear = Math.floor(30 * n + j - 30);

      const occasions: Record<string, string> = {
        "1-10": "ذكرى عاشوراء الأليمة 🖤",
        "7-27": "المبعث النبوي الشريف ✨",
        "8-3": "ولادة الإمام الحسين عليه السلام 🎉",
        "8-15": "ولادة الإمام المهدي عجل الله فرجه 🌟",
        "9-21": "ذكرى استشهاد الإمام أمير المؤمنين علي عليه السلام 🖤",
        "12-9": "يوم عرفة المبارك 🕋",
        "12-10": "عيد الأضحى المبارك 🐑",
        "12-18": "عيد الغدير الأغر المبارك 👑"
      };

      const key = `${hijriMonth}-${hijriDay}`;
      const occasion = occasions[key] || "";

      const months = [
        "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
      ];

      const hijriMonthName = (hijriMonth >= 1 && hijriMonth <= 12) ? months[hijriMonth - 1] : "";

      return {
        formatted: `${hijriDay} ${hijriMonthName} ${hijriYear} هـ`,
        occasion
      };
    } catch (e) {
      return null;
    }
  };

  const handleExportAsImage = () => {
    if (!activeOutline) return;

    const scale = 4.5; // High definition scaling factor for pristine 4K-grade resolution
    const canvas = document.createElement('canvas');
    canvas.width = 500 * scale;
    canvas.height = 940 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale all operations by 4.5 for high-fidelity rendering without changing individual coordinates
    ctx.scale(scale, scale);

    // Helper: Wrap Arabic Text
    const wrapArabicText = (text: string, maxWidth: number): string[] => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? currentLine + " " + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // 1. Draw Simulated Studio Emulator Background
    const bgGrad = ctx.createLinearGradient(0, 0, 500, 940);
    bgGrad.addColorStop(0, '#1c1917'); // Dark Stone 900
    bgGrad.addColorStop(0.5, '#121214'); // Charcoal Deep Black
    bgGrad.addColorStop(1, '#0c0a09'); // Warm Off-Black
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 500, 940);

    // Realistic Spotlight Glowing Orbs behind virtual phone
    const orb1 = ctx.createRadialGradient(250, 470, 50, 250, 470, 450);
    orb1.addColorStop(0, 'rgba(16, 185, 129, 0.08)'); // emerald amber core glow
    orb1.addColorStop(0.5, 'rgba(245, 158, 11, 0.03)');
    orb1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, 500, 940);

    // 2. Beautiful Handset Frame Bezel & Shadow
    const bezelX = 25;
    const bezelY = 25;
    const bezelW = 450;
    const bezelH = 890;
    const bezelR = 42;

    // Outer drop shadow on the bezel
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;

    // Draw bezel structure
    ctx.fillStyle = '#0f172a'; // Luxury dark space frame
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bezelX, bezelY, bezelW, bezelH, bezelR);
    } else {
      ctx.rect(bezelX, bezelY, bezelW, bezelH);
    }
    ctx.fill();

    // Reset shadow for inner graphics
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw metallic bezel outline border (Golden reflection)
    ctx.strokeStyle = '#f59e0b'; // Gold reflection
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bezelX, bezelY, bezelW, bezelH, bezelR);
    } else {
      ctx.rect(bezelX, bezelY, bezelW, bezelH);
    }
    ctx.stroke();

    // 3. Phone Inner Screen Display
    const screenX = 31;
    const screenY = 31;
    const screenW = 438;
    const screenH = 878;
    const screenR = 36;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(screenX, screenY, screenW, screenH, screenR);
    } else {
      ctx.rect(screenX, screenY, screenW, screenH);
    }
    ctx.clip(); // Mask content inside screen boundaries

    // Draw Screen Gradient Background (Match emerald app colors)
    const screenGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
    screenGrad.addColorStop(0, '#022c22'); // Very dark emerald
    screenGrad.addColorStop(0.4, '#064e3b'); // Rich royal emerald
    screenGrad.addColorStop(1, '#021e17'); // Pitch shadow emerald
    ctx.fillStyle = screenGrad;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Draw Decorative Islamic Arch Lines
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(250, 150, 220, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(250, 150, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Draw traditional Islamic geometric vector diamond outline card background
    ctx.save();
    ctx.translate(250, 150);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.02)';
    ctx.strokeRect(-120, -120, 240, 240);
    ctx.restore();

    // 4. Android Status Bar (Status icons & Clock)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    
    // Time String formatted locally (Gregorian time)
    const timeFormatted = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
    ctx.fillText(timeFormatted, 90, 52);

    // Draw Wifi signal waves on top-right status area
    const wifiX = 385;
    const wifiY = 44;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wifiX, wifiY, 7, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wifiX, wifiY, 4, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wifiX, wifiY, 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    // Draw cellular connection signals
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let bar = 0; bar < 4; bar++) {
      ctx.fillRect(400 + (bar * 3.5), 52 - (bar * 2), 2.5, bar * 2 + 2);
    }

    // Battery outline & percent level
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(422, 44, 18, 9);
    ctx.fillStyle = '#a3e635'; // Lime green
    ctx.fillRect(424, 46, 12, 5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(440, 47, 1.5, 3); // cap

    // 5. App Header Branding Section (Featuring 'حملة التكاتف والإيمان' beautifully)
    ctx.fillStyle = '#f59e0b'; // Gold
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('• حَمْلَةُ التَّكَاتُفِ وَالإِيمَانِ •', 250, 78);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillText('حَقِيبَةُ الأَعْمَالِ وَالْأَوْرَادِ اليَوْمِيَّةِ', 250, 94);

    // Big Day Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(`أعمال ومستحبات يوم (${activeOutline.dayName})`, 250, 120);

    // Dates & Occasion
    const dates = getHijriDateAndOccasionForOutline(selectedDateStr);
    const hijriStr = dates ? dates.formatted : "ذو الحجة ١٤٤٧ هـ";
    ctx.fillStyle = '#fef08a'; // light yellow gold
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`📅 ${hijriStr}`, 250, 146);

    const matchGregDate = new Date(selectedDateStr);
    const gregStr = `الموافق ميلادياً: ${matchGregDate.getDate()} / ${matchGregDate.getMonth() + 1} / ${matchGregDate.getFullYear()} م`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(gregStr, 250, 164);

    // Underline divider ornament
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 178);
    ctx.lineTo(400, 178);
    ctx.stroke();

    // Center micro ornament diamond
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(250, 178, 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. BLOCK A: THE INTERACTIVE DHIKR (ورد اليوم المكرر)
    const blockAY = 195;
    const blockAH = 150;
    // Base rounded card
    ctx.fillStyle = 'rgba(6, 78, 59, 0.55)'; // transparent glass green
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; // gold rimmed
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(50, blockAY, 400, blockAH, 18);
    } else {
      ctx.rect(50, blockAY, 400, blockAH);
    }
    ctx.fill();
    ctx.stroke();

    // Header label
    ctx.fillStyle = '#fcd34d'; // bright gold
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🌟 ورد اليوم المكرر الموصى به (١٠٠ مرة):', 430, blockAY + 25);

    // Large Dhikr calligraphy style
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    
    // Simple text shadow using canvas shadow context temporarily
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 6;
    ctx.fillText(`« ${activeOutline.dhikr} »`, 250, blockAY + 65);
    
    // Restore shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Benefit description wrapping
    ctx.fillStyle = '#d1fae5'; // pale emerald green
    ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
    const benefitLines = wrapArabicText(`الأثر الروحي والبركة: ${activeOutline.dhikrBenefit}`, 360);
    benefitLines.forEach((line, idx) => {
      ctx.fillText(line, 250, blockAY + 102 + (idx * 16));
    });

    // 7. BLOCK B: CORE DUA & ZIYARAT TITLES
    const blockBY = 365;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('📖 الأدعية والزيارات المأثورة لليوم:', 430, blockBY + 15);

    // Dua pill box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(50, blockBY + 30, 400, 38, 12);
    } else {
      ctx.rect(50, blockBY + 30, 400, 38);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🤲 ${activeOutline.duaTitle}`, 430, blockBY + 53);

    // Ziyarat pill box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(50, blockBY + 78, 400, 38, 12);
    } else {
      ctx.rect(50, blockBY + 78, 400, 38);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`🕌 ${activeOutline.ziyaratTitle}`, 430, blockBY + 101);

    // 8. BLOCK C: RECOMMENDED AMAAL CHECKLIST (الوصايا والأعمال)
    const blockCY = 505;
    ctx.fillStyle = '#fcd34d'; // Gold title
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('📋 التوصيات العملية والمستحبات لليوم:', 430, blockCY + 15);

    let listOffset = blockCY + 38;
    // Draw list bullet cards with checklist icons
    activeOutline.recommendedAmaal.forEach((amal, idx) => {
      // Small rounded background box for recommendation item to be legible
      ctx.fillStyle = 'rgba(251, 191, 36, 0.04)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)';
      ctx.lineWidth = 1;
      
      const lines = wrapArabicText(amal, 325);
      const cardHeight = lines.length * 17 + 16;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(50, listOffset, 400, cardHeight, 10);
      } else {
        ctx.rect(50, listOffset, 400, cardHeight);
      }
      ctx.fill();
      ctx.stroke();

      // Gold-White Android Check Circle icon drawing
      ctx.fillStyle = '#fbbf24'; // beautiful gold circle
      ctx.beginPath();
      ctx.arc(422, listOffset + 16, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#064e3b'; // dark inner dot checkmark
      ctx.beginPath();
      ctx.arc(422, listOffset + 16, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Recommendation Text
      ctx.fillStyle = '#e2e8f0'; // slate text
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      
      lines.forEach((line, lineIdx) => {
        ctx.fillText(line, 405, listOffset + 20 + (lineIdx * 17));
      });

      listOffset += cardHeight + 10;
    });

    // 9. Brand & Watermark Signature
    ctx.fillStyle = '#fbbf24'; // beautiful gold
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('• حَمْلَةُ التَّكَاتُفِ وَالإِيمَانِ •', 250, 810);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillText('مستخرج تلقائياً بجودة فائقة من تطبيق حقيبة اليوم والليلة المبارك', 250, 826);

    // 10. Android Virtual Navigation Bar (Bottom keys overlay)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.5;

    // Back Key (Triangle pointing left)
    ctx.beginPath();
    ctx.moveTo(135, 856);
    ctx.lineTo(125, 862);
    ctx.lineTo(135, 868);
    ctx.closePath();
    ctx.stroke();

    // Home Key (Soft outer circle)
    ctx.beginPath();
    ctx.arc(250, 862, 6.5, 0, Math.PI * 2);
    ctx.stroke();

    // Apps/Multitask Key (Small rounded square)
    ctx.strokeRect(362, 856, 12, 12);

    // Top Android thin Notch bezel
    ctx.fillStyle = '#090d16'; // Notch black container
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(205, 48, 90, 18, 9);
    } else {
      ctx.rect(205, 48, 90, 18);
    }
    ctx.fill();

    // Camera reflections
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(275, 57, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(275, 57, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Stop screen boundaries masking

    // Save image to target browser downloads with 4K resolution properties
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `حملة_التكاتف_والإيمان_موجز_${activeOutline.dayName}_4K.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Image Export Failed:', err);
    }
  };

  const currentSlot = getCurrentTimeLabel();
  
  const getFilterValForSlot = (slot: string): AmaalTime => {
    if (slot === 'الظهر' || slot === 'العصر') return 'الظهر';
    if (slot === 'المغرب' || slot === 'العشاء') return 'المغرب';
    return slot as AmaalTime;
  };

  // Filter criteria logic
  const filteredWorks = works.filter((work) => {
    const matchesSearch = work.title.toLowerCase().includes(search.toLowerCase()) || 
                          work.description.toLowerCase().includes(search.toLowerCase());
    
    // Support dual groupings (e.g. Lunch & Afternoon as 1 tab or specific matches)
    let matchesTime = true;
    if (timeFilter !== 'الكل') {
      if (timeFilter === 'الظهر') {
        matchesTime = work.time === 'الظهر' || work.time === 'العصر';
      } else if (timeFilter === 'المغرب') {
        matchesTime = work.time === 'المغرب' || work.time === 'العشاء';
      } else {
        matchesTime = work.time === timeFilter;
      }
    }

    const matchesType = typeFilter === 'الكل' || work.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'منجز') matchesStatus = work.isCompleted;
    if (statusFilter === 'غير_منجز') matchesStatus = !work.isCompleted;

    return matchesSearch && matchesTime && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dynamic Period Spotlight / Time Helper Banner */}
      <div className="bg-amber-50/70 border border-amber-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs leading-relaxed transition-all hover:bg-amber-50">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-stone-750">
            أنت الآن في نطاق فترة <strong className="text-emerald-900 font-serif font-bold text-[13px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">({currentSlot})</strong> المباركة. هل ترغب بتصفية الأعمال المخصصة لها؟
          </span>
        </div>
        <button
          onClick={() => {
            const filterVal = getFilterValForSlot(currentSlot);
            setTimeFilter(filterVal);
          }}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-serif font-bold px-4 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-xs text-xs whitespace-nowrap"
        >
          تصفية أوراد {currentSlot === 'الظهر' || currentSlot === 'العصر' ? 'الظهر وعصر' : currentSlot === 'المغرب' || currentSlot === 'العشاء' ? 'المغرب وعشاء' : currentSlot}
        </button>
      </div>

      {/* 📖 موجز ومختصر أعمال اليوم المستحبة بالتفصيل والزيارات */}
      {activeOutline && (
        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-amber-500/20 rounded-3xl text-white shadow-lg overflow-hidden transition-all duration-300">
          
          {/* Header Bar */}
          <div 
            onClick={() => setIsOutlineExpanded(!isOutlineExpanded)}
            className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-emerald-900/30 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl shadow-xs">
                <BookText className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h3 className="font-serif font-extrabold text-[#FFFDF9] text-xs md:text-sm">
                  موجز وخلاصة أعمال ومستحبات يوم ({activeOutline.dayName})
                </h3>
                <p className="text-[10px] text-amber-300 font-medium opacity-90">
                  الزيارات اليومية، الأدعية المأثورة، والورد المكرر لليوم المحدد أعلاه
                </p>
              </div>
            </div>
            <div className="text-amber-300 hover:text-amber-100 p-1">
              {isOutlineExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {/* Collapsible Content */}
          {isOutlineExpanded && (
            <div className="p-5 border-t border-emerald-900/40 bg-emerald-950/20 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                
                {/* 1. Tasbih/Dhikr Interactive Counter Block */}
                <div className="md:col-span-5 bg-emerald-900/40 border border-emerald-850/60 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[9px] font-bold tracking-wider text-amber-300 uppercase block mb-1">ورد اليوم المكرر (١٠٠ مرة)</span>
                    <h4 className="font-serif font-bold text-sm text-[#FFFDF9] leading-snug">
                      «{activeOutline.dhikr}»
                    </h4>
                    <p className="text-[10px] text-emerald-300 leading-normal mt-1.5 font-sans">
                      {activeOutline.dhikrBenefit}
                    </p>
                  </div>

                  {/* Interactivity Counter Widget */}
                  <div className="bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button 
                        id="reset-dhikr-btn"
                        onClick={handleResetDhikr}
                        className="p-1 px-1.5 bg-emerald-900 hover:bg-emerald-850 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="إعادة ضبط العداد"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-emerald-400 block tracking-wide">العدد المنجز</span>
                        <div className="font-mono font-extrabold text-xs flex items-baseline gap-0.5 text-white">
                          <span className={`${dhikrCount >= 100 ? 'text-amber-400 animate-pulse font-serif font-extrabold' : 'text-white'}`}>
                            {dhikrCount}
                          </span>
                          <span className="text-emerald-500 text-[10px]">/ ١٠٠</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="increment-dhikr-btn"
                      onClick={handleIncrementDhikr}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 font-serif font-black rounded-xl transition-all cursor-pointer shadow-sm text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>سبّح</span>
                    </button>
                  </div>

                  {/* Celebration feedback */}
                  {dhikrCount >= 100 && (
                    <div className="text-center bg-amber-400/10 border border-amber-400/20 text-amber-300 p-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                      <span>✨ تقبّل الله طاعتكم بالأوردة التامة!</span>
                    </div>
                  )}
                </div>

                {/* 2. Ziyarat & Dua Action Grid */}
                <div className="md:col-span-7 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-bold tracking-wider text-amber-300 uppercase block mb-2">النصوص والأدعية المقررة</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Dua Card trigger */}
                      <button
                        id="show-today-dua-btn"
                        onClick={() => setActiveReader({ title: activeOutline.duaTitle, text: activeOutline.duaText })}
                        className="p-3 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-800 rounded-2xl text-right transition-all group flex flex-col justify-between h-24 cursor-pointer hover:border-amber-400/30 active:translate-y-0.5"
                      >
                        <div className="p-1 bg-emerald-850 text-amber-300 rounded-lg w-fit group-hover:bg-amber-300 group-hover:text-emerald-950 transition-colors">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h5 className="font-serif font-extrabold text-xs text-[#FFFDF9] leading-snug group-hover:text-amber-300 transition-colors line-clamp-1">
                            {activeOutline.duaTitle}
                          </h5>
                          <span className="text-[9px] text-emerald-300/80 block mt-0.5">انقر لقراءة النص الكامل</span>
                        </div>
                      </button>

                      {/* Ziyarat Card trigger */}
                      <button
                        id="show-today-ziyarat-btn"
                        onClick={() => setActiveReader({ title: activeOutline.ziyaratTitle, text: activeOutline.ziyaratText })}
                        className="p-3 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-800 rounded-2xl text-right transition-all group flex flex-col justify-between h-24 cursor-pointer hover:border-amber-400/30 active:translate-y-0.5"
                      >
                        <div className="p-1 bg-emerald-850 text-amber-300 rounded-lg w-fit group-hover:bg-amber-300 group-hover:text-emerald-950 transition-colors">
                          <BookText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h5 className="font-serif font-extrabold text-xs text-[#FFFDF9] leading-snug group-hover:text-amber-300 transition-colors line-clamp-1">
                            {activeOutline.ziyaratTitle}
                          </h5>
                          <span className="text-[9px] text-emerald-300/80 block mt-0.5">انقر لقراءة النص الكامل</span>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="bg-emerald-900/20 border border-emerald-850/60 p-3 rounded-2xl space-y-1">
                    <span className="text-[10px] font-extrabold text-amber-300 block mb-0.5">من أهم توصيات ومستحبات هذا اليوم:</span>
                    <ul className="text-[10px] text-[#ECEAE4]/90 space-y-0.5 pr-1 list-disc list-inside">
                      {activeOutline.recommendedAmaal.map((amal, idx) => (
                        <li key={idx} className="leading-relaxed font-sans">{amal}</li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

              {/* 📱 Android Emulator Style Export Action Bar */}
              <div className="mt-4 pt-4 border-t border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/40 px-4 py-3 -mx-5 -mb-5 rounded-b-3xl">
                <span className="text-[10px] text-emerald-300 font-sans flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>تصدير فوري للموجز بـطابع ومحاكي أندرويد الأنيق بنفس الألوان لمشاركته.</span>
                </span>
                
                <button
                  id="export-outline-image-btn"
                  onClick={handleExportAsImage}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 font-serif font-black rounded-xl transition-all cursor-pointer shadow-md text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  <span>تصدير كصورة محاكي آندرويد 📱</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Search & Action Panel */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 right-3 flex items-center text-stone-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="amaal-search-bar"
            type="text"
            placeholder="ابحث عن دعاء، زيارة، صلاة مخصصة، إلخ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-xl bg-white border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow text-sm"
          />
        </div>

        {/* Status Fast Toggle & Add custom button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              id="status-filter-all"
              onClick={() => setStatusFilter('الكل')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'الكل'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              الكل ({works.length})
            </button>
            <button
              id="status-filter-pending"
              onClick={() => setStatusFilter('غير_منجز')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'غير_منجز'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              غير منجز ({works.filter(w => !w.isCompleted).length})
            </button>
            <button
              id="status-filter-done"
              onClick={() => setStatusFilter('منجز')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'منجز'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              المنجز ({works.filter(w => w.isCompleted).length})
            </button>
          </div>

          <button
            id="add-custom-amal-btn"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-700"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>عمل مخصص</span>
          </button>
        </div>
      </div>

      {/* Filter Options: Times Row */}
      <div className="space-y-3">
        {/* Time Tabs */}
        <div>
          <span className="text-[11px] font-bold text-stone-400 mb-1.5 block pr-1">تصفية حسب وقت الأداء</span>
          <div className="flex flex-wrap gap-1.5">
            {TIMES.map((t) => {
              const Icon = t.icon;
              const isActive = timeFilter === t.value;
              return (
                <button
                  key={t.value}
                  id={`time-tab-${t.value}`}
                  onClick={() => setTimeFilter(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-850 text-white border-transparent shadow-xs'
                      : 'bg-white text-stone-650 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Type Tabs */}
        <div>
          <span className="text-[11px] font-bold text-stone-400 mb-1.5 block pr-1">تصفية حسب نوع العمل</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => {
              const isActive = typeFilter === t.value;
              return (
                <button
                  key={t.value}
                  id={`type-tab-${t.value}`}
                  onClick={() => setTypeFilter(t.value)}
                  className={`px-3 py-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-850 text-white border-transparent shadow-xs'
                      : 'bg-white text-stone-650 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rendered Works Body */}
      {filteredWorks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              id={`amal-card-${work.id}`}
              className={`p-4 rounded-2xl border transition-all duration-300 group ${
                work.isCompleted
                  ? 'bg-emerald-50/40 border-emerald-150 shadow-inner'
                  : 'bg-white border-stone-200 hover:border-emerald-700/30 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Checkbox Frame */}
                <button
                  id={`checkbox-toggle-${work.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(work.id);
                  }}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${
                    work.isCompleted
                      ? 'bg-emerald-800 border-transparent text-white'
                      : 'border-stone-300 hover:border-emerald-800 bg-white'
                  }`}
                >
                  {work.isCompleted && (
                    <svg className="w-4 h-4 fill-none stroke-current stroke-[3]" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Card Core Content */}
                <div className="flex-1 space-y-2 text-right">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-850 rounded-full">
                      {work.type}
                    </span>
                    <span className="text-[10px] font-medium text-stone-400">
                      • {work.time}
                    </span>
                    {work.orderIndex !== undefined && work.orderIndex > 0 && (
                      <span className="text-[10px] font-medium text-emerald-900 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded-md">
                        ترتيب: {work.orderIndex}
                      </span>
                    )}
                    {work.occasion && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-250/30 rounded-md px-1.5 py-0.5 font-bold flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-amber-600" />
                        {work.occasion}
                      </span>
                    )}
                    {work.isCustom && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-250 rounded px-1 font-semibold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        مخصص
                      </span>
                    )}
                  </div>

                  <h3 
                    onClick={() => onSelectWork(work)}
                    className={`font-serif text-sm font-bold cursor-pointer hover:text-emerald-850 transition-colors ${
                      work.isCompleted ? 'text-stone-500 line-through' : 'text-stone-950'
                    }`}
                  >
                    {work.title}
                  </h3>

                  <p 
                    onClick={() => onSelectWork(work)}
                    className="text-xs text-stone-600 line-clamp-2 leading-relaxed cursor-pointer"
                  >
                    {work.description}
                  </p>
                  
                  {/* Bottom action panel */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                    <button
                      id={`open-reader-btn-${work.id}`}
                      onClick={() => onSelectWork(work)}
                      className="flex items-center gap-1 text-emerald-850 font-semibold hover:text-emerald-950 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{work.content ? 'قراءة النص الكامل' : 'عرض التفاصيل'}</span>
                    </button>

                    <span className="font-mono text-[9px] text-stone-450 uppercase tracking-widest bg-stone-50 px-1 border border-stone-150 rounded">
                      ID: {work.id.slice(0, 10)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-stone-50 border border-stone-200 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
          <ClipboardList className="w-10 h-10 text-stone-300" />
          <div>
            <p className="text-stone-800 font-bold font-serif text-sm">لم يعثر على أعمال عبادية مطابقة</p>
            <p className="text-stone-400 text-xs mt-1">حاول تعديل خيارات التصفية أو أضف عملاً عبادياً مخصصاً.</p>
          </div>
          <button
            id="empty-state-add-btn"
            onClick={onOpenAddModal}
            className="px-4 py-1.5 text-xs font-semibold text-emerald-850 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 rounded-xl transition-all"
          >
            إضافة عمل جديد الآن
          </button>
        </div>
      )}

      {/* 📘 Elegant Floating Reader Modal for Ziyarat & Dua */}
      {activeReader && (
        <div className="fixed inset-0 z-[110] bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-stone-200 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in text-stone-900">
            
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <h4 className="font-serif font-extrabold text-[#FFFDF9] text-sm tracking-wide">
                  {activeReader.title}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setActiveReader(null);
                  setCopiedText(false);
                }}
                className="text-stone-300 hover:text-white font-bold select-none cursor-pointer text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-900/40"
              >
                ×
              </button>
            </div>

            {/* Modal Controls Toolbar */}
            <div className="bg-stone-100 px-5 py-2 border-b border-stone-200 flex items-center justify-between gap-4 text-xs font-semibold text-stone-650 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 text-[11px]">حجم الخط:</span>
                <button 
                  onClick={() => setReaderFontSize(Math.max(12, readerFontSize - 2))}
                  className="p-1 px-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors font-mono font-bold"
                  title="تصغير الخط"
                >
                  أ-
                </button>
                <span className="font-mono text-xs w-6 text-center bg-white px-1 py-0.5 border border-stone-200 rounded">{readerFontSize}</span>
                <button 
                  onClick={() => setReaderFontSize(Math.min(30, readerFontSize + 2))}
                  className="p-1 px-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors font-mono font-bold"
                  title="تكبير الخط"
                >
                  أ+
                </button>
              </div>

              <button
                onClick={() => handleCopyToClipboard(activeReader.text)}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-55 text-emerald-850 hover:bg-emerald-100 border border-emerald-150 rounded-lg transition-all cursor-pointer font-bold text-[11px]"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                    <span>تم نسخ النص</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص الكامل</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="p-6 md:p-7 overflow-y-auto space-y-4 max-h-[55vh] text-right" style={{ fontSize: `${readerFontSize}px` }}>
              <div className="font-serif leading-loose text-stone-800 whitespace-pre-wrap select-text">
                {activeReader.text}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-5 py-3 border-t border-stone-150 flex justify-end">
              <button
                onClick={() => {
                  setActiveReader(null);
                  setCopiedText(false);
                }}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-850 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق القراءة
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

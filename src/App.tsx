import React, { useState, useEffect } from 'react';
import { DailyWork, AmaalState, NotificationSettings } from './types';
import { DEFAULT_AMAAL } from './data/defaultAmaal';
import AmaalList from './components/AmaalList';
import AmaalDetail from './components/AmaalDetail';
import AmaalForm from './components/AmaalForm';
import StatsDashboard from './components/StatsDashboard';
import RemindersManager, { DEFAULT_NOTIFICATION_SETTINGS, playSereneChime } from './components/RemindersManager';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Award, Bookmark, ShieldCheck, HeartPulse, Bell, Volume2,
  LogIn, LogOut, User as UserIcon, Crown
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser } from './firebase';

// Helper to safely get local date string YYYY-MM-DD
const getLocalDateString = (d: Date = new Date()) => {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Advanced Hijri converter and occasion mapper based on astronomy algorithm
const getHijriDateAndOccasion = (dateStr: string) => {
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
      "8-15": "ولادة الإمام المهدي عجل الله فرجه (١٥ شعبان) 🌟",
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
      hijriDay,
      hijriMonth,
      hijriMonthName,
      hijriYear,
      occasion,
      formatted: `${hijriDay} ${hijriMonthName} ${hijriYear} هـ`
    };
  } catch (e) {
    return null;
  }
};

const LOCAL_STORAGE_KEY = 'daily_amaal_app_state_v1';

export default function App() {
  // Global State
  const [works, setWorks] = useState<DailyWork[]>([]);
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [streak, setStreak] = useState<number>(0);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setSignInError(err?.message || "فشل تسجيل الدخول باستخدام غوغل");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err: any) {
      console.error("Logout Err:", err);
    }
  };

  const isAdminUser = user?.email === 'basim5252@gmail.com';
  
  // Navigation & View States
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalDateString());
  const [activeTab, setActiveTab] = useState<'schedule' | 'stats' | 'reminders'>('schedule');
  const [selectedWork, setSelectedWork] = useState<DailyWork | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingWork, setEditingWork] = useState<DailyWork | null>(null);

  // Clock state for beautiful header time display
  const [currentTime, setCurrentTime] = useState<string>('');

  // Notification and toast state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [activeToast, setActiveToast] = useState<{ title: string; text: string } | null>(null);

  // 1. Load initial state from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          works: DailyWork[];
          history: Record<string, string[]>;
        };
        
        // Merge default works to ensure any new defaults exist, preserving customs
        const mergedWorks = [...parsed.works];
        DEFAULT_AMAAL.forEach(def => {
          if (!mergedWorks.some(w => w.id === def.id)) {
            mergedWorks.push(def);
          }
        });

        setWorks(mergedWorks);
        setHistory(parsed.history || {});
      } catch (e) {
        // Fallback if parsing fails
        setWorks(DEFAULT_AMAAL);
        setHistory({});
      }
    } else {
      setWorks(DEFAULT_AMAAL);
      setHistory({});
    }

    // Load notification settings
    const savedSettings = localStorage.getItem('daily_amaal_notification_settings_v1');
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (e) {
        setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      }
    }

    // Check reminders matching current hour/minute
    const checkReminders = (now: Date) => {
      const dateKey = getLocalDateString(now);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hhmm = `${hh}:${mm}`;

      const storedSettingsStr = localStorage.getItem('daily_amaal_notification_settings_v1');
      const settings: NotificationSettings = storedSettingsStr ? JSON.parse(storedSettingsStr) : DEFAULT_NOTIFICATION_SETTINGS;

      const storedTriggered = localStorage.getItem('daily_amaal_triggered_reminders_v1');
      const triggered: Record<string, string[]> = storedTriggered ? JSON.parse(storedTriggered) : {};
      const todayTriggeredList = triggered[dateKey] || [];

      // Helper to calculate target trigger hh:mm
      const getTriggerTime = (timeStr: string, advanceMins: number) => {
        try {
          const [h, m] = timeStr.split(':').map(Number);
          const minutesTotal = h * 60 + m - advanceMins;
          let finalMin = minutesTotal % 60;
          let finalHour = Math.floor(minutesTotal / 60);
          if (finalMin < 0) {
            finalMin += 60;
            finalHour -= 1;
          }
          if (finalHour < 0) {
            finalHour += 24;
          }
          return `${String(finalHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`;
        } catch {
          return timeStr;
        }
      };

      const triggerReminder = (id: string, title: string, msg: string) => {
        if (todayTriggeredList.includes(id)) return;
        
        todayTriggeredList.push(id);
        triggered[dateKey] = todayTriggeredList;
        localStorage.setItem('daily_amaal_triggered_reminders_v1', JSON.stringify(triggered));
        
        // Play Chime sound
        playSereneChime();
        
        // Desktop Browser Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body: msg,
              icon: '/favicon.ico',
              dir: 'rtl'
            });
          } catch (err) {
            console.error("Browser notification error:", err);
          }
        }

        // Trigger App Toast
        setActiveToast({ title, text: msg });
        setTimeout(() => {
          setActiveToast(null);
        }, 12000);
      };

      // 1. Fajr Reminder
      if (settings.fajrReminder) {
        const target = getTriggerTime(settings.fajrTime, settings.fajrAdvance);
        if (hhmm === target) {
          triggerReminder('fajr', '🕌 صلاة الفجر', 'حان وقت صلاة الفجر. قال تعالى: (وقرآن الفجر إن قرآن الفجر كان مشهوداً). لا تنسَ نافلة الفجر.');
        }
      }

      // 2. Dhuhr Reminder
      if (settings.dhuhrReminder) {
        const target = getTriggerTime(settings.dhuhrTime, settings.dhuhrAdvance);
        if (hhmm === target) {
          triggerReminder('dhuhr', '🕌 صلاة الظهر', 'حان وقت صلاة الظهر. لا تنسَ نافلة الظهر (٨ ركعات) قبل الفريضة لزيادة الرزق.');
        }
      }

      // 3. Asr Reminder
      if (settings.asrReminder) {
        const target = getTriggerTime(settings.asrTime, settings.asrAdvance);
        if (hhmm === target) {
          triggerReminder('asr', '🕌 صلاة العصر', 'حان وقت صلاة العصر. وعن الصادق عليه السلام: نافلة العصر تفتح أبواب السماء.');
        }
      }

      // 4. Maghrib Reminder
      if (settings.maghribReminder) {
        const target = getTriggerTime(settings.maghribTime, settings.maghribAdvance);
        if (hhmm === target) {
          triggerReminder('maghrib', '🕌 صلاة المغرب', 'حان وقت صلاة المغرب. لا تنسَ نافلة المغرب (٤ ركعات) بعد الفريضة المباركة.');
        }
      }

      // 5. Isha Reminder
      if (settings.ishaReminder) {
        const target = getTriggerTime(settings.ishaTime, settings.ishaAdvance);
        if (hhmm === target) {
          triggerReminder('isha', '🕌 صلاة العشاء', 'حان وقت صلاة العشاء. لا تنسَ صلاة الوتيرة (نافلة العشاء جلوساً) لدفع وحشة القبر.');
        }
      }

      // 6. Night Prayer Reminder (صلاة الليل)
      if (settings.nightPrayerReminder && hhmm === settings.nightPrayerTime) {
        triggerReminder('nightPrayer', '🌙 صلاة الليل وقيام السحر', 'وقت السحر وصلاة الليل. قال الإمام الصادق (ع): صلاة الليل تزيد في الرزق وتحسن الوجه والمزاج (١١ ركعة).');
      }

      // 7. Occasions Reminder
      if (settings.occasionReminder && hhmm === settings.occasionTime) {
        const hijri = getHijriDateAndOccasion(dateKey);
        if (hijri && hijri.occasion) {
          triggerReminder('occasion', '🌟 مناسبة اليوم المباركة', `اليوم هو: ${hijri.occasion}. تذكّر الاطّلاع على الأعمال والزيارات المخصوصة لليوم.`);
        }
      }

      // 8. Daily Reset at exactly 00:01
      if (settings.dailyReset && hhmm === "00:01") {
        if (!todayTriggeredList.includes('dailyResetAction')) {
          todayTriggeredList.push('dailyResetAction');
          triggered[dateKey] = todayTriggeredList;
          localStorage.setItem('daily_amaal_triggered_reminders_v1', JSON.stringify(triggered));
          triggerReminder('dailyReset', '🔄 إعادة تعيين تلقائية للأعمال', 'تم تصفير حالة الأعمال والتعقيبات وبدء يوم تعبدي جديد مفعم بالإيمان والنشاط.');
        }
      }
    };

    // Refresh Time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      checkReminders(now);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Synchronize completion status of current UI cards with the currently selected date
  useEffect(() => {
    if (works.length === 0) return;

    const completedIdsForDate = history[selectedDateStr] || [];
    
    setWorks(prevWorks => 
      prevWorks.map(work => ({
        ...work,
        isCompleted: completedIdsForDate.includes(work.id)
      }))
    );
  }, [selectedDateStr, history]);

  // 3. Calculate streak dynamically
  useEffect(() => {
    if (Object.keys(history).length === 0) {
      setStreak(0);
      return;
    }

    let calculatedStreak = 0;
    const todayStr = getLocalDateString();
    let checkDate = new Date(); // Start checking from Today back

    // Check if yesterday or today has completions to begin counting back
    const todayCompleted = history[todayStr] && history[todayStr].length > 0;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    const yesterdayCompleted = history[yesterdayStr] && history[yesterdayStr].length > 0;

    // If neither today nor yesterday has completions, streak is broken / 0
    if (!todayCompleted && !yesterdayCompleted) {
      setStreak(0);
      return;
    }

    // Begin countdown back
    if (!todayCompleted && yesterdayCompleted) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = getLocalDateString(checkDate);
      const completedIds = history[dateStr] || [];
      if (completedIds.length > 0) {
        calculatedStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // step back 1 day
      } else {
        break;
      }
    }

    setStreak(calculatedStreak);
  }, [history]);

  // Save changes helper
  const saveStateToStorage = (updatedWorks: DailyWork[], updatedHistory: Record<string, string[]>) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      works: updatedWorks.map(w => ({ ...w, isCompleted: false })), // save state without pre-applied completions since we calculate those on-fly
      history: updatedHistory
    }));
  };

  // Toggle Complete Handler
  const handleToggleComplete = (id: string) => {
    const isCurrentlyCompleted = (history[selectedDateStr] || []).includes(id);
    let updatedCompletedIds = [...(history[selectedDateStr] || [])];

    if (isCurrentlyCompleted) {
      updatedCompletedIds = updatedCompletedIds.filter(item => item !== id);
    } else {
      updatedCompletedIds.push(id);
    }

    const updatedHistory = {
      ...history,
      [selectedDateStr]: updatedCompletedIds,
    };

    setHistory(updatedHistory);

    // Apply immediate local feedback to active works representation
    const updatedWorks = works.map(w => w.id === id ? { ...w, isCompleted: !isCurrentlyCompleted } : w);
    setWorks(updatedWorks);

    // Keep active viewing modal in sync with toggle actions
    if (selectedWork && selectedWork.id === id) {
      setSelectedWork({ ...selectedWork, isCompleted: !isCurrentlyCompleted });
    }

    saveStateToStorage(updatedWorks, updatedHistory);
  };

  // Save / Add / Update Work Handler
  const handleSaveWork = (newWork: DailyWork) => {
    let updatedWorks;
    const exists = works.some(w => w.id === newWork.id);

    if (exists) {
      updatedWorks = works.map(w => w.id === newWork.id ? newWork : w);
    } else {
      updatedWorks = [...works, newWork];
    }

    setWorks(updatedWorks);
    saveStateToStorage(updatedWorks, history);
  };

  // Delete Custom Work
  const handleDeleteWork = (id: string) => {
    const updatedWorks = works.filter(w => w.id !== id);
    
    // Also remove from all historical log recordings
    const updatedHistory = { ...history };
    Object.keys(updatedHistory).forEach(date => {
      updatedHistory[date] = updatedHistory[date].filter(item => item !== id);
    });

    setWorks(updatedWorks);
    setHistory(updatedHistory);
    saveStateToStorage(updatedWorks, updatedHistory);
  };

  // Import Backup Callback
  const handleImportData = (importedWorks: DailyWork[], importedHistory: Record<string, string[]>) => {
    setWorks(importedWorks);
    setHistory(importedHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      works: importedWorks.map(w => ({ ...w, isCompleted: false })),
      history: importedHistory
    }));
  };

  // Clear or Factory Reset Data Callback
  const handleClearAllData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setWorks(DEFAULT_AMAAL);
    setHistory({});
    setStreak(0);
  };

  // Day navigation controls
  const stepDate = (days: number) => {
    const current = new Date(selectedDateStr);
    current.setDate(current.getDate() + days);
    setSelectedDateStr(getLocalDateString(current));
  };

  // Helper to format date visually in Arabic
  const formatArabicDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper to format Hijri date
  const formatHijriDate = (dateStr: string) => {
    const calculated = getHijriDateAndOccasion(dateStr);
    if (calculated) {
      return calculated.formatted;
    }
    try {
      const date = new Date(dateStr);
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const formatted = formatter.format(date);
      if (formatted && !formatted.includes('هـ')) {
        return `${formatted} هـ`;
      }
      return formatted;
    } catch {
      return '';
    }
  };

  const isTodaySelected = selectedDateStr === getLocalDateString();

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-stone-850 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900" dir="rtl">
      {/* Decorative Golden Top Pattern Rim */}
      <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200" />

      {/* Header Container */}
      <header className="bg-emerald-950 text-white shadow-xl relative overflow-hidden flex-shrink-0">
        {/* Subtle Background Radial Aura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
          
          {/* Main Titles */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-col gap-0.5">
                <div className="text-amber-400 text-sm md:text-base font-extrabold tracking-wide drop-shadow-sm">
                  حملة التكاتف والإيمان
                </div>
                <div className="h-0.5 w-[180px] bg-gradient-to-l from-amber-400/80 to-transparent my-1" />
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-serif text-2xl md:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-white via-stone-100 to-amber-200">
                  زاد العباد
                </h1>
                <span className="text-emerald-400 text-xs md:text-xs font-semibold tracking-wider font-mono opacity-80 dir-ltr">
                  — Zad Al-Ibaad
                </span>
              </div>
              <p className="text-emerald-300/80 text-xs">
                متابعة منظمة للصلوات والتعقيبات والأدعية المسـتحبة وتأصيل وردك العبادي.
              </p>
            </div>

            {/* Live Clock, Badge Stats & Google Auth Card */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 self-end sm:self-center">
              {/* Authenticated User or Sign in button */}
              {authLoading ? (
                <div className="h-9 w-24 rounded-xl bg-emerald-900/30 animate-pulse border border-emerald-850" />
              ) : user ? (
                <div className="bg-emerald-900/40 border border-emerald-800/80 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-md">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg border border-amber-400/30 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-bold text-xs">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  
                  <div className="text-right">
                    <div className="text-[10px] text-stone-200 font-bold max-w-[110px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </div>
                    {isAdminUser ? (
                      <span className="text-[9px] text-amber-300 font-extrabold flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 fill-amber-300 animate-pulse" />
                        <span>المدير 👑</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-300 font-sans">مُسجّل</span>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1 bg-emerald-950 hover:bg-emerald-800 rounded-lg text-emerald-300 hover:text-white transition-all cursor-pointer mr-1"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-emerald-950 font-serif font-black rounded-xl transition-all shadow-md text-xs flex items-center gap-1.5 cursor-pointer border border-amber-400/25"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>دخول بجوجل</span>
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className="bg-emerald-900/60 border border-emerald-800 p-2.5 rounded-xl text-left font-mono text-xs flex items-center gap-2 shadow-inner text-emerald-200">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentTime || '00:00:00'}</span>
                </div>
                <div className="bg-amber-400 text-emerald-950 px-3 py-2 rounded-xl shadow-md font-bold text-xs flex items-center gap-1.5 font-sans">
                  <Award className="w-4 h-4 fill-emerald-950" />
                  <span>الالتزام: {streak} يوم</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date Navigator & Controls */}
          <div className="mt-6 pt-5 border-t border-emerald-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* NavButtons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                id="prev-day-btn"
                onClick={() => stepDate(-1)}
                className="p-2 bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                title="اليوم السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex-1 sm:flex-initial text-center bg-emerald-900 px-4 py-1.5 rounded-xl border border-emerald-800 min-w-[240px] md:min-w-[280px]">
                <div className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase flex items-center justify-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-amber-400" />
                  <span>{selectedDateStr}</span>
                </div>
                <div className="font-serif font-bold text-stone-100 text-xs mt-0.5 flex flex-wrap items-center justify-center gap-1.5">
                  <span>{formatArabicDate(selectedDateStr)}</span>
                  <span className="text-amber-400/80">•</span>
                  <span className="text-amber-300">{formatHijriDate(selectedDateStr)}</span>
                </div>
              </div>

              <button
                id="next-day-btn"
                onClick={() => stepDate(1)}
                className="p-2 bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                title="اليوم التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Today Fast Redirect */}
            {!isTodaySelected && (
              <button
                id="reset-today-btn"
                onClick={() => setSelectedDateStr(getLocalDateString())}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl font-bold text-xs shadow-md transition-shadow cursor-pointer"
              >
                العودة لليوم الحالي
              </button>
            )}
          </div>

          {/* Dynamic Hijri Occasion Banner */}
          {(() => {
            const hijriInfo = getHijriDateAndOccasion(selectedDateStr);
            if (hijriInfo && hijriInfo.occasion) {
              return (
                <div className="mt-4 px-4 py-3 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-emerald-900/40 border border-amber-400/30 rounded-2xl flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">✨</span>
                    <div className="text-right">
                      <div className="text-[10px] text-amber-300/80 font-bold font-mono">الـمناسبة الهـجرية للـيوم</div>
                      <div className="text-amber-200 font-serif font-extrabold text-sm sm:text-base tracking-wide drop-shadow-sm">
                        {hijriInfo.occasion}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 bg-amber-400 text-emerald-950 rounded-lg shadow-sm">
                    {hijriInfo.hijriDay} {hijriInfo.hijriMonthName}
                  </span>
                </div>
              );
            }
            return null;
          })()}

          {/* Tab Navigation Switches */}
          <div className="flex flex-wrap gap-2 md:gap-4 mt-5">
            <button
              id="tab-schedule-btn"
              onClick={() => setActiveTab('schedule')}
              className={`pb-2 pt-1 px-3 md:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-emerald-300/60 hover:text-white'
              }`}
            >
              الأعمال الواجبة والمستـحبّة
            </button>
            <button
              id="tab-stats-btn"
              onClick={() => setActiveTab('stats')}
              className={`pb-2 pt-1 px-3 md:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-emerald-300/60 hover:text-white'
              }`}
            >
              مؤشرات الالتزام والتقارير
            </button>
            <button
              id="tab-reminders-btn"
              onClick={() => setActiveTab('reminders')}
              className={`pb-2 pt-1 px-3 md:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'reminders'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-emerald-300/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">
                <Bell className="w-3 h-3 text-amber-300 animate-pulse animate-duration-1000" />
                <span>تنبيـهات صلاة الرواتب والأوراد</span>
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 relative">
        {/* Content Container Frame */}
        <div className="bg-stone-50/40 p-1 md:p-3 rounded-3xl border border-stone-200 shadow-sm min-h-[400px]">
          {activeTab === 'schedule' ? (
            <AmaalList 
              works={works} 
              onToggleComplete={handleToggleComplete} 
              onSelectWork={(work) => setSelectedWork(work)} 
              onOpenAddModal={() => {
                setEditingWork(null);
                setIsFormOpen(true);
              }}
              selectedDateStr={selectedDateStr}
              isAdminUser={isAdminUser}
            />
          ) : activeTab === 'stats' ? (
            <StatsDashboard 
              works={works} 
              history={history} 
              streak={streak} 
              onImportData={handleImportData}
              onClearAllData={handleClearAllData}
              hijriFormatted={getHijriDateAndOccasion(selectedDateStr)?.formatted}
              occasion={getHijriDateAndOccasion(selectedDateStr)?.occasion}
              onToggleComplete={handleToggleComplete}
            />
          ) : (
            <RemindersManager 
              settings={notificationSettings}
              onUpdateSettings={(updated) => {
                setNotificationSettings(updated);
                localStorage.setItem('daily_amaal_notification_settings_v1', JSON.stringify(updated));
              }}
              hijriOccasion={getHijriDateAndOccasion(selectedDateStr)?.occasion || ''}
            />
          )}
        </div>
      </main>

      {/* Footer Branding Area */}
      <footer className="py-8 bg-stone-100 border-t border-stone-200 mt-auto text-center space-y-3 flex flex-col items-center">
        {/* Fine-line branding elements */}
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
          <span className="font-serif text-xs font-bold text-emerald-950 tracking-wider">زاد العباد — Zad Al-Ibaad</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
        </div>
        
        <p className="text-[10px] text-stone-400 max-w-md px-4 leading-normal">
          تطبيق تعبدي مستقل مخصص لمتابعة وتنظيم أعمال البر، تلاوة الأدعية، والزيارات اليومية. يتم تخزين بياناتك محلياً بشكل آمن وسري تماماً على متصفحك.
        </p>

        <div className="flex items-center gap-4 text-[10px] text-stone-500 font-mono mt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Secure Local Sandbox
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <HeartPulse className="w-3.5 h-3.5 text-amber-500" /> Devoted Living 2026
          </span>
        </div>
      </footer>

      {/* Multi Modal Overlays */}

      {/* 1. Add / Edit Custom Work Modal */}
      {isFormOpen && (
        <AmaalForm 
          onClose={() => {
            setIsFormOpen(false);
            setEditingWork(null);
          }} 
          onSave={handleSaveWork} 
          editingWork={editingWork} 
        />
      )}

      {/* 2. Reader & Tasbih Detail Modal */}
      {selectedWork && (
        <AmaalDetail
          work={selectedWork}
          onClose={() => setSelectedWork(null)}
          onToggleComplete={handleToggleComplete}
          onEdit={(work) => {
            setEditingWork(work);
            setSelectedWork(null);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteWork}
        />
      )}

      {/* 3. Global Notification Alert Toast */}
      {activeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90%] bg-gradient-to-br from-emerald-950 to-emerald-900 border border-amber-300 text-white rounded-2xl shadow-2xl p-4.5 flex gap-3.5 items-start animate-fade-in animate-bounce">
          <div className="p-2 bg-emerald-800 text-amber-300 rounded-xl">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 text-right flex-1">
            <h4 className="font-serif font-extrabold text-xs text-amber-300">{activeToast.title}</h4>
            <p className="text-[11px] text-stone-200 leading-relaxed font-sans">{activeToast.text}</p>
          </div>
          <button 
            className="text-stone-300 hover:text-white font-bold select-none cursor-pointer self-start text-lg"
            onClick={() => setActiveToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

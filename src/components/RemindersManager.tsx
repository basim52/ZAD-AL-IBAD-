import React, { useState, useEffect } from 'react';
import { NotificationSettings } from '../types';
import { 
  Bell, BellOff, Volume2, ShieldAlert, CheckCircle2, RefreshCw, 
  Settings, Sparkles, Flame, Calendar, Clock, Play
} from 'lucide-react';

// Soothing, divine bell sound synthesized purely in the browser using the Web Audio API
export const playSereneChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First bell chime (low and sweet - 528 Hz - Solfeggio frequency of relaxation)
    const playBell = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Add subtle harmonic richness (simulating metal bell resonance)
      const overtone1 = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone1.type = 'sine';
      overtone1.frequency.setValueAtTime(freq * 1.5, startTime);
      
      const overtone2 = ctx.createOscillator();
      const overtone2Gain = ctx.createGain();
      overtone2.type = 'sine';
      overtone2.frequency.setValueAtTime(freq * 2, startTime);
      
      // Connect nodes
      osc.connect(gainNode);
      overtone1.connect(overtoneGain);
      overtone2.connect(overtone2Gain);
      
      gainNode.connect(ctx.destination);
      overtoneGain.connect(ctx.destination);
      overtone2Gain.connect(ctx.destination);
      
      // Volume shaping (exponential decay like a traditional singing bowl / bell chime)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      overtoneGain.gain.setValueAtTime(0, startTime);
      overtoneGain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.05);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);
      
      overtone2Gain.gain.setValueAtTime(0, startTime);
      overtone2Gain.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.04);
      overtone2Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.45);
      
      osc.start(startTime);
      overtone1.start(startTime);
      overtone2.start(startTime);
      
      osc.stop(startTime + duration + 0.1);
      overtone1.stop(startTime + duration + 0.1);
      overtone2.stop(startTime + duration + 0.1);
    };

    // Play double bell chime (with a 0.35s gap between strikes)
    playBell(528, ctx.currentTime, 2.5, 0.5);
    playBell(660, ctx.currentTime + 0.35, 1.8, 0.35);

  } catch (error) {
    console.warn('Web Audio Playback blocked or unsupported:', error);
  }
};

interface RemindersManagerProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  hijriOccasion: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  fajrReminder: true,
  dhuhrReminder: true,
  asrReminder: true,
  maghribReminder: true,
  ishaReminder: true,
  nightPrayerReminder: true,
  occasionReminder: true,
  dailyReset: true,
  
  fajrTime: "04:30",
  dhuhrTime: "12:00",
  asrTime: "15:30",
  maghribTime: "18:00",
  ishaTime: "19:30",
  nightPrayerTime: "03:00",
  occasionTime: "08:00",

  fajrAdvance: 15,
  dhuhrAdvance: 10,
  asrAdvance: 10,
  maghribAdvance: 5,
  ishaAdvance: 10
};

export default function RemindersManager({ 
  settings, 
  onUpdateSettings,
  hijriOccasion
}: RemindersManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showTestBanner, setShowTestBanner] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testText, setTestText] = useState('');

  // Auto-fetch status of browser permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("متصفحك الحالي لا يدعم إشعارات سطح المكتب.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const toggleReminder = (key: keyof NotificationSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const updateTime = (key: keyof NotificationSettings, val: string) => {
    onUpdateSettings({
      ...settings,
      [key]: val
    });
  };

  const updateAdvance = (key: keyof NotificationSettings, val: number) => {
    onUpdateSettings({
      ...settings,
      [key]: Math.max(0, val)
    });
  };

  const handleTriggerTest = () => {
    playSereneChime();
    
    const randomPrayers = [
      {
        title: "🕌 صلاة الفجر",
        msg: "حان وقت صلاة الفجر. قـال تعالى: (إن قرآن الفجر كان مشـهوداً) - تنبـيه مسبق قبل ١٥ دقيقة."
      },
      {
        title: "🕌 صلاة الظهر",
        msg: "حان وقت صلاة الظهر. لا تنس نافلة الظهر (٨ ركعات) قبل الفريضة."
      },
      {
        title: "🌙 صلاة الليل",
        msg: "وقت السحر وصلاة الليل. قال الإمام الصادق (ع): صلاة الليل تزيد في الرزق وتحسن الوجه."
      },
      {
        title: "🌟 مناسبة اليوم",
        msg: hijriOccasion ? `مناسبة اليوم: ${hijriOccasion}. لا تنس الأعمال المخصوصة.` : "تذكر قراءة الأدعية المأثورة والأوراد اليومية المباركة."
      }
    ];

    const pick = randomPrayers[Math.floor(Math.random() * randomPrayers.length)];
    setTestTitle(pick.title);
    setTestText(pick.msg);
    setShowTestBanner(true);

    if (permission === 'granted') {
      try {
        new Notification(pick.title, {
          body: pick.msg,
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (err) {
        console.error("Desktop Notification failed to send:", err);
      }
    }
    
    setTimeout(() => {
      setShowTestBanner(false);
    }, 8000);
  };

  // Human friendly display offset calculation helper
  const calculateTriggerTime = (timeStr: string, advanceMins: number) => {
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

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Test Interactive Alert Toast overlay (Client top preview) */}
      {showTestBanner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl shadow-2xl border border-amber-300/40 p-4.5 flex gap-3.5 items-start animate-bounce">
          <div className="p-2.5 bg-emerald-800/80 text-amber-300 rounded-xl shadow-inner shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-serif font-extrabold text-sm text-amber-300">{testTitle}</span>
              <span className="text-[9px] bg-amber-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded">الآن</span>
            </div>
            <p className="text-xs text-stone-200/90 leading-relaxed font-sans">
              {testText}
            </p>
            <div className="h-0.5 w-full bg-emerald-800 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-amber-400 rounded-full animate-play-progress" style={{ animationDuration: '8s' }} />
            </div>
          </div>
          <button 
            onClick={() => setShowTestBanner(false)}
            className="text-white/40 hover:text-white text-base font-bold select-none cursor-pointer self-start"
          >
            ×
          </button>
        </div>
      )}

      {/* Permission request component */}
      <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-3.5 items-start text-right">
          <div className={`p-3 rounded-2xl shrink-0 ${
            permission === 'granted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'
          }`}>
            <Bell className="w-6 h-6 animate-swing" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-800 text-sm">حالة نظام الإشعارات والتنبيهات الموقوتة</h3>
              {permission === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-lg leading-none">
                  <CheckCircle2 className="w-3 h-3" /> نشط ومفعّل
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold rounded-lg leading-none">
                  <ShieldAlert className="w-3 h-3" /> معطّل حالياً
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              يتيح لك هذا النظام إطلاق إشعارات على جهازك ونغمة تنبيه روحانية هادئة قبل الصلوات والأعمال، تماماً كإعدادات تطبيق زاد العباد على نظام الأندرويد.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleTriggerTest}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>تجربة الصوت والتنبيه</span>
          </button>

          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>تفعيل إشعارات المتصفح</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Grid Accordion */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-stone-50/80 border-b border-stone-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-stone-500" />
            <span className="font-serif font-bold text-stone-700 text-xs">إعدادات توقيت الصلوات وتنبيهات الأعمال الروتينية</span>
          </div>
          <span className="text-[10px] font-mono bg-stone-200/70 text-stone-600 px-2 py-0.5 rounded-lg">PrayerTimeManager</span>
        </div>

        <div className="divide-y divide-stone-100">
          
          {/* 1. FAJR PRE-REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.fajrReminder} 
                  onChange={() => toggleReminder('fajrReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه صلاة الفجر</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                إرسال تنبيه روحي قبل صلاة الفجر للتهيئة ونافلة الصبح (ركعتا الفجر).
              </p>
              {settings.fajrReminder && (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>سيتم إرسال التنبيه في تمام الساعة {calculateTriggerTime(settings.fajrTime, settings.fajrAdvance)} ص</span>
                </div>
              )}
            </div>

            {settings.fajrReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت صلاة الفجر</span>
                  <input 
                    type="time" 
                    value={settings.fajrTime} 
                    onChange={(e) => updateTime('fajrTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">التنبيه قبل الموعد بـ</span>
                  <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-0.5">
                    <input 
                      type="number" 
                      value={settings.fajrAdvance} 
                      onChange={(e) => updateAdvance('fajrAdvance', parseInt(e.target.value) || 0)}
                      className="w-[45px] text-xs font-mono font-bold text-center border-none p-0 focus:ring-0"
                    />
                    <span className="text-[10px] text-stone-400">دقيقة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. DHUHR PRE-REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.dhuhrReminder} 
                  onChange={() => toggleReminder('dhuhrReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه صلاة الظهر</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                منبه للظهر وتذكير بأداء نافلة الظهر (٨ ركعات) الشـديدة الفضل.
              </p>
              {settings.dhuhrReminder && (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>سيتم إرسال التنبيه في تمام الساعة {calculateTriggerTime(settings.dhuhrTime, settings.dhuhrAdvance)} م</span>
                </div>
              )}
            </div>

            {settings.dhuhrReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت صلاة الظهر</span>
                  <input 
                    type="time" 
                    value={settings.dhuhrTime} 
                    onChange={(e) => updateTime('dhuhrTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">التنبيه قبل الموعد بـ</span>
                  <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-0.5">
                    <input 
                      type="number" 
                      value={settings.dhuhrAdvance} 
                      onChange={(e) => updateAdvance('dhuhrAdvance', parseInt(e.target.value) || 0)}
                      className="w-[45px] text-xs font-mono font-bold text-center border-none p-0 focus:ring-0"
                    />
                    <span className="text-[10px] text-stone-400">دقيقة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. ASR PRE-REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.asrReminder} 
                  onChange={() => toggleReminder('asrReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه صلاة العصر</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                تنبيه لأداء صلاة العصر مع تذكير بنافلة العصر (٨ ركعات) ثوابها كـ مئة حجة وعمرة.
              </p>
              {settings.asrReminder && (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>سيتم إرسال التنبيه في تمام الساعة {calculateTriggerTime(settings.asrTime, settings.asrAdvance)} م</span>
                </div>
              )}
            </div>

            {settings.asrReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت صلاة العصر</span>
                  <input 
                    type="time" 
                    value={settings.asrTime} 
                    onChange={(e) => updateTime('asrTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">التنبيه قبل الموعد بـ</span>
                  <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-0.5">
                    <input 
                      type="number" 
                      value={settings.asrAdvance} 
                      onChange={(e) => updateAdvance('asrAdvance', parseInt(e.target.value) || 0)}
                      className="w-[45px] text-xs font-mono font-bold text-center border-none p-0 focus:ring-0"
                    />
                    <span className="text-[10px] text-stone-400">دقيقة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. MAGHRIB PRE-REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.maghribReminder} 
                  onChange={() => toggleReminder('maghribReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه صلاة المغرب</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                منبه وقت المغرب مع تذكير بنافلتها (٤ ركعات) بعد الفريضة لزيادة الرزق والبركة.
              </p>
              {settings.maghribReminder && (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>سيتم إرسال التنبيه في تمام الساعة {calculateTriggerTime(settings.maghribTime, settings.maghribAdvance)} م</span>
                </div>
              )}
            </div>

            {settings.maghribReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت صلاة المغرب</span>
                  <input 
                    type="time" 
                    value={settings.maghribTime} 
                    onChange={(e) => updateTime('maghribTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">التنبيه قبل الموعد بـ</span>
                  <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-0.5">
                    <input 
                      type="number" 
                      value={settings.maghribAdvance} 
                      onChange={(e) => updateAdvance('maghribAdvance', parseInt(e.target.value) || 0)}
                      className="w-[45px] text-xs font-mono font-bold text-center border-none p-0 focus:ring-0"
                    />
                    <span className="text-[10px] text-stone-400">دقيقة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. ISHA PRE-REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.ishaReminder} 
                  onChange={() => toggleReminder('ishaReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه صلاة العشاء</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                تنبيه لأداء العشاء وتذكير بأداء صلاة الوتيرة (نافلة العشاء جلوساً) لدفع وحشة القبر.
              </p>
              {settings.ishaReminder && (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>سيتم إرسال التنبيه في تمام الساعة {calculateTriggerTime(settings.ishaTime, settings.ishaAdvance)} م</span>
                </div>
              )}
            </div>

            {settings.ishaReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت صلاة العشاء</span>
                  <input 
                    type="time" 
                    value={settings.ishaTime} 
                    onChange={(e) => updateTime('ishaTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">التنبيه قبل الموعد بـ</span>
                  <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-0.5">
                    <input 
                      type="number" 
                      value={settings.ishaAdvance} 
                      onChange={(e) => updateAdvance('ishaAdvance', parseInt(e.target.value) || 0)}
                      className="w-[45px] text-xs font-mono font-bold text-center border-none p-0 focus:ring-0"
                    />
                    <span className="text-[10px] text-stone-400">دقيقة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. NIGHT PRAYER REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.nightPrayerReminder} 
                  onChange={() => toggleReminder('nightPrayerReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه صلاة الليل (وقت السحر)</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                الموقظ المبارك للتهجد وقيام الليل والاستغفار في السحر قبل الفجر.
              </p>
              {settings.nightPrayerReminder && (
                <div className="text-[10px] text-teal-800 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>تنبيه صلاة الليل في تمام الساعة {settings.nightPrayerTime} ص</span>
                </div>
              )}
            </div>

            {settings.nightPrayerReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت تنبيه السحر</span>
                  <input 
                    type="time" 
                    value={settings.nightPrayerTime} 
                    onChange={(e) => updateTime('nightPrayerTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. OCCASION REMINDER */}
          <div className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.occasionReminder} 
                  onChange={() => toggleReminder('occasionReminder')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">تنبيه المناسبات الهجرية والذكريات الإسلامية</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                ينبهك صباحاً بالذكريات الإسلامية والولادات والوفيات المباركة مع حث قراءة أعمالها.
              </p>
              {settings.occasionReminder && (
                <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                  <Calendar className="w-3 h-3" />
                  <span>تنبيه المناسبات يومياً الساعة {settings.occasionTime} ص</span>
                </div>
              )}
            </div>

            {settings.occasionReminder && (
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 self-start md:self-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-stone-400 font-bold">وقت تنبيه الصباح</span>
                  <input 
                    type="time" 
                    value={settings.occasionTime} 
                    onChange={(e) => updateTime('occasionTime', e.target.value)}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-[95px] focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 8. DAILY AUTO RESET */}
          <div className="p-4.5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 text-right flex-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={settings.dailyReset} 
                  onChange={() => toggleReminder('dailyReset')}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-800 cursor-pointer"
                />
                <label className="font-bold text-xs text-stone-800">إعادة تعيين اليوم التلقائي (تصفير المسـحوبات)</label>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                عند تدشين يوم جديد (بعد منتصف الليل بدقيقة)، يتم إفساح المجال وتصفير حالة الأعمال اليومية لتتمكن من تدوينها مجدداً بشكل تلقائي.
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-1.5 p-2 bg-emerald-50 rounded-xl text-emerald-800 text-xs">
              <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="font-mono font-bold">00:01 ص</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* Informative advice on importance of Routine Prayers & Nafilah */}
      <div className="p-4 bg-gradient-to-l from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl border border-amber-300/30 text-white flex flex-col sm:flex-row gap-4 items-center sm:items-start text-right">
        <span className="text-2xl pt-0.5">✨</span>
        <div className="space-y-1.5">
          <h4 className="font-serif font-extrabold text-[#FEDB9B] text-xs">منزلة النوافل وتأصيل المراقبة</h4>
          <p className="text-[11px] text-stone-200/95 leading-relaxed font-sans">
            عن الإمام الصادق عليه السلام: «شُـفَعاؤنا صَلاتُهم على النَّوافِلِ، فافْزَعوا إليها وتَقَرَّبُوا بها». إن وضع منبهات ومواقيت دورية يرسّخ وردكم العبادي ويعزز استمراريتكم على طاعة المولى عز وجل في غمرة الشواغل اليومية.
          </p>
        </div>
      </div>

    </div>
  );
}

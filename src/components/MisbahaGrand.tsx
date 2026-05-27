import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Sparkles, Volume2, VolumeX, ShieldAlert, Award, Plus, Trash2, CheckCircle2, Music, Moon, Play
} from 'lucide-react';

interface PresetDhikr {
  id: string;
  title: string;
  defaultGoal: number;
  arabic: string;
}

const PRESET_DHIKRS: PresetDhikr[] = [
  { id: 'salawat', title: 'الصلوات المحمدية', defaultGoal: 100, arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ' },
  { id: 'fاطمة_زهراء', title: 'تسبيح الزهراء (اللّه أكبر)', defaultGoal: 34, arabic: 'اللَّهُ أَكْبَرُ' },
  { id: 'فاطمة_حمد', title: 'تسبيح الزهراء (الحمد للّه)', defaultGoal: 33, arabic: 'الْحَمْدُ لِلَّهِ' },
  { id: 'fاطمة_سبحان', title: 'تسبيح الزهراء (سبحان اللّه)', defaultGoal: 33, arabic: 'سُبْحَانَ اللَّهِ' },
  { id: 'istighfar', title: 'الاستغفار المنيب', defaultGoal: 100, arabic: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ' },
  { id: 'tahlil', title: 'تهليل التوحيد', defaultGoal: 100, arabic: 'لَا إِلَهَ إِلَّا اللَّهُ' },
  { id: 'subhan', title: 'التسبيحات الأربعة', defaultGoal: 100, arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ' }
];

type MisbahaTheme = 'emerald_gold' | 'starry_midnight' | 'clay_desert';

interface MisbahaGrandProps {
  onAddTotalCounts?: (amount: number) => void;
}

export default function MisbahaGrand({ onAddTotalCounts }: MisbahaGrandProps) {
  // Preset select
  const [selectedPresetId, setSelectedPresetId] = useState<string>('salawat');
  const [activePreset, setActivePreset] = useState<PresetDhikr>(PRESET_DHIKRS[0]);
  
  // Custom user dhikrs
  const [customDhikrs, setCustomDhikrs] = useState<PresetDhikr[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newGoal, setNewGoal] = useState<number>(100);
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Counters
  const [counter, setCounter] = useState<number>(0);
  const [totalAccumulated, setTotalAccumulated] = useState<number>(() => {
    const saved = localStorage.getItem('grand_misbaha_accumulated_total_v1');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [loopsCompleted, setLoopsCompleted] = useState<number>(0);

  // Settings
  const [soundMode, setSoundMode] = useState<'bell' | 'click' | 'silent'>(() => {
    const saved = localStorage.getItem('grand_misbaha_sound_mode_v1');
    return (saved as any) || 'bell';
  });
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [activeTheme, setActiveTheme] = useState<MisbahaTheme>('emerald_gold');

  // Trigger feedback
  const triggerFeedback = () => {
    // Vibration
    if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    // Audio context feedback
    if (soundMode !== 'silent') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          if (soundMode === 'bell') {
            // Serene metal bowl key chime frequency (or a double chime when goal complete)
            const isGoalMet = (counter + 1) % activePreset.defaultGoal === 0;
            const f = isGoalMet ? 880 : 528;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, ctx.currentTime);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (isGoalMet ? 1.0 : 0.6));
            osc.start();
            osc.stop(ctx.currentTime + (isGoalMet ? 1.1 : 0.7));
          } else if (soundMode === 'click') {
            // Short wooden mechanical click
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.03);
            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
          }
        }
      } catch (err) {}
    }
  };

  const handleIncrement = () => {
    triggerFeedback();
    
    setCounter(prev => {
      const next = prev + 1;
      const isLoop = next % activePreset.defaultGoal === 0;
      if (isLoop) {
        setLoopsCompleted(l => l + 1);
      }
      return next;
    });

    setTotalAccumulated(prev => {
      const next = prev + 1;
      localStorage.setItem('grand_misbaha_accumulated_total_v1', String(next));
      if (onAddTotalCounts) onAddTotalCounts(1);
      return next;
    });
  };

  const handleResetCurrent = () => {
    setCounter(0);
    setLoopsCompleted(0);
  };

  const handleClearTotalAccumulated = () => {
    if (confirm('هل تود تصفير رصيد مسبحتك التراكمي؟ ستخسر سجل التسبيح التام.')) {
      setTotalAccumulated(0);
      localStorage.setItem('grand_misbaha_accumulated_total_v1', '0');
    }
  };

  const handleSelectPreset = (pId: string) => {
    setSelectedPresetId(pId);
    let found = PRESET_DHIKRS.find(p => p.id === pId);
    if (!found) {
      found = customDhikrs.find(p => p.id === pId);
    }
    if (found) {
      setActivePreset(found);
      setCounter(0);
      setLoopsCompleted(0);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArabic.trim()) return;

    const custom: PresetDhikr = {
      id: `custom-dhikr-${Date.now()}`,
      title: newTitle.trim(),
      defaultGoal: newGoal,
      arabic: newArabic.trim()
    };

    const updated = [...customDhikrs, custom];
    setCustomDhikrs(updated);
    localStorage.setItem('grand_misbaha_custom_dhikrs_v1', JSON.stringify(updated));
    
    // Auto active
    setActivePreset(custom);
    setSelectedPresetId(custom.id);
    setCounter(0);
    setLoopsCompleted(0);

    // Reset Form
    setNewTitle('');
    setNewArabic('');
    setNewGoal(100);
    setShowAddCustom(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('حذف هذا الذكر المخصص؟')) {
      const updated = customDhikrs.filter(p => p.id !== id);
      setCustomDhikrs(updated);
      localStorage.setItem('grand_misbaha_custom_dhikrs_v1', JSON.stringify(updated));
      
      // select default first
      setActivePreset(PRESET_DHIKRS[0]);
      setSelectedPresetId(PRESET_DHIKRS[0].id);
      setCounter(0);
      setLoopsCompleted(0);
    }
  };

  // Load customs on mount
  useEffect(() => {
    const saved = localStorage.getItem('grand_misbaha_custom_dhikrs_v1');
    if (saved) {
      try {
        setCustomDhikrs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Save sound configurations
  const updateSoundMode = (mode: 'bell' | 'click' | 'silent') => {
    setSoundMode(mode);
    localStorage.setItem('grand_misbaha_sound_mode_v1', mode);
  };

  // Percent calculation
  const progressPercent = Math.min(100, (counter % activePreset.defaultGoal) / activePreset.defaultGoal * 100);

  return (
    <div className="space-y-6" id="grand-misbaha">
      {/* Upper branding card */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-emerald-950 to-emerald-900 border border-amber-300/20 p-5 rounded-3xl text-white text-right gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-end sm:justify-start">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif text-lg font-extrabold text-amber-300">المسبحة الوردية الإلكترونية الكبرى</h3>
          </div>
          <p className="text-xs text-emerald-200">
            مسبحة تعبدية متكاملة لترسيخ الالتزام والذكر المتواصل بالأوراد المعينة والمخصوصة بمزايا حسية وصوتية.
          </p>
        </div>

        {/* Total accumulated badge */}
        <div className="bg-emerald-900/60 border border-emerald-800 p-3 rounded-2xl flex flex-col items-center">
          <span className="text-[9px] text-amber-300 font-bold uppercase">إجمالي الرصيد التراكمي 🏆</span>
          <span className="text-xl font-mono text-white font-black">{totalAccumulated}</span>
          <button 
            onClick={handleClearTotalAccumulated}
            className="text-[8px] text-emerald-300 hover:text-white underline mt-1 cursor-pointer"
          >
            تصفير السجل التراكمي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Parameters, Presets, and Customs configurator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 text-right">
            <h4 className="font-serif font-bold text-stone-850 text-xs border-b border-stone-100 pb-2">
              📿 اخـتيار ورد التسبيـح الحالي
            </h4>

            {/* Dhikr Selector Select dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold">الورد أو الذكر النشط:</label>
              <select
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl outline-none text-xs text-stone-700 cursor-pointer font-sans"
              >
                <optgroup label="أوراد الأذكار الكلاسيكية">
                  {PRESET_DHIKRS.map(p => (
                    <option key={`preset-${p.id}`} value={p.id}>{p.title} ({p.defaultGoal})</option>
                  ))}
                </optgroup>
                {customDhikrs.length > 0 && (
                  <optgroup label="أورادك العبادية المضافة">
                    {customDhikrs.map(p => (
                      <option key={`preset-${p.id}`} value={p.id}>{p.title} ({p.defaultGoal})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Presets Grid quick selector buttons */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DHIKRS.map(p => (
                <button
                  key={`quick-${p.id}`}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer ${
                    activePreset.id === p.id
                      ? 'bg-amber-100 border-amber-300 text-amber-950 font-black'
                      : 'bg-stone-50 border-stone-150 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Custom List delete indicators */}
            {customDhikrs.length > 0 && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <span className="text-[9px] text-stone-400 font-bold block">إدارة أورادك المخصصة:</span>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {customDhikrs.map(p => (
                    <div key={`manage-${p.id}`} className="flex items-center justify-between text-[11px] bg-stone-50 p-2 rounded-lg">
                      <button
                        onClick={() => handleDeleteCustom(p.id, {} as any)}
                        className="text-stone-400 hover:text-red-600 cursor-pointer"
                        title="حذف هذا الورد"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-stone-700">{p.title} ({p.defaultGoal})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show Add Custom Trigger */}
            {!showAddCustom ? (
              <button
                onClick={() => setShowAddCustom(true)}
                className="w-full h-9 bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200 border-dashed rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة ورد أو ذكر مخصص بهدف محدد</span>
              </button>
            ) : (
              <form onSubmit={handleAddCustom} className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-right space-y-3">
                <span className="font-bold text-[10px] text-stone-700 block">✏️ إضافة ورد مخصص</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-stone-400">الاسم المرجعي للذكر:</label>
                    <input
                      type="text"
                      placeholder="نعمة العافية"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full h-8 px-2 border border-stone-200 bg-white rounded-lg text-[10px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-stone-400">العدد المحدد للدورة:</label>
                    <input
                      type="number"
                      value={newGoal}
                      onChange={(e) => setNewGoal(Math.max(1, parseInt(e.target.value, 10)))}
                      className="w-full h-8 px-2 border border-stone-200 bg-white rounded-lg text-[10px]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-stone-400">النص العربي بالتشكيل للتلاوة:</label>
                  <input
                    type="text"
                    placeholder="مَا شَاءَ اللَّهُ لَا قُوَّةَ إِلَّا بِاللَّهِ"
                    value={newArabic}
                    onChange={(e) => setNewArabic(e.target.value)}
                    className="w-full h-8 px-2 border border-stone-200 bg-white rounded-lg text-[10px] text-right text-emerald-900 font-bold"
                    required
                  />
                </div>

                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="h-7 px-3 text-[9px] text-stone-500 rounded bg-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-7 px-3 text-[9px] bg-emerald-900 text-amber-300 font-serif font-black rounded cursor-pointer"
                  >
                    حفظ الورد في مسبحتك
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Feedback controls configuration card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 text-right">
            <h4 className="font-serif font-bold text-stone-850 text-xs border-b border-stone-100 pb-2">
              ⚙️ المؤثرات الحسية والاهتزاز للمسبحة
            </h4>

            {/* Sound Selection pills */}
            <div className="space-y-2">
              <span className="text-[10px] text-stone-400 font-bold block">مستوى الصوت ورنين الهدف:</span>
              <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl">
                <button
                  onClick={() => updateSoundMode('bell')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-all ${
                    soundMode === 'bell' ? 'bg-emerald-900 text-white shadow' : 'text-stone-600 hover:bg-stone-150'
                  }`}
                >
                  🔔 صوت هادئ مهدئ
                </button>
                <button
                  onClick={() => updateSoundMode('click')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-all ${
                    soundMode === 'click' ? 'bg-emerald-900 text-white shadow' : 'text-stone-600 hover:bg-stone-150'
                  }`}
                >
                  🔊 نقرة ميكانيكية
                </button>
                <button
                  onClick={() => updateSoundMode('silent')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-all ${
                    soundMode === 'silent' ? 'bg-emerald-900 text-white shadow' : 'text-stone-600 hover:bg-stone-150'
                  }`}
                >
                  🔕 الوضع الصامت
                </button>
              </div>
            </div>

            {/* Vibration Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  vibrationEnabled ? 'bg-[#4CAF50]' : 'bg-stone-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  vibrationEnabled ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
              <div className="text-right">
                <span className="font-bold text-stone-700 block text-[11px]">اهتزاز بنقرة العداد (Haptic Call)</span>
                <span className="text-[9px] text-stone-400 block">إصدار رجّة خفيفة لتثبيت التركيز باليد دون الحاجة للشاشة.</span>
              </div>
            </div>

            {/* Aesthetic Themes selection list */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold block">طابع ولون المسبحة:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['emerald_gold', 'starry_midnight', 'clay_desert'] as const).map(th => (
                  <button
                    key={`theme-${th}`}
                    onClick={() => setActiveTheme(th)}
                    className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                      activeTheme === th
                        ? 'border-emerald-900 bg-emerald-50 text-emerald-950 font-black'
                        : 'border-stone-150 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {th === 'emerald_gold' ? '🟢 الروضة الشريفة' : th === 'starry_midnight' ? '🔵 الليل الساهر' : '🟤 طين الرضا'}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Primary interactive tapping area (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm text-center flex flex-col justify-between items-center min-h-[480px]">
          
          {/* Top Info display */}
          <div className="w-full space-y-2 select-none">
            <span className="text-[10px] text-stone-400 font-bold tracking-widest block uppercase">الورد الـجاري تلاوته 📿</span>
            <h4 className="font-serif text-base font-extrabold text-[#2E7D32]">{activePreset.title}</h4>
            
            {/* Massive Arabic Supplication text for recitation inspiration */}
            <div className="p-4 bg-stone-50/60 border border-stone-150 rounded-2xl flex items-center justify-center min-h-[80px]">
              <p className="font-serif text-emerald-950 text-lg md:text-xl font-bold leading-normal text-center drop-shadow-sm selection:bg-amber-100">
                {activePreset.arabic}
              </p>
            </div>
          </div>

          {/* Interactive physics-like huge clicker button */}
          <div className="relative my-6 select-none flex items-center justify-center">
            
            {/* Glowing borders themed background */}
            <div className={`absolute w-64 h-64 rounded-full blur-xl opacity-30 animate-pulse ${
              activeTheme === 'emerald_gold' ? 'bg-emerald-500' : activeTheme === 'starry_midnight' ? 'bg-indigo-600' : 'bg-amber-600'
            }`} />

            {/* Circular progress container */}
            <div 
              onClick={handleIncrement}
              className={`w-52 h-52 sm:w-56 sm:h-56 rounded-full border-8 flex flex-col items-center justify-center cursor-pointer select-none relative shadow-xl transition-transform active:scale-95 duration-100 ${
                activeTheme === 'emerald_gold' 
                  ? 'bg-[#022c22] border-amber-400/20 text-white' 
                  : activeTheme === 'starry_midnight'
                    ? 'bg-[#020617] border-indigo-400/20 text-white'
                    : 'bg-[#451a03] border-amber-500/20 text-white'
              }`}
              style={{
                backgroundImage: `conic-gradient(from 0deg, var(--theme-accent) ${progressPercent}%, transparent ${progressPercent}%)`
              }}
            >
              
              {/* Inner ring to hold values */}
              <div className={`mx-3 w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center select-none shadow-inner ${
                activeTheme === 'emerald_gold' ? 'bg-[#002018]' : activeTheme === 'starry_midnight' ? 'bg-[#090d23]' : 'bg-[#3b1202]'
              }`}>
                
                {/* Loops completed above */}
                <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wide">
                  الدورات المنجزة: {loopsCompleted}
                </span>

                {/* Core counter digits */}
                <span className="font-mono text-5xl font-black text-white mt-1.5 select-none tracking-tight">
                  {counter}
                </span>

                {/* Goal indicator below */}
                <span className="text-[10px] text-stone-300 mt-2 font-serif font-bold">
                  الهدف الكلي: {activePreset.defaultGoal} مرة
                </span>

                {/* Quick Touch indicator */}
                <span className="text-[8px] text-emerald-300/60 mt-3 font-sans uppercase animate-bounce animate-duration-3000 block">
                  اضغط كليك للتسبيح 📿
                </span>

              </div>

            </div>

          </div>

          {/* Controls button footer */}
          <div className="w-full flex justify-between items-center border-t border-stone-100 pt-4">
            <button
              onClick={handleResetCurrent}
              className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-xl text-xs font-serif font-black flex items-center gap-1 cursor-pointer transition-colors"
              title="إعادة تدوير العداد للصفر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تهيئة الدورة الجارية 🔄</span>
            </button>

            {/* Manual offset adjuster */}
            <div className="flex items-center gap-1 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
              <button
                onClick={() => {
                  if (counter > 0) {
                    setCounter(c => c - 1);
                    setTotalAccumulated(t => Math.max(0, t - 1));
                  }
                }}
                className="w-6 h-6 rounded bg-white hover:bg-stone-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs"
                title="تراجع خطوة للخلف"
              >
                -١
              </button>
              <span className="text-[10px] text-stone-500 font-bold px-1.5 font-sans">تعديل المقدار</span>
              <button
                onClick={() => {
                  setCounter(c => c + 1);
                  setTotalAccumulated(t => t + 1);
                }}
                className="w-6 h-6 rounded bg-white hover:bg-stone-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs"
                title="أضف خطوة"
              >
                +١
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

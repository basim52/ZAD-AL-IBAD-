import React, { useState, useEffect } from 'react';
import { DailyWork, AmaalState } from './types';
import { DEFAULT_AMAAL } from './data/defaultAmaal';
import AmaalList from './components/AmaalList';
import AmaalDetail from './components/AmaalDetail';
import AmaalForm from './components/AmaalForm';
import StatsDashboard from './components/StatsDashboard';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Award, Bookmark, ShieldCheck, HeartPulse
} from 'lucide-react';

// Helper to safely get local date string YYYY-MM-DD
const getLocalDateString = (d: Date = new Date()) => {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const LOCAL_STORAGE_KEY = 'daily_amaal_app_state_v1';

export default function App() {
  // Global State
  const [works, setWorks] = useState<DailyWork[]>([]);
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [streak, setStreak] = useState<number>(0);
  
  // Navigation & View States
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalDateString());
  const [activeTab, setActiveTab] = useState<'schedule' | 'stats'>('schedule');
  const [selectedWork, setSelectedWork] = useState<DailyWork | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingWork, setEditingWork] = useState<DailyWork | null>(null);

  // Clock state for beautiful header time display
  const [currentTime, setCurrentTime] = useState<string>('');

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

    // Refresh Time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-400/20 border border-amber-400/35 text-amber-400 text-[10px] font-mono tracking-wider font-extrabold px-2 uppercase">
                  Zad Al-Ibaad
                </span>
                <span className="text-emerald-400 text-xs font-semibold">• زادُ العِباد</span>
              </div>
              <h1 className="font-serif text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-white via-stone-100 to-amber-200">
                متابع الأعمال اليومية
              </h1>
              <p className="text-emerald-300/80 text-xs">
                متابعة منظمة للصلوات والتعقيبات والأدعية المسـتحبة وتأصيل وردك العبادي.
              </p>
            </div>

            {/* Live Clock & Badge Stats */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="bg-emerald-900/60 border border-emerald-800 p-2.5 rounded-xl text-left font-mono text-xs flex items-center gap-2 shadow-inner text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
              <div className="bg-amber-400 text-emerald-950 px-3 py-2 rounded-xl shadow-md font-bold text-xs flex items-center gap-1.5">
                <Award className="w-4 h-4 fill-emerald-950" />
                <span>الالتزام: {streak} يوم</span>
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

              <div className="flex-1 sm:flex-initial text-center bg-emerald-900 px-4 py-1.5 rounded-xl border border-emerald-800 min-w-[210px]">
                <div className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase flex items-center justify-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-amber-400" />
                  <span>{selectedDateStr}</span>
                </div>
                <div className="font-serif font-bold text-stone-100 text-xs mt-0.5">
                  {formatArabicDate(selectedDateStr)}
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

          {/* Tab Navigation Switches */}
          <div className="flex gap-2.5 mt-5">
            <button
              id="tab-schedule-btn"
              onClick={() => setActiveTab('schedule')}
              className={`pb-2 pt-1 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
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
              className={`pb-2 pt-1 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-emerald-300/60 hover:text-white'
              }`}
            >
              مؤشرات الالتزام والتقارير
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
            />
          ) : (
            <StatsDashboard 
              works={works} 
              history={history} 
              streak={streak} 
              onImportData={handleImportData}
              onClearAllData={handleClearAllData}
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
    </div>
  );
}

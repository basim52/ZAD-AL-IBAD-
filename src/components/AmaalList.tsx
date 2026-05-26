import React, { useState } from 'react';
import { DailyWork, AmaalType, AmaalTime } from '../types';
import { 
  Plus, Search, Sun, Sunset, Moon, Sparkles, Filter, CheckSquare, ClipboardList, Eye, Calendar
} from 'lucide-react';

interface AmaalListProps {
  works: DailyWork[];
  onToggleComplete: (id: string) => void;
  onSelectWork: (work: DailyWork) => void;
  onOpenAddModal: () => void;
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
  { label: 'دعاء', value: 'دعاء' },
  { label: 'زيارة', value: 'زيارة' },
  { label: 'تعقيب', value: 'تعقيب' },
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
  onOpenAddModal 
}: AmaalListProps) {
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<AmaalTime | 'الكل'>('الكل');
  const [typeFilter, setTypeFilter] = useState<AmaalType | 'الكل'>('الكل');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'غير_منجز' | 'منجز'>('الكل');

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
    </div>
  );
}

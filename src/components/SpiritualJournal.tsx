import React, { useState } from 'react';
import { 
  BookOpen, Calendar, Edit3, Trash2, Search, Plus, Sparkles, AlertCircle, Quote, RefreshCw, Feather
} from 'lucide-react';

export interface JournalEntry {
  id: string;
  date: string;
  category: 'تفكر' | 'مناجاة' | 'عهد' | 'شكر' | 'قرآن' | 'عام';
  title: string;
  content: string;
  createdAt: string;
}

interface SpiritualJournalProps {
  selectedDateStr: string;
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  isCloudSyncing?: boolean;
}

const CATEGORY_STYLES: Record<JournalEntry['category'], { bg: string; text: string; icon: string }> = {
  'تفكر': { bg: 'bg-indigo-50/85', text: 'text-indigo-800', icon: '🧠' },
  'مناجاة': { bg: 'bg-amber-50/85', text: 'text-amber-800', icon: '🤲' },
  'عهد': { bg: 'bg-purple-50/85', text: 'text-purple-800', icon: '🤝' },
  'شكر': { bg: 'bg-emerald-50/85', text: 'text-emerald-800', icon: '🌻' },
  'قرآن': { bg: 'bg-sky-50/85', text: 'text-sky-850', icon: '📖' },
  'عام': { bg: 'bg-stone-105', text: 'text-stone-700', icon: '📝' }
};

const REFLECTION_PROMPTS = [
  "ما الآية أو الدعاء الذي تغلغل في قلبك اليوم ولامس وجدانك؟",
  "كيف تصف خشوعك وتوجهك اللطيف في صلوات الفريضة اليوم؟",
  "نعمة خفية أو ظاهرة شعرت بالامتنان التام للباري عز وجل عليها اليوم؟",
  "عهد روحي قطعته على نفسك اليوم لتجاوز تقصير ما أو لتثبيت خصلة حميدة؟",
  "أثر دعاء اليوم ومناجاتك في هدوء فكرك وسكينة مشاعرك؟"
];

export default function SpiritualJournal({
  selectedDateStr,
  entries,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
  isCloudSyncing = false
}: SpiritualJournalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JournalEntry['category']>('تفكر');
  
  // Form values
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(selectedDateStr);

  // Prompt helper
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);

  const rotatePrompt = () => {
    setCurrentPromptIdx(prev => (prev + 1) % REFLECTION_PROMPTS.length);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      const existing = entries.find(en => en.id === editingId);
      if (existing) {
        onUpdateEntry({
          ...existing,
          title: title.trim(),
          content: content.trim(),
          category: selectedCategory,
          date: entryDate
        });
      }
      setEditingId(null);
    } else {
      const newEntry: JournalEntry = {
        id: `journal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: entryDate,
        category: selectedCategory,
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString()
      };
      onAddEntry(newEntry);
    }

    // Reset Form
    setTitle('');
    setContent('');
    setIsAdding(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedCategory(entry.category);
    setEntryDate(entry.date);
    setIsAdding(true);
  };

  const usePromptAsTitle = (promptText: string) => {
    setTitle(promptText.slice(0, 40) + "...");
    setContent(`إجابتي وتفكري في: "${promptText}"\n\n---\n`);
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      entry.title.toLowerCase().includes(q) || 
      entry.content.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q);
    return matchesSearch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6" id="spiritual-journal">
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white rounded-3xl border border-amber-300/20 shadow-sm text-right">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-end sm:justify-start">
            <Feather className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif text-lg font-extrabold text-amber-300">مفكرة التدوين والخواطر الروحانية</h3>
          </div>
          <p className="text-xs text-emerald-200">
            سجل مذكراتك العبادية وتجلياتك الصادقة ومناجاتك للباري عزّ وجل بخصوصية مطلقة.
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsAdding(prev => !prev);
            setEditingId(null);
            setTitle('');
            setContent('');
            setEntryDate(selectedDateStr);
          }}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-serif font-black text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95 shrink-0"
        >
          {isAdding ? 'إغلاق المفكرة ×' : '📝 تدوين خاطرة عبادية جديدة'}
        </button>
      </div>

      {/* Adding / Editing Devotion Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4 text-right">
          <h4 className="font-serif font-extrabold text-stone-850 text-sm border-b border-stone-100 pb-2">
            {editingId ? ' تعديل تدوينتك العبادية 📝' : '✍️ تدوين خواطر روحانية للمثابرة'}
          </h4>

          {/* Prompt card as an interactive helper */}
          {!editingId && (
            <div className="p-4 bg-amber-50/45 border border-amber-100 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={rotatePrompt}
                  className="text-[10px] text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 animate-spin animate-duration-3000" />
                  <span>توليد سؤال آخر 🔄</span>
                </button>
                <span className="text-[9px] text-amber-900 font-bold">💡 تجليات مقترحة من حملة الإيمان للكتابة</span>
              </div>
              <p className="text-xs text-stone-700 italic font-sans leading-relaxed">
                "{REFLECTION_PROMPTS[currentPromptIdx]}"
              </p>
              <button
                type="button"
                onClick={() => usePromptAsTitle(REFLECTION_PROMPTS[currentPromptIdx])}
                className="text-[9px] px-2.5 py-1 bg-amber-100 hover:bg-amber-150 text-amber-950 font-bold rounded-lg cursor-pointer transition-all"
              >
                ✍️ كتابة خاطرة بناءً على هذا السؤال
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs text-stone-500 font-bold mb-1">نوع التدوينة الروحية:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as JournalEntry['category'])}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white rounded-xl text-xs text-stone-700 outline-none cursor-pointer"
              >
                <option value="تفكر">🧠 تفكر واعتراف بالتقصير</option>
                <option value="مناجاة">🤲 دعاء ومناجاة فردية</option>
                <option value="عهد">🤝 ميثاق وعهد روحي</option>
                <option value="شكر">🌻 شكر وعِرفان النعم</option>
                <option value="قرآن">📖 تدبر آية أو سورة</option>
                <option value="عام">📝 خاطرة روحانية عامة</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs text-stone-500 font-bold mb-1">التاريخ الهجري/الميلادي للتدوين:</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white rounded-xl text-xs text-stone-700 outline-none"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs text-stone-500 font-bold mb-1">عنوان الخاطرة / الحدث:</label>
              <input
                type="text"
                placeholder="مثال: الخشوع بصلاة المغرب، عهد الصدق، تدبر سورة النور..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 pr-3 text-xs bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white rounded-xl outline-none"
                required
              />
            </div>
          </div>

          {/* Devotional content text */}
          <div>
            <label className="block text-xs text-stone-500 font-bold mb-1">تفريغ الخاطرة ومشاعر الروح والوجدان:</label>
            <textarea
              rows={6}
              placeholder="اكتب هنا بصلة لرب العالمين ما يمليه عليك الصدق الوجداني..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 text-xs font-sans bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white rounded-2xl outline-none leading-relaxed text-right"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-150 text-stone-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-900 hover:bg-emerald-850 text-amber-300 rounded-xl text-xs font-serif font-black flex items-center gap-1 cursor-pointer transition-all shadow"
            >
              <span>{editingId ? '💾 حفظ التعديلات' : '✅ حفظ في سجل الخواطر السحابي'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search inside journal */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="البحث في خواطرك السابقة بكلمة مفتاحية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pr-9 pl-4 text-xs bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-amber-400 focus:bg-white transition-all text-right"
          />
        </div>
        
        <div className="text-[10px] text-stone-500 font-bold">
          الإجمالي: <strong className="font-mono text-stone-800">{filteredEntries.length}</strong> تدوينات
        </div>
      </div>

      {/* Journal entries timeline */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl space-y-3">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="font-serif font-bold text-stone-700">دفتر الخواطر الروحانية خالٍ حالياً</h4>
            <p className="text-stone-400 text-xs max-w-sm mx-auto">
              لم تقم بتدوين خواطر بعد، التدوين الروحي يعزز الطمأنينة ويساعدك على رصد استجابة قلبك للمستحبات التعبدية.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-4 py-1.5 bg-emerald-50 text-[#2E7D32] hover:bg-emerald-100 text-[11px] font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ابدأ تدوين خاطرة الآن</span>
            </button>
          </div>
        ) : (
          <div className="relative border-r border-stone-200 pr-4 sm:pr-6 space-y-6">
            {filteredEntries.map((entry) => {
              const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES['عام'];
              
              return (
                <div key={entry.id} className="relative group text-right">
                  {/* Circle locator on vertical timeline */}
                  <div className={`absolute -right-[23px] sm:-right-[31px] top-6 w-5 h-5 rounded-full border-4 border-stone-50 flex items-center justify-center text-xs select-none shadow-sm ${style.bg} ${style.text}`}>
                    <span className="text-[10px]">{style.icon}</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 hover:border-emerald-950/20 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold ${style.bg} ${style.text}`}>
                          {entry.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold">
                          <Calendar className="w-3 h-3" />
                          <span className="font-mono">{entry.date}</span>
                        </div>
                      </div>

                      {/* Action tools */}
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-550 hover:text-[#2E7D32] transition-colors cursor-pointer"
                          title="تعديل الخاطرة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه الخاطرة الروحية نهائياً؟')) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="p-1 hover:bg-stone-100 rounded text-stone-550 hover:text-red-700 transition-colors cursor-pointer"
                          title="حذف الخاطرة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-serif font-extrabold text-stone-850 text-sm sm:text-base">
                        {entry.title}
                      </h4>
                      <p className="text-stone-700 text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-line tracking-wide bg-[#FBF9F4]/40 p-3 rounded-xl border border-stone-100 shadow-inner">
                        {entry.content}
                      </p>
                    </div>

                    <div className="text-[9px] text-stone-400 text-left font-mono italic">
                      تم الحفظ في: {new Date(entry.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}{' '}
                      {new Date(entry.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

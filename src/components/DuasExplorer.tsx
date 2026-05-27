import React, { useState } from 'react';
import { Book, Bookmark, Check, ChevronRight, Type, Flame, Heart, Sparkles, RotateCcw } from 'lucide-react';

interface DuaItem {
  id: string;
  title: string;
  category: 'أدعية' | 'زيارات' | 'مناجاات';
  virtue: string;
  recommendedTime: string;
  lines: string[];
  repeatingSections?: { index: number; count: number; current: number; text: string }[];
}

const DUAS_DATABASE: DuaItem[] = [
  {
    id: 'dua-kumail',
    title: 'دعاء كميل بن زياد الروحاني',
    category: 'أدعية',
    recommendedTime: 'ليلة الجمعة المباركة أو في منتصف شعبان',
    virtue: 'كفاية شر الأعداء، فتح أبواب الرزق، وغفران الذنوب المستعصية.',
    lines: [
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ،',
      'وَبِقُوَّتِكَ الَّتِي قَهَرْتَ بِهَا كُلَّ شَيْءٍ، وَخَضَعَ لَهَا كُلُّ شَيْءٍ، وَذَلَّ لَهَا كُلُّ شَيْءٍ،',
      'وَبِجَبَرُوتِكَ الَّتِي غَلَبْتَ بِهَا كُلَّ شَيْءٍ،',
      'وَبِعِزَّتِكَ الَّتِي لا يَقُومُ لَهَا شَيْءٌ، وَبِعَظَمَتِكَ الَّتِي مَلأَتْ كُلَّ شَيْءٍ،',
      'وَبِسُلْطَانِكَ الَّذِي عَلا كُلَّ شَيْءٍ،',
      'وَبِوَجْهِكَ الْبَاقِي بَعْدَ فَنَاءِ كُلِّ شَيْءٍ،',
      'وَبِأَسْمَائِكَ الَّتِي مَلأَتْ أَرْكَانَ كُلِّ شَيْءٍ،',
      'وَبِعِلْمِكَ الَّذِي أَحَاطَ بِكُلِّ شَيْءٍ،',
      'وَبِنُورِ وَجْهِكَ الَّذِي أَضَاءَ لَهُ كُلُّ شَيْءٍ،',
      'يَا نُورُ يَا قُدُّوسُ، يَا أَوَّلَ الأَوَّلِينَ، وَيَا آخِرَ الآخِرِينَ.',
      'اللَّهُمَّ اغْفِرْ لِيَ الذُّنُوبَ الَّتِي تَهْتِكُ الْعِصَمَ،',
      'اللَّهُمَّ اغْفِرْ لِيَ الذُّنُوبَ الَّتِي تُنْزِلُ النِّقَمَ،',
      'اللَّهُمَّ اغْفِرْ لِيَ الذُّنُوبَ الَّتِي تُغَيِّرُ النِّعَمَ،',
      'اللَّهُمَّ اغْفِرْ لِيَ الذُّنُوبَ الَّتِي تَحْبِسُ الدُّعَاءَ،',
      'اللَّهُمَّ اغْفِرْ لِيَ الذُّنُوبَ الَّتِي تُنْزِلُ الْبَلاءَ...'
    ]
  },
  {
    id: 'dua-ahd',
    title: 'دعاء العهد (تجديد الولاء)',
    category: 'أدعية',
    recommendedTime: 'صباح كل يوم بعد صلاة الفجر',
    virtue: 'من دعا به أربعين صباحاً كُتب من أنصار الإمام المهدي (عج) ورزق رؤيته.',
    lines: [
      'اللَّهُمَّ رَبَّ النُّورِ الْعَظِيمِ، وَرَبَّ الْكُرْسِيِّ الرَّفِيعِ،',
      'وَرَبَّ الْبَحْرِ الْمَسْجُورِ، وَمُنْزِلَ التَّوْرَاةِ وَالإِنْجِيلِ وَالزَّبُورِ،',
      'وَرَبَّ الظِّلِّ وَالْحَرُورِ، وَمُنْزِلَ الْقُرْآنِ الْعَظِيمِ، وَرَبَّ الْمَلائِكَةِ الْمُقَرَّبِينَ وَالأَنْبِيَاءِ وَالْمُرْسَلِينَ.',
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِوَجْهِكَ الْكَرِيمِ، وَبِنُورِ وَجْهِكَ الْمُنِيرِ، وَمُلْكِكَ الْقَدِيمِ،',
      'يَا حَيُّ يَا قَيُّومُ، أَسْأَلُكَ بِاسْمِكَ الَّذِي أَشْرَقَتْ بِهِ السَّمَاوَاتُ وَالأَرَضُونَ،',
      'وَبِاسْمِكَ الَّذِي يَصْلَحُ بِهِ الأَوَّلُونَ وَالآخِرُونَ،',
      'يَا حَيّاً قَبْلَ كُلِّ حَيٍّ، وَيَا حَيّاً بَعْدَ كُلِّ حَيٍّ، وَيَا حَيّاً حِينَ لا حَيَّ،',
      'يَا مُحْيِيَ الْمَوْتَى وَمُمِيتَ الأَحْيَاءِ، يَا حَيُّ لا إِلَهَ إِلا أَنْتَ.',
      'اللَّهُمَّ بَلِّغْ مَوْلانَا الإِمَامَ الْهَادِيَ الْمَهْدِيَّ الْقَائِمَ بِأَمْرِكَ...'
    ]
  },
  {
    id: 'ziyarat-ashura',
    title: 'زيارة عاشوراء (مختصر تلاوة وذكر)',
    category: 'زيارات',
    recommendedTime: 'كل يوم لتيسير الحوائج وغفران الخطايا',
    virtue: 'تفجّر البركات، نماء الرزق الحلال، وقبول الشفاعة والسكينة في الآخرة.',
    lines: [
      'السَّلامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ، السَّلامُ عَلَيْكَ يَا ابْنَ رَسُولِ اللَّهِ،',
      'السَّلامُ عَلَيْكَ يَا ابْنَ أَمِيرِ الْمُؤْمِنِينَ وَابْنَ سَيِّدِ الْوَصِيِّينَ،',
      'السَّلامُ عَلَيْكَ يَا ابْنَ فَاطِمَةَ سَيِّدَةِ نِسَاءِ الْعَالَمِينَ،',
      'السَّلامُ عَلَيْكَ يَا ثَارَ اللَّهِ وَابْنَ ثَارِهِ وَالْوِتْرَ الْمَوْتُورَ،',
      'السَّلامُ عَلَيْكَ وَعَلَى الأَرْوَاحِ الَّتِي حَلَّتْ بِفِنَائِكَ وَأَنَاخَتْ بِرَحْلِكَ،',
      'عَلَيْكُمْ مِنِّي جَمِيعاً سَلامُ اللَّهِ أَبَداً مَا بَقِيتُ وَبَقِيَ اللَّيْلُ وَالنَّهَارُ.',
      'يَا أَبَا عَبْدِ اللَّهِ، لَقَدْ عَظُمَتِ الرَّزِيَّةُ وَجَلَّتْ وَعَظُمَتِ الْمُصِيبَةُ بِكَ عَلَيْنَا وَعَلَى جَمِيعِ أَهْلِ الإِسْلامِ...'
    ],
    repeatingSections: [
      { index: 100, count: 100, current: 0, text: 'اللَّهُمَّ الْعَنْ أَوَّلَ ظَالِمٍ ظَلَمَ حَقَّ مُحَمَّدٍ وَآلِ مُحَمَّدٍ...' },
      { index: 101, count: 100, current: 0, text: 'السَّلامُ عَلَى الْحُسَيْنِ وَعَلَى عَلِيِّ بْنِ الْحُسَيْنِ وَعَلَى أَوْلادِ الْحُسَيْنِ...' }
    ]
  },
  {
    id: 'munajat-ali',
    title: 'مناجاة أمير المؤمنين علي (ع) في الكوفة',
    category: 'مناجاات',
    recommendedTime: 'الأسحار، الأعوام المباركة، والاعتكاف',
    virtue: 'بث الخشوع وتفريج الهموم وتقوية الارتباط الوجداني بالخالق سبحانه.',
    lines: [
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الأَمَانَ يَوْمَ لا يَنْفَعُ مَالٌ وَلا بَنُونَ إِلا مَنْ أَتَى اللَّهَ بِقَلْبٍ سَلِيمٍ،',
      'وَأَسْأَلُكَ الأَمَانَ يَوْمَ يَعَضُّ الظَّالِمُ عَلَى يَدَيْهِ يَقُولُ يَا لَيْتَنِي اتَّخَذْتُ مَعَ الرَّسُولِ سَبِيلاً،',
      'وَأَسْأَلُكَ الأَمَانَ يَوْمَ يُعْرَفُ الْمُجْرِمُونَ بِسِيمَاهُمْ فَيُؤْخَذُ بِالنَّوَاصِي وَالأَقْدَامِ،',
      'وَأَسْأَلُكَ الأَمَانَ يَوْمَ لا يَجْزِي وَالِدٌ عَنْ وَلَدِهِ وَلا مَوْلُودٌ هُوَ جَازٍ عَنْ وَالِدِهِ شَيْئاً إِنَّ وَعْدَ اللَّهِ حَقٌّ.',
      'مَوْلايَ يَا مَوْلايَ، أَنْتَ الْمَوْلَى وَأَنَا الْعَبْدُ، وَهَلْ يَرْحَمُ الْعَبْدَ إِلا الْمَوْلَى؟',
      'مَوْلايَ يَا مَوْلايَ، أَنْتَ الْمَالِكُ وَأَنَا الْمَمْلُوكُ، وَهَلْ يَرْحَمُ الْمَمْلُوكَ إِلا الْمَالِكُ؟',
      'مَوْلايَ يَا مَوْلايَ، أَنْتَ الْعَزِيزُ وَأَنَا الذَّلِيلُ، وَهَلْ يَرْحَمُ الذَّلِيلَ إِلا الْعَزِيزُ؟'
    ]
  },
  {
    id: 'dua-tawassul',
    title: 'دعاء التوسل بالأئمة الأطهار',
    category: 'أدعية',
    recommendedTime: 'ليلة الأربعاء من كل أسبوع لقضاء الحاجات',
    virtue: 'التوجّه بحرمة الأئمة المعصومين الطاهرين لقضاء سائر الحاجات المستعصية والرزق.',
    lines: [
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ وَأَتَوَجَّهُ إِلَيْكَ بِنَبِيِّكَ نَبِيِّ الرَّحْمَةِ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَآلِهِ،',
      'يَا أَبَا الْقَاسِمِ، يَا رَسُولَ اللَّهِ، يَا إِمَامَ الرَّحْمَةِ، يَا سَيِّدَنَا وَمَوْلانَا،',
      'إِنَّا تَوَجَّهْنَا وَاسْتَشْفَعْنَا وَتَوَسَّلْنَا بِكَ إِلَى اللَّهِ وَقَدَّمْنَاكَ بَيْنَ يَدَيْ حَاجَاتِنَا، يَا وَجِيهاً عِنْدَ اللَّهِ اشْفَعْ لَنَا عِنْدَ اللَّهِ.',
      'يَا أَبَا الْحَسَنِ، يَا أَمِيرَ الْمُؤْمِنِينَ، يَا عَلِيَّ بْنَ أَبِي طَالِبٍ، يَا حُجَّةَ اللَّهِ عَلَى خَلْقِهِ، يَا سَيِّدَنَا وَمَوْلانَا،',
      'إِنَّا تَوَجَّهْنَا وَاسْتَشْفَعْنَا وَتَوَسَّلْنَا بِكَ إِلَى اللَّهِ وَقَدَّمْنَاكَ بَيْنَ يَدَيْ حَاجَاتِنَا، يَا وَجِيهاً عِنْدَ اللَّهِ اشْفَعْ لَنَا عِنْدَ اللَّهِ.'
    ]
  }
];

export default function DuasExplorer() {
  const [selectedDua, setSelectedDua] = useState<DuaItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'أدعية' | 'زيارات' | 'مناجاات'>('all');
  const [fontSize, setFontSize] = useState<number>(18); // default size px
  
  // Repeating list counters for sections like Ziyarat Ashura
  const [repCounters, setRepCounters] = useState<Record<string, number>>({});

  const handleIncrementRep = (key: string, max: number) => {
    const current = repCounters[key] || 0;
    if (current < max) {
      setRepCounters({ ...repCounters, [key]: current + 1 });
    }
  };

  const handleResetRep = (key: string) => {
    setRepCounters({ ...repCounters, [key]: 0 });
  };

  const filteredDuas = DUAS_DATABASE.filter(dua => {
    if (activeTab === 'all') return true;
    return dua.category === activeTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6" id="duas-explorer-container">
      {/* If reading a specific Dua */}
      {selectedDua ? (
        <div className="space-y-6 animate-fade-in text-right">
          {/* Back button and header */}
          <div className="flex justify-between items-center bg-stone-100 p-3 rounded-2xl border border-stone-200">
            <button
              onClick={() => {
                setSelectedDua(null);
                setRepCounters({});
              }}
              className="px-3 py-1.5 bg-emerald-950 text-white hover:bg-emerald-900 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
              <span>العودة للمكتبة</span>
            </button>

            <span className="text-[10px] sm:text-xs font-serif font-black text-amber-900 bg-amber-100 hover:bg-amber-150 px-3 py-1 rounded-lg">
              {selectedDua.category}
            </span>

            {/* Font controllers */}
            <div className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-stone-500" />
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-7 h-7 bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold font-mono cursor-pointer"
                title="تصغير الخط"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className="w-7 h-7 bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold font-mono cursor-pointer"
                title="تكبير الخط"
              >
                A+
              </button>
            </div>
          </div>

          {/* Virtues summary card in Reader screen */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/45 rounded-2xl space-y-1">
            <h4 className="text-xs font-bold text-amber-955 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
              <span>فضل وثواب التلاوة:</span>
            </h4>
            <p className="text-[11px] text-stone-600 leading-normal">
              {selectedDua.virtue}
            </p>
          </div>

          {/* Lines & Text Reader board */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-md space-y-4 min-h-[300px]">
            <h3 className="font-serif font-extrabold text-lg md:text-xl text-emerald-950 text-center pb-4 border-b border-stone-100">
              {selectedDua.title}
            </h3>

            {/* Actual Dua Texts */}
            <div className="space-y-6 pt-4 text-center select-none leading-loose">
              {selectedDua.lines.map((line, idx) => (
                <p 
                  key={idx} 
                  className="font-serif font-medium hover:text-emerald-800 transition-colors cursor-text"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Repeating sections sub counters (e.g. Ziyarat Ashura Repeating curses) */}
            {selectedDua.repeatingSections && selectedDua.repeatingSections.length > 0 && (
              <div className="pt-6 mt-6 border-t border-stone-200 space-y-4 text-right">
                <h4 className="font-serif font-black text-xs md:text-sm text-amber-950 flex items-center gap-1">
                  <span>📿</span>
                  <span>أذكار وفقرات مريرة مستحبة التكرار (١٠٠ مرة):</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDua.repeatingSections.map((sec, sidx) => {
                    const key = `${selectedDua.id}_rep_${sidx}`;
                    const curCount = repCounters[key] || 0;
                    return (
                      <div 
                        key={sidx}
                        className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col justify-between gap-3 text-right"
                      >
                        <p className="text-xs font-serif font-bold text-emerald-950 leading-relaxed">
                          "{sec.text}"
                        </p>
                        
                        <div className="flex items-center justify-between gap-2 border-t border-stone-200/50 pt-2.5">
                          <span className="text-[10px] text-stone-400 font-bold font-mono">العداد المنجز: {curCount} / {sec.count}</span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleResetRep(key)}
                              className="p-1 hover:bg-stone-200 text-stone-500 rounded border border-transparent hover:border-stone-200 cursor-pointer text-xs"
                              title="إعادة تصفير العداد"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleIncrementRep(key, sec.count)}
                              disabled={curCount >= sec.count}
                              className="px-3 py-1 bg-emerald-950 text-white disabled:opacity-50 hover:bg-emerald-900 rounded-lg text-xs font-bold cursor-pointer transition-all"
                            >
                              +١ تكرار
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Informative advice */}
          <p className="text-[10px] text-stone-400 text-center leading-normal">
            تلاوة الأدعية بنية القرب الإلهي والتعلق الوجداني تسكب راحة غامرة وتطرد وساوس القلق. تقبّل الله منكم.
          </p>
        </div>
      ) : (
        /* Library main selector page */
        <div className="space-y-6">
          {/* Text and Introduction card */}
          <div className="text-right space-y-1">
            <h2 className="text-xl md:text-2xl font-serif font-extrabold text-emerald-950 flex items-center gap-2">
              <span>🕊️</span>
              <span>مستكشف الأدعية والمناجاة الكبرى</span>
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              ادخل لمشاهدة وتلاوة أشهر الأدعية المأثورة والزيارات الخاصة الروحانية وقراءتها بسلاسة وهدوء وبأحجام خط منوعة ومناسبة لجميع الأجهزة.
            </p>
          </div>

          {/* Categorisation filter pills */}
          <div className="flex flex-wrap gap-2 justify-start">
            {[
              { id: 'all', title: 'الكل' },
              { id: 'أدعية', title: 'الأدعية الكبرى 🤲' },
              { id: 'زيارات', title: 'زيارات مباركة 🕊️' },
              { id: 'مناجاات', title: 'مناجاة وخواطر 🌟' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-950 text-white'
                    : 'bg-white hover:bg-stone-55 text-stone-600 border border-stone-200'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Grid list display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDuas.map(dua => (
              <div 
                key={dua.id}
                className="bg-white border border-stone-200 rounded-2xl p-4.5 hover:border-emerald-300 transition-all flex flex-col justify-between gap-4 card-item"
              >
                <div className="space-y-2 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-sans font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
                      {dua.category}
                    </span>
                    <span className="text-[10px] text-stone-400 font-bold">{dua.recommendedTime}</span>
                  </div>
                  
                  <h4 className="font-serif font-extrabold text-sm md:text-base text-stone-900 group-hover:text-emerald-800">
                    {dua.title}
                  </h4>
                  
                  <p className="text-[11px] text-stone-500 leading-normal font-sans">
                    {dua.virtue}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDua(dua)}
                  className="w-full py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-inner transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Book className="w-3.5 h-3.5" />
                  <span>افتح لقراءة وتلاوة النص كامل</span>
                </button>
              </div>
            ))}
          </div>

          {/* Guidance tip and quote */}
          <div className="p-4 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-2xl space-y-2 text-right">
            <h5 className="font-serif font-bold text-xs text-emerald-950 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-200" />
              <span>فضل ومحبوبية الدعاء</span>
            </h5>
            <p className="text-[11px] text-stone-600 leading-normal pr-1">
              "وقال ربكم ادعوني أستجب لكم" - الدعاء وسيلة العبد المباشرة ودرعه الروحانية لمخاطبة جلال الرب والارتقاء بالنفس المجهدة والانسجام مع طاقة النقاء في هذا الوجود الفسيح.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

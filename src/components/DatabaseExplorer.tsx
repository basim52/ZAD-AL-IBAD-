import React, { useState } from 'react';
import { DailyWork } from '../types';
import { MONTHLY_RAJAB_AMAAL } from '../data/monthlyRajabAmaal';
import { MONTHLY_SHABAN_AMAAL } from '../data/monthlyShabanAmaal';
import { MONTHLY_RAMADAN_AMAAL } from '../data/monthlyRamadanAmaal';
import { 
  Database, Download, Upload, Trash2, Code, Terminal, Layers, CheckCircle, AlertTriangle,
  Moon, Sun, Search, Copy, BookOpen, Sparkles, SlidersHorizontal, ArrowLeftRight, Bell
} from 'lucide-react';

interface DatabaseExplorerProps {
  works: DailyWork[];
  history: Record<string, string[]>;
  onImportData: (importedWorks: DailyWork[], importedHistory: Record<string, string[]>) => void;
  onClearAllData: () => void;
}

export default function DatabaseExplorer({ 
  works, 
  history, 
  onImportData, 
  onClearAllData 
}: DatabaseExplorerProps) {
  const [activeTab, setActiveTab] = useState<'entity' | 'dao' | 'appdatabase' | 'viewmodel' | 'compose' | 'activity' | 'utils' | 'sqlite' | 'rajab-amaal' | 'backup' | 'notifications'>('entity');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedComposeSubTab, setSelectedComposeSubTab] = useState<'list' | 'summary'>('list');
  const [selectedUtilsSubTab, setSelectedUtilsSubTab] = useState<'utils' | 'export'>('utils');

  // Rajab, Shaban & Ramadan simulated database browser states
  const [selectedMonth, setSelectedMonth] = useState<'رجب' | 'شعبان' | 'رمضان'>('رجب');
  const [rajabQuery, setRajabQuery] = useState('');
  const [rajabTypeFilter, setRajabTypeFilter] = useState<'all' | 'صلاة' | 'دعاء' | 'ذكر' | 'صيام' | 'غسل' | 'زيارة'>('all');
  const [rajabDayTypeFilter, setRajabDayTypeFilter] = useState<'all' | 'يوم' | 'ليلة'>('all');
  const [rajabDayFilter, setRajabDayFilter] = useState<number | 'all'>('all');
  const [expandedRajabItem, setExpandedRajabItem] = useState<number | null>(null);
  const [showKotlinSeed, setShowKotlinSeed] = useState(false);

  // Download Backup JSON
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ works, history }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `daily_amaal_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportError(null);
    setImportSuccess(false);

    fileReader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error('ملف غير صالح');
        
        const parsed = JSON.parse(result);
        
        // Validate Structure
        if (!parsed || typeof parsed !== 'object') throw new Error('بنية ملف النسخ الاحتياطي غير متوافقة');
        if (!Array.isArray(parsed.works)) throw new Error('قائمة الأعمال العبادية مفقودة أو تالفة');
        if (!parsed.history || typeof parsed.history !== 'object') throw new Error('سجل الإنجاز المرفق غير صالح');

        // Simple item validation
        const validatedWorks = parsed.works.filter((w: any) => {
          return w && typeof w === 'object' && typeof w.title === 'string' && typeof w.id === 'string';
        }) as DailyWork[];

        if (validatedWorks.length === 0) {
          throw new Error('لا توجد أعمال صالحة للاستيراد في الملف.');
        }

        onImportData(validatedWorks, parsed.history);
        setImportSuccess(true);
      } catch (err: any) {
        setImportError(err.message || 'فشل في قراءة ملف JSON أو تحليله بشكل صحيح.');
      }
    };
    fileReader.readAsText(files[0]);
  };

  const copyTextToClipboard = (tag: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 2000);
  };

  // Raw SQLite code preview representation
  const sqliteSchemaText = `CREATE TABLE IF NOT EXISTS daily_works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,            -- اسم العمل
    type TEXT NOT NULL,             -- صلاة، دعاء، زيارة، تعقيب، عام
    time TEXT NOT NULL,             -- الفجر، الظهر، العصر، المغرب، العشاء، الليل، الصباح
    description TEXT NOT NULL,      -- نص مختصر أو كيفية الأداء
    is_completed INTEGER NOT NULL DEFAULT 0, -- حالة الإنجاز (0 أو 1)
    content TEXT,                   -- نص التلاوة الكامل (اختياري)
    is_custom INTEGER DEFAULT 0,    -- هل مضاف من المستخدم
    order_index INTEGER DEFAULT 0,  -- الترتيب داخل المجموعة
    occasion TEXT DEFAULT ''        -- مناسبة مرتبطة (اختياري)
);

CREATE TABLE IF NOT EXISTS completion_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,             -- صيغة YYYY-MM-DD
    work_id TEXT NOT NULL,          -- معرف العمل المستهدف
    FOREIGN KEY(work_id) REFERENCES daily_works(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monthly_works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,            -- الشهر: رجب، شعبان، رمضان
    day_type TEXT NOT NULL,         -- نوع اليوم: يوم، ليلة
    day_number INTEGER NOT NULL,    -- رقم اليوم في الشهر (1-30)
    title TEXT NOT NULL,            -- عنوان العمل
    work_type TEXT NOT NULL,        -- صلاة، دعاء، ذكر، صيام، غسل، زيارة
    how_to TEXT NOT NULL,           -- كيفية الأداء والركعات
    virtue TEXT NOT NULL,           -- ثواب العمل وفضله
    full_text TEXT DEFAULT '',      -- النص الكامل للدعاء
    notes TEXT DEFAULT ''           -- ملاحظات إضافية
);

CREATE TABLE IF NOT EXISTS hadiths (
    day_number INTEGER PRIMARY KEY, -- رقم اليوم في السنة (1-360)
    text TEXT NOT NULL,             -- النص الشريف للحديث
    source TEXT NOT NULL,           -- السند أو قائل الحديث
    book TEXT NOT NULL,             -- الكتاب المستخلص منه
    category TEXT NOT NULL          -- التبويب السلوكي / الأخلاقي
);`;

  const kotlinDbEntityText = `package com.example.dailyamaal.data.local.entity

import androidx.room.*

@Entity(tableName = "daily_works")
data class DailyWorkEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "type") val type: String,
    @ColumnInfo(name = "time") val time: String,
    @ColumnInfo(name = "description") val description: String,
    @ColumnInfo(name = "full_text") val fullText: String = "", // ✅ النص الكامل
    @ColumnInfo(name = "is_completed") val isCompleted: Boolean = false,
    @ColumnInfo(name = "order_index") val orderIndex: Int = 0, // الترتيب داخل المجموعة
    @ColumnInfo(name = "occasion") val occasion: String = "" // مناسبة مرتبطة (اختياري)
)`;

  const kotlinHadithEntityText = `package com.example.dailyamaal.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "hadiths")
data class HadithEntity(
    @PrimaryKey
    @ColumnInfo(name = "day_number") val dayNumber: Int, // رقم اليوم في السنة (1-360)
    
    @ColumnInfo(name = "text") val text: String,        // النص الشريف للحديث
    @ColumnInfo(name = "source") val source: String,    // اسم قائل أو ناقل الحديث
    @ColumnInfo(name = "book") val book: String,        // الكتاب المستخرج منه
    @ColumnInfo(name = "category") val category: String // التبويب الأخلاقي / السلوكي
)`;

  const kotlinHadithSeedText = `package com.example.dailyamaal.data.local.utils

import com.example.dailyamaal.data.local.entity.HadithEntity

fun getFirst30Hadiths(): List<HadithEntity> = listOf(
    // ========== 1 ==========
    HadithEntity(dayNumber = 1,
        text = "أفضل العبادة الصمت وانتظار الفرج",
        source = "رسول الله صلى الله عليه وآله",
        book = "بحار الأنوار - ج71",
        category = "أخلاق"),
    
    // ========== 2 ==========
    HadithEntity(dayNumber = 2,
        text = "من تواضع لله رفعه الله، ومن تكبر وضعه الله",
        source = "الإمام الصادق عليه السلام",
        book = "الكافي - ج2",
        category = "أخلاق"),
    
    // ========== 3 ==========
    HadithEntity(dayNumber = 3,
        text = "حسن الخلق يذيب الخطايا كما تذيب الشمس الجليد",
        source = "الإمام الكاظم عليه السلام",
        book = "بحار الأنوار - ج71",
        category = "أخلاق"),
    
    // ========== 4 ==========
    HadithEntity(dayNumber = 4,
        text = "لا حسب كالتواضع، ولا شرف كالعلم",
        source = "الإمام علي عليه السلام",
        book = "غرر الحكم ودرر الكلم",
        category = "أخلاق"),
    
    // ========== 5 ==========
    HadithEntity(dayNumber = 5,
        text = "من عامل الناس فلم يظلمهم، وحدثهم فلم يكذبهم، ووعدهم فلم يخلفهم، فهو ممن كملت مروءته وظهرت عدالته",
        source = "الإمام الصادق عليه السلام",
        book = "الكافي - ج2",
        category = "أخلاق"),
    
    // ========== 6 ==========
    HadithEntity(dayNumber = 6,
        text = "صلاة الليل تزيد في الرزق، وتحسن الوجه، وتدفع البلايا",
        source = "الإمام الصادق عليه السلام",
        book = "ثواب الأعمال",
        category = "عبادة"),
    
    // ========== 7 ==========
    HadithEntity(dayNumber = 7,
        text = "ما من شيء أحب إلى الله من الصلاة، فلا تلهينكم أمور الدنيا عن أوقاتها",
        source = "الإمام الباقر عليه السلام",
        book = "الكافي - ج3",
        category = "عبادة"),
    
    // ========== 8 ==========
    HadithEntity(dayNumber = 8,
        text = "الدعاء سلاح المؤمن، وعمود الدين، ونور السماوات والأرض",
        source = "الإمام الصادق عليه السلام",
        book = "الكافي - ج2",
        category = "عبادة"),
    
    // ========== 9 ==========
    HadithEntity(dayNumber = 9,
        text = "من أتى المسجد فأحسن الوضوء وصلى ركعتين دخل الجنة",
        source = "رسول الله صلى الله عليه وآله",
        book = "بحار الأنوار - ج80",
        category = "عبادة"),
    
    // ========== 10 ==========
    HadithEntity(dayNumber = 10,
        text = "الصوم جنة من النار",
        source = "رسول الله صلى الله عليه وآله",
        book = "الكافي - ج4",
        category = "عبادة"),
    
    // ========== 11 ==========
    HadithEntity(dayNumber = 11,
        text = "العلم نور يقذفه الله في قلب من يشاء",
        source = "الإمام الصادق عليه السلام",
        book = "بحار الأنوار - ج1",
        category = "علم"),
    
    // ========== 12 ==========
    HadithEntity(dayNumber = 12,
        text = "اطلبوا العلم ولو في الصين، فإنطلب العلم فريضة على كل مسلم",
        source = "رسول الله صلى الله عليه وآله",
        book = "الكافي - ج1",
        category = "علم"),
    
    // ========== 13 ==========
    HadithEntity(dayNumber = 13,
        text = "العلماء ورثة الأنبياء",
        source = "رسول الله صلى الله عليه وآله",
        book = "الكافي - ج1",
        category = "علم"),
    
    // ========== 14 ==========
    HadithEntity(dayNumber = 14,
        text = "من تعلم العلم ليماري به السفهاء، أو يباهي به العلماء، أو يصرف وجوه الناس إليه، فليتبوأ مقعده من النار",
        source = "الإمام الصادق عليه السلام",
        book = "الكافي - ج1",
        category = "علم"),
    
    // ========== 15 ==========
    HadithEntity(dayNumber = 15,
        text = "الحكمة ضالة المؤمن، فحيث وجدها فهو أحق بها",
        source = "الإمام علي عليه السلام",
        book = "نهج البلاغة - الحكمة 80",
        category = "علم"),
    
    // ========== 16 ==========
    HadithEntity(dayNumber = 16,
        text = "من أصبح ولم يهتم بأمور المسلمين فليس بمسلم",
        source = "رسول الله صلى الله عليه وآله",
        book = "الكافي - ج2",
        category = "اجتماع"),
    
    // ========== 17 ==========
    HadithEntity(dayNumber = 17,
        text = "خير الناس من نفع الناس",
        source = "الإمام الصادق عليه السلام",
        book = "تحف العقول",
        category = "اجتماع"),
    
    // ========== 18 ==========
    HadithEntity(dayNumber = 18,
        text = "من أحب أن يكون من خيار الناس فليتق الله وليؤد الأمانة",
        source = "الإمام علي عليه السلام",
        book = "غرر الحكم",
        category = "اجتماع"),
    
    // ========== 19 ==========
    HadithEntity(dayNumber = 19,
        text = "المؤمن للمؤمن كالبنيان يشد بعضه بعضاً",
        source = "رسول الله صلى الله عليه وآله",
        book = "بحار الأنوار - ج74",
        category = "اجتماع"),
    
    // ========== 20 ==========
    HadithEntity(dayNumber = 20,
        text = "قولوا للناس حسناً، فإن الله يحب اللين والرفق",
        source = "الإمام الباقر عليه السلام",
        book = "الكافي - ج2",
        category = "اجتماع"),
    
    // ========== 21 ==========
    HadithEntity(dayNumber = 21,
        text = "الاستغفار يزيد في الرزق",
        source = "الإمام علي عليه السلام",
        book = "نهج البلاغة",
        category = "رزق"),
    
    // ========== 22 ==========
    HadithEntity(dayNumber = 22,
        text = "من رضي بما قسم الله له استغنى",
        source = "الإمام الصادق عليه السلام",
        book = "الكافي - ج2",
        category = "رزق"),
    
    // ========== 23 ==========
    HadithEntity(dayNumber = 23,
        text = "طلب الحلال فريضة على كل مسلم ومسلمة",
        source = "رسول الله صلى الله عليه وآله",
        book = "بحار الأنوار - ج103",
        category = "رزق"),
    
    // ========== 24 ==========
    HadithEntity(dayNumber = 24,
        text = "الرزق مقسوم، ولن يموت عبد حتى يستكمل رزقه، فاتقوا الله وأجملوا في الطلب",
        source = "الإمام الباقر عليه السلام",
        book = "الكافي - ج5",
        category = "رزق"),
    
    // ========== 25 ==========
    HadithEntity(dayNumber = 25,
        text = "ما من شيء يزيد في العمر إلا الصدقة، ولا يزيد في الرزق إلا الصلاة",
        source = "الإمام الكاظم عليه السلام",
        book = "بحار الأنوار - ج82",
        category = "رزق"),
    
    // ========== 26 ==========
    HadithEntity(dayNumber = 26,
        text = "مثل أهل بيتي فيكم كمثل سفينة نوح، من ركبها نجا، ومن تخلف عنها غرق",
        source = "رسول الله صلى الله عليه وآله",
        book = "بحار الأنوار - ج23",
        category = "أهل البيت"),
    
    // ========== 27 ==========
    HadithEntity(dayNumber = 27,
        text = "إني تارك فيكم الثقلين: كتاب الله وعترتي أهل بيتي، ما إن تمسكتم بهما لن تضلوا بعدي أبداً",
        source = "رسول الله صلى الله عليه وآله",
        book = "الكافي - ج1",
        category = "أهل البيت"),
    
    // ========== 28 ==========
    HadithEntity(dayNumber = 28,
        text = "نحن أصل كل خير، ومن فروعنا كل بر",
        source = "الإمام الصادق عليه السلام",
        book = "بحار الأنوار - ج26",
        category = "أهل البيت"),
    
    // ========== 29 ==========
    HadithEntity(dayNumber = 29,
        text = "معرفة آل محمد براءة من النار، وحب آل محمد جواز على الصراط، والولاية لآل محمد أمان من العذاب",
        source = "الإمام الصادق عليه السلام",
        book = "بحار الأنوار - ج27",
        category = "أهل البيت"),
    
    // ========== 30 ==========
    HadithEntity(dayNumber = 30,
        text = "نحن أهل بيت لا يقاس بنا أحد، ولا يقدر على صفتنا أحد",
        source = "الإمام الهادي عليه السلام",
        book = "بحار الأنوار - ج50",
        category = "أهل البيت")
)
`;

  const kotlinHadithRemainingSeedText = `package com.example.dailyamaal.data.local.utils

import com.example.dailyamaal.data.local.entity.HadithEntity

fun getRemainingHadiths(): List<HadithEntity> = listOf(
    // ========== 31-40 ==========
    HadithEntity(dayNumber = 31, text = "من أصلح سريرته أصلح الله علانيته", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 32, text = "العفو عند المقدرة من أخلاق الكرام", source = "الإمام الحسين عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 33, text = "الصبر مفتاح الفرج", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 34, text = "من كثر كلامه كثر خطؤه", source = "الإمام الصادق عليه السلام", book = "تحف العقول", category = "أخلاق"),
    HadithEntity(dayNumber = 35, text = "الغضب مفتاح كل شر", source = "الإمام الباقر عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 36, text = "التقوى جماع كل خير", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "أخلاق"),
    HadithEntity(dayNumber = 37, text = "الكريم يلين إذا استعطف، واللئيم يقسو إذا لطف", source = "الإمام الحسن عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 38, text = "من حسن إسلام المرء تركه ما لا يعنيه", source = "رسول الله صلى الله عليه وآله", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 39, text = "الرفق يمن والخرق شؤم", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 40, text = "من أدب ولده صغيراً سر به كبيراً", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "تربية"),

    // ========== 41-50 ==========
    HadithEntity(dayNumber = 41, text = "بروا آباءكم تبركم أبناؤكم", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "تربية"),
    HadithEntity(dayNumber = 42, text = "لأن أموت طالباً للعلم خير من أن أموت قاعداً عنه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 43, text = "اللهم إني أسألك علماً نافعاً وقلباً خاشعاً ويقيناً صادقاً", source = "رسول الله صلى الله عليه وآله", book = "بحار الأنوار", category = "دعاء"),
    HadithEntity(dayNumber = 44, text = "إن الله يحب معالي الأمور ويكره سفسافها", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 45, text = "من زرع العدوان حصد الخسران", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 46, text = "أحسن مصاحبة من صحبك تكن مسلماً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 47, text = "صلة الرحم تزيد في العمر وتنفي الفقر", source = "الإمام الباقر عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 48, text = "من أصبح وهمه غير الله فليس من الله في شيء", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "عبادة"),
    HadithEntity(dayNumber = 49, text = "أفضل الأعمال عند الله إدخال السرور على المؤمن", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 50, text = "حسن الظن بالله من حسن العبادة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),

    // ========== 51-60 ==========
    HadithEntity(dayNumber = 51, text = "المؤمن بشره في وجهه وحزنه في قلبه", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 52, text = "طوبى لمن شغله عيبه عن عيوب الناس", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 53, text = "الظلم ظلمات يوم القيامة", source = "رسول الله صلى الله عليه وآله", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 54, text = "من ضعف عن حفظ سره لم يقو على حفظ سر غيره", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "أخلاق"),
    HadithEntity(dayNumber = 55, text = "الكلام كالدواء، قليله ينفع وكثيره يقتل", source = "الإمام الحسن عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 56, text = "من صدق في قوله قويت حجته", source = "الإمام الجواد عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 57, text = "من تذكر مني حديثاً كتب الله له أجر شهيد", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 58, text = "أحب الأعمال إلى الله ما داوم عليه العبد وإن قل", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "عبادة"),
    HadithEntity(dayNumber = 59, text = "النية الصالحة تجلب الرزق", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 60, text = "من أراد الغنى بلا مال فعليه بالاقتصاد", source = "الإمام الكاظم عليه السلام", book = "بحار الأنوار", category = "رزق"),

    // ========== 61-70 ==========
    HadithEntity(dayNumber = 61, text = "الرزق مع القناعة، والغنى مع اليأس مما في أيدي الناس", source = "الإمام الرضا عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 62, text = "التجارة تزيد في العقل", source = "الإمام الصادق عليه السلام", book = "من لا يحضره الفقيه", category = "رزق"),
    HadithEntity(dayNumber = 63, text = "السخاء شجرة في الجنة، أغصانها في الدنيا", source = "رسول الله صلى الله عليه وآله", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 64, text = "خيركم من أطعم الطعام وأفشى السلام", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 65, text = "العافية نعمة خفية، إذا وجدت نسيت، وإذا فقدت ذكرت", source = "الإمام الحسين عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 66, text = "ما من بلية إلا ولله فيها نعمة", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "حكم"),
    HadithEntity(dayNumber = 67, text = "من عرف نفسه فقد عرف ربه", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "معرفة"),
    HadithEntity(dayNumber = 68, text = "الدنيا سجن المؤمن وجنة الكافر", source = "رسول الله صلى الله عليه وآله", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 69, text = "دع ما يريبك إلى ما لا يريبك", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),
    HadithEntity(dayNumber = 70, text = "لا تنظروا إلى طول ركوع الرجل وسجوده، فإن ذلك شيء اعتاده، ولكن انظروا إلى صدق حديثه وأداء أمانته", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),

    // ========== 71-80 ==========
    HadithEntity(dayNumber = 71, text = "أداء الأمانة رزق، والخيانة فقر", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 72, text = "التوكل على الله ينفي الفقر", source = "الإمام الكاظم عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 73, text = "من توكل على الله كفاه، ومن اعتمد عليه هداه", source = "الإمام الجواد عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 74, text = "ليس منا من غش مسلماً أو ضره أو ماكره", source = "رسول الله صلى الله عليه وآله", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 75, text = "المؤمن مرآة المؤمن، يريه عيوبه ويصلحها", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 76, text = "خير الإخوان من لا تحوج إخوانك إلى سؤاله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 77, text = "المرء على دين خليله، فلينظر أحدكم من يخالل", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 78, text = "صحبة عشرين سنة قرابة", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "اجتماع"),
    HadithEntity(dayNumber = 79, text = "الجنة محفوفة بالمكاره، والنار محفوفة بالشهوات", source = "رسول الله صلى الله عليه وآله", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 80, text = "من أرضى والديه فقد أرضى الله، ومن أسخطهما فقد أسخط الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "تربية"),

    // ========== 81-90 ==========
    HadithEntity(dayNumber = 81, text = "لا يرغب في صحبة من ضيع حقه", source = "الإمام الحسين عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 82, text = "من تكبر على الناس ذل", source = "الإمام الصادق عليه السلام", book = "تحف العقول", category = "أخلاق"),
    HadithEntity(dayNumber = 83, text = "ساعة تفكر خير من عبادة سنة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 84, text = "العامل بالظلم، والمعين عليه، والراضي به شركاء", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 85, text = "من صدقت لهجته قويت حجته", source = "الإمام الجواد عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 86, text = "لا يزهدنك في المعروف من لا يشكره", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 87, text = "العالم من شهدت بصحة أقواله أفعاله", source = "الإمام العسكري عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 88, text = "رحم الله عبداً أحيا أمرنا، فقيل له: كيف يحيي أمركم؟ قال: يتعلم علومنا ويعلمها الناس", source = "الإمام الرضا عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 89, text = "يا ابن آدم، إن كنت تريد الدنيا فعليك بالعلم، وإن كنت تريد الآخرة فعليك بالعلم", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 90, text = "إذا أراد الله بعبد خيراً فقهه في الدين", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),

    // ========== 91-100 ==========
    HadithEntity(dayNumber = 91, text = "الغنى الأكبر اليأس مما في أيدي الناس", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),
    HadithEntity(dayNumber = 92, text = "من رضي بالقضاء أتاه القضاء وهو محمود", source = "الإمام الحسين عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 93, text = "احذر البغي، فإنه لا يهلك أكثر من أصحاب البغي", source = "الإمام الباقر عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 94, text = "خصلتان ليس فوقهما شيء: الإيمان بالله، ونفع الإخوان", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 95, text = "إياكم والكذب، فإن الكذب لا يصنع منه أحد إلا بطر وغنى إلا أفقره الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 96, text = "بركة العمر في العمل الصالح", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "حكم"),
    HadithEntity(dayNumber = 97, text = "لا تنظر إلى من قال، وانظر إلى ما قال", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "علم"),
    HadithEntity(dayNumber = 98, text = "حسن الخلق يزيد في الرزق ويؤنس الرفيق", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 99, text = "الناس في الدنيا بالأموال، وفي الآخرة بالأعمال", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "حكم"),
    HadithEntity(dayNumber = 100, text = "التدبير نصف العيش", source = "الإمام الصادق عليه السلام", book = "تحف العقول", category = "حكم"),

    // ========== 101-110 ==========
    HadithEntity(dayNumber = 101, text = "اطلب قلبك في ثلاثة مواطن: عند سماع القرآن، وعند الذكر، وعند الخلوة، فإن لم تجده فسل الله قلباً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 102, text = "مجالسة الأشرار تورث سوء الظن بالأخيار", source = "الإمام الهادي عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 103, text = "المؤمن وحده حجة، والمؤمن وحده جماعة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 104, text = "صلة الأرحام تزكي الأعمال وتنمي الأموال وتدفع البلوى", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 105, text = "الحياء من الإيمان، والإيمان في الجنة", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 106, text = "من أحبنا فليعمل بعملنا وليستعن بالورع", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 107, text = "ثلاثة تورث القسوة: النوم بغير تعب، والأكل بغير جوع، والضحك بغير عجب", source = "الإمام الرضا عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 108, text = "تفقهوا في الدين، فإن من لم يتفقه منكم فهو أعرابي", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),
    HadithEntity(dayNumber = 109, text = "اشكر من أنعم عليك، وأنعم على من شكرك", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "أخلاق"),
    HadithEntity(dayNumber = 110, text = "من عير أخاه بذنب لم يمت حتى يفعله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),

    // ========== 111-120 ==========
    HadithEntity(dayNumber = 111, text = "الغنى والفقر بعد العرض على الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),
    HadithEntity(dayNumber = 112, text = "النظر في المصحف عبادة، والنظر إلى وجه الوالدين عبادة", source = "رسول الله صلى الله عليه وآله", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 113, text = "من حفظ منكم أربعين حديثاً بعثه الله يوم القيامة فقيهاً عالماً", source = "رسول الله صلى الله عليه وآله", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 114, text = "لا تطلب العلم لأربع: لتباهي به العلماء، أو تماري به السفهاء، أو تصرف به وجه الناس، أو تتخذ به المال", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),
    HadithEntity(dayNumber = 115, text = "كفى بخشية الله علماً، وكفى بالاغترار بالله جهلاً", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),
    HadithEntity(dayNumber = 116, text = "التجربة فوق العلم", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "علم"),
    HadithEntity(dayNumber = 117, text = "لا شرف كالعلم، ولا عز كالحلم", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "علم"),
    HadithEntity(dayNumber = 118, text = "العامل على غير بصيرة كالسائر على غير الطريق، لا يزيده سرعة السير إلا بعداً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 119, text = "إن من حق المؤمن على المؤمن أن ينصح له في المشهد والمغيب", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 120, text = "عظموا أصحابكم ووقروهم، ولا يتجهم بعضكم لبعض", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),

    // ========== 121-130 ==========
    HadithEntity(dayNumber = 121, text = "من استفاد أخاً في الله استفاد بيتاً في الجنة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 122, text = "أفضل الإخوان من إذا قطعته أعطاك، وإذا هجرته وصلك", source = "الإمام علي عليه السلام", book = "غرر الحكم", category = "اجتماع"),
    HadithEntity(dayNumber = 123, text = "لا تشاور أحمق ولا تكذب كذوباً ولا تطمئن إلى دنيء", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 124, text = "من عامل الناس بالإنصاف عاملوه بالإنصاف", source = "الإمام الكاظم عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 125, text = "المؤمن أخو المؤمن لأبيه وأمه", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 126, text = "قال الله عز وجل: المتحابون بجلالي في ظل عرشي يوم لا ظل إلا ظلي", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 127, text = "زيارة الإخوان تزيد في العمر وتنفي الفقر", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 128, text = "التودد إلى الناس نصف العقل", source = "الإمام الصادق عليه السلام", book = "تحف العقول", category = "اجتماع"),
    HadithEntity(dayNumber = 129, text = "رأس العقل بعد الإيمان بالله التحبب إلى الناس", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 130, text = "المرء كثير بأخيه", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "اجتماع"),

    // ========== 131-140 ==========
    HadithEntity(dayNumber = 131, text = "أفضل الجهاد كلمة حق عند سلطان جائر", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "جهاد"),
    HadithEntity(dayNumber = 132, text = "إن الله كتب الإحسان على كل شيء", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 133, text = "من لا حياء له فلا إيمان له", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 134, text = "أوحى الله إلى آدم: يا آدم، إني سأجمع لك الخير كله في كلمة واحدة: ازهد في الدنيا تكن معي", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 135, text = "من لم يجعل الله له من نفسه واعظاً، فإن مواعظ الناس لن تغني عنه شيئاً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 136, text = "ما من مؤمن يقارف ذنباً في يومه وليلته إلا وهو يتمنى أنه لم يفعله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 137, text = "اصبر على طاعة الله، واصبر عن معصية الله، فإنما الدنيا ساعة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 138, text = "لا يكون المؤمن مؤمناً حتى يكون فيه ثلاث: سنة من ربه، وسنة من نبيه، وسنة من وليه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 139, text = "من صدق لسانه زكى عمله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 140, text = "الكيس من دان نفسه وعمل لما بعد الموت، والأحمق من أتبع نفسه هواها وتمنى على الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),

    // ========== 141-148 ==========
    HadithEntity(dayNumber = 141, text = "لا يغرنك صلاة امرئ ولا صيامه، فإن الرجل ربما لهج بالصلاة والصوم حتى لو تركه استوحش، ولكن اختبره عند صدق الحديث وأداء الأمانة", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 142, text = "بلغ بحسن خلقك منازل الصائم القائم", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 143, text = "ما من ذنب أشد من سوء الخلق", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 144, text = "إذا كان يوم القيامة نادى مناد: أين الصابرون؟ فيقوم عنق من الناس، فيقال لهم: صبرتم فأبشروا بالجنة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 145, text = "حسن الصحبة يزيد في الرزق", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 146, text = "إن الله عز وجل خص رسله بمكارم الأخلاق، فمن كانت فيه فليحمد الله، ومن لم تكن فيه فليتضرع إلى الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 147, text = "من حسن يقين المرء أن لا يرضي الناس بسخط الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "عبادة"),
    HadithEntity(dayNumber = 148, text = "لا ينبغي للمؤمن أن يذل نفسه، قيل: وكيف يذل نفسه؟ قال: يتعرض لما لا يطيق", source = "الإمام الصادق عليه السلام", book = "الكافي - ج5", category = "أخلاق"),

    // ========== 256-260 ==========
    HadithEntity(dayNumber = 256, text = "لأن أشبع جائعاً أحب إلي من أن أحج عشرين حجة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 257, text = "من كسا مؤمناً ثوباً لم يزل في ستر الله ما دام منه سلك", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 258, text = "من سقى مؤمناً شربة من ماء حيث يقدر على الماء، أعطاه الله بكل شربة سبعين ألف حسنة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 259, text = "أيما مؤمن نفس عن مؤمن كربة وهو موسر، نفس الله عنه سبعين كربة من كرب الدنيا والآخرة", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 260, text = "من أدخل على مؤمن سروراً أدخل الله عليه يوم القيامة سروراً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),

    // ========== 261-270 ==========
    HadithEntity(dayNumber = 261, text = "خذوا بحكمة الحق ممن أتاكم به، وانظروا إلى ما قال ولا تنظروا إلى من قال", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 262, text = "النظر إلى العالم حباً له عبادة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 263, text = "من احب أن ينظر إلى أحب أهل الأرض إلى الله فلينظر إلى العالم، فوالله لهو أحب إلى الله من حامل القرآن", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 264, text = "فضل العالم على العابد كفضل القمر ليلة البدر على سائر النجوم", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),
    HadithEntity(dayNumber = 265, text = "إذا كان يوم القيامة جمع الله الناس في صعيد واحد، ووضعت موازين القسط، فتوزن دماء الشهداء مع مداد العلماء، فيرجح مداد العلماء على دماء الشهداء", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 266, text = "من مات وهو طالب للعلم فهو شهيد", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 267, text = "من تعلم العلم لغير الله لم ينفعه، ومن طلب الدنيا بعمل الآخرة لم يربح", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 268, text = "من رضي من الله باليسير من الرزق رضي الله عنه باليسير من العمل", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 269, text = "من استذل للغنى ذهب ثلثا دينه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 270, text = "من أكل لقمة من حرام لم تقبل له صلاة أربعين ليلة، ولم تستجب له دعوة أربعين صباحاً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),

    // ========== 271-280 ==========
    HadithEntity(dayNumber = 271, text = "من جمع مالاً من مهاوش أذهبه الله في نهابر", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 272, text = "طلب الحلال واجب على كل مسلم ومسلمة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 273, text = "من سعادة المرء أن يكون القيم على عياله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "تربية"),
    HadithEntity(dayNumber = 274, text = "كفى بالمرء إثماً أن يضيع من يعول", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "تربية"),
    HadithEntity(dayNumber = 275, text = "ملعون ملعون من يضيع من يعول", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "تربية"),
    HadithEntity(dayNumber = 276, text = "حق الولد على والده ثلاثة: يحسن اسمه، ويعلمه الكتابة، ويزوجه إذا بلغ", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "تربية"),
    HadithEntity(dayNumber = 277, text = "بادروا أولادكم بالحديث قبل أن تسبقكم إليهم المرجئة", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "تربية"),
    HadithEntity(dayNumber = 278, text = "الغلام يلعب سبعاً، ويتعلم سبعاً، ويتعلم الحلال والحرام سبعاً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "تربية"),
    HadithEntity(dayNumber = 279, text = "من زوج أعزباً كان ممن ينظر الله إليه يوم القيامة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 280, text = "ما بني بناء في الإسلام أحب إلى الله من التزويج", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),

    // ========== 281-290 ==========
    HadithEntity(dayNumber = 281, text = "ركعتان يصليهما متزوج أفضل من سبعين ركعة يصليها أعزب", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 282, text = "أكثر الناس قيمة أكثرهم علماً، وأقل الناس قيمة أقلهم علماً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 283, text = "لا ينبغي للرجل أن يبيت ليلة إلا وفي عنقه لله نعمة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 284, text = "من أصبح وأمسى وهمه رضى الله، كان الله له حافظاً وناصراً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 285, text = "إنما المؤمن الذي إذا غضب لم يخرجه غضبه من حق، وإذا رضي لم يدخله رضاه في باطل", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 286, text = "أشد ما فرض الله على خلقه: ذكر الله كثيراً", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "ذكر"),
    HadithEntity(dayNumber = 287, text = "من أكثر ذكر الله أحبه الله، ومن أحبه الله أدخله الجنة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),
    HadithEntity(dayNumber = 288, text = "ألا أخبركم بأشد ما فرض الله على خلقه؟ قالوا: بلى، قال: إنصاف الناس من نفسك، ومواساتك أخاك، وذكر الله في كل موطن", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "ذكر"),
    HadithEntity(dayNumber = 289, text = "ما من شيء إلا وله حد ينتهي إليه، قيل: فما حد التوكل؟ قال: اليقين، قيل: فما حد اليقين؟ قال: ألا تخاف مع الله شيئاً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 290, text = "المؤمن بين مخافتين: ذنب قد مضى لا يدري ما صنع الله فيه، وعمر قد بقي لا يدري ما يكتسب فيه من المهالك", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),

    // ========== 291-300 ==========
    HadithEntity(dayNumber = 291, text = "من طلب الدنيا بحقها وتعطفاً على الفقراء والمساكين كان عند الله عظيماً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 292, text = "اعمل لدنياك كأنك تعيش أبداً، واعمل لآخرتك كأنك تموت غداً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 293, text = "ليس منا من لم يحاسب نفسه في كل يوم، فإن عمل حسناً استزاد الله، وإن عمل سيئاً استغفر الله وتاب إليه", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 294, text = "حاسبوا أنفسكم قبل أن تحاسبوا، وزنوها قبل أن توزنوا، وتجهزوا للعرض الأكبر", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 295, text = "من استوى يوماه فهو مغبون، ومن كان آخر يوميه خيرهما فهو مغبوط، ومن كان آخر يوميه شرهما فهو ملعون", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 296, text = "اليوم عمل ولا حساب، وغداً حساب ولا عمل", source = "الإمام علي عليه السلام", book = "نهج البلاغة", category = "حكم"),
    HadithEntity(dayNumber = 297, text = "اعمل اليوم ولا تؤخر العمل إلى الغد، فإن لكل يوم عملاً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 298, text = "من غدا يريد أن يتعلم علماً سهل الله له طريقاً إلى الجنة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 299, text = "تفقهوا في الحلال والحرام، وإلا فأنتم أعراب", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 300, text = "من عمل على غير علم كان ما يفسد أكثر مما يصلح", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),

    // ========== 301-310 ==========
    HadithEntity(dayNumber = 301, text = "أفضل العبادة العلم بالدين", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 302, text = "ليس العلم بكثرة التعلم، إنما العلم نور يقذفه الله في قلب من يشاء", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "علم"),
    HadithEntity(dayNumber = 303, text = "إذا أراد الله بعبد خيراً فقهه في الدين، وألهمه رشده", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "علم"),
    HadithEntity(dayNumber = 304, text = "الدنيا ساعة فاجعلها طاعة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 305, text = "ابن آدم، إنما أنت أيام، كلما ذهب يوم ذهب بعضك", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 306, text = "من عمرت صحيفته بالاستغفار لم تخل من نور", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),
    HadithEntity(dayNumber = 307, text = "الاستغفار يمحو الذنوب ويطهر القلوب", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),
    HadithEntity(dayNumber = 308, text = "طوبى لعبد طلب الآخرة وسعى لها، وطلب الدنيا فأحسن فيها ولم ينس حظه منها", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 309, text = "الكيس من دان نفسه وعمل لما بعد الموت، والأحمق من أتبع نفسه هواها وتمنى على الله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),
    HadithEntity(dayNumber = 310, text = "من لم يهتم بأمر المسلمين فليس منهم، ومن لم يصبح ويمسي ناصحاً لله ولرسوله ولأئمة المسلمين ولعامتهم فليس منهم", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),

    // ========== 311-320 ==========
    HadithEntity(dayNumber = 311, text = "أحبب حبيبك هوناً ما، عسى أن يكون بغيضك يوماً ما، وأبغض بغيضك هوناً ما، عسى أن يكون حبيبك يوماً ما", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 312, text = "احذروا موت الفجأة، فإنه راحة للمؤمن وحسرة على الفاجر", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 313, text = "إذا أراد الله قبض روح عبد في بلدة جعل له إليها حاجة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 314, text = "الكيس من إذا خاف شيئاً تحرز منه، والأحمق من إذا خاف شيئاً قصد إليه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "حكم"),
    HadithEntity(dayNumber = 315, text = "إياكم والتجبر، فإنه لا يتجبر أحد إلا ذل، ولا يتواضع أحد إلا عز", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 316, text = "ثلاثة لا يزيد الله بهن إلا خيراً: التواضع، وكظم الغيظ، وقلة الكلام", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 317, text = "رأس طاعة الله الصبر والرضا عن الله فيما أحب العبد أو كره", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 318, text = "إذا نزل البلاء فعليكم بالدعاء والتضرع إلى الله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "دعاء"),
    HadithEntity(dayNumber = 319, text = "من قدم في الدعاء أربعين رجلاً من إخوانه قبل أن يدعو لنفسه استجيب له فيهم وفي نفسه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "دعاء"),
    HadithEntity(dayNumber = 320, text = "الداعي بلا عمل كالرامي بلا وتر", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "دعاء"),

    // ========== 321-330 ==========
    HadithEntity(dayNumber = 321, text = "عليكم بطيب الكسب، فإنه لا يخرج من كسب حرام خير أبداً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 322, text = "من صدق لسانه زكى عمله، ومن حسنت نيته زيد في رزقه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 323, text = "من حسن بره بأهله زاد الله في رزقه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "رزق"),
    HadithEntity(dayNumber = 324, text = "صلة الرحم تزكي الأعمال، وتنمي الأموال، وتدفع البلوى، وتيسر الحساب، وتنسئ في الأجل", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 325, text = "من سره أن يطول عمره ويزاد في رزقه فليصل رحمه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 326, text = "قضاء حاجة المؤمن أفضل من ألف حجة متقبلة بمناسكها", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 327, text = "من مشى في حاجة أخيه المؤمن كتب الله له بكل خطوة حسنة، وحط عنه بها سيئة، ورفع له بها درجة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 328, text = "ما من مؤمن يمشي لأخيه في حاجة إلا كتب الله له بكل خطوة حسنة، ومحى عنه سيئة، ورفع له درجة، وإذا قضيت حاجته كان كمن عبد الله عمره", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 329, text = "من فرج عن مؤمن كربة من كرب الدنيا فرج الله عنه كربة من كرب الآخرة", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "اجتماع"),
    HadithEntity(dayNumber = 330, text = "إن لله عباداً في الأرض يفزع الناس إليهم في حوائجهم، أولئك هم الآمنون يوم القيامة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),

    // ========== 331-340 ==========
    HadithEntity(dayNumber = 331, text = "من خاف الله أخاف الله منه كل شيء، ومن لم يخف الله أخافه الله من كل شيء", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 332, text = "من أطاع الله عز وجل كفي ما أهمه من أمر دنياه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 333, text = "من اتقى الله وقاه، ومن توكل على الله كفاه", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 334, text = "لا يزال العبد المؤمن يكتب محسناً ما دام ساكتاً، فإذا تكلم كتب محسناً أو مسيئاً", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 335, text = "الصمت كنز من كنوز الحكماء، ولولا الصمت ما كان في الأرض أحد أحكم من المتكلمين", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 336, text = "لا يزال الرجل يكتب مصلياً ما دام ينتظر الصلاة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 337, text = "من مشى إلى مسجد من مساجد الله فله بكل خطوة خطاها سبعون ألف حسنة، ويرفع له سبعون ألف درجة، ويحط عنه سبعون ألف سيئة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 338, text = "أحب الأعمال إلى الله الصلاة لوقتها، ثم بر الوالدين، ثم الجهاد في سبيل الله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "عبادة"),
    HadithEntity(dayNumber = 339, text = "من ذكر الله في الأسواق وفي الغفلة غفر الله له", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),
    HadithEntity(dayNumber = 340, text = "ليس شيء من العبادة أشد على الشياطين من ذكر الله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),

    // ========== 341-350 ==========
    HadithEntity(dayNumber = 341, text = "ألا أدلكم على دواء لا يخطئ؟ قالوا: بلى، قال: عليكم بالاستغفار", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),
    HadithEntity(dayNumber = 342, text = "من أكثر الاستغفار جعل الله له من كل هم فرجاً، ومن كل ضيق مخرجاً، ورزقه من حيث لا يحتسب", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "ذكر"),
    HadithEntity(dayNumber = 343, text = "إنما الأعمال بالنيات، ولكل امرئ ما نوى", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),
    HadithEntity(dayNumber = 344, text = "نية المؤمن خير من عمله، ونية الكافر شر من عمله", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "حكم"),
    HadithEntity(dayNumber = 345, text = "من أسرع إلى الناس بما يكرهون قالوا فيه ما لا يعلمون", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 346, text = "من كف عن أعراض الناس أقاله الله عثرته يوم القيامة", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 347, text = "إذا سمعت من صاحبك الكلمة تنكرها فلا تردها، فإن للكلام جواباً ربما كان شراً من الكلام", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 348, text = "أدبني ربي فأحسن تأديبي، وقال: (خذ العفو وأمر بالعرف وأعرض عن الجاهلين)", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 349, text = "أفضل من الصدق قائله، وأفضل من الخير فاعله", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),
    HadithEntity(dayNumber = 350, text = "لا تنظروا إلى طول ركوع الرجل وسجوده، ولكن انظروا إلى صدق حديثه وأداء أمانته", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أخلاق"),

    // ========== 351-360 ==========
    HadithEntity(dayNumber = 351, text = "من عامل الناس فلم يظلمهم، وحدثهم فلم يكذبهم، ووعدهم فلم يخلفهم، فهو ممن كملت مروءته", source = "الإمام الصادق عليه السلام", book = "الكافي", category = "أخلاق"),
    HadithEntity(dayNumber = 352, text = "إنما المؤمنون إخوة بنو أب وأم، وإذا ضرب على رجل منهم عرق تداعى له الآخرون", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 353, text = "من أصبح مهموماً لغير فكاك أسير، أو قضاء دين، أو لملمة عيال، فما أجدره أن لا يفوز", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 354, text = "قال الله عز وجل: الخلق عيالي، فأحبهم إلي ألطفهم بهم، وأسعاهم في حوائجهم", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 355, text = "تنافسوا في المعروف لإخوانكم وكونوا من أهله، فإن للجنة باباً يقال له المعروف، لا يدخله إلا من اصطنع المعروف في الحياة الدنيا", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "اجتماع"),
    HadithEntity(dayNumber = 356, text = "خير الناس بعدنا من أحيا أمرنا، وذكر الناس بمقالنا، ودعاهم إلى ربهم", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 357, text = "شيعتنا منا، خلقوا من فاضل طينتنا، يفرحون لفرحنا ويحزنون لحزننا", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 358, text = "إن لصاحب هذا الأمر غيبتين: إحداهما تطول حتى يقول القائل: مات وهلك، ولا يبقى على إمامته إلا من امتحن الله قلبه للإيمان", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 359, text = "العجب كل العجب ممن أنكر الغيبة وهو يرى الشمس في وقت الظهيرة تحت السحاب", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت"),
    HadithEntity(dayNumber = 360, text = "من مات وهو لا يعرف إمام زمانه مات ميتة جاهلية", source = "الإمام الصادق عليه السلام", book = "بحار الأنوار", category = "أهل البيت")
)
`;

  const kotlinMonthlyDbEntityText = `package com.example.dailyamaal.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "monthly_works")
data class MonthlyWorkEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    
    // الشهر: "رجب" أو "شعبان" أو "رمضان"
    @ColumnInfo(name = "month") val month: String,
    
    // نوع اليوم: "يوم" أو "ليلة"
    @ColumnInfo(name = "day_type") val dayType: String,
    
    // رقم اليوم في الشهر (1-30)
    @ColumnInfo(name = "day_number") val dayNumber: Int,
    
    // عنوان العمل
    @ColumnInfo(name = "title") val title: String,
    
    // نوع العمل: صلاة، دعاء، ذكر، صيام، غسل، زيارة
    @ColumnInfo(name = "work_type") val workType: String,
    
    // كيفية الأداء (عدد الركعات، السور المطلوبة)
    @ColumnInfo(name = "how_to") val howTo: String,
    
    // فضل العمل وثوابه
    @ColumnInfo(name = "virtue") val virtue: String,
    
    // النص الكامل للدعاء إن وجد
    @ColumnInfo(name = "full_text") val fullText: String = "",
    
    // ملاحظات إضافية
    @ColumnInfo(name = "notes") val notes: String = ""
)`;

  const kotlinDaoText = `package com.example.dailyamaal.data.local.dao

import androidx.room.*
import com.example.dailyamaal.data.local.entity.DailyWorkEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DailyWorkDao {
    // جلب جميع الأعمال مرتبة
    @Query("SELECT * FROM daily_works ORDER BY time, order_index ASC")
    fun getAllWorks(): Flow<List<DailyWorkEntity>>

    // جلب الأعمال المناسبة لليوم + الأعمال العامة
    @Query("SELECT * FROM daily_works WHERE occasion = :today OR occasion = '' ORDER BY time, order_index ASC")
    fun getWorksForToday(today: String): Flow<List<DailyWorkEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(works: List<DailyWorkEntity>)

    @Query("UPDATE daily_works SET is_completed = :completed WHERE id = :id")
    suspend fun updateCompletion(id: Int, completed: Boolean)
}`;

  const kotlinHadithDaoText = `package com.example.dailyamaal.data.local.dao

import androidx.room.*
import com.example.dailyamaal.data.local.entity.HadithEntity

@Dao
interface HadithDao {
    
    @Query("SELECT * FROM hadiths WHERE day_number = :dayNumber")
    suspend fun getHadithByDay(dayNumber: Int): HadithEntity?
    
    @Query("SELECT COUNT(*) FROM hadiths")
    suspend fun getCount(): Int
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(hadiths: List<HadithEntity>)
    
    @Query("SELECT * FROM hadiths ORDER BY day_number ASC")
    suspend fun getAllHadiths(): List<HadithEntity>
}`;

  const kotlinMonthlyDaoText = `package com.example.dailyamaal.data.local.dao

import androidx.room.*
import com.example.dailyamaal.data.local.entity.MonthlyWorkEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MonthlyWorkDao {
    
    // جلب أعمال يوم محدد من شهر محدد
    @Query("SELECT * FROM monthly_works WHERE month = :month AND day_number = :day AND day_type = 'يوم' ORDER BY id ASC")
    fun getDayWorks(month: String, day: Int): Flow<List<MonthlyWorkEntity>>
    
    // جلب أعمال ليلة محددة من شهر محدد
    @Query("SELECT * FROM monthly_works WHERE month = :month AND day_number = :day AND day_type = 'ليلة' ORDER BY id ASC")
    fun getNightWorks(month: String, day: Int): Flow<List<MonthlyWorkEntity>>
    
    // جلب جميع أعمال شهر محدد
    @Query("SELECT * FROM monthly_works WHERE month = :month ORDER BY day_number, day_type, id ASC")
    fun getMonthWorks(month: String): Flow<List<MonthlyWorkEntity>>
    
    // إدخال بيانات
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(works: List<MonthlyWorkEntity>)
}`;

  const kotlinAppDatabaseText = `package com.example.dailyamaal.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.dailyamaal.data.local.dao.DailyWorkDao
import com.example.dailyamaal.data.local.dao.MonthlyWorkDao
import com.example.dailyamaal.data.local.dao.HadithDao
import com.example.dailyamaal.data.local.entity.DailyWorkEntity
import com.example.dailyamaal.data.local.entity.MonthlyWorkEntity
import com.example.dailyamaal.data.local.entity.HadithEntity

@Database(
    entities = [
        DailyWorkEntity::class, 
        MonthlyWorkEntity::class, 
        HadithEntity::class
    ], 
    version = 2, 
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun dailyWorkDao(): DailyWorkDao
    abstract fun monthlyWorkDao(): MonthlyWorkDao
    abstract fun hadithDao(): HadithDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "daily_amaal.db"
                )
                // تحديث ودمج قاعدة البيانات التلقائي للإصدار v2
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}`;

  const kotlinViewModelText = `package com.example.dailyamaal.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.dailyamaal.data.local.db.AppDatabase
import com.example.dailyamaal.data.local.entity.DailyWorkEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import java.util.Calendar

class DailyWorkViewModel(private val db: AppDatabase) : ViewModel() {

    val allWorks: Flow<List<DailyWorkEntity>> = db.dailyWorkDao().getAllWorks()

    fun insertDailyWorks() {
        viewModelScope.launch {
            db.dailyWorkDao().insertAll(
                listOf(
                    DailyWorkEntity(title = "صلاة الفجر", type = "فريضة", time = "الفجر", orderIndex = 1, description = "ركعتان"),
                    DailyWorkEntity(title = "تعقيب صلاة الفجر", type = "تعقيب", time = "الفجر", orderIndex = 2, description = "تسبيح الزهراء + دعاء"),
                    DailyWorkEntity(title = "صلاة الظهر", type = "فريضة", time = "الظهر", orderIndex = 1, description = "أربع ركعات"),
                    DailyWorkEntity(title = "تعقيب صلاة الظهر", type = "تعقيب", time = "الظهر", orderIndex = 2, description = "تسبيح الزهراء + آية الكرسي"),
                    DailyWorkEntity(title = "دعاء قضاء الحاجة", type = "دعاء", time = "الظهر", orderIndex = 3, description = "دعاء (يا من أظهر الجميل)", fullText = "يا من أظهر الجميل وستر القبيح..."),
                    DailyWorkEntity(title = "صلاة العصر", type = "فريضة", time = "العصر", orderIndex = 1, description = "أربع ركعات"),
                    DailyWorkEntity(title = "صلاة المغرب", type = "فريضة", time = "المغرب", orderIndex = 1, description = "ثلاث ركعات"),
                    DailyWorkEntity(title = "صلاة العشاء", type = "فريضة", time = "العشاء", orderIndex = 1, description = "أربع ركعات"),
                    DailyWorkEntity(title = "صلاة الليل", type = "نافلة", time = "الليل", orderIndex = 1, description = "8 ركعات + الشفع + الوتر"),
                    DailyWorkEntity(title = "دعاء قبل النوم", type = "دعاء", time = "الليل", orderIndex = 2, description = "التسبيحات الأربع + آية الكرسي"),
                    DailyWorkEntity(
                        title = "صيام يوم عرفة",
                        type = "صيام",
                        time = "يوم عرفة",
                        orderIndex = 1,
                        description = "صيام يوم عرفة يكفر ذنوب سنتين",
                        fullText = "قال الإمام الصادق (عليه السلام): صيام يوم عرفة كفارة سنة ماضية وسنة مستقبلة"
                    ),
                    DailyWorkEntity(
                        title = "دعاء الإمام الحسين (ع) يوم عرفة",
                        type = "دعاء",
                        time = "يوم عرفة",
                        orderIndex = 2,
                        description = "الدعاء المخصوص للإمام الحسين (ع) في يوم عرفة",
                        fullText = "اَلْحَمْدُ لِلّهِ الَّذِي لَيْسَ لِقَضَائِهِ دَافِعٌ..."
                    ),
                    DailyWorkEntity(
                        title = "زيارة الإمام الحسين (ع) يوم عرفة",
                        type = "زيارة",
                        time = "يوم عرفة",
                        orderIndex = 3,
                        description = "زيارة الحسين (ع) المخصوصة بيوم عرفة",
                        fullText = "السلام عليك يا أبا عبد الله..."
                    ),
                    DailyWorkEntity(
                        title = "غسل يوم عرفة",
                        type = "غسل",
                        time = "يوم عرفة",
                        orderIndex = 4,
                        description = "الغسل بالماء بنية الاستحباب",
                        fullText = ""
                    )
                )
            )
        }
    }

    fun toggleCompletion(workId: Int, completed: Boolean) {
        viewModelScope.launch {
            db.dailyWorkDao().updateCompletion(workId, completed)
        }
    }

    fun resetAllWorks() {
        viewModelScope.launch {
            db.dailyWorkDao().resetAllWorks()
        }
    }

    fun getCurrentTimeLabel(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 4..5 -> "الفجر"
            in 6..11 -> "الصباح"
            in 12..13 -> "الظهر"
            in 14..16 -> "العصر"
            in 17..18 -> "المغرب"
            in 19..21 -> "العشاء"
            else -> "الليل"
        }
    }

    // ==================== ✅ دوال التاريخ الهجري ====================

    fun getHijriDate(): String {
        val today = Calendar.getInstance()
        val day = today.get(Calendar.DAY_OF_MONTH)
        val month = today.get(Calendar.MONTH) + 1
        val year = today.get(Calendar.YEAR)

        // خوارزمية تحويل تقريبية للتاريخ الهجري
        val jd = (1461 * (year + 4800 + (month - 14) / 12)) / 4 +
                (367 * (month - 2 - 12 * ((month - 14) / 12))) / 12 -
                (3 * ((year + 4900 + (month - 14) / 12) / 100)) / 4 +
                day - 32075

        val l = jd - 1948440 + 10632
        val n = ((l - 1) / 10631).toInt()
        val l2 = l - 10631 * n + 354
        val j = ((10985 - l2) / 5316) * ((50 * l2) / 17719) + (l2 / 5670) * ((43 * l2) / 15238)
        val l3 = l2 - ((30 - j) / 15) * ((17719 * j) / 50) - (j / 16) * ((15238 * j) / 43) + 29

        val hijriMonth = ((24 * l3) / 709).toInt()
        val hijriDay = (l3 - ((709 * hijriMonth) / 24)).toInt()
        val hijriYear = (30 * n + j - 30).toInt()

        val months = arrayOf(
            "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
            "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
            "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
        )

        val hijriMonthName = if (hijriMonth in 1..12) months[hijriMonth - 1] else ""

        return "$hijriDay $hijriMonthName $hijriYear"
    }

    fun getTodayOccasion(): String {
        val today = Calendar.getInstance()
        val day = today.get(Calendar.DAY_OF_MONTH)
        val month = today.get(Calendar.MONTH) + 1
        val year = today.get(Calendar.YEAR)

        val jd = (1461 * (year + 4800 + (month - 14) / 12)) / 4 +
                (367 * (month - 2 - 12 * ((month - 14) / 12))) / 12 -
                (3 * ((year + 4900 + (month - 14) / 12) / 100)) / 4 +
                day - 32075

        val l = jd - 1948440 + 10632
        val n = ((l - 1) / 10631).toInt()
        val l2 = l - 10631 * n + 354
        val j = ((10985 - l2) / 5316) * ((50 * l2) / 17719) + (l2 / 5670) * ((43 * l2) / 15238)
        val l3 = l2 - ((30 - j) / 15) * ((17719 * j) / 50) - (j / 16) * ((15238 * j) / 43) + 29

        val hijriMonth = ((24 * l3) / 709).toInt()
        val hijriDay = (l3 - ((709 * hijriMonth) / 24)).toInt()

        return when {
            hijriMonth == 1 && hijriDay == 1 -> "رأس السنة الهجرية"
            hijriMonth == 1 && hijriDay == 10 -> "ذكرى عاشوراء"
            hijriMonth == 1 && hijriDay == 40 -> "زيارة الأربعين"
            hijriMonth == 2 && hijriDay == 20 -> "زيارة الأربعين (حسب رواية)"
            hijriMonth == 3 && hijriDay == 12 -> "ولادة النبي محمد (صلى الله عليه وآله)"
            hijriMonth == 3 && hijriDay == 17 -> "ولادة الإمام الصادق (عليه السلام)"
            hijriMonth == 7 && hijriDay == 10 -> "ولادة الإمام الجواد (عليه السلام)"
            hijriMonth == 7 && hijriDay == 13 -> "ولادة الإمام علي (عليه السلام)"
            hijriMonth == 7 && hijriDay == 27 -> "المبعث النبوي الشريف"
            hijriMonth == 8 && hijriDay == 3 -> "ولادة الإمام الحسين (عليه السلام)"
            hijriMonth == 8 && hijriDay == 4 -> "ولادة أبي الفضل العباس (عليه السلام)"
            hijriMonth == 8 && hijriDay == 5 -> "ولادة الإمام السجاد (عليه السلام)"
            hijriMonth == 8 && hijriDay == 15 -> "ولادة الإمام المهدي (عجل الله فرجه)"
            hijriMonth == 9 && hijriDay == 10 -> "وفاة السيدة خديجة (عليها السلام)"
            hijriMonth == 9 && hijriDay == 15 -> "ولادة الإمام الحسن (عليه السلام)"
            hijriMonth == 9 && hijriDay == 19 -> "ليلة القدر - جرح الإمام علي (عليه السلام)"
            hijriMonth == 9 && hijriDay == 21 -> "ليلة القدر - استشهاد الإمام علي (عليه السلام)"
            hijriMonth == 9 && hijriDay == 23 -> "ليلة القدر (الليلة الثالثة)"
            hijriMonth == 10 && hijriDay == 1 -> "عيد الفطر المبارك"
            hijriMonth == 12 && hijriDay == 9 -> "يوم عرفة المبارك"
            hijriMonth == 12 && hijriDay == 10 -> "عيد الأضحى المبارك"
            hijriMonth == 12 && hijriDay == 18 -> "عيد الغدير الأغر"
            else -> ""
        }
    }

    // دوال الشهر الهجري (تستخدم للاستعلام عن الشهر الحالي)
    fun getCurrentHijriMonth(): Int {
        val today = Calendar.getInstance()
        val day = today.get(Calendar.DAY_OF_MONTH)
        val month = today.get(Calendar.MONTH) + 1
        val year = today.get(Calendar.YEAR)

        val jd = (1461 * (year + 4800 + (month - 14) / 12)) / 4 +
                (367 * (month - 2 - 12 * ((month - 14) / 12))) / 12 -
                (3 * ((year + 4900 + (month - 14) / 12) / 100)) / 4 +
                day - 32075

        val l = jd - 1948440 + 10632
        val n = ((l - 1) / 10631).toInt()
        val l2 = l - 10631 * n + 354
        val j = ((10985 - l2) / 5316) * ((50 * l2) / 17719) + (l2 / 5670) * ((43 * l2) / 15238)
        val l3 = l2 - ((30 - j) / 15) * ((17719 * j) / 50) - (j / 16) * ((15238 * j) / 43) + 29

        return ((24 * l3) / 709).toInt()
    }

    fun getCurrentHijriDay(): Int {
        val today = Calendar.getInstance()
        val day = today.get(Calendar.DAY_OF_MONTH)
        val month = today.get(Calendar.MONTH) + 1
        val year = today.get(Calendar.YEAR)

        val jd = (1461 * (year + 4800 + (month - 14) / 12)) / 4 +
                (367 * (month - 2 - 12 * ((month - 14) / 12))) / 12 -
                (3 * ((year + 4900 + (month - 14) / 12) / 100)) / 4 +
                day - 32075

        val l = jd - 1948440 + 10632
        val n = ((l - 1) / 10631).toInt()
        val l2 = l - 10631 * n + 354
        val j = ((10985 - l2) / 5316) * ((50 * l2) / 17719) + (l2 / 5670) * ((43 * l2) / 15238)
        val l3 = l2 - ((30 - j) / 15) * ((17719 * j) / 50) - (j / 16) * ((15238 * j) / 43) + 29

        val hijriMonth = ((24 * l3) / 709).toInt()
        return (l3 - ((709 * hijriMonth) / 24)).toInt()
    }

    fun getCurrentHijriMonthName(): String {
        val months = arrayOf(
            "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
            "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
            "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
        )
        val monthIndex = getCurrentHijriMonth()
        return if (monthIndex in 1..12) months[monthIndex - 1] else ""
    }
}`;

  const kotlinComposeScreenText = `package com.example.dailyamaal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.room.Room
import com.example.dailyamaal.data.local.db.AppDatabase
import com.example.dailyamaal.data.local.entity.DailyWorkEntity
import com.example.dailyamaal.ui.viewmodel.DailyWorkViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyWorksScreen() {
    val context = LocalContext.current
    val db = remember {
        Room.databaseBuilder(context, AppDatabase::class.java, "daily_amaal.db").build()
    }
    val viewModel: DailyWorkViewModel = viewModel { DailyWorkViewModel(db) }
    val works by viewModel.allWorks.collectAsState(initial = emptyList())
    val currentTimeLabel = viewModel.getCurrentTimeLabel()

    LaunchedEffect(Unit) {
        viewModel.insertDailyWorks()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1B5E20),
                    titleContentColor = Color.White
                ),
                actions = {
                    IconButton(onClick = { viewModel.resetAllWorks() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "إعادة تعيين",
                            tint = Color.White
                        )
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {

            // ==================== ✅ العنوان العلوي الكبير ====================
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(
                                    Color(0xFF0D3B0F),  // أخضر داكن جداً
                                    Color(0xFF1B5E20),
                                    Color(0xFF2E7D32)
                                )
                            )
                        )
                        .padding(vertical = 36.dp, horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {

                        // ========== حملة التكاتف والإيمان ==========
                        Text(
                            text = "حملة التكاتف والإيمان",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFFFD54F), // ذهبي
                            textAlign = TextAlign.Center,
                            letterSpacing = 2.sp
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // خط فاصل مزخرف
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.5f)
                                .height(3.dp)
                                .background(Color(0xFFFFD54F))
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // ========== زاد العباد (بخط كبير) ==========
                        Text(
                            text = "زاد العباد",
                            fontSize = 56.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            textAlign = TextAlign.Center,
                            letterSpacing = 6.sp
                        )
                    }
                }
            }

            // ==================== ✅ التاريخ الهجري والميلادي ====================
            item {
                HijriHeader(viewModel)
            }

            // ==================== بطاقة تنبيهية للوقت الحالي ====================
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF8E1))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "📌 الوقت الآن: \$currentTimeLabel",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "الأعمال المستحبة في هذا الوقت:",
                            fontSize = 14.sp,
                            color = Color.DarkGray
                        )
                    }
                }
            }

            // ==================== قائمة الأعمال حسب الوقت ====================
            val groupedWorks = works.groupBy { it.time }

            groupedWorks.forEach { (time, worksInTime) ->
                item {
                    val isCurrentTime = time == currentTimeLabel
                    Text(
                        text = "🕐 \$time",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isCurrentTime) Color(0xFFE65100) else Color(0xFF1B5E20),
                        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp)
                    )
                    if (isCurrentTime) {
                        Text(
                            "👈 الوقت الحالي",
                            fontSize = 12.sp,
                            color = Color(0xFFE65100),
                            modifier = Modifier.padding(start = 16.dp)
                        )
                    }
                }
                items(worksInTime) { work ->
                    DailyWorkCard(
                        work = work,
                        isHighlighted = time == currentTimeLabel
                    ) { newState ->
                        viewModel.toggleCompletion(work.id, newState)
                    }
                }
            }
        }
    }
}

// ==================== ✅ بطاقة التاريخ الهجري والميلادي ====================
@Composable
fun HijriHeader(viewModel: DailyWorkViewModel) {
    // استدعاء مباشر من ViewModel
    val hijriDate = viewModel.getHijriDate()
    val occasion = viewModel.getTodayOccasion()
    val today = java.util.Calendar.getInstance()

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2E7D32))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // التاريخ الهجري
            Text(
                text = "📅 \$hijriDate",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            // التاريخ الميلادي
            Text(
                text = "الموافق: \${today.get(java.util.Calendar.DAY_OF_MONTH)}/\${today.get(java.util.Calendar.MONTH) + 1}/\${today.get(java.util.Calendar.YEAR)}",
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 14.sp
            )
        }
    }

    // بطاقة المناسبة (تظهر فقط في المناسبات)
    if (occasion.isNotEmpty()) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF8E1))
        ) {
            Text(
                text = "🌟 \$occasion",
                modifier = Modifier.padding(16.dp),
                color = Color(0xFFB71C1C),
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        }
    }
}

// ==================== ✅ بطاقة العمل اليومي ====================
@Composable
fun DailyWorkCard(
    work: DailyWorkEntity,
    isHighlighted: Boolean = false,
    onToggle: (Boolean) -> Unit
) {
    var checked by remember { mutableStateOf(work.isCompleted) }
    var showFullText by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable { if (work.fullText.isNotEmpty()) showFullText = true },
        colors = CardDefaults.cardColors(
            containerColor = when {
                checked -> Color(0xFFE8F5E9)
                isHighlighted -> Color(0xFFFFF3E0)
                else -> Color.White
            }
        ),
        border = if (isHighlighted) {
            androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE65100))
        } else null
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = {
                checked = !checked
                onToggle(checked)
            }) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "إنجاز",
                    tint = if (checked) Color(0xFF4CAF50) else Color.Gray
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = work.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = if (checked) Color.Gray else Color.Black
                )
                Text(
                    text = work.description,
                    fontSize = 14.sp,
                    color = Color.DarkGray
                )
                Text(
                    text = "📌 \${work.type}" + if (work.fullText.isNotEmpty()) "  📖 اضغط للتفاصيل" else "",
                    fontSize = 12.sp,
                    color = Color(0xFF1B5E20)
                )
            }
        }
    }

    if (showFullText) {
        AlertDialog(
            onDismissRequest = { showFullText = false },
            title = { Text(work.title, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    work.fullText,
                    fontSize = 16.sp,
                    lineHeight = 28.sp
                )
            },
            confirmButton = {
                TextButton(onClick = { showFullText = false }) {
                    Text("إغلاق")
                }
            }
        )
    }
}`;

  const kotlinDailySummaryScreenText = `package com.example.dailyamaal.ui.screens

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.room.Room
import com.example.dailyamaal.data.local.db.AppDatabase
import com.example.dailyamaal.ui.viewmodel.DailyWorkViewModel
import java.io.OutputStream
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailySummaryScreen() {
    val context = LocalContext.current
    val db = remember {
        Room.databaseBuilder(context, AppDatabase::class.java, "daily_amaal.db").build()
    }
    val viewModel: DailyWorkViewModel = viewModel { DailyWorkViewModel(db) }
    val works by viewModel.allWorks.collectAsState(initial = emptyList())
    val hijriDate = viewModel.getHijriDate()
    val occasion = viewModel.getTodayOccasion()
    val today = Calendar.getInstance()

    val completedCount = works.count { it.isCompleted }
    val totalCount = works.size
    val progressPercent = if (totalCount > 0) (completedCount * 100 / totalCount) else 0

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("📋 موجز الأعمال اليومية") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1B5E20),
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // ========== بطاقة التاريخ والمناسبة ==========
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2E7D32)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "📅 $hijriDate",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp
                        )
                        Text(
                            text = "الموافق: \${today.get(Calendar.DAY_OF_MONTH)}/\${today.get(Calendar.MONTH) + 1}/\${today.get(Calendar.YEAR)}",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 14.sp
                        )
                        if (occasion.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "🌟 $occasion",
                                color = Color(0xFFFFD54F),
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }

            // ========== بطاقة الإحصائيات ==========
            item {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "📊 إحصائيات اليوم",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Color(0xFF1B5E20)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatItem("الأعمال", "\$totalCount")
                            StatItem("مكتمل", "\$completedCount")
                            StatItem("متبقي", "\${totalCount - completedCount}")
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        // شريط التقدم
                        LinearProgressIndicator(
                            progress = { progressPercent / 100f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(12.dp)
                                .clip(RoundedCornerShape(6.dp)),
                            color = Color(0xFF4CAF50),
                            trackColor = Color(0xFFC8E6C9),
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "\$progressPercent% مكتمل",
                            fontSize = 14.sp,
                            color = Color(0xFF1B5E20),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // ========== الأعمال المنجزة وغير المنجزة ==========
            item {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "✅ الأعمال المنجزة (\$completedCount)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color(0xFF2E7D32),
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            items(works.filter { it.isCompleted }) { work ->
                SummaryWorkItem(work, isCompleted = true)
            }

            item {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "⏳ أعمال متبقية (\${totalCount - completedCount})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color(0xFFE65100),
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            items(works.filter { !it.isCompleted }) { work ->
                SummaryWorkItem(work, isCompleted = false)
            }

            // ========== زر التصدير كصورة ==========
            item {
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = {
                        // تعيين تصدير المعطيات كصورة في أجهزة الأندرويد الأساسية
                        Toast.makeText(context, "جاري تصدير الموجز...", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1B5E20)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("📤 تصدير الموجز كصورة", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontWeight = FontWeight.Bold, fontSize = 24.sp, color = Color(0xFF1B5E20))
        Text(text = label, fontSize = 12.sp, color = Color.Gray)
    }
}

@Composable
fun SummaryWorkItem(work: com.example.dailyamaal.data.local.entity.DailyWorkEntity, isCompleted: Boolean) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isCompleted) Color(0xFFE8F5E9) else Color(0xFFFFF8E1)
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (isCompleted) Color(0xFF4CAF50) else Color.Gray,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = work.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = if (isCompleted) Color.Gray else Color.Black
                )
                Text(
                    text = "\${work.type} • \${work.time}",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }
    }
}`;

  const kotlinMainActivityText = `package com.example.dailyamaal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.example.dailyamaal.data.local.NotificationHelper
import com.example.dailyamaal.data.local.PrayerTimeManager
import com.example.dailyamaal.ui.screens.DailySummaryScreen
import com.example.dailyamaal.ui.screens.DailyWorksScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        NotificationHelper.createChannels(this)
        val prayerManager = PrayerTimeManager(this)
        prayerManager.scheduleAllPrayerNotifications()
        prayerManager.scheduleNightPrayerNotification()
        prayerManager.scheduleDailyReset()

        setContent {
            var showSummary by remember { mutableStateOf(false) }

            Scaffold(
                bottomBar = {
                    NavigationBar {
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Home, contentDescription = null) },
                            label = { Text("الأعمال") },
                            selected = !showSummary,
                            onClick = { showSummary = false }
                        )
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Summarize, contentDescription = null) },
                            label = { Text("الموجز") },
                            selected = showSummary,
                            onClick = { showSummary = true }
                        )
                    }
                }
            ) { padding ->
                Box(modifier = Modifier.padding(padding)) {
                    if (showSummary) {
                        DailySummaryScreen()
                    } else {
                        DailyWorksScreen()
                    }
                }
            }
        }
    }
}`;

  const kotlinNotificationHelperText = `package com.example.dailyamaal.data.local

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat

class NotificationHelper {
    companion object {
        private const val CHANNEL_PRAYER = "prayer_channel"
        private const val CHANNEL_NIGHT = "night_channel"

        fun createChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                
                val prayerChannel = NotificationChannel(
                    CHANNEL_PRAYER, "إشعارات الصلوات", NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "تذكير بالصلوات الخمس"; enableVibration(true) }
                
                val nightChannel = NotificationChannel(
                    CHANNEL_NIGHT, "صلاة الليل", NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "تذكير بصلاة الليل"; enableVibration(true) }
                
                manager.createNotificationChannel(prayerChannel)
                manager.createNotificationChannel(nightChannel)
            }
        }

        fun showNotification(context: Context, title: String, message: String, notificationId: Int) {
            val channelId = if (notificationId == 2001) CHANNEL_NIGHT else CHANNEL_PRAYER
            val builder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(notificationId, builder.build())
        }
    }
}`;

  const kotlinPrayerTimeManagerText = `package com.example.dailyamaal.data.local

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import java.util.Calendar

class PrayerTimeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "تنبيه"
        val message = intent.getStringExtra("message") ?: "حان وقت العمل"
        val notificationId = intent.getIntExtra("notification_id", 0)
        NotificationHelper.showNotification(context, title, message, notificationId)
    }
}

class DailyResetReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // سيتم ربطه لاحقاً بقاعدة البيانات لإعادة تعيين الأعمال
    }
}

class PrayerTimeManager(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun scheduleNotification(
        hour: Int, minute: Int,
        title: String, message: String,
        notificationId: Int,
        advanceMinutes: Int = 10
    ) {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute - advanceMinutes)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(Calendar.getInstance())) add(Calendar.DAY_OF_MONTH, 1)
        }

        val intent = Intent(context, PrayerTimeReceiver::class.java).apply {
            putExtra("title", title)
            putExtra("message", message)
            putExtra("notification_id", notificationId)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context, notificationId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.cancel(pendingIntent)
        alarmManager.setRepeating(
            AlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            pendingIntent
        )
    }

    fun scheduleAllPrayerNotifications() {
        // الفجر
        scheduleNotification(4, 30, "🕌 صلاة الفجر", "حان وقت صلاة الفجر والنافلة قبلها", 1001, 15)
        // الظهر
        scheduleNotification(12, 0, "🕌 صلاة الظهر", "حان وقت صلاة الظهر. لا تنس نافلة الظهر 8 ركعات", 1002, 10)
        // العصر
        scheduleNotification(15, 30, "🕌 صلاة العصر", "حان وقت صلاة العصر. لا تنس نافلة العصر 8 ركعات", 1003, 10)
        // المغرب
        scheduleNotification(18, 0, "🕌 صلاة المغرب", "حان وقت صلاة المغرب. نافلة المغرب بعد الفريضة", 1004, 5)
        // العشاء
        scheduleNotification(19, 30, "🕌 صلاة العشاء", "حان وقت صلاة العشاء. لا تنس صلاة الوتيرة", 1005, 10)
    }

    fun scheduleNightPrayerNotification() {
        scheduleNotification(3, 0, "🌙 صلاة الليل", "وقت السحر. صلاة الليل 11 ركعة تزيد في الرزق", 2001, 0)
    }

    fun scheduleDailyReset() {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 1)
            set(Calendar.SECOND, 0)
            add(Calendar.DAY_OF_MONTH, 1)
        }
        val intent = Intent(context, DailyResetReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context, 4001, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, AlarmManager.INTERVAL_DAY, pendingIntent)
    }
}`;

  const kotlinAndroidManifestText = `<!-- 1. أذونات الإشعارات والمنبهات الفورية (Permissions) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- 2. مستقبلات البث لاستلام إشارات الصلوات والتصفير اليومي (Receivers inside <application>) -->
<receiver android:name=".data.local.PrayerTimeReceiver" android:exported="false" />
<receiver android:name=".data.local.DailyResetReceiver" android:exported="false" />`;

  const kotlinUtilsText = `import java.util.Calendar
import java.util.GregorianCalendar

fun getCurrentTimeLabel(): String {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 4..5 -> "الفجر"
        in 6..11 -> "الصباح"
        in 12..13 -> "الظهر"
        in 14..16 -> "العصر"
        in 17..18 -> "المغرب"
        in 19..21 -> "العشاء"
        else -> "الليل"
    }
}

fun getHijriDate(): String {
    val today = Calendar.getInstance()
    val day = today.get(Calendar.DAY_OF_MONTH)
    val month = today.get(Calendar.MONTH) + 1
    val year = today.get(Calendar.YEAR)
    
    // خوارزمية تحويل تقريبية (للتمثيل فقط، قد تحتاج مكتبة متخصصة لدقة 100%)
    val jd = (1461 * (year + 4800 + (month - 14) / 12)) / 4 + (367 * (month - 2 - 12 * ((month - 14) / 12))) / 12 - (3 * ((year + 4900 + (month - 14) / 12) / 100)) / 4 + day - 32075
    val l = jd - 1948440 + 10632
    val n = ((l - 1) / 10631).toInt()
    val l2 = l - 10631 * n + 354
    val j = ((10985 - l2) / 5316) * ((50 * l2) / 17719) + (l2 / 5670) * ((43 * l2) / 15238)
    val l3 = l2 - ((30 - j) / 15) * ((17719 * j) / 50) - (j / 16) * ((15238 * j) / 43) + 29
    val hijriMonth = ((24 * l3) / 709).toInt()
    val hijriDay = (l3 - ((709 * hijriMonth) / 24)).toInt()
    val hijriYear = (30 * n + j - 30).toInt()
    
    val months = arrayOf("محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة")
    
    return "$hijriDay \${months[hijriMonth - 1]} $hijriYear"
}

fun getTodayOccasion(hijriMonth: Int, hijriDay: Int): String {
    // قائمة مختصرة جداً، يمكنك التوسع لاحقاً
    return when {
        hijriMonth == 9 && hijriDay == 19 -> "ليلة القدر (الضربة)"
        hijriMonth == 9 && hijriDay == 21 -> "ذكرى استشهاد الإمام علي (ع)"
        hijriMonth == 12 && hijriDay == 9 -> "يوم عرفة المبارك"
        hijriMonth == 12 && hijriDay == 10 -> "عيد الأضحى المبارك"
        hijriMonth == 12 && hijriDay == 18 -> "عيد الغدير الأغر"
        hijriMonth == 1 && hijriDay == 10 -> "ذكرى عاشوراء"
        // أضف باقي المناسبات
        else -> ""
    }
}`;

  const kotlinSummaryExportHelperText = `package com.example.dailyamaal.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class SummaryExportHelper(private val context: Context) {

    fun exportViewToImage(view: View): Uri? {
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        view.draw(canvas)

        return saveBitmapToGallery(bitmap)
    }

    private fun saveBitmapToGallery(bitmap: Bitmap): Uri? {
        val fileName = "موجز_الأعمال_\${System.currentTimeMillis()}.png"

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // أندرويد 10+
            val contentValues = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/زاد_العباد")
            }
            val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            uri?.let {
                context.contentResolver.openOutputStream(it)?.use { outputStream ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                }
            }
            uri
        } else {
            // أندرويد 9 وما دون
            val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "زاد_العباد")
            if (!dir.exists()) dir.mkdirs()
            val file = File(dir, fileName)
            FileOutputStream(file).use { outputStream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            }
            Uri.fromFile(file)
        }
    }

    fun shareImage(uri: Uri) {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(shareIntent, "مشاركة الموجز عبر"))
    }
}`;

  // Get active month's data array
  const activeMonthAmaalList = selectedMonth === 'رجب' 
    ? MONTHLY_RAJAB_AMAAL 
    : selectedMonth === 'شعبان' 
      ? MONTHLY_SHABAN_AMAAL 
      : MONTHLY_RAMADAN_AMAAL;

  // Generate dynamic Kotlin Room seed file content for Rajab/Shaban/Ramadan Monthly Amaal
  const generateKotlinMonthlySeedText = () => {
    const itemsCode = activeMonthAmaalList.map(item => {
      const escapedTitle = item.title.replace(/"/g, '\\"');
      const escapedHowTo = item.how_to.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const escapedVirtue = item.virtue.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const escapedFullText = (item.full_text || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const escapedNotes = (item.notes || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      return `        MonthlyWorkEntity(
            month = "${item.month}",
            dayType = "${item.day_type}",
            dayNumber = ${item.day_number},
            title = "${escapedTitle}",
            workType = "${item.work_type}",
            howTo = "${escapedHowTo}",
            virtue = "${escapedVirtue}",
            fullText = "${escapedFullText}",
            notes = "${escapedNotes}"
        )`;
    }).join(",\n");

    const objectName = selectedMonth === 'رجب' 
      ? 'RajabAmaalSeed' 
      : selectedMonth === 'شعبان' 
        ? 'ShabanAmaalSeed' 
        : 'RamadanAmaalSeed';

    return `package com.example.dailyamaal.data.local.utils

import com.example.dailyamaal.data.local.entity.MonthlyWorkEntity

object ${objectName} {
    val list = listOf(
${itemsCode}
    )
}`;
  };

  const kotlinMonthlySeedText = generateKotlinMonthlySeedText();

  // Filter works dynamically for interactive simulator
  const filteredRajabWorks = activeMonthAmaalList.filter(work => {
    const matchQuery = rajabQuery.trim() === '' || 
      work.title.toLowerCase().includes(rajabQuery.toLowerCase()) ||
      work.how_to.toLowerCase().includes(rajabQuery.toLowerCase()) ||
      work.virtue.toLowerCase().includes(rajabQuery.toLowerCase()) ||
      (work.full_text && work.full_text.toLowerCase().includes(rajabQuery.toLowerCase())) ||
      (work.notes && work.notes.toLowerCase().includes(rajabQuery.toLowerCase()));

    const matchType = rajabTypeFilter === 'all' || work.work_type === rajabTypeFilter;
    const matchDayType = rajabDayTypeFilter === 'all' || work.day_type === rajabDayTypeFilter;
    const matchDay = rajabDayFilter === 'all' || work.day_number === Number(rajabDayFilter);

    return matchQuery && matchType && matchDayType && matchDay;
  });

  return (
    <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5" dir="rtl">
      {/* Title block */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-800" />
          <span className="font-serif font-bold text-emerald-950 text-sm">مستكشف قاعدة البيانات والـ DAO والـ Backup</span>
        </div>
        <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200">
          Room DB Map &amp; SQLite Schema
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-stone-600 leading-relaxed">
        أدوات متكاملة للمطورين وهواة البرمجة لاستكشاف كيفية إسقاط وتوافق هيكلية هذا اللوح التعبدي الإلكتروني على قاعدة بيانات الأجهزة الذكية الكلاسيكية (Room SQL Table Entity) مع إمكانيات النسخ الاحتياطي التام.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 text-xs overflow-x-auto whitespace-nowrap scrollbar-none pb-[2px] -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('entity')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'entity'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          الكيان (Entity)
        </button>
        <button
          onClick={() => setActiveTab('dao')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'dao'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          الوسيط (DAO)
        </button>
        <button
          onClick={() => setActiveTab('appdatabase')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 ${
            activeTab === 'appdatabase'
              ? 'border-emerald-800 text-emerald-850 font-extrabold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-800" />
          <span>قاعدة البيانات (AppDatabase v2)</span>
        </button>
        <button
          onClick={() => setActiveTab('viewmodel')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'viewmodel'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          العارض (ViewModel)
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'compose'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          شاشة العرض (Compose)
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'activity'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          الرئيسية (MainActivity)
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>إشعارات الأندرويد (Notifications)</span>
        </button>
        <button
          onClick={() => setActiveTab('utils')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'utils'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          دالة الوقت (Utils)
        </button>
        <button
          onClick={() => setActiveTab('sqlite')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'sqlite'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          مخطط SQLite Schema
        </button>
        <button
          onClick={() => setActiveTab('rajab-amaal')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 ${
            activeTab === 'rajab-amaal'
              ? 'border-amber-500 text-amber-850 font-extrabold bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Moon className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
          <span>أعمال رجب وشعبان (البيانات)</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 font-bold border-b-2 -mb-[2px] transition-all cursor-pointer flex-shrink-0 ${
            activeTab === 'backup'
              ? 'border-emerald-800 text-emerald-850'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          أخذ نسخة احتياطية (JSON)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="text-xs">
        
        {/* ENTITY TAB */}
        {activeTab === 'entity' && (
          <div className="space-y-5">
            {/* DailyWorkEntity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>1. كيان جدول أعمال الـ Room DB اليومي المتطابق (DailyWorkEntity):</span>
                <button
                  onClick={() => copyTextToClipboard('entity-daily', kotlinDbEntityText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'entity-daily' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinDbEntityText}
              </pre>
            </div>

            {/* MonthlyWorkEntity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>2. كيان جدول أعمال الـ Room DB الشهري المتطابق (MonthlyWorkEntity) [مثل رجب، شعبان، رمضان]:</span>
                <button
                  onClick={() => copyTextToClipboard('entity-monthly', kotlinMonthlyDbEntityText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'entity-monthly' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinMonthlyDbEntityText}
              </pre>
            </div>

            {/* HadithEntity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>3. كيان جدول الـ Hadith المضاف للإصدار الثاني لقاعدة البيانات (HadithEntity):</span>
                <button
                  onClick={() => copyTextToClipboard('entity-hadith', kotlinHadithEntityText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'entity-hadith' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinHadithEntityText}
              </pre>
            </div>

            {/* Hadiths Seed Code */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>4. دالة توليد بيانات الـ 30 حديثًا الأولى للتهيئة لـ HadithEntity في نظام الأندرويد (getFirst30Hadiths):</span>
                <button
                  onClick={() => copyTextToClipboard('entity-hadith-seed', kotlinHadithSeedText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'entity-hadith-seed' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left max-h-[250px]" dir="ltr">
                {kotlinHadithSeedText}
              </pre>
            </div>

            {/* Hadiths Remaining Seed Code */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>5. دالة توليد الأحاديث المتبقية (31-148 و 256-360) للتهيئة لـ HadithEntity في نظام الأندرويد (getRemainingHadiths):</span>
                <button
                  onClick={() => copyTextToClipboard('entity-hadith-remaining-seed', kotlinHadithRemainingSeedText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'entity-hadith-remaining-seed' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left max-h-[250px]" dir="ltr">
                {kotlinHadithRemainingSeedText}
              </pre>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200/50 text-[11px] text-amber-900 rounded-lg">
              <strong>ملاحظة مطابقة:</strong> حقول واجهة مستخدم الويب في <code>types.ts</code> مثل (<code>title</code>, <code>type</code>, <code>time</code>, <code>description</code>, <code>isCompleted</code>) تم إسقاطها بشكل كلي للتطابق التام مع مخطط الكائن البرمجي المحلي بأعمدة SQLite لجداول الأعمال، وكذلك جدول الأحاديث يطابق حقول العرض.
            </div>
          </div>
        )}

        {/* DAO TAB */}
        {activeTab === 'dao' && (
          <div className="space-y-5">
            {/* DailyWorkDao */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>1. واجهة الـ DAO البرمجية للأعمال اليومية (DailyWorkDao):</span>
                <button
                  onClick={() => copyTextToClipboard('dao-daily', kotlinDaoText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'dao-daily' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinDaoText}
              </pre>
            </div>

            {/* MonthlyWorkDao */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>2. واجهة الـ DAO البرمجية للأعمال الشهرية (MonthlyWorkDao) [مثل رجب، شعبان، رمضان]:</span>
                <button
                  onClick={() => copyTextToClipboard('dao-monthly', kotlinMonthlyDaoText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'dao-monthly' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinMonthlyDaoText}
              </pre>
            </div>

            {/* HadithDao */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>3. واجهة الـ DAO البرمجية للأحاديث النبوية مضافة للنسخة الثانية (HadithDao):</span>
                <button
                  onClick={() => copyTextToClipboard('dao-hadith', kotlinHadithDaoText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'dao-hadith' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinHadithDaoText}
              </pre>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 text-[11px] text-stone-600 rounded-lg space-y-1">
              <span className="font-bold text-stone-850 block">مكافئ العمليات محلياً بالويب:</span>
              <p>• استعلام <code>getAllDailyWorks</code> مُمثّل بمفاعيل الاسترجاع من <code>localStorage</code> مع تفنيد الحالات.</p>
              <p>• عملية <code>insertWork</code> و <code>updateWork</code> و <code>deleteWork</code> مُمثلة عبر حالة مصفوفة React وإعادة الحفظ.</p>
            </div>
          </div>
        )}

        {/* APPDATABASE TAB */}
        {activeTab === 'appdatabase' && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl space-y-2">
              <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <span>🗄️</span>
                <span>فئة بناء وتوسيع قاعدة بيانات Room (AppDatabase - النسخة الثانية v2)</span>
              </h4>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                تقوم فئة <code>AppDatabase</code> ببرمجة وتجميع الكيانات الثلاثة (الأعمال اليومية، الأوردة الشهرية، وأحاديث الأخلاق والسلوك لـ 360 يومًا) تحت ترويسة واحدة موثَّقة للنسخة رقم 2 (Version 2). تدير الفئة كود الإنشاء والتحديث التدميري الآمن (fallbackToDestructiveMigration) لتقديم تجربة حيوية خالية من تشوه البيانات في نظام الأندرويد.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>كود المصدر الكامل لفئة قاعدة البيانات المتكاملة (AppDatabase.kt):</span>
                <button
                  onClick={() => copyTextToClipboard('appdb-code', kotlinAppDatabaseText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'appdb-code' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left animate-fade-in" dir="ltr">
                {kotlinAppDatabaseText}
              </pre>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 text-[11px] text-stone-600 rounded-lg space-y-1.5 leading-relaxed">
              <span className="font-bold text-stone-850 block">مفاتيح التثبيت (Room Compilation Keys):</span>
              <p>• <strong>Entities (الجداول الشريكة):</strong> <code>DailyWorkEntity</code> و <code>MonthlyWorkEntity</code> و <code>HadithEntity</code>.</p>
              <p>• <strong>Database Version (النسخة):</strong> <code>2</code> (شاملة للأعمال ومرويات الأثر الشريف بتمامها).</p>
              <p>• <strong>DAOs (الوسائط البرمجية):</strong> <code>dailyWorkDao()</code> و <code>monthlyWorkDao()</code> و <code>hadithDao()</code>.</p>
            </div>
          </div>
        )}

        {/* VIEWMODEL TAB */}
        {activeTab === 'viewmodel' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
              <span>الفئة الحاكمة والـ ViewModel لإدارة الأوراد وتعديل الإنجاز بقشرة التطبيقات:</span>
              <button
                onClick={() => copyTextToClipboard('viewmodel', kotlinViewModelText)}
                className="text-emerald-850 hover:underline font-serif"
              >
                {copied === 'viewmodel' ? 'تم نسخ الكود!' : 'نسخ الكود'}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
              {kotlinViewModelText}
            </pre>
            <div className="p-3 bg-emerald-50/50 border border-emerald-150 text-[11px] text-emerald-900 rounded-lg space-y-1">
              <span className="font-bold text-emerald-950 block">مواءمة البيانات:</span>
              <p>تتوافق قائمة التأسيس المبدئية للأعمال الصالحة (مثل الصلوات الخمس المكتوبة، تسبيح الزهراء، دعاء الصباح، وزيارة عاشوراء المختصرة) كلياً مع قائمة البداية المقررة في الكود المتأصل بالـ ViewModel للأجهزة الذكية.</p>
            </div>
          </div>
        )}

        {/* COMPOSE TAB */}
        {activeTab === 'compose' && (
          <div className="space-y-3">
            {/* Sub-tabs Selector */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-stone-100 border border-stone-200 rounded-xl max-w-fit">
              <button
                type="button"
                onClick={() => setSelectedComposeSubTab('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedComposeSubTab === 'list'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                1. قائمة الأوراد (DailyWorksScreen.kt)
              </button>
              <button
                type="button"
                onClick={() => setSelectedComposeSubTab('summary')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedComposeSubTab === 'summary'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                2. شاشة الموجز الجديدة (DailySummaryScreen.kt)
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
              <span>
                {selectedComposeSubTab === 'list'
                  ? 'واجهة قائمة الأوراد المبوّبة بالـ Jetpack Compose (DailyWorksScreen):'
                  : 'واجهة ملخص الإنجازات اليومية وبطاقة التصدير بالـ Jetpack Compose (DailySummaryScreen):'}
              </span>
              <button
                onClick={() =>
                  copyTextToClipboard(
                    selectedComposeSubTab === 'list' ? 'compose' : 'compose-summary',
                    selectedComposeSubTab === 'list' ? kotlinComposeScreenText : kotlinDailySummaryScreenText
                  )
                }
                className="text-emerald-850 hover:underline font-serif"
              >
                {copied === (selectedComposeSubTab === 'list' ? 'compose' : 'compose-summary')
                  ? 'تم نسخ الكود!'
                  : 'نسخ الكود'}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left max-h-[380px]" dir="ltr">
              {selectedComposeSubTab === 'list' ? kotlinComposeScreenText : kotlinDailySummaryScreenText}
            </pre>

            {selectedComposeSubTab === 'list' ? (
              <div className="p-3 bg-teal-50 border border-teal-150 text-[11px] text-teal-900 rounded-lg space-y-1">
                <span className="font-bold text-teal-950 block">مواءمة واجهة قائمة الأوراد الـ (UI Alignment):</span>
                <p>• تعتمد واجهة Jetpack Compose على تجميع الأوراد حسب أوقات اليوم <code>groupedWorks</code> وعرض عنوان الوقت بشكل مميز (مثل الفجر، الظهر، المغرب، الليل)، وهو ما يتكامل تماماً مع تنظيم وتفريد وعرض مجموعات الأوراد بالويب!</p>
                <p>• تعتمد واجهة الـ Compose بطاقة <code>DailyWorkCard</code> مجهزة بـ <code>IconButton</code> لإنجاز ودعم التعديل الفوري لحالة الورد، وهو مطابق تماماً للبطاقة الحديثة التفاعلية بموقع الويب.</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-[11px] text-emerald-900 rounded-lg space-y-1">
                <span className="font-bold text-emerald-950 block">مبادئ تصميم شاشة الموجز (DailySummaryScreen Design):</span>
                <p>• تعتمد هذه الشاشة Compose على عرض النسب والإحصائيات وتصنيف الأوراد إلى <strong>منجز (Completed)</strong> بلون أخضر مريح، و<strong>متبقي (Remaining)</strong> بلون ذهبي/برتقالي لتعزيز امتثال ومتابعة المحاسبة الذاتية.</p>
                <p>• يتضمن الكود زراً لتصدير البطاقة (Export Report as Social Card Image) لمشاركتها مع العائلة أو للتذكير الشخصي، ويتصل مباشرة بـ Room Database لإحضار البيانات المحدثة تلقائياً.</p>
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
              <span>نقطة دخول التطبيق الأساسية (Android MainActivity):</span>
              <button
                onClick={() => copyTextToClipboard('activity', kotlinMainActivityText)}
                className="text-emerald-850 hover:underline font-serif"
              >
                {copied === 'activity' ? 'تم نسخ الكود!' : 'نسخ الكود'}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left text-[10px]" dir="ltr">
              {kotlinMainActivityText}
            </pre>
            <div className="p-3 bg-stone-50 border border-stone-200 text-[11px] text-stone-600 rounded-lg space-y-1">
              <span className="font-bold text-stone-850 block">مكافئ تشغيل التطبيق (Bootstrapping):</span>
              <p>• تقوم فئة <code>MainActivity</code> بتدشين شاشة <code>DailyWorksScreen</code> فور تشغيل التطبيق على الهاتف الذكي.</p>
              <p>• بالمثل، تُحاكي هذه الواجهة التفاعلية بالويب نفس الانسيابية بتهيئة الـ <code>App.tsx</code> الذي يقوم بجمع وتنظيم وتوزيع وعرض مكونات الأوراد والأعمال اليومية ومؤشرات الإكمال بسلاسة فائقة متطابقة كلياً.</p>
            </div>
          </div>
        )}

        {/* UTILS TAB */}
        {activeTab === 'utils' && (
          <div className="space-y-3">
            {/* Sub-tabs Selector */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-stone-100 border border-stone-200 rounded-xl max-w-fit">
              <button
                type="button"
                onClick={() => setSelectedUtilsSubTab('utils')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedUtilsSubTab === 'utils'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                1. دوال الهجري والوقت (Utils.kt)
              </button>
              <button
                type="button"
                onClick={() => setSelectedUtilsSubTab('export')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedUtilsSubTab === 'export'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                2. أداة تصدير الصور والمشاركة (SummaryExportHelper.kt)
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
              <span>
                {selectedUtilsSubTab === 'utils'
                  ? 'دوال تحديد الفترة الزمنية الحالية وحساب التاريخ الهجري (Utils.kt):'
                  : 'أداة تصدير شاشات الأندرويد لصور وحفظها في المعرض ومشاركتها (SummaryExportHelper.kt):'}
              </span>
              <button
                onClick={() =>
                  copyTextToClipboard(
                    selectedUtilsSubTab === 'utils' ? 'utils' : 'export-helper',
                    selectedUtilsSubTab === 'utils' ? kotlinUtilsText : kotlinSummaryExportHelperText
                  )
                }
                className="text-emerald-850 hover:underline font-serif"
              >
                {copied === (selectedUtilsSubTab === 'utils' ? 'utils' : 'export-helper')
                  ? 'تم نسخ الكود!'
                  : 'نسخ الكود'}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left text-[10px] max-h-[380px]" dir="ltr">
              {selectedUtilsSubTab === 'utils' ? kotlinUtilsText : kotlinSummaryExportHelperText}
            </pre>

            {selectedUtilsSubTab === 'utils' ? (
              <div className="p-3 bg-indigo-50 border border-indigo-150 text-[11px] text-indigo-900 rounded-lg space-y-1">
                <span className="font-bold text-indigo-950 block">مواءمة الفترات الزمنية للصلوات والأوراد:</span>
                <p>• تُستعمل الدالة <code>getCurrentTimeLabel</code> للتقسيم الديناميكي الفوري للفترات استنادًا إلى الساعة الحالية من اليوم.</p>
                <p>• لقد قمنا كذلك بدمج هذا المنطق الذكي في الواجهة الرئيسية للويب لتسليط الضوء بلطف على الفترة الحالية والـ Amaal الموصى بها لهذا الوقت بالذات لتنسجم دقة التصميم وتوجيه المؤمنين بأعلى درجات السلاسة.</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-[11px] text-emerald-900 rounded-lg space-y-1">
                <span className="font-bold text-emerald-950 block">مبادئ التقاط ومشاركة الإنجازات اليومية:</span>
                <p>• تدعم فئة <code>SummaryExportHelper</code> تحويل واجهة العرض (View) كلياً لـ <code>Bitmap</code> ورسمها على كائن Canvas، مما يفعل آلية التقاط صورة الموجز بدقة.</p>
                <p>• متوافقة تماماً مع متطلبات أندرويد 10+ (Android Q) باستخدام <code>MediaStore</code> ومسار حفظ مخصص باسم التطبيق <code>زاد_العباد</code> ليعزز تجربة المستخدمين وبنيتهم التحتية لحفظ التقارير كصورة ومشاركتها مع الأقارب.</p>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            {/* NotificationHelper */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>1. منسق قنوات ومصمم الإشعارات المحلّي (NotificationHelper.kt):</span>
                <button
                  onClick={() => copyTextToClipboard('helper', kotlinNotificationHelperText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'helper' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left max-h-[220px]" dir="ltr">
                {kotlinNotificationHelperText}
              </pre>
            </div>

            {/* PrayerTimeManager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>2. مدير التنبيهات ومستقبل البث المجدول للصلوات وتصفير الأعمال (PrayerTimeManager.kt):</span>
                <button
                  onClick={() => copyTextToClipboard('manager', kotlinPrayerTimeManagerText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'manager' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left max-h-[300px]" dir="ltr">
                {kotlinPrayerTimeManagerText}
              </pre>
            </div>

            {/* Android Manifest Permissions & Receivers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                <span>3. أذونات ومستقبلات ملف التعريف الأساسي (AndroidManifest.xml):</span>
                <button
                  onClick={() => copyTextToClipboard('manifest', kotlinAndroidManifestText)}
                  className="text-emerald-850 hover:underline font-serif"
                >
                  {copied === 'manifest' ? 'تم نسخ الكود!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
                {kotlinAndroidManifestText}
              </pre>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-150 text-[11px] text-emerald-900 rounded-lg space-y-2">
              <span className="font-bold text-emerald-950 block">مكافئ التنبيهات بالمتصفح (Browser Notification Equivalence):</span>
              <p>• تعتمد الأكواد أعلاه بالـ Android على نظام <strong>AlarmManager</strong> لإطلاق الـ BroadcastReceivers في دقة تامة وتنبيه المستخدم بمشهد صوتي واهتزاز كامل.</p>
              <p>• بالمثل، يوظف موقع الويب في شاشة <strong>مفكرة التنبيهات</strong> نظام توقيت محلي فائق الدقة (مستند لـ LocalStorage) لتشغيل رنين سماوي وئيم (Serene Chime) وتنشيط إشعارات سطح المكتب (Desktop Standard Notifications) واللوحات الإرشادية الفورية للتطابق السلس بالمهام!</p>
            </div>
          </div>
        )}

        {/* SQLITE TAB */}
        {activeTab === 'sqlite' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
              <span>أوامر بناء محرك وجداول قاعدة البيانات الذاتية (SQLite DDL):</span>
              <button
                onClick={() => copyTextToClipboard('sqlite', sqliteSchemaText)}
                className="text-emerald-850 hover:underline font-serif"
              >
                {copied === 'sqlite' ? 'تم نسخ الاستعلام!' : 'نسخ الاستعلام'}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-250 font-mono rounded-xl overflow-x-auto text-[11px] leading-relaxed text-left" dir="ltr">
              {sqliteSchemaText}
            </pre>
            <div className="p-3 bg-emerald-50/50 border border-emerald-150 text-[11px] text-emerald-900 rounded-lg">
              ترتبط الأعمال الدورية بجدول مستقل للسجل التاريخي <code>completion_history</code> يُمكّن محرك الويب من استرجاع تراكم الإنجازات اليومية للأيام والأعوام السابقة بسلاسة وبساطة تامة وخلفية منخفضة العبء.
            </div>
          </div>
        )}
        {activeTab === 'rajab-amaal' && (
          <div className="space-y-4">
            {/* Header with Switcher */}
            <div className="bg-gradient-to-l from-amber-50 to-stone-50 border border-amber-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                    <Moon className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                    أعمال شهر {selectedMonth === 'رجب' ? 'رجب الأصب' : selectedMonth === 'شعبان' ? 'شعبان المعظم' : 'رمضان العظيم'} المبارك (البيانات والـ Seeding)
                  </h4>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed mt-1">
                    تصفح {activeMonthAmaalList.length} عملاً تعبدياً لشهر {selectedMonth} المبارك مبرمجاً كملف بيانات بالكامل، للتصدير البرمجي لـ Room Database في بيئة Android.
                  </p>
                </div>

                {/* Switcher Buttons */}
                <div className="flex bg-stone-200/60 p-1 rounded-xl w-fit border border-stone-200 gap-1 overflow-x-auto flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth('رجب');
                      setRajabDayFilter('all');
                      setExpandedRajabItem(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedMonth === 'رجب'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 fill-current" />
                    <span>أعمال رجب (٤٥ عمل)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth('شعبان');
                      setRajabDayFilter('all');
                      setExpandedRajabItem(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedMonth === 'شعبان'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 fill-current" />
                    <span>أعمال شعبان ({MONTHLY_SHABAN_AMAAL.length} عمل)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth('رمضان');
                      setRajabDayFilter('all');
                      setExpandedRajabItem(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedMonth === 'رمضان'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 fill-current text-amber-200" />
                    <span>أعمال رمضان ({MONTHLY_RAMADAN_AMAAL.length} عمل)</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => setShowKotlinSeed(!showKotlinSeed)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    showKotlinSeed
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showKotlinSeed ? 'مستعرض الجدول التفاعلي' : `عرض كود التأسيس Kotlin (${selectedMonth})`}</span>
                </button>
              </div>
            </div>

            {!showKotlinSeed ? (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-stone-200 text-stone-600 font-bold text-xs">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
                    <span>تصفح وتصفية الأعمال التعبدية لشهر {selectedMonth}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                    {/* Search Title */}
                    <div className="relative">
                      <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، الكيفية، الثواب..."
                        value={rajabQuery}
                        onChange={(e) => setRajabQuery(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 h-9"
                      />
                    </div>

                    {/* Filter Type */}
                    <div>
                      <select
                        value={rajabTypeFilter}
                        onChange={(e: any) => setRajabTypeFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 h-9 cursor-pointer"
                      >
                        <option value="all">كل الأنواع (الجميع)</option>
                        <option value="صلاة">صلاة</option>
                        <option value="دعاء">دعاء</option>
                        <option value="ذكر">ذكر</option>
                        <option value="صيام">صيام</option>
                        <option value="غسل">غسل</option>
                        <option value="زيارة">زيارة</option>
                        <option value="عبادة">عبادة</option>
                      </select>
                    </div>

                    {/* Filter DayType */}
                    <div>
                      <select
                        value={rajabDayTypeFilter}
                        onChange={(e: any) => setRajabDayTypeFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 h-9 cursor-pointer"
                      >
                        <option value="all">يوم / ليلة (الجميع)</option>
                        <option value="يوم">يوم</option>
                        <option value="ليلة">ليلة</option>
                      </select>
                    </div>

                    {/* Filter DayNumber */}
                    <div>
                      <select
                        value={rajabDayFilter === 'all' ? 'all' : rajabDayFilter}
                        onChange={(e: any) => setRajabDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 h-9 cursor-pointer"
                      >
                        <option value="all">اليوم من {selectedMonth} (كل الأيام)</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>اليوم {day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-stone-550 pt-1">
                    <span>عدد الأعمال المطابقة للتصفية الحالية لـ {selectedMonth}: <strong className="text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded-sm">{filteredRajabWorks.length} عمل</strong></span>
                    {(rajabQuery || rajabTypeFilter !== 'all' || rajabDayTypeFilter !== 'all' || rajabDayFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setRajabQuery('');
                          setRajabTypeFilter('all');
                          setRajabDayTypeFilter('all');
                          setRajabDayFilter('all');
                        }}
                        className="text-red-700 hover:text-red-800 hover:underline font-bold cursor-pointer"
                      >
                        إلغاء التصفية وإعادة تعيين
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid List */}
                {filteredRajabWorks.length === 0 ? (
                  <div className="p-10 border border-dashed border-stone-300 text-center rounded-2xl text-stone-400 space-y-2 bg-stone-50/50">
                    <AlertTriangle className="w-8 h-8 mx-auto text-amber-500/80 mb-1" />
                    <p className="font-bold text-xs text-stone-600">لم يتم العثور على أي عمل مطابق لمحددات التصفية في {selectedMonth}</p>
                    <p className="text-[10px] text-stone-500">يرجى تغيير شروط التصفية أو إلغاء البحث للوصول لكافة ملف البيانات.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                    {filteredRajabWorks.map((work) => {
                      const absoluteIndex = activeMonthAmaalList.indexOf(work);
                      const isExpanded = expandedRajabItem === absoluteIndex;
                      
                      // Work Badge Styling
                      let badgeBg = 'bg-stone-100 text-stone-750';
                      if (work.work_type === 'صلاة') badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-150';
                      else if (work.work_type === 'دعاء') badgeBg = 'bg-blue-50 text-blue-800 border-blue-150';
                      else if (work.work_type === 'صيام') badgeBg = 'bg-amber-50 text-amber-850 border-amber-150';
                      else if (work.work_type === 'زيارة') badgeBg = 'bg-purple-50 text-purple-800 border-purple-150';
                      else if (work.work_type === 'غسل') badgeBg = 'bg-cyan-50 text-cyan-850 border-cyan-150';
                      else if (work.work_type === 'ذكر') badgeBg = 'bg-indigo-50 text-indigo-800 border-indigo-150';
                      else if (work.work_type === 'عبادة') badgeBg = 'bg-teal-50 text-teal-800 border-teal-150';

                      return (
                        <div 
                          key={absoluteIndex}
                          className="bg-white border border-stone-200 hover:border-emerald-600/40 hover:shadow-xs transition-all rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            {/* Metadata Badges */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeBg}`}>
                                  {work.work_type}
                                </span>
                                <span className="text-[10px] font-extrabold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-md">
                                  {work.day_type === 'ليلة' ? '🌙 ليلة' : '☀️ يوم'} {work.day_number} {selectedMonth}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-stone-400">#Index_{absoluteIndex + 1}</span>
                            </div>

                            {/* Title */}
                            <h5 className="font-serif font-bold text-stone-850 text-xs leading-normal">
                              {work.title}
                            </h5>

                            {/* how to */}
                            <div className="bg-stone-50 border border-stone-150/60 p-2.5 rounded-lg space-y-1">
                              <div className="text-[10px] text-stone-400 font-extrabold flex items-center gap-1">
                                <SlidersHorizontal className="w-3 h-3 text-stone-400" />
                                <span>كيفية الأداء (how_to):</span>
                              </div>
                              <p className="text-[11px] text-stone-650 leading-relaxed font-sans font-medium">{work.how_to}</p>
                            </div>

                            {/* virtue */}
                            <div className="p-2.5 bg-amber-500/[0.01] border border-amber-200/50 rounded-lg space-y-1">
                              <div className="text-[10px] text-amber-800 font-extrabold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                                <span>الفضل والثواب (virtue):</span>
                              </div>
                               <p className="text-[11px] text-stone-600 leading-relaxed italic">{work.virtue}</p>
                            </div>

                            {/* Expanding Block for text / notes */}
                            {isExpanded && (
                              <div className="pt-2.5 border-t border-stone-200 space-y-2.5">
                                {work.full_text && (
                                  <div className="bg-emerald-950 text-emerald-100 p-3 rounded-lg space-y-1.5 font-serif text-[11px] leading-relaxed text-center">
                                    <span className="font-bold text-amber-300 block text-right border-b border-emerald-900 pb-1 mb-1">البيان والنص الكامل (full_text):</span>
                                    <p className="whitespace-pre-line leading-loose select-all">{work.full_text}</p>
                                  </div>
                                )}
                                {work.notes && (
                                  <div className="bg-amber-50 border border-amber-100 text-amber-950 p-2.5 rounded-lg space-y-0.5 text-[10px]">
                                    <span className="font-bold text-amber-900 block">هوامش وملاحظات تعقيبية (notes):</span>
                                    <p className="leading-relaxed">{work.notes}</p>
                                  </div>
                                )}
                                <div className="bg-stone-900 text-stone-300 p-2.5 rounded-lg font-mono text-[9px] space-y-1 text-left" dir="ltr">
                                  <span className="font-bold text-[10px] text-emerald-400 block pb-1 border-b border-stone-800 text-right" dir="rtl">تمثيل الـ Room SQL DB Model:</span>
                                  <div>MONTH_WORKS | MONTH: "{selectedMonth}" | DAY_TYPE: "{work.day_type}" | {work.day_number} | TITLE: "{work.title}"</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {(work.full_text || work.notes) && (
                            <button
                              type="button"
                              onClick={() => setExpandedRajabItem(isExpanded ? null : absoluteIndex)}
                              className="mt-2 text-stone-600 hover:text-emerald-950 font-bold text-[10px] border border-stone-200 bg-stone-50 hover:bg-emerald-50/55 py-1.5 rounded-lg w-full transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <BookOpen className="w-3 h-3 text-emerald-850" />
                              <span>{isExpanded ? 'إغلاق النص والتفسير الهامشي' : 'عرض النص الكامل وملاحظات الغرفة'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-stone-550 font-semibold">
                  <span>أوراد شهر {selectedMonth} الـ {activeMonthAmaalList.length} كفئة متكاملة جاهزة للتأسيس (Kotlin Seed Resource):</span>
                  <button
                    type="button"
                    onClick={() => copyTextToClipboard('monthly-seed', kotlinMonthlySeedText)}
                    className="text-emerald-850 hover:text-emerald-950 hover:underline font-serif flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-150 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied === 'monthly-seed' ? 'تم نسخ الكود!' : 'نسخ الكود بالكامل'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-stone-900 text-stone-200 font-mono rounded-xl overflow-x-auto text-[10px] leading-relaxed text-left max-h-[420px]" dir="ltr">
                  {kotlinMonthlySeedText}
                </pre>
                <div className="p-3 bg-amber-400/10 text-amber-950 rounded-lg text-[11px] border border-amber-300/30">
                  <strong>نصيحة للمطور لأجهزة Android:</strong> يمكنك إنشاء ملف باسم <code>{selectedMonth === 'رجب' ? 'RajabAmaalSeed.kt' : selectedMonth === 'شعبان' ? 'ShabanAmaalSeed.kt' : 'RamadanAmaalSeed.kt'}</code> ببيئة الأندرويد ونسخ الكود المتكامل المولد تلقائياً أعلاه، ثم استدعاؤه بداخل فئة الـ <code>ViewModel</code> أو الـ <code>Repository</code> المخططة بقابلية تامة لتخزين وتأسيس قاعدة البيانات بنقرة واحدة!
                </div>
              </div>
            )}
          </div>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <h4 className="font-bold text-stone-850">إدارة وتحميل النسخ الاحتياطية (Backup Management)</h4>
              <p className="text-stone-500 leading-relaxed text-[11px]">
                تستطيع تحميل كامل قائمة الأوراد المخصصة التي قمت بتسجيلها وتأسيسها مع سجلات وتواريخ إنجازاتك الشخصية كملف مشفّر ومفهرس بصيغة <strong>JSON</strong> ونقلها إلى أي هاتف أو متصفح آخر لضمان الحفاظ والوقاية من فقد السجل.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1.5">
                {/* Export Card */}
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير النسخة الاحتياطية (Download.json)</span>
                </button>

                {/* Import Label and Input wrapper */}
                <label className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold rounded-lg shadow-sm cursor-pointer transition-colors text-xs select-none">
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>استيراد واستعادة من ملف (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Notifications */}
            {importSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>تم استعادة قاعدة بيانات وورد أعمالك والتواريخ بنجاح تام! تم تحديث الصفحة بسلاسة.</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>فشل الاستيراد: {importError}</span>
              </div>
            )}

            {/* Clear all database safeguard row */}
            <div className="p-4 bg-red-50/40 border border-red-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <span className="font-bold text-red-800 block">إعادة تهيئة مخزن البيانات</span>
                <span className="text-red-600/80 text-[10px] block">
                  سيؤدي هذا الخيار إلى حذف كل السجلات التاريخية المسجلة وتصفير العداد والأعمال المخصصة والرجوع لقائمة الـ Setup المبدئية الشاملة.
                </span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('🚨 تحذير: هل أنت متأكد تماماً من رغبتك في مسح كل سجلاتك وتنزيهاتك والعودة كلياً لخيارات التثبيت وإعدادات المصنع؟ هذا الإجراء لا يمكن الرجوع عنه.')) {
                    onClearAllData();
                    alert('تم إعادة تعيين قاعدة المتابعة المخصصة بنجاح.');
                  }
                }}
                className="flex items-center justify-center gap-1 px-3 py-1.5 border border-red-250 text-red-700 hover:bg-red-50 rounded-lg font-semibold cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف وتصفير القاعدة</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

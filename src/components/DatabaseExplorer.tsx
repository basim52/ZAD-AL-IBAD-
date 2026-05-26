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
  const [activeTab, setActiveTab] = useState<'entity' | 'dao' | 'viewmodel' | 'compose' | 'activity' | 'utils' | 'sqlite' | 'rajab-amaal' | 'backup' | 'notifications'>('entity');
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
);`;

  const kotlinDbEntityText = `@Entity(tableName = "daily_works")
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

  const kotlinDaoText = `@Dao
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

            <div className="p-3 bg-amber-50/50 border border-amber-200/50 text-[11px] text-amber-900 rounded-lg">
              <strong>ملاحظة مطابقة:</strong> حقول واجهة مستخدم الويب في <code>types.ts</code> مثل (<code>title</code>, <code>type</code>, <code>time</code>, <code>description</code>, <code>isCompleted</code>) تم إسقاطها بشكل كلي للتطابق التام مع مخطط الكائن البرمجي المحلي بأعمدة SQLite.
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

            <div className="p-3 bg-stone-50 border border-stone-200 text-[11px] text-stone-600 rounded-lg space-y-1">
              <span className="font-bold text-stone-850 block">مكافئ العمليات محلياً بالويب:</span>
              <p>• استعلام <code>getAllDailyWorks</code> مُمثّل بمفاعيل الاسترجاع من <code>localStorage</code> مع تفنيد الحالات.</p>
              <p>• عملية <code>insertWork</code> و <code>updateWork</code> و <code>deleteWork</code> مُمثلة عبر حالة مصفوفة React وإعادة الحفظ.</p>
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

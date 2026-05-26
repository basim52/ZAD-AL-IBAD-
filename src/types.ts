export type AmaalType = 'صلاة' | 'دعاء' | 'زيارة' | 'تعقيب' | 'عام';

export type AmaalTime = 'الفجر' | 'الظهر' | 'العصر' | 'المغرب' | 'العشاء' | 'الليل' | 'الصباح';

export interface DailyWork {
  id: string; // Unique ID (string to accommodate dynamically created client-side IDs)
  title: string; // اسم العمل
  type: AmaalType; // نوع العمل
  time: AmaalTime; // وقت الأداء
  description: string; // وصف مختصر أو كيفية الأداء
  content?: string; // النص الكامل للذكر أو الدعاء أو الزيارة للقراءة
  isCompleted: boolean; // حالة الإنجاز لليوم الحالي
  isCustom?: boolean; // هل تمت إضافته من قبل المستخدم؟
  orderIndex?: number; // الترتيب داخل المجموعة
  occasion?: string; // مناسبة مرتبطة (اختياري)
}

export interface DayCompletion {
  date: string; // YYYY-MM-DD
  completedIds: string[]; // IDs of works completed on this date
}

export interface MonthlyWork {
  month: string;
  day_type: 'يوم' | 'ليلة';
  day_number: number;
  title: string;
  work_type: 'صلاة' | 'دعاء' | 'ذكر' | 'صيام' | 'غسل' | 'زيارة' | 'عبادة';
  how_to: string;
  virtue: string;
  full_text?: string;
  notes?: string;
}

export interface AmaalState {
  works: DailyWork[];
  history: Record<string, string[]>; // date string -> array of completed IDs
  streak: number;
}

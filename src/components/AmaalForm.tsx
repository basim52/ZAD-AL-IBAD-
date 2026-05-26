import React, { useState, useEffect } from 'react';
import { DailyWork, AmaalType, AmaalTime } from '../types';
import { X, Save, Plus } from 'lucide-react';

interface AmaalFormProps {
  onClose: () => void;
  onSave: (work: DailyWork) => void;
  editingWork?: DailyWork | null;
}

const TYPES: AmaalType[] = ['صلاة', 'نافلة', 'دعاء', 'زيارة', 'تعقيب', 'ملخص', 'عام'];
const TIMES: AmaalTime[] = ['الفجر', 'الصباح', 'الظهر', 'العصر', 'المغرب', 'العشاء', 'الليل'];

export default function AmaalForm({ onClose, onSave, editingWork }: AmaalFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AmaalType>('عام');
  const [time, setTime] = useState<AmaalTime>('الصباح');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [occasion, setOccasion] = useState('');

  useEffect(() => {
    if (editingWork) {
      setTitle(editingWork.title);
      setType(editingWork.type);
      setTime(editingWork.time);
      setDescription(editingWork.description);
      setContent(editingWork.content || '');
      setOrderIndex(editingWork.orderIndex || 0);
      setOccasion(editingWork.occasion || '');
    }
  }, [editingWork]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newWork: DailyWork = {
      id: editingWork?.id || `custom-${Date.now()}`,
      title: title.trim(),
      type,
      time,
      description: description.trim(),
      content: content.trim() ? content.trim() : undefined,
      isCompleted: editingWork ? editingWork.isCompleted : false,
      isCustom: true,
      orderIndex: orderIndex > 0 ? orderIndex : undefined,
      occasion: occasion.trim() ? occasion.trim() : undefined,
    };

    onSave(newWork);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div 
        id="amaal-form-container"
        className="w-full max-w-lg overflow-hidden border bg-stone-50 border-stone-250 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-900 border-stone-200 text-stone-100">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <span className="font-serif text-lg font-bold">
              {editingWork ? 'تعديل عمل عبادي' : 'إضافة عمل عبادي جديد'}
            </span>
          </div>
          <button 
            id="close-form-btn"
            onClick={onClose} 
            className="p-1 rounded-full text-stone-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-1">اسم العمل العبادي *</label>
            <input
              id="amal-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دعاء التوسل، سورة الواقعة..."
              className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-emerald-900 mb-1">النوع</label>
              <select
                id="amal-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as AmaalType)}
                className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-emerald-900 mb-1">وقت الاداء</label>
              <select
                id="amal-time-select"
                value={time}
                onChange={(e) => setTime(e.target.value as AmaalTime)}
                className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Order Index */}
            <div>
              <label className="block text-sm font-semibold text-emerald-900 mb-1">الترتيب داخل المجموعة</label>
              <input
                id="amal-order-index-input"
                type="number"
                min={0}
                value={orderIndex === 0 ? '' : orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value) || 0)}
                placeholder="مثال: 1, 2, 3..."
                className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
              />
            </div>

            {/* Occasion */}
            <div>
              <label className="block text-sm font-semibold text-emerald-900 mb-1">مناسبة مرتبطة (اختياري)</label>
              <input
                id="amal-occasion-input"
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="مثال: ليلة الجمعة، شهر رمضان..."
                className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-1">وصف مختصر أو كيفية الأداء *</label>
            <textarea
              id="amal-desc-input"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: يقرأ لقضاء الحوائج وله ركعتان قبل التلاوة..."
              className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Full Text Content */}
          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-1">النص الكامل أو التلاوة (اختياري)</label>
            <textarea
              id="amal-content-input"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب نص الدعاء، الزيارة، أو التعقيب الكامل لكي يظهر في وضع القراءة المريح..."
              className="w-full px-3 py-2 border rounded-lg bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm font-serif"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            id="cancel-form-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            إلغاء
          </button>
          <button
            id="save-form-btn"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ العمل</span>
          </button>
        </div>
      </div>
    </div>
  );
}

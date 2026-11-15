import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { CategoryType } from '../types';
import {
  QUESTION_CONFIGS,
  QuestionConfig,
  SECTIONS,
  SECTION_ORDER
} from '../config/questions';
import { compressQuestionnairePhoto } from '../utils/imageCompressor';
import { savePhotoToIndexedDB, getPhotoFromIndexedDB } from '../utils/photoStorage';
import { useTheme } from '../ThemeContext';

interface QuestionnaireRendererProps {
  category: CategoryType;
  outletId: string;
  visitId: string;
  isAiRunning: boolean;
  aiProgressPercent?: number;
  onComplete: (answers: Record<string, any>, newProducts: Array<Record<string, any>>) => void;
  onBackToCapture: () => void;
}

const NEW_PRODUCT_FIELDS = [
  'np_photo',
  'np_brand',
  'np_brand_other',
  'np_subcat',
  'np_pack',
  'np_price',
  'np_desc'
] as const;

const ISSUE_WHEN_YES = new Set(['os_damaged']);
const ISSUE_WHEN_NO = new Set(['os_price_tag_ok', 'os_shelf_strip', 'os_wobblers']);

function isQuestionVisible(
  q: QuestionConfig,
  answers: Record<string, any>,
  category: CategoryType
): boolean {
  if (q.scope !== 'all' && !q.scope.includes(category)) {
    return false;
  }
  if (q.show_if) {
    const depVal = answers[q.show_if.id];
    if (q.show_if.equals !== undefined && depVal !== q.show_if.equals) {
      return false;
    }
    if (q.show_if.notEquals !== undefined && depVal === q.show_if.notEquals) {
      return false;
    }
  }
  return true;
}

function isValueEmpty(q: QuestionConfig, val: any): boolean {
  if (val === undefined || val === null) return true;
  if (q.type === 'number') {
    const str = String(val).trim();
    return str === '' || Number.isNaN(Number(str));
  }
  if (typeof val === 'string') {
    return val.trim() === '';
  }
  return false;
}

function hasActiveNewProductDraft(answers: Record<string, any>): boolean {
  return NEW_PRODUCT_FIELDS.some((field) => {
    const v = answers[field];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });
}

export const QuestionnaireRenderer: React.FC<QuestionnaireRendererProps> = ({
  category,
  outletId,
  visitId,
  isAiRunning,
  aiProgressPercent = 50,
  onComplete,
  onBackToCapture
}) => {
  const { isDark } = useTheme();
  const autosaveKey = `mta_questionnaire_${visitId}_${outletId}_${category}`;
  const newProductsAutosaveKey = `${autosaveKey}_new_products`;

  // Answers state pre-populated with defaults + localStorage restore
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    QUESTION_CONFIGS.forEach((q) => {
      if (q.default !== undefined) {
        initial[q.id] = q.default;
      }
    });

    try {
      const saved =
        localStorage.getItem(autosaveKey) ||
        localStorage.getItem(`mta_questionnaire_${outletId}_${category}`);
      if (saved) {
        return { ...initial, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore corrupt autosave
    }

    return initial;
  });

  // Saved additional new products in Block 3 loop
  const [newProductsList, setNewProductsList] = useState<Array<Record<string, any>>>(() => {
    try {
      const saved = localStorage.getItem(newProductsAutosaveKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore corrupt autosave
    }
    return [];
  });

  // 5-block navigation: 0..4 correspond to SECTION_ORDER [2, 3, 4, 5, 6]; 5 = completed/AI wait
  const [blockIndex, setBlockIndex] = useState<number>(0);
  const [highestVisitedBlock, setHighestVisitedBlock] = useState<number>(0);

  // Validation error field IDs for current block
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());

  // Photo thumbnail preview cache keyed by photoId or dataUrl
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  const activePhotoFieldRef = useRef<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef<boolean>(false);

  // Persist answers & newProductsList to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(autosaveKey, JSON.stringify(answers));
    } catch (err) {
      console.warn('[Questionnaire] Autosave answers warning:', err);
    }
  }, [answers, autosaveKey]);

  useEffect(() => {
    try {
      localStorage.setItem(newProductsAutosaveKey, JSON.stringify(newProductsList));
    } catch (err) {
      console.warn('[Questionnaire] Autosave newProducts warning:', err);
    }
  }, [newProductsList, newProductsAutosaveKey]);

  // Hydrate photo thumbnails from IndexedDB for any stored photoIds
  useEffect(() => {
    const candidateIds: string[] = [];
    QUESTION_CONFIGS.forEach((q) => {
      if (q.type === 'photo') {
        const val = answers[q.id];
        if (typeof val === 'string' && val.length > 0 && !photoPreviews[val]) {
          candidateIds.push(val);
        }
      }
    });
    newProductsList.forEach((item) => {
      if (typeof item.np_photo === 'string' && item.np_photo.length > 0 && !photoPreviews[item.np_photo]) {
        candidateIds.push(item.np_photo);
      }
    });

    candidateIds.forEach((photoKey) => {
      if (photoKey.startsWith('data:')) {
        setPhotoPreviews((prev) => ({ ...prev, [photoKey]: photoKey }));
      } else {
        getPhotoFromIndexedDB(photoKey).then((cached) => {
          if (cached) {
            setPhotoPreviews((prev) => ({ ...prev, [photoKey]: cached }));
          }
        });
      }
    });
  }, [answers, newProductsList, photoPreviews]);

  const isCompleted = blockIndex >= SECTION_ORDER.length;

  // Compute merged New Products list on completion and fire onComplete once AI finishes
  const finalNewProducts = useMemo(() => {
    if (answers.np_seen !== 'Yes') return [];
    const list = [...newProductsList];
    const hasDraft =
      answers.np_brand ||
      answers.np_photo ||
      answers.np_subcat ||
      answers.np_pack ||
      (answers.np_price !== undefined && answers.np_price !== null && String(answers.np_price).trim() !== '');

    if (hasDraft) {
      list.push({
        np_photo: answers.np_photo,
        np_brand: answers.np_brand,
        np_brand_other: answers.np_brand_other,
        np_subcat: answers.np_subcat,
        np_pack: answers.np_pack,
        np_price: answers.np_price,
        np_desc: answers.np_desc
      });
    }
    return list;
  }, [answers, newProductsList]);

  useEffect(() => {
    if (isCompleted && !isAiRunning && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete(answers, finalNewProducts);
    }
  }, [isCompleted, isAiRunning, answers, finalNewProducts, onComplete]);

  // Questions belonging to the active block
  const currentSectionId = SECTION_ORDER[blockIndex];
  const currentSectionQuestions = useMemo(() => {
    if (!currentSectionId) return [];
    return QUESTION_CONFIGS.filter(
      (q) => q.section === currentSectionId && (q.scope === 'all' || q.scope.includes(category))
    );
  }, [currentSectionId, category]);

  // Root questions (no show_if) in the active block, plus recursive visible children helper
  const rootQuestions = useMemo(() => {
    const sectionIds = new Set(currentSectionQuestions.map((q) => q.id));
    return currentSectionQuestions.filter(
      (q) => !q.show_if || !sectionIds.has(q.show_if.id)
    );
  }, [currentSectionQuestions]);

  const getVisibleChildren = useCallback(
    (parentId: string): QuestionConfig[] => {
      return currentSectionQuestions.filter(
        (q) =>
          q.show_if?.id === parentId &&
          isQuestionVisible(q, answers, category)
      );
    },
    [currentSectionQuestions, answers, category]
  );

  // Update answer & clear validation error for that field
  const updateAnswer = useCallback((id: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // If user sets a brand away from 'Other', clear the 'brand_other' field cleanly
      if (id.endsWith('_brand') && value !== 'Other') {
        delete next[`${id}_other`];
      }
      return next;
    });
    setMissingFields((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Handle photo upload/capture for any photo question
  const triggerPhotoPicker = (fieldId: string, source: 'camera' | 'gallery') => {
    activePhotoFieldRef.current = fieldId;
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetField = activePhotoFieldRef.current;
    if (!file || !targetField) return;

    setIsProcessingPhoto(true);
    try {
      const compressedDataUrl = await compressQuestionnairePhoto(file, 1600, 0.7);
      const photoId = `photo_${outletId}_${targetField}_${Date.now()}`;
      await savePhotoToIndexedDB(photoId, visitId, compressedDataUrl);

      setPhotoPreviews((prev) => ({ ...prev, [photoId]: compressedDataUrl }));
      updateAnswer(targetField, photoId);
    } catch (err) {
      console.error('[Questionnaire] Photo capture error:', err);
    } finally {
      setIsProcessingPhoto(false);
      activePhotoFieldRef.current = null;
      e.target.value = '';
    }
  };

  // Validate required visible fields in the current block
  const validateCurrentBlock = useCallback((): string[] => {
    const missing: string[] = [];
    const skipBlankExtraNewProduct =
      currentSectionId === 4 &&
      answers.np_seen === 'Yes' &&
      newProductsList.length > 0 &&
      !hasActiveNewProductDraft(answers);

    currentSectionQuestions.forEach((q) => {
      if (!q.required) return;
      if (!isQuestionVisible(q, answers, category)) return;
      if (
        skipBlankExtraNewProduct &&
        q.id !== 'np_seen' &&
        NEW_PRODUCT_FIELDS.includes(q.id as (typeof NEW_PRODUCT_FIELDS)[number])
      ) {
        return;
      }
      if (isValueEmpty(q, answers[q.id])) {
        missing.push(q.id);
      }
    });

    return missing;
  }, [currentSectionId, currentSectionQuestions, answers, category, newProductsList.length]);

  // Add current active new product to newProductsList and reset draft fields
  const handleAddAnotherNewProduct = () => {
    const npQuestions = currentSectionQuestions.filter(
      (q) =>
        q.id !== 'np_seen' &&
        NEW_PRODUCT_FIELDS.includes(q.id as (typeof NEW_PRODUCT_FIELDS)[number]) &&
        isQuestionVisible(q, answers, category)
    );

    const missingNp = npQuestions
      .filter((q) => q.required && isValueEmpty(q, answers[q.id]))
      .map((q) => q.id);

    if (missingNp.length > 0) {
      setMissingFields((prev) => {
        const next = new Set(prev);
        missingNp.forEach((id) => next.add(id));
        return next;
      });
      const el = document.getElementById(`q-row-${missingNp[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const entry = {
      np_photo: answers.np_photo,
      np_brand: answers.np_brand,
      np_brand_other: answers.np_brand_other,
      np_subcat: answers.np_subcat,
      np_pack: answers.np_pack,
      np_price: answers.np_price,
      np_desc: answers.np_desc
    };

    setNewProductsList((prev) => [...prev, entry]);
    setAnswers((prev) => {
      const next = { ...prev };
      NEW_PRODUCT_FIELDS.forEach((f) => {
        delete next[f];
      });
      return next;
    });
    setMissingFields((prev) => {
      const next = new Set(prev);
      NEW_PRODUCT_FIELDS.forEach((f) => next.delete(f));
      return next;
    });
  };

  const handleRemoveSavedNewProduct = (idx: number) => {
    setNewProductsList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Block navigation
  const handleNextBlock = () => {
    const missing = validateCurrentBlock();
    if (missing.length > 0) {
      setMissingFields(new Set(missing));
      const el = document.getElementById(`q-row-${missing[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setMissingFields(new Set());
    const nextIdx = blockIndex + 1;
    setBlockIndex(nextIdx);
    setHighestVisitedBlock((prev) => Math.max(prev, Math.min(nextIdx, SECTION_ORDER.length - 1)));
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (blockIndex > 0) {
      setMissingFields(new Set());
      setBlockIndex((prev) => prev - 1);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBackToCapture();
    }
  };

  const handleSegmentClick = (targetIdx: number) => {
    if (targetIdx === blockIndex) return;
    if (targetIdx < blockIndex) {
      setMissingFields(new Set());
      setBlockIndex(targetIdx);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetIdx <= highestVisitedBlock) {
      const missing = validateCurrentBlock();
      if (missing.length > 0) {
        setMissingFields(new Set(missing));
        const el = document.getElementById(`q-row-${missing[0]}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      setMissingFields(new Set());
      setBlockIndex(targetIdx);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ================= AI WAITING SCREEN =================
  if (isCompleted) {
    return (
      <div
        className={`flex-1 flex flex-col justify-center items-center p-6 text-center select-none ${
          isDark ? 'bg-[#0B120E] text-[#F0FDF4]' : 'bg-[#F8FAF9] text-[#061A12]'
        }`}
      >
        <div className="w-full max-w-sm flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#047857] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-950/30">
            <RefreshCw size={28} className="text-white animate-spin stroke-[2]" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Field Intel Saved
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Reading your shelf…</h2>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Shelf vision AI is finishing facing counts and Share of Shelf.
            </p>
          </div>

          <div className="w-full space-y-2 pt-1">
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-emerald-950/60' : 'bg-slate-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(20, aiProgressPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Shelf detection</span>
              <span className="font-mono tabular-nums font-semibold text-emerald-500">
                {aiProgressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSectionMeta = SECTIONS[currentSectionId];
  const nextSectionMeta = blockIndex < SECTION_ORDER.length - 1 ? SECTIONS[SECTION_ORDER[blockIndex + 1]] : null;

  // Render a single question control + any visible conditional children underneath
  const renderQuestionTree = (q: QuestionConfig, depth = 0): React.ReactNode => {
    const val = answers[q.id];
    const hasError = missingFields.has(q.id);
    const label = q.shortLabel || q.text;
    const resolvedOptions =
      typeof q.options === 'function' ? q.options(category) : q.options || [];
    const visibleChildren = getVisibleChildren(q.id);

    const getYesNoButtonStyle = (opt: 'Yes' | 'No') => {
      const isSelected = val === opt;
      if (!isSelected) {
        return isDark
          ? 'bg-transparent text-slate-400 hover:text-slate-200'
          : 'bg-transparent text-slate-500 hover:text-slate-800';
      }
      if (opt === 'Yes' && ISSUE_WHEN_YES.has(q.id)) {
        return 'bg-rose-600 text-white shadow-xs';
      }
      if (opt === 'No' && ISSUE_WHEN_NO.has(q.id)) {
        return 'bg-rose-600 text-white shadow-xs';
      }
      if (opt === 'Yes') {
        return 'bg-emerald-600 text-white shadow-xs';
      }
      return isDark
        ? 'bg-emerald-950 text-emerald-200 border border-emerald-700/60'
        : 'bg-slate-800 text-white shadow-xs';
    };

    const renderControl = () => {
      if (q.type === 'yes_no') {
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-semibold leading-snug block ${hasError ? 'text-rose-500' : ''}`}>
                {label}
              </span>
              {hasError && (
                <span className="text-[11px] font-semibold text-rose-500 mt-0.5 block">
                  Required
                </span>
              )}
            </div>

            <div
              role="group"
              aria-label={label}
              className={`inline-flex p-1 rounded-xl shrink-0 border ${
                isDark
                  ? 'bg-black/40 border-emerald-900/50'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              {(['Yes', 'No'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateAnswer(q.id, opt)}
                  className={`min-h-[40px] min-w-[54px] px-3 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.97] ${getYesNoButtonStyle(
                    opt
                  )}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      }

      if (q.type === 'choice') {
        const useFixedGrid =
          resolvedOptions.length === 3 || resolvedOptions.length === 4;
        const gridClass =
          resolvedOptions.length === 3
            ? 'grid grid-cols-3 gap-2'
            : resolvedOptions.length === 4 && resolvedOptions.every((o) => o.length <= 10)
            ? 'grid grid-cols-4 gap-1.5'
            : useFixedGrid
            ? 'grid grid-cols-2 gap-2'
            : 'flex flex-wrap gap-2';

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${hasError ? 'text-rose-500' : ''}`}>
                {label}
              </span>
              {hasError && (
                <span className="text-[11px] font-semibold text-rose-500">Required</span>
              )}
            </div>
            <div className={gridClass}>
              {resolvedOptions.map((option) => {
                const isSelected = val === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateAnswer(q.id, option)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-[0.98] text-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : hasError
                        ? isDark
                          ? 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                          : 'bg-rose-50/40 border-rose-300 text-slate-700'
                        : isDark
                        ? 'bg-black/30 border-emerald-900/50 text-slate-300 hover:border-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      if (q.type === 'number') {
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`input-${q.id}`}
                className={`text-sm font-semibold ${hasError ? 'text-rose-500' : ''}`}
              >
                {label}
              </label>
              {hasError && (
                <span className="text-[11px] font-semibold text-rose-500">Required</span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id={`input-${q.id}`}
                type="number"
                inputMode={q.decimals ? 'decimal' : 'numeric'}
                step={q.decimals ? '0.01' : '1'}
                min="0"
                value={val ?? ''}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                placeholder={q.placeholder || '0'}
                className={`w-full min-h-[48px] px-3.5 ${
                  q.unit ? 'pr-16' : 'pr-3.5'
                } rounded-xl text-base font-bold tabular-nums border outline-none transition-colors ${
                  hasError
                    ? 'border-rose-500 focus:border-rose-500'
                    : isDark
                    ? 'bg-black/40 border-emerald-900/60 text-white placeholder-slate-500 focus:border-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
              {q.unit && (
                <span
                  className={`absolute right-3.5 text-xs font-bold tracking-wide pointer-events-none ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {q.unit}
                </span>
              )}
            </div>
          </div>
        );
      }

      if (q.type === 'text') {
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`input-${q.id}`}
                className={`text-sm font-semibold ${hasError ? 'text-rose-500' : ''}`}
              >
                {label}
              </label>
              {hasError && (
                <span className="text-[11px] font-semibold text-rose-500">Required</span>
              )}
            </div>
            <input
              id={`input-${q.id}`}
              type="text"
              value={val ?? ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              placeholder={q.placeholder || 'Enter details...'}
              className={`w-full min-h-[48px] px-3.5 rounded-xl text-sm font-medium border outline-none transition-colors ${
                hasError
                  ? 'border-rose-500 focus:border-rose-500'
                  : isDark
                  ? 'bg-black/40 border-emerald-900/60 text-white placeholder-slate-500 focus:border-emerald-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
              }`}
            />
          </div>
        );
      }

      if (q.type === 'photo') {
        const previewSrc = val ? photoPreviews[val] || (String(val).startsWith('data:') ? val : null) : null;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${hasError ? 'text-rose-500' : ''}`}>
                {label}
              </span>
              {hasError && (
                <span className="text-[11px] font-semibold text-rose-500">Photo required</span>
              )}
            </div>

            {val ? (
              <div
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={label}
                    className="h-12 w-14 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="h-12 w-14 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
                    <Check size={18} className="text-emerald-500" />
                  </div>
                )}
                <span className={`text-xs font-semibold flex-1 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  Photo attached
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerPhotoPicker(q.id, 'camera')}
                    className={`min-h-[40px] px-3 rounded-lg text-xs font-bold cursor-pointer ${
                      isDark
                        ? 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/70'
                        : 'bg-white text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAnswer(q.id, undefined)}
                    title="Remove photo"
                    className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg cursor-pointer ${
                      isDark
                        ? 'bg-black/30 text-slate-400 hover:text-rose-400'
                        : 'bg-white text-slate-500 border border-slate-200 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isProcessingPhoto}
                  onClick={() => triggerPhotoPicker(q.id, 'camera')}
                  className={`min-h-[46px] px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer active:scale-[0.98] ${
                    hasError
                      ? isDark
                        ? 'bg-rose-950/30 border-rose-500/60 text-rose-300'
                        : 'bg-rose-50 border-rose-300 text-rose-700'
                      : isDark
                      ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300 hover:border-emerald-500'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-300'
                  }`}
                >
                  <Camera size={16} />
                  <span>{isProcessingPhoto && activePhotoFieldRef.current === q.id ? 'Saving…' : 'Camera'}</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessingPhoto}
                  onClick={() => triggerPhotoPicker(q.id, 'gallery')}
                  className={`min-h-[46px] px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-[0.98] ${
                    isDark
                      ? 'bg-black/30 border-emerald-900/50 text-slate-300 hover:border-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <ImageIcon size={16} />
                  <span>Gallery</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      return null;
    };

    const isNewProductEnd = q.id === 'np_desc';

    return (
      <div
        key={q.id}
        id={`q-row-${q.id}`}
        className={depth === 0 ? 'px-4 py-3.5' : 'pt-3'}
      >
        {renderControl()}

        {/* Saved New Products summary list right under np_seen toggle */}
        {q.id === 'np_seen' && val === 'Yes' && newProductsList.length > 0 && (
          <div className="mt-3 space-y-2">
            {newProductsList.map((prod, idx) => (
              <div
                key={`${prod.np_brand}-${idx}`}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-emerald-950/30 border-emerald-800/50'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {prod.np_photo && photoPreviews[prod.np_photo] && (
                    <img
                      src={photoPreviews[prod.np_photo]}
                      alt="New product"
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">
                      #{idx + 1} · {prod.np_brand === 'Other' ? prod.np_brand_other : prod.np_brand}
                    </p>
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {prod.np_subcat} · {prod.np_pack} · {prod.np_price} QAR
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSavedNewProduct(idx)}
                  className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'
                  }`}
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <p className={`text-[11px] font-semibold pt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              New product #{newProductsList.length + 1} (optional)
            </p>
          </div>
        )}

        {/* Inline conditional children */}
        {visibleChildren.length > 0 && (
          <div
            className={`mt-3 pl-3.5 border-l-2 space-y-1 ${
              isDark ? 'border-emerald-700/60' : 'border-emerald-500/40'
            }`}
          >
            {visibleChildren.map((child) => renderQuestionTree(child, depth + 1))}
          </div>
        )}

        {/* "+ Add another new product" button at bottom of New Product details */}
        {isNewProductEnd && answers.np_seen === 'Yes' && (
          <div className="pt-3">
            <button
              type="button"
              onClick={handleAddAnotherNewProduct}
              className={`w-full min-h-[44px] px-3.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'border-emerald-600/60 text-emerald-300 hover:bg-emerald-950/40'
                  : 'border-emerald-500/60 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Plus size={15} />
              <span>Add another new product</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex-1 flex flex-col justify-between max-w-lg mx-auto w-full h-full overflow-hidden select-none ${
        isDark ? 'bg-[#0B120E] text-[#F0FDF4]' : 'bg-[#F8FAF9] text-[#061A12]'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 pt-3 pb-2.5 space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBack}
            className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#132219]/80 border-emerald-900/50 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-xs'
            }`}
            title={blockIndex === 0 ? 'Back to shelf photos' : 'Previous block'}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center">
            <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {category} · Block {blockIndex + 1} of {SECTION_ORDER.length}
            </p>
            <h1 className="text-lg font-bold tracking-tight leading-tight">
              {currentSectionMeta?.name}
            </h1>
          </div>

          <div className="min-w-[44px] text-right">
            <span
              className={`text-[11px] font-mono tabular-nums font-semibold ${
                isAiRunning
                  ? isDark
                    ? 'text-slate-400'
                    : 'text-slate-500'
                  : 'text-emerald-500'
              }`}
            >
              {isAiRunning ? `AI ${aiProgressPercent}%` : 'AI ready'}
            </span>
          </div>
        </div>

        {/* 5-Segment Block Indicator */}
        <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Questionnaire blocks">
          {SECTION_ORDER.map((secId, idx) => {
            const isActive = idx === blockIndex;
            const isPast = idx < blockIndex;
            const canTap = idx <= highestVisitedBlock;
            return (
              <button
                key={secId}
                type="button"
                disabled={!canTap}
                onClick={() => handleSegmentClick(idx)}
                title={SECTIONS[secId]?.name}
                className={`h-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-emerald-500'
                    : isPast
                    ? 'bg-emerald-500/45'
                    : isDark
                    ? 'bg-emerald-950/60'
                    : 'bg-slate-200'
                } ${canTap ? 'cursor-pointer' : 'cursor-default'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Scrollable 1-Block Form Sheet */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pt-1 pb-4 no-scrollbar"
      >
        <div
          className={`rounded-2xl border divide-y ${
            isDark
              ? 'bg-[#132219]/80 border-emerald-900/50 divide-emerald-900/40'
              : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
          }`}
        >
          {rootQuestions.map((q) => renderQuestionTree(q, 0))}
        </div>
      </div>

      {/* Hidden File Inputs for Camera & Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />

      {/* Sticky Thumb-Zone Bottom CTA */}
      <div
        className={`px-4 pt-2.5 pb-4 shrink-0 border-t ${
          isDark
            ? 'bg-[#0B120E]/95 border-emerald-950/60'
            : 'bg-[#F8FAF9]/95 border-slate-200/80'
        }`}
      >
        {missingFields.size > 0 && (
          <p className="text-xs font-semibold text-rose-500 text-center pb-2">
            Please complete highlighted required {missingFields.size === 1 ? 'field' : 'fields'}
          </p>
        )}
        <button
          type="button"
          disabled={isProcessingPhoto}
          onClick={handleNextBlock}
          className="w-full min-h-[54px] py-3.5 px-5 rounded-2xl text-sm font-bold bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] text-white shadow-lg shadow-emerald-950/25 hover:brightness-105 active:scale-[0.99] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          <span>
            {isProcessingPhoto
              ? 'Saving photo…'
              : nextSectionMeta
              ? `Next: ${nextSectionMeta.name}`
              : 'View AI Results'}
          </span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

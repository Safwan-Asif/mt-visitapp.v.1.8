import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  Camera,
  Check,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Image as ImageIcon,
  Plus,
  Loader2,
  Trash2,
  Sparkles,
  Circle
} from 'lucide-react';
import { CategoryType } from '../types';
import { useTheme } from '../ThemeContext';
import {
  QUESTION_CONFIGS,
  QuestionConfig,
  SECTIONS,
  SECTION_ORDER
} from '../config/questions';
import { savePhotoToIndexedDB, getPhotoFromIndexedDB } from '../utils/photoStorage';
import { VisionAiStatusCapsule } from './pjp/PjpPrimitives';

interface QuestionnaireRendererProps {
  category: CategoryType;
  outletId: string;
  visitId: string;
  isAiRunning: boolean;
  hasAiError?: boolean;
  aiProgressPercent: number;
  previewPhotoUrl?: string | null;
  onRetryAi?: () => void;
  onSkipWaitToManual?: () => void;
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

function isQuestionVisible(
  q: QuestionConfig,
  answers: Record<string, any>,
  category: CategoryType
): boolean {
  if (q.scope !== 'all' && !q.scope.includes(category)) return false;
  if (!q.show_if) return true;
  const parentVal = answers[q.show_if.id];
  if (q.show_if.equals !== undefined && parentVal !== q.show_if.equals) return false;
  if (q.show_if.notEquals !== undefined && parentVal === q.show_if.notEquals) return false;
  return true;
}

function isValueEmpty(q: QuestionConfig, val: any): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  if (q.type === 'number' && Number.isNaN(Number(val))) return true;
  return false;
}

async function compressQuestionnairePhoto(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to decode photo'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read photo file'));
    reader.readAsDataURL(file);
  });
}

function hasActiveNewProductDraft(answers: Record<string, any>): boolean {
  return Boolean(
    answers.np_photo ||
      answers.np_brand ||
      answers.np_subcat ||
      answers.np_pack ||
      (answers.np_price !== undefined &&
        answers.np_price !== null &&
        String(answers.np_price).trim() !== '') ||
      (answers.np_desc && String(answers.np_desc).trim() !== '')
  );
}

export const QuestionnaireRenderer: React.FC<QuestionnaireRendererProps> = ({
  category,
  outletId,
  visitId,
  isAiRunning,
  hasAiError = false,
  aiProgressPercent,
  previewPhotoUrl,
  onRetryAi,
  onSkipWaitToManual,
  onComplete,
  onBackToCapture
}) => {
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const autosaveKey = `mta_questionnaire_${visitId}_${outletId}_${category}`;
  const newProductsAutosaveKey = `${autosaveKey}_new_products`;

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

  const [newProductsList, setNewProductsList] = useState<Array<Record<string, any>>>(() => {
    try {
      const saved = localStorage.getItem(newProductsAutosaveKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore corrupt autosave
    }
    return [];
  });

  const [blockIndex, setBlockIndex] = useState<number>(0);
  const [highestVisitedBlock, setHighestVisitedBlock] = useState<number>(0);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  const activePhotoFieldRef = useRef<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef<boolean>(false);

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
      if (
        typeof item.np_photo === 'string' &&
        item.np_photo.length > 0 &&
        !photoPreviews[item.np_photo]
      ) {
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

  const finalNewProducts = useMemo(() => {
    if (answers.np_seen !== 'Yes') return [];
    const list = [...newProductsList];
    const hasDraft =
      answers.np_brand ||
      answers.np_photo ||
      answers.np_subcat ||
      answers.np_pack ||
      (answers.np_price !== undefined &&
        answers.np_price !== null &&
        String(answers.np_price).trim() !== '');

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

  const currentSectionId = SECTION_ORDER[blockIndex];
  const currentSectionQuestions = useMemo(() => {
    if (!currentSectionId) return [];
    return QUESTION_CONFIGS.filter(
      (q) => q.section === currentSectionId && (q.scope === 'all' || q.scope.includes(category))
    );
  }, [currentSectionId, category]);

  const rootQuestions = useMemo(() => {
    const sectionIds = new Set(currentSectionQuestions.map((q) => q.id));
    return currentSectionQuestions.filter((q) => !q.show_if || !sectionIds.has(q.show_if.id));
  }, [currentSectionQuestions]);

  const getVisibleChildren = useCallback(
    (parentId: string): QuestionConfig[] => {
      return currentSectionQuestions.filter(
        (q) => q.show_if?.id === parentId && isQuestionVisible(q, answers, category)
      );
    },
    [currentSectionQuestions, answers, category]
  );

  const updateAnswer = useCallback((id: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
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
    setHighestVisitedBlock((prev) =>
      Math.max(prev, Math.min(nextIdx, SECTION_ORDER.length - 1))
    );
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

  // ================= SCREEN 08: VISION AI LIVE PROCESSING BRIDGE =================
  if (isCompleted) {
    const stages = [
      { label: 'Detecting products', done: aiProgressPercent >= 25 },
      { label: 'Analysing facings', done: aiProgressPercent >= 55, active: aiProgressPercent >= 25 && aiProgressPercent < 55 },
      { label: 'Calculating Share of Shelf', done: aiProgressPercent >= 80, active: aiProgressPercent >= 55 && aiProgressPercent < 80 },
      { label: 'Checking planogram', done: aiProgressPercent >= 98, active: aiProgressPercent >= 80 }
    ];

    return (
      <div className="flex-1 flex flex-col justify-between items-center p-5 max-w-md mx-auto w-full text-center select-none animate-fade-in">
        <div className="pt-2 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#008DFF] dark:text-[#00C8FF]">
            {category} · Vision AI
          </p>
          <h2 className="font-heading font-extrabold text-[28px] leading-none text-[var(--text-primary)]">
            Processing with AI
          </h2>
        </div>

        {/* Glowing 3D Perspective Shelf Scan Frame (Matched to Screen 08) */}
        <div className="relative w-full max-w-[290px] h-48 my-4 rounded-3xl overflow-hidden border border-[#008DFF]/55 bg-[#04152B] shadow-[0_0_40px_-8px_rgba(0,141,255,0.45)] flex items-center justify-center">
          {previewPhotoUrl ? (
            <img
              src={previewPhotoUrl}
              alt="Shelf under Vision AI scan"
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <Sparkles size={36} className="text-[#00C8FF] opacity-55" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020D1F]/80 via-transparent to-[#020D1F]/40" />
          <div className="w-full h-2 bg-gradient-to-r from-transparent via-[#00C8FF] to-transparent shadow-[0_0_24px_#00C8FF] animate-scan-laser-rod absolute left-0 z-20" />
        </div>

        {/* 4-Stage Live Checklist */}
        <div className="w-full glass-panel rounded-3xl p-4 space-y-3 text-left">
          {stages.map((st) => (
            <div key={st.label} className="flex items-center gap-3 text-xs">
              {st.done ? (
                <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
              ) : st.active ? (
                <Loader2 size={16} className="text-[#00C8FF] animate-spin shrink-0" />
              ) : (
                <Circle size={15} className="text-[var(--text-muted)] shrink-0" />
              )}
              <span
                className={
                  st.done || st.active
                    ? 'font-bold text-[var(--text-primary)]'
                    : 'font-medium text-[var(--text-muted)]'
                }
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Non-trapping Manual Fallback Escape Hatch */}
        <div className="w-full pt-3">
          <button
            type="button"
            onClick={() => {
              if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onSkipWaitToManual?.();
                onComplete(answers, finalNewProducts);
              }
            }}
            className="w-full min-h-[44px] rounded-full glass-subtle text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            Enter Facings Manually Instead
          </button>
        </div>
      </div>
    );
  }

  const currentSectionMeta = SECTIONS[currentSectionId];
  const isLastBlock = blockIndex === SECTION_ORDER.length - 1;

  const renderQuestionTree = (q: QuestionConfig, depth = 0): React.ReactNode => {
    const val = answers[q.id];
    const hasError = missingFields.has(q.id);
    const label = q.text || q.shortLabel;
    const resolvedOptions =
      typeof q.options === 'function' ? q.options(category) : q.options || [];
    const visibleChildren = getVisibleChildren(q.id);

    const renderControl = () => {
      if (q.type === 'yes_no') {
        return (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[14.5px] font-bold leading-snug ${
                  hasError ? 'text-rose-500' : 'text-[var(--text-primary)]'
                }`}
              >
                {label}
              </span>
              {hasError && (
                <span className="text-[11px] font-bold text-rose-500 shrink-0">Required</span>
              )}
            </div>

            <div
              role="group"
              aria-label={label}
              className="grid grid-cols-2 gap-2"
            >
              {(['Yes', 'No'] as const).map((opt) => {
                const isSelected = val === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateAnswer(q.id, opt)}
                    className={`min-h-[44px] rounded-full text-xs font-bold transition-all cursor-pointer active:scale-[0.97] ${
                      isSelected
                        ? 'btn-electric-blue text-white'
                        : 'glass-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      if (q.type === 'choice') {
        if (resolvedOptions.length > 4) {
          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`select-${q.id}`}
                  className={`text-xs font-bold ${
                    hasError ? 'text-rose-500' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </label>
                {hasError && (
                  <span className="text-[11px] font-bold text-rose-500">Required</span>
                )}
              </div>
              <div className="relative">
                <select
                  id={`select-${q.id}`}
                  value={val ?? ''}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  className={`w-full min-h-[46px] pl-3.5 pr-9 rounded-2xl text-sm font-semibold appearance-none glass-subtle text-[var(--text-primary)] outline-none cursor-pointer ${
                    hasError
                      ? 'border-rose-500'
                      : 'focus:ring-2 focus:ring-[#008DFF]/45'
                  }`}
                >
                  <option value="" className="bg-[#04152B] text-white">
                    Choose {q.shortLabel || 'option'}
                  </option>
                  {resolvedOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#04152B] text-white">
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                />
              </div>
            </div>
          );
        }

        const gridClass =
          resolvedOptions.length === 3
            ? 'grid grid-cols-3 gap-2'
            : resolvedOptions.length === 4 && resolvedOptions.every((o) => o.length <= 12)
            ? 'grid grid-cols-2 sm:grid-cols-4 gap-2'
            : 'grid grid-cols-2 gap-2';

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[14px] font-bold ${
                  hasError ? 'text-rose-500' : 'text-[var(--text-primary)]'
                }`}
              >
                {label}
              </span>
              {hasError && (
                <span className="text-[11px] font-bold text-rose-500">Required</span>
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
                    className={`min-h-[44px] px-2.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-[0.97] text-center ${
                      isSelected
                        ? 'btn-electric-blue text-white'
                        : hasError
                        ? 'bg-rose-500/10 border border-rose-500/40 text-rose-500'
                        : 'glass-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                className={`text-xs font-bold ${
                  hasError ? 'text-rose-500' : 'text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </label>
              {hasError && (
                <span className="text-[11px] font-bold text-rose-500">Required</span>
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
                className={`w-full min-h-[46px] px-3.5 ${
                  q.unit ? 'pr-16' : 'pr-3.5'
                } rounded-2xl text-base font-bold tabular-nums glass-subtle text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors ${
                  hasError
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'focus:ring-2 focus:ring-[#008DFF]/45'
                }`}
              />
              {q.unit && (
                <span className="absolute right-3.5 text-xs font-bold tracking-wide pointer-events-none text-[var(--text-secondary)]">
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
                className={`text-xs font-bold ${
                  hasError ? 'text-rose-500' : 'text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </label>
              {hasError && (
                <span className="text-[11px] font-bold text-rose-500">Required</span>
              )}
            </div>
            <input
              id={`input-${q.id}`}
              type="text"
              value={val ?? ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              placeholder={q.placeholder || 'Enter details...'}
              className={`w-full min-h-[46px] px-3.5 rounded-2xl text-sm font-medium glass-subtle text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors ${
                hasError
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'focus:ring-2 focus:ring-[#008DFF]/45'
              }`}
            />
          </div>
        );
      }

      if (q.type === 'photo') {
        const previewSrc = val
          ? photoPreviews[val] || (String(val).startsWith('data:') ? val : null)
          : null;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold ${
                  hasError ? 'text-rose-500' : 'text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </span>
              {hasError && (
                <span className="text-[11px] font-bold text-rose-500">Photo required</span>
              )}
            </div>

            {val ? (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl glass-subtle">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={label}
                    className="h-12 w-14 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className="h-12 w-14 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                    <Check size={18} className="text-[#22C55E]" />
                  </div>
                )}
                <span className="text-xs font-bold flex-1 text-[#22C55E]">
                  Photo attached
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerPhotoPicker(q.id, 'camera')}
                    className="min-h-[38px] px-3 rounded-xl text-xs font-bold glass-panel text-[#008DFF] dark:text-[#00C8FF] cursor-pointer"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAnswer(q.id, undefined)}
                    title="Remove photo"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl glass-panel text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
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
                  className={`min-h-[44px] px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer active:scale-[0.98] ${
                    hasError
                      ? 'bg-rose-500/10 border border-rose-500/40 text-rose-500'
                      : 'glass-subtle text-[#008DFF] dark:text-[#00C8FF]'
                  }`}
                >
                  <Camera size={15} />
                  <span>
                    {isProcessingPhoto && activePhotoFieldRef.current === q.id
                      ? 'Saving…'
                      : 'Camera'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isProcessingPhoto}
                  onClick={() => triggerPhotoPicker(q.id, 'gallery')}
                  className="min-h-[44px] px-3 rounded-2xl glass-subtle text-[var(--text-primary)] flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-[0.98]"
                >
                  <ImageIcon size={15} />
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

        {q.id === 'np_seen' && val === 'Yes' && newProductsList.length > 0 && (
          <div className="mt-3 space-y-2">
            {newProductsList.map((prod, idx) => (
              <div
                key={`${prod.np_brand}-${idx}`}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl glass-subtle"
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
                    <p className="text-xs font-bold truncate text-[var(--text-primary)]">
                      #{idx + 1} ·{' '}
                      {prod.np_brand === 'Other' ? prod.np_brand_other : prod.np_brand}
                    </p>
                    <p className="text-[11px] truncate text-[var(--text-secondary)] tabular-nums">
                      {prod.np_subcat} · {prod.np_pack} · {prod.np_price} QAR
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSavedNewProduct(idx)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg cursor-pointer text-[var(--text-secondary)] hover:text-rose-500"
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <p className="text-[11px] font-semibold pt-1 text-[#008DFF] dark:text-[#00C8FF]">
              New product #{newProductsList.length + 1} (optional)
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {visibleChildren.length > 0 && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-3 pl-3 pt-2 border-t border-[var(--border-glass)] space-y-1 overflow-hidden"
            >
              {visibleChildren.map((child) => renderQuestionTree(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>

        {isNewProductEnd && answers.np_seen === 'Yes' && (
          <div className="pt-3">
            <button
              type="button"
              onClick={handleAddAnotherNewProduct}
              className="w-full min-h-[44px] px-3.5 rounded-2xl border border-dashed border-[#008DFF]/50 flex items-center justify-center gap-2 text-xs font-bold text-[#008DFF] dark:text-[#00C8FF] hover:bg-[#008DFF]/10 transition-colors cursor-pointer"
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
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full h-full overflow-hidden select-none">
      {/* Top Header + Progress + Floating Vision AI Capsule */}
      <div className="px-3.5 pt-2 pb-2.5 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
            title={blockIndex === 0 ? 'Back to shelf photos' : 'Previous block'}
            aria-label="Back"
          >
            <ChevronLeft size={19} />
          </button>

          <div className="text-center min-w-0">
            <h1 className="text-base font-extrabold tracking-tight leading-tight text-[var(--text-primary)] truncate">
              {category} Audit
            </h1>
            <p className="text-[11px] font-bold tracking-wide text-[#008DFF] dark:text-[#00C8FF] tabular-nums">
              {blockIndex + 1} of {SECTION_ORDER.length} · {currentSectionMeta?.name}
            </p>
          </div>

          <div className="w-10 shrink-0" />
        </div>

        {/* 5-Segment Block Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Questionnaire sections">
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
                    ? 'bg-[#00C8FF] shadow-[0_0_8px_#00C8FF]'
                    : isPast
                    ? 'bg-[#007AFF]'
                    : isDark
                    ? 'bg-[#104878]/50'
                    : 'bg-[#0066FF]/15'
                } ${canTap ? 'cursor-pointer' : 'cursor-default'}`}
              />
            );
          })}
        </div>

        {/* Concurrent Vision AI Status Capsule */}
        <VisionAiStatusCapsule
          isAiRunning={isAiRunning}
          hasError={hasAiError}
          progressPercent={aiProgressPercent}
          onRetryAi={onRetryAi}
        />
      </div>

      {/* Scrollable 1-Block Form Sheet */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3.5 pt-0.5 pb-4 no-scrollbar"
      >
        <motion.div
          key={currentSectionId}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="glass-panel rounded-3xl divide-y divide-[var(--border-glass)] overflow-hidden"
        >
          {rootQuestions.map((q) => renderQuestionTree(q, 0))}
        </motion.div>
      </div>

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
      <div className="px-3.5 pt-2 pb-3 shrink-0">
        {missingFields.size > 0 && (
          <p className="text-xs font-bold text-rose-500 text-center pb-2">
            Please complete highlighted required {missingFields.size === 1 ? 'field' : 'fields'}
          </p>
        )}
        <button
          type="button"
          disabled={isProcessingPhoto}
          onClick={handleNextBlock}
          className="w-full min-h-[54px] py-3.5 px-5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.97] btn-electric-blue text-white"
        >
          <span>
            {isProcessingPhoto
              ? 'Saving photo…'
              : isLastBlock
              ? 'Review Audit'
              : 'Continue'}
          </span>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};

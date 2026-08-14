'use client';

import * as React from 'react';
import {
  Calendar,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlotIndicator } from '@/components/ui/SlotIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, Column } from '@/components/ui/DataTable';
import type { TrialClass, Parent, Student, BookingWithDetails, BookingState } from '@/types/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Types for local UI state
// ---------------------------------------------------------------------------
type FeedbackType = 'success' | 'error_duplicate' | 'error_full' | 'error_payment' | 'error_unknown';

interface Feedback {
  type: FeedbackType;
  message: string;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function BookingPage() {
  const t = useTranslations('Booking');
  const tc = useTranslations('Common');
  const ts = useTranslations('Status');

  // ---- Remote data state ----
  const [parents, setParents] = React.useState<Parent[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<TrialClass[]>([]);
  const [bookings, setBookings] = React.useState<BookingWithDetails[]>([]);

  // ---- UI selection state ----
  const [selectedParentUuid, setSelectedParentUuid] = React.useState('');
  const [selectedStudentUuid, setSelectedStudentUuid] = React.useState('');
  const [selectedClassUuid, setSelectedClassUuid] = React.useState('');
  const [paymentSuccess, setPaymentSuccess] = React.useState(true);

  // ---- Loading states ----
  const [isLoadingInitial, setIsLoadingInitial] = React.useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ---- Feedback ----
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [isFormOpenMobile, setIsFormOpenMobile] = React.useState(true);
  const formRef = React.useRef<HTMLDivElement>(null);

  // ---- Derived ----
  const childrenOfParent = React.useMemo(
    () => students.filter((s) => s.students_parents_uuid === selectedParentUuid),
    [students, selectedParentUuid]
  );

  const selectedClass = classes.find((c) => c.trial_classes_uuid === selectedClassUuid);
  const isClassFull = selectedClass
    ? selectedClass.trial_classes_confirmed_count >= selectedClass.trial_classes_capacity
    : false;

  // ---- Data Fetchers ----
  const loadInitialData = React.useCallback(async () => {
    setIsLoadingInitial(true);
    try {
      const [parentsRes, studentsRes, classesRes] = await Promise.all([
        fetch('/api/parents').then((r) => r.json()),
        fetch('/api/students').then((r) => r.json()),
        fetch('/api/trial-classes').then((r) => r.json()),
      ]);

      const fetchedParents: Parent[] = parentsRes.success ? parentsRes.data : [];
      const fetchedStudents: Student[] = studentsRes.success ? studentsRes.data : [];
      const fetchedClasses: TrialClass[] = classesRes.success ? classesRes.data : [];

      setParents(fetchedParents);
      setStudents(fetchedStudents);
      setClasses(fetchedClasses);

      // Auto-select first parent, student, class
      if (fetchedParents.length > 0) setSelectedParentUuid(fetchedParents[0].parents_uuid);
      if (fetchedClasses.length > 0) setSelectedClassUuid(fetchedClasses[0].trial_classes_uuid);
    } catch {
      /* silently fail; page shows empty states */
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  const loadBookings = React.useCallback(async (parentUuid: string) => {
    if (!parentUuid) return;
    setIsLoadingBookings(true);
    try {
      const res = await fetch(`/api/bookings?parent_uuid=${parentUuid}`);
      const json = await res.json();
      setBookings(json.success ? json.data : []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // When parent changes: reset student, reload bookings
  React.useEffect(() => {
    if (!selectedParentUuid) return;
    setSelectedStudentUuid('');
    loadBookings(selectedParentUuid);
  }, [selectedParentUuid, loadBookings]);

  // Auto-select first child when parent changes
  React.useEffect(() => {
    if (childrenOfParent.length > 0) {
      setSelectedStudentUuid(childrenOfParent[0].students_uuid);
    }
  }, [childrenOfParent]);

  // ---- Form Submit ----
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentUuid || !selectedClassUuid) return;
    if (isClassFull) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_uuid: selectedStudentUuid,
          class_uuid: selectedClassUuid,
          payment_success: paymentSuccess,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        const code = json.errorCode as string;
        if (code === 'DUPLICATE_BOOKING') {
          setFeedback({ type: 'error_duplicate', message: json.error });
        } else if (code === 'CLASS_FULL') {
          setFeedback({ type: 'error_full', message: json.error });
          // Refresh classes to show updated count
          const cr = await fetch('/api/trial-classes').then((r) => r.json());
          if (cr.success) setClasses(cr.data);
        } else {
          setFeedback({ type: 'error_unknown', message: json.error || tc('errorOccurred') });
        }
        return;
      }

      // Payment success path
      const finalState: BookingState = json.data.bookings_state;
      if (finalState === 'confirmed') {
        setFeedback({ type: 'success', message: t('feedbackSuccess') });
      } else {
        setFeedback({ type: 'error_payment', message: t('feedbackPaymentFailed') });
      }

      // Refresh both classes (slot count updated) and bookings
      const [cr, br] = await Promise.all([
        fetch('/api/trial-classes').then((r) => r.json()),
        fetch(`/api/bookings?parent_uuid=${selectedParentUuid}`).then((r) => r.json()),
      ]);
      if (cr.success) setClasses(cr.data);
      if (br.success) setBookings(br.data);

    } catch {
      setFeedback({ type: 'error_unknown', message: tc('networkError') });
    } finally {
      setIsSubmitting(false);
      // Auto-clear non-error feedback after 6s
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  // ---- DataTable Columns ----
  const columns: Column<BookingWithDetails>[] = [
    {
      header: t('tableChild'),
      accessorKey: 'students_name',
      sortable: true,
      renderCell: (row) => (
        <span className="font-semibold text-slate-800">{row.students_name ?? '—'}</span>
      ),
    },
    {
      header: t('tableClass'),
      accessorKey: 'trial_classes_subject',
      renderCell: (row) => (
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-medium text-slate-700">{row.trial_classes_subject ?? '—'}</span>
        </div>
      ),
    },
    {
      header: t('tableSchedule'),
      accessorKey: 'trial_classes_start_time',
      renderCell: (row) => (
        <span className="text-slate-600">{formatDate(row.trial_classes_start_time)}</span>
      ),
    },
    {
      header: t('tableStatus'),
      accessorKey: 'bookings_state',
      renderCell: (row) => <StatusBadge status={row.bookings_state} />,
    },
    {
      header: t('tableDate'),
      accessorKey: 'bookings_create_date',
      sortable: true,
      renderCell: (row) => (
        <span className="text-slate-500 text-xs">{formatDate(row.bookings_create_date)}</span>
      ),
    },
  ];

  // Mobile card render
  const renderMobileBookingCard = (row: BookingWithDetails) => (
    <div
      key={row.bookings_uuid}
      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
            {row.students_name ?? '—'}
          </span>
          <h4 className="font-display font-bold text-slate-800 text-sm mt-1.5 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            {row.trial_classes_subject ?? '—'}
          </h4>
        </div>
        <StatusBadge status={row.bookings_state} className="shrink-0" />
      </div>
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div>
          <span className="block text-slate-400 font-medium">{t('tableSchedule')}</span>
          <span className="font-semibold text-slate-700">{formatDate(row.trial_classes_start_time)}</span>
        </div>
        <div className="text-right">
          <span className="block text-slate-400 font-medium">{t('tableDate')}</span>
          <span className="font-semibold text-slate-700">{formatDate(row.bookings_create_date)}</span>
        </div>
      </div>
    </div>
  );

  // ---- Feedback Banner ----
  const FeedbackBanner = () => {
    if (!feedback) return null;
    const cfg = {
      success: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-800', Icon: CheckCircle2, iconColor: 'text-emerald-500' },
      error_duplicate: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-800', Icon: AlertCircle, iconColor: 'text-amber-500' },
      error_full: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-800', Icon: XCircle, iconColor: 'text-rose-500' },
      error_payment: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', Icon: CreditCard, iconColor: 'text-slate-500' },
      error_unknown: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-800', Icon: AlertCircle, iconColor: 'text-rose-500' },
    }[feedback.type];

    return (
      <div className={`${cfg.bg} border rounded-xl p-3 flex items-start gap-2.5 text-xs ${cfg.text} animate-[fadeIn_0.3s_ease-out]`}>
        <cfg.Icon className={`w-4 h-4 ${cfg.iconColor} shrink-0 mt-0.5`} />
        <span>{feedback.message}</span>
      </div>
    );
  };

  // ---- Loading skeleton ----
  if (isLoadingInitial) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-slate-100 rounded-2xl" />
          <div className="lg:col-span-2 h-72 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 scale-150">
          <Sparkles className="w-72 h-72" />
        </div>
        <div className="max-w-2xl relative z-10 space-y-2">
          <span className="bg-amber-400 text-teal-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {t('heroTag')}
          </span>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-teal-50/90 text-sm leading-relaxed max-w-xl">
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Booking Form Panel */}
        <div ref={formRef} className="lg:col-span-1">
          <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/75 border-b border-slate-200/60 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">{t('formTitle')}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">{t('formSubtitle')}</CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpenMobile(!isFormOpenMobile)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 lg:hidden"
                >
                  {isFormOpenMobile ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </CardHeader>

            <div className={`${isFormOpenMobile ? 'block' : 'hidden'} lg:block`}>
              <CardContent className="p-6 space-y-6">
                <form onSubmit={handleBookingSubmit} className="space-y-5">

                  {/* Parent Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {t('fieldParent')}
                    </label>
                    <Select
                      value={selectedParentUuid}
                      onChange={(e) => setSelectedParentUuid(e.target.value)}
                      className="border-slate-200 rounded-xl focus:border-teal-500 bg-white font-medium text-slate-700 shadow-2xs w-full"
                      options={parents.map((p) => ({
                        label: p.parents_name ?? p.parents_uuid,
                        value: p.parents_uuid,
                      }))}
                    />
                  </div>

                  {/* Child Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {t('fieldStudent')}
                    </label>
                    {childrenOfParent.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t('emptyChild')}</p>
                    ) : (
                      <Select
                        value={selectedStudentUuid}
                        onChange={(e) => setSelectedStudentUuid(e.target.value)}
                        className="border-slate-200 rounded-xl focus:border-teal-500 bg-white font-medium text-slate-700 shadow-2xs w-full"
                        options={childrenOfParent.map((s) => ({
                          label: `${s.students_name ?? '—'} (${s.students_age} thn)`,
                          value: s.students_uuid,
                        }))}
                      />
                    )}
                  </div>

                  {/* Trial Class Cards */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {t('fieldClass')}
                    </label>
                    {classes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t('emptyClass')}</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                        {classes.map((cls) => {
                          const isSelected = selectedClassUuid === cls.trial_classes_uuid;
                          const isFull = cls.trial_classes_confirmed_count >= cls.trial_classes_capacity;
                          return (
                            <div
                              key={cls.trial_classes_uuid}
                              onClick={() => !isFull && setSelectedClassUuid(cls.trial_classes_uuid)}
                              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                isFull
                                  ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-teal-50/50 border-teal-500 shadow-xs ring-1 ring-teal-500/20'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-display font-bold text-slate-800 text-sm leading-tight">
                                  {cls.trial_classes_subject ?? 'Kelas tanpa nama'}
                                </h4>
                                {isFull && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                                    {t('classFullTag')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mb-3">{formatDate(cls.trial_classes_start_time)}</p>
                              <SlotIndicator
                                filled={cls.trial_classes_confirmed_count}
                                total={cls.trial_classes_capacity}
                                mode="left"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Payment Success Toggle (for testing) */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 space-y-1.5">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      {t('simulationHeader')}
                    </p>
                    <label className="flex items-center justify-between cursor-pointer gap-3">
                      <span className="text-xs text-amber-800 font-medium">
                        {paymentSuccess ? t('simulationSuccess') : t('simulationFailed')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaymentSuccess(!paymentSuccess)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                          paymentSuccess ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                            paymentSuccess ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  <FeedbackBanner />

                  <Button
                    type="submit"
                    disabled={isClassFull || isSubmitting || !selectedStudentUuid || !selectedClassUuid}
                    className={`w-full py-3 font-bold rounded-xl transition-all shadow-xs ${
                      isClassFull || !selectedStudentUuid
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'
                        : 'bg-amber-500 hover:bg-amber-600 text-white border-none hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {isSubmitting
                      ? tc('loading')
                      : isClassFull
                      ? t('btnClassFull')
                      : t('btnSubmit')}
                  </Button>
                </form>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Booking History Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-800">{t('historyTitle')}</h2>
              <p className="text-xs text-slate-400">{t('historySubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                {t('bookingCount', { count: bookings.length })}
              </span>
              <button
                onClick={() => loadBookings(selectedParentUuid)}
                disabled={isLoadingBookings}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {isLoadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={bookings}
              searchKey="students_name"
              searchPlaceholder={t('searchPlaceholder')}
              filterKey="bookings_state"
              filterPlaceholder={tc('allStatus')}
              filterOptions={[
                { label: ts('pending_payment'), value: 'pending_payment' },
                { label: ts('confirmed'), value: 'confirmed' },
                { label: ts('payment_failed'), value: 'payment_failed' },
                { label: ts('cancelled'), value: 'cancelled' },
              ]}
              defaultSortKey="bookings_create_date"
              defaultSortDirection="desc"
              mobileCardRender={renderMobileBookingCard}
              emptyState={
                <div className="py-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <EmptyState
                    icon={Calendar}
                    title={t('emptyStateTitle')}
                    description={t('emptyStateSubtitle')}
                    actionLabel={t('emptyStateBtn')}
                    onAction={() => {
                      setIsFormOpenMobile(true);
                      formRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

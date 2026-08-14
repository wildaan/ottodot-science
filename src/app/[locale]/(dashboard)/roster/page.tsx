'use client';

import * as React from 'react';
import { GraduationCap, Users, Phone, User, Calendar, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, Column } from '@/components/ui/DataTable';
import type { TrialClass, RosterParticipant } from '@/types/database';

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
// Page Component
// ---------------------------------------------------------------------------
export default function RosterPage() {
  const t = useTranslations('Roster');
  const tc = useTranslations('Common');

  // ---- Remote data state ----
  const [classes, setClasses] = React.useState<TrialClass[]>([]);
  const [participants, setParticipants] = React.useState<RosterParticipant[]>([]);

  // ---- UI state ----
  const [selectedClassUuid, setSelectedClassUuid] = React.useState('');
  const [isLoadingClasses, setIsLoadingClasses] = React.useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = React.useState(false);

  // ---- Derived ----
  const activeClass = classes.find((c) => c.trial_classes_uuid === selectedClassUuid);

  // Circular progress specs
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const filled = activeClass?.trial_classes_confirmed_count ?? 0;
  const total = activeClass?.trial_classes_capacity ?? 4;
  const strokeDashoffset = circumference - (filled / total) * circumference;

  // ---- Data Fetchers ----
  const loadClasses = React.useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const res = await fetch('/api/trial-classes');
      const json = await res.json();
      const fetchedClasses: TrialClass[] = json.success ? json.data : [];
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) setSelectedClassUuid(fetchedClasses[0].trial_classes_uuid);
    } catch {
      /* silently fail */
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  const loadRoster = React.useCallback(async (classUuid: string) => {
    if (!classUuid) return;
    setIsLoadingRoster(true);
    try {
      const res = await fetch(`/api/roster/${classUuid}`);
      const json = await res.json();
      setParticipants(json.success ? json.data : []);
    } catch {
      setParticipants([]);
    } finally {
      setIsLoadingRoster(false);
    }
  }, []);

  React.useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  React.useEffect(() => {
    if (selectedClassUuid) loadRoster(selectedClassUuid);
  }, [selectedClassUuid, loadRoster]);

  // ---- DataTable Columns ----
  const columns: Column<RosterParticipant>[] = [
    {
      header: t('tableName'),
      accessorKey: 'students_name',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-display font-extrabold text-xs shrink-0">
            {row.students_name?.charAt(0) ?? '?'}
          </div>
          {row.students_name ?? '—'}
        </div>
      ),
    },
    {
      header: t('tableParent'),
      accessorKey: 'parents_name',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {row.parents_name ?? '—'}
        </div>
      ),
    },
    {
      header: t('tableContact'),
      accessorKey: 'parents_phone',
      renderCell: (row) => (
        <a
          href={row.parents_phone ? `tel:${row.parents_phone}` : undefined}
          className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 transition-colors group"
        >
          <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 shrink-0" />
          <span className="font-mono text-xs">{row.parents_phone ?? '—'}</span>
        </a>
      ),
    },
    {
      header: t('tableConfirmedDate'),
      accessorKey: 'bookings_create_date',
      sortable: true,
      renderCell: (row) => (
        <span className="text-slate-500 text-xs">{formatDate(row.bookings_create_date)}</span>
      ),
    },
  ];

  // Mobile custom card render
  const renderMobileParticipantCard = (row: RosterParticipant) => (
    <div
      key={row.bookings_uuid}
      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-display font-black text-sm shrink-0">
          {row.students_name?.charAt(0) ?? '?'}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('tableName')}</span>
          <h4 className="font-display font-bold text-slate-800 text-sm">{row.students_name ?? '—'}</h4>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <span className="block text-slate-400 font-medium mb-0.5">{t('tableParent')}</span>
          <span className="font-semibold text-slate-700">{row.parents_name ?? '—'}</span>
        </div>
        <div>
          <span className="block text-slate-400 font-medium mb-0.5">{t('tableContact')}</span>
          <a href={row.parents_phone ? `tel:${row.parents_phone}` : undefined} className="font-mono text-teal-600 font-semibold block">
            {row.parents_phone ?? '—'}
          </a>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl px-3 py-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wide">
        <span>{t('tableConfirmedDate')}</span>
        <span className="text-slate-600 font-mono normal-case">{formatDate(row.bookings_create_date)}</span>
      </div>
    </div>
  );

  // ---- Loading skeleton ----
  if (isLoadingClasses) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-36 bg-slate-100 rounded-2xl" />
          <div className="h-36 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-600" />
            {t('title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Class Dropdown */}
        <div className="w-full md:w-80">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
            {t('fieldClass')}
          </label>
          <Select
            value={selectedClassUuid}
            onChange={(e) => setSelectedClassUuid(e.target.value)}
            className="w-full border-slate-200 rounded-xl bg-white font-medium text-slate-700 shadow-2xs focus:border-teal-500"
            options={classes.map((cls) => ({
              label: `${cls.trial_classes_subject ?? 'Kelas'} · ${formatDate(cls.trial_classes_start_time)}`,
              value: cls.trial_classes_uuid,
            }))}
          />
        </div>
      </div>

      {/* Roster Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Class Detail */}
        <Card className="md:col-span-2 border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {t('detailHeader')}
              </span>
              <h2 className="font-display font-extrabold text-slate-800 text-lg leading-tight pt-1">
                {activeClass?.trial_classes_subject ?? t('fieldClass')}
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-600">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{t('detailSchedule', { time: formatDate(activeClass?.trial_classes_start_time) })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Circular Capacity Gauge */}
        <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center justify-between gap-4 h-full">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-slate-800 text-sm">{t('capacityHeader')}</h3>
              <p className="text-xs text-slate-400">{t('capacitySubtitle')}</p>
              <div className="pt-2 font-display font-extrabold text-slate-700 text-lg">
                {t('capacityProgress', { filled, total })}
              </div>
              <button
                onClick={() => loadRoster(selectedClassUuid)}
                disabled={isLoadingRoster}
                className="flex items-center gap-1 text-[10px] text-teal-600 font-semibold hover:underline pt-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRoster ? 'animate-spin' : ''}`} />
                {tc('refresh')}
              </button>
            </div>

            {/* Circular SVG gauge */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-95" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`transition-all duration-500 ease-out ${
                    filled >= total ? 'stroke-amber-500' : 'stroke-teal-600'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute font-display font-black text-slate-700 text-sm">
                {total > 0 ? Math.round((filled / total) * 100) : 0}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participant Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-800">
              {t('title')}
            </h2>
          </div>
          <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
            {t('participantCount', { count: participants.length })}
          </div>
        </div>

        {isLoadingRoster ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={participants}
            searchKey="students_name"
            searchPlaceholder={t('searchPlaceholder')}
            defaultSortKey="bookings_create_date"
            defaultSortDirection="asc"
            mobileCardRender={renderMobileParticipantCard}
            emptyState={
              <div className="py-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <EmptyState
                  icon={Users}
                  title={t('emptyStateTitle')}
                  description={t('emptyStateSubtitle')}
                />
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

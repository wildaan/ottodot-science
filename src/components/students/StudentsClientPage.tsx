'use client';

import * as React from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw, Users, UserCheck, Mail, Phone, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Student, Parent } from '@/types/database';

interface StudentsClientPageProps {
  initialStudents: Student[];
  parents: Parent[];
}

export default function StudentsClientPage({ initialStudents, parents: initialParents }: StudentsClientPageProps) {
  const tm = useTranslations('Management');
  const tStudents = useTranslations('Students');
  const tParents = useTranslations('Parents');
  const tc = useTranslations('Common');

  // Active Tab: 'students' | 'parents'
  const [activeTab, setActiveTab] = React.useState<'students' | 'parents'>('students');

  // Data states
  const [students, setStudents] = React.useState<Student[]>(initialStudents);
  const [parents, setParents] = React.useState<Parent[]>(initialParents);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // ---- Student Modal State ----
  const [studentModalOpen, setStudentModalOpen] = React.useState(false);
  const [editStudentUuid, setEditStudentUuid] = React.useState<string | null>(null);
  const [studentName, setStudentName] = React.useState('');
  const [studentAge, setStudentAge] = React.useState<number | ''>('');
  const [studentParentUuid, setStudentParentUuid] = React.useState(initialParents[0]?.parents_uuid || '');
  const [studentErrors, setStudentErrors] = React.useState<{ name?: string; age?: string; parent?: string }>({});

  // ---- Parent Modal State ----
  const [parentModalOpen, setParentModalOpen] = React.useState(false);
  const [editParentUuid, setEditParentUuid] = React.useState<string | null>(null);
  const [parentName, setParentName] = React.useState('');
  const [parentEmail, setParentEmail] = React.useState('');
  const [parentPhone, setParentPhone] = React.useState('');
  const [parentErrors, setParentErrors] = React.useState<{ name?: string }>({});

  // Refresh All Data
  const refreshAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/students').then((r) => r.json()),
        fetch('/api/parents').then((r) => r.json()),
      ]);

      if (sRes.success) {
        setStudents(sRes.data || []);
      } else {
        setErrorMsg(sRes.error || tc('errorOccurred'));
      }

      if (pRes.success) {
        setParents(pRes.data || []);
      }
    } catch {
      setErrorMsg(tc('networkError'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to map parent name
  const getParentName = (uuid: string) => {
    const parent = parents.find((p) => p.parents_uuid === uuid);
    return parent?.parents_name || '—';
  };

  // Helper count children per parent
  const getChildrenCount = (parentUuid: string) => {
    return students.filter((s) => s.students_parents_uuid === parentUuid).length;
  };

  // =========================================================================
  // Student Form Handlers
  // =========================================================================
  const validateStudent = () => {
    const errors: typeof studentErrors = {};
    if (!studentName.trim()) errors.name = tStudents('valNameRequired');
    else if (studentName.trim().length < 2) errors.name = tStudents('valNameLength');

    if (studentAge === '') {
      errors.age = tStudents('valAgeRequired');
    } else {
      const ageNum = Number(studentAge);
      if (isNaN(ageNum) || ageNum < 2 || ageNum > 18) {
        errors.age = tStudents('valAgeRange');
      }
    }

    if (!studentParentUuid) errors.parent = tStudents('valParentRequired');

    setStudentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateStudent = () => {
    setEditStudentUuid(null);
    setStudentName('');
    setStudentAge('');
    if (parents.length > 0) setStudentParentUuid(parents[0].parents_uuid);
    setStudentErrors({});
    setStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditStudentUuid(student.students_uuid);
    setStudentName(student.students_name || '');
    setStudentAge(student.students_age || '');
    setStudentParentUuid(student.students_parents_uuid);
    setStudentErrors({});
    setStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStudent()) return;

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      students_name: studentName.trim(),
      students_age: Number(studentAge),
      students_parents_uuid: studentParentUuid,
    };

    try {
      const endpoint = editStudentUuid ? `/api/students/${editStudentUuid}` : '/api/students';
      const method = editStudentUuid ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setStudentModalOpen(false);
        await refreshAllData();
      } else {
        setErrorMsg(json.error || tc('errorOccurred'));
      }
    } catch {
      setErrorMsg(tc('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (uuid: string) => {
    if (!confirm(tStudents('deleteConfirm'))) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${uuid}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await refreshAllData();
      } else {
        setErrorMsg(json.error || tc('errorOccurred'));
      }
    } catch {
      setErrorMsg(tc('networkError'));
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // Parent Form Handlers
  // =========================================================================
  const validateParent = () => {
    const errors: typeof parentErrors = {};
    if (!parentName.trim()) errors.name = tParents('valNameRequired');
    else if (parentName.trim().length < 2) errors.name = tParents('valNameLength');

    setParentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateParent = () => {
    setEditParentUuid(null);
    setParentName('');
    setParentEmail('');
    setParentPhone('');
    setParentErrors({});
    setParentModalOpen(true);
  };

  const handleOpenEditParent = (parent: Parent) => {
    setEditParentUuid(parent.parents_uuid);
    setParentName(parent.parents_name || '');
    setParentEmail(parent.parents_email || '');
    setParentPhone(parent.parents_phone || '');
    setParentErrors({});
    setParentModalOpen(true);
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateParent()) return;

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      parents_name: parentName.trim(),
      parents_email: parentEmail.trim() || null,
      parents_phone: parentPhone.trim() || null,
    };

    try {
      const endpoint = editParentUuid ? `/api/parents/${editParentUuid}` : '/api/parents';
      const method = editParentUuid ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setParentModalOpen(false);
        await refreshAllData();
      } else {
        setErrorMsg(json.error || tc('errorOccurred'));
      }
    } catch {
      setErrorMsg(tc('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParent = async (uuid: string) => {
    if (!confirm(tParents('deleteConfirm'))) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/parents/${uuid}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await refreshAllData();
      } else {
        setErrorMsg(json.error || tc('errorOccurred'));
      }
    } catch {
      setErrorMsg(tc('networkError'));
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // DataTable Columns: Students
  // =========================================================================
  const studentColumns: Column<Student>[] = [
    {
      header: tStudents('tableName'),
      accessorKey: 'students_name',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-2.5 font-semibold text-slate-800">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-display font-bold text-xs border border-teal-100/60 shrink-0">
            {row.students_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <span className="block font-bold text-slate-800 text-sm">{row.students_name || '—'}</span>
            <span className="text-[11px] text-slate-400 font-medium sm:hidden">
              {row.students_age} {tStudents('ageSuffix')} · {getParentName(row.students_parents_uuid)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: tStudents('tableAge'),
      accessorKey: 'students_age',
      sortable: true,
      renderCell: (row) => (
        <span className="text-slate-600 font-medium text-sm">
          {row.students_age} {tStudents('ageSuffix')}
        </span>
      ),
    },
    {
      header: tStudents('tableParent'),
      accessorKey: 'students_parents_uuid',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-sm">{getParentName(row.students_parents_uuid)}</span>
        </div>
      ),
    },
    {
      header: tStudents('tableStatus'),
      accessorKey: 'students_status',
      renderCell: () => <Badge variant="success">{tc('active')}</Badge>,
    },
    {
      id: 'student_actions',
      header: tc('actions'),
      accessorKey: 'students_uuid',
      renderCell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            className="hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50"
            onClick={() => handleOpenEditStudent(row)}
            title={tStudents('editStudent')}
          >
            <Edit2 className="h-3 w-3" />
            <span className="hidden md:inline text-xs">{tc('edit')}</span>
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => handleDeleteStudent(row.students_uuid)}
            title={tc('delete')}
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden md:inline text-xs">{tc('delete')}</span>
          </Button>
        </div>
      ),
    },
  ];

  // Mobile card render for Student
  const renderMobileStudentCard = (row: Student) => (
    <div
      key={row.students_uuid}
      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-display font-bold text-sm border border-teal-100/60 shrink-0">
            {row.students_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{row.students_name || '—'}</h4>
            <span className="text-xs text-slate-500 font-medium">
              {row.students_age} {tStudents('ageSuffix')}
            </span>
          </div>
        </div>
        <Badge variant="success">{tc('active')}</Badge>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{getParentName(row.students_parents_uuid)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenEditStudent(row)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => handleDeleteStudent(row.students_uuid)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // DataTable Columns: Parents
  // =========================================================================
  const parentColumns: Column<Parent>[] = [
    {
      id: 'parent_name',
      header: tParents('tableName'),
      accessorKey: 'parents_name',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-2.5 font-semibold text-slate-800">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-display font-bold text-xs border border-amber-100/60 shrink-0">
            {row.parents_name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <span className="block font-bold text-slate-800 text-sm">{row.parents_name || '—'}</span>
            <span className="text-[11px] text-slate-400 font-medium sm:hidden">
              {row.parents_phone || row.parents_email || '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'parent_phone',
      header: tParents('tablePhone'),
      accessorKey: 'parents_phone',
      renderCell: (row) =>
        row.parents_phone ? (
          <a
            href={`tel:${row.parents_phone}`}
            className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 font-mono text-xs font-medium group"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 shrink-0" />
            {row.parents_phone}
          </a>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        ),
    },
    {
      id: 'parent_email',
      header: tParents('tableEmail'),
      accessorKey: 'parents_email',
      renderCell: (row) =>
        row.parents_email ? (
          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{row.parents_email}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        ),
    },
    {
      id: 'parent_child_count',
      header: tParents('tableChildCount'),
      accessorKey: 'parents_uuid',
      renderCell: (row) => {
        const count = getChildrenCount(row.parents_uuid);
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100/60">
            <Users className="w-3 h-3 text-teal-600" />
            {tParents('childCount', { count })}
          </span>
        );
      },
    },
    {
      id: 'parent_actions',
      header: tc('actions'),
      accessorKey: 'parents_uuid',
      renderCell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            className="hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50"
            onClick={() => handleOpenEditParent(row)}
            title={tParents('editParent')}
          >
            <Edit2 className="h-3 w-3" />
            <span className="hidden md:inline text-xs">{tc('edit')}</span>
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => handleDeleteParent(row.parents_uuid)}
            title={tc('delete')}
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden md:inline text-xs">{tc('delete')}</span>
          </Button>
        </div>
      ),
    },
  ];

  // Mobile card render for Parent
  const renderMobileParentCard = (row: Parent) => (
    <div
      key={row.parents_uuid}
      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-display font-bold text-sm border border-amber-100/60 shrink-0">
            {row.parents_name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{row.parents_name || '—'}</h4>
            <span className="text-xs text-slate-500 font-mono">
              {row.parents_phone || row.parents_email || '—'}
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700">
          {tParents('childCount', { count: getChildrenCount(row.parents_uuid) })}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
          {row.parents_email || 'No email registered'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenEditParent(row)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => handleDeleteParent(row.parents_uuid)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
              <UserCheck className="w-4 h-4" />
            </span>
            {tm('title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{tm('subtitle')}</p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={loading}
            className="rounded-xl font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{tc('refresh')}</span>
          </Button>

          {activeTab === 'students' ? (
            <Button
              size="sm"
              onClick={handleOpenCreateStudent}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tStudents('addStudent')}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleOpenCreateParent}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tParents('addParent')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Controls */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'students'
            ? 'bg-white text-teal-700 shadow-xs ring-1 ring-slate-200/70'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
        >
          <Users className="w-3.5 h-3.5 text-teal-600" />
          <span>{tm('tabStudents')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'students' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-600'
            }`}>
            {students.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('parents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'parents'
            ? 'bg-white text-teal-700 shadow-xs ring-1 ring-slate-200/70'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
        >
          <User className="w-3.5 h-3.5 text-amber-600" />
          <span>{tm('tabParents')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'parents' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'
            }`}>
            {parents.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Students DataTable */}
      {activeTab === 'students' && (
        <DataTable
          columns={studentColumns}
          data={students}
          searchKey="students_name"
          searchPlaceholder={tStudents('searchPlaceholder')}
          defaultSortKey="students_name"
          defaultSortDirection="asc"
          mobileCardRender={renderMobileStudentCard}
          emptyState={
            <div className="py-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <EmptyState
                icon={Users}
                title={tStudents('emptyStateTitle')}
                description={tStudents('emptyStateSubtitle')}
                actionLabel={tStudents('addStudent')}
                onAction={handleOpenCreateStudent}
              />
            </div>
          }
        />
      )}

      {/* Tab 2: Parents DataTable */}
      {activeTab === 'parents' && (
        <DataTable
          columns={parentColumns}
          data={parents}
          searchKey="parents_name"
          searchPlaceholder={tParents('searchPlaceholder')}
          defaultSortKey="parents_name"
          defaultSortDirection="asc"
          mobileCardRender={renderMobileParentCard}
          emptyState={
            <div className="py-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <EmptyState
                icon={User}
                title={tParents('emptyStateTitle')}
                description={tParents('emptyStateSubtitle')}
                actionLabel={tParents('addParent')}
                onAction={handleOpenCreateParent}
              />
            </div>
          }
        />
      )}

      {/* ===================================================================== */}
      {/* Student Modal */}
      {/* ===================================================================== */}
      {studentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200/80 overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 font-display">
                {editStudentUuid ? tStudents('editStudent') : tStudents('addStudentHeader')}
              </h2>
              <button
                onClick={() => setStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {tStudents('fieldName')}
                  </label>
                  <Input
                    placeholder={tStudents('fieldNamePlaceholder')}
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    error={studentErrors.name}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {tStudents('fieldAge')}
                  </label>
                  <Input
                    type="number"
                    placeholder={tStudents('fieldAgePlaceholder')}
                    value={studentAge}
                    onChange={(e) => setStudentAge(e.target.value === '' ? '' : Number(e.target.value))}
                    error={studentErrors.age}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {tStudents('fieldParent')}
                  </label>
                  <Select
                    options={parents.map((p) => ({
                      label: `${p.parents_name} (${p.parents_phone || p.parents_email || 'No Contact'})`,
                      value: p.parents_uuid,
                    }))}
                    value={studentParentUuid}
                    onChange={(e) => setStudentParentUuid(e.target.value)}
                    error={studentErrors.parent}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStudentModalOpen(false)}
                  className="rounded-xl"
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                >
                  {editStudentUuid ? tc('save') : tc('create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Parent Modal */}
      {/* ===================================================================== */}
      {parentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200/80 overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 font-display">
                {editParentUuid ? tParents('editParent') : tParents('addParentHeader')}
              </h2>
              <button
                onClick={() => setParentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleParentSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {tParents('fieldName')}
                  </label>
                  <Input
                    placeholder={tParents('fieldNamePlaceholder')}
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    error={parentErrors.name}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {tParents('fieldPhone')}
                  </label>
                  <Input
                    type="tel"
                    placeholder={tParents('fieldPhonePlaceholder')}
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {tParents('fieldEmail')}
                  </label>
                  <Input
                    type="email"
                    placeholder={tParents('fieldEmailPlaceholder')}
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setParentModalOpen(false)}
                  className="rounded-xl"
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                >
                  {editParentUuid ? tc('save') : tc('create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

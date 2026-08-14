import { studentService } from '@/services/studentService';
import StudentsClientPage from '@/components/students/StudentsClientPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Management | Ottodot Trial Booking',
  description: 'Manage registered students and parents roster for Ottodot trial classes.',
};

export default async function StudentsPage() {
  const [studentsResult, parentsResult] = await Promise.all([
    studentService.getStudents(),
    studentService.getActiveParents(),
  ]);

  const initialStudents = studentsResult.success ? studentsResult.data || [] : [];
  const parents = parentsResult.success ? parentsResult.data || [] : [];

  return (
    <StudentsClientPage 
      initialStudents={initialStudents} 
      parents={parents} 
    />
  );
}

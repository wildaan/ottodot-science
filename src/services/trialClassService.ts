import { supabaseServer } from '@/config/supabase/server';
import { TrialClass, RosterParticipant } from '@/types/database';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const trialClassService = {
  /**
   * Mengambil semua trial class aktif, diurutkan berdasarkan waktu mulai.
   */
  async getActiveTrialClasses(): Promise<ApiResponse<TrialClass[]>> {
    try {
      const { data, error } = await supabaseServer
        .from('trial_classes')
        .select(
          'trial_classes_id, trial_classes_uuid, trial_classes_subject, trial_classes_start_time, trial_classes_capacity, trial_classes_confirmed_count, trial_classes_create_date, trial_classes_create_by, trial_classes_status'
        )
        .eq('trial_classes_status', 1)
        .order('trial_classes_start_time', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as TrialClass[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch trial classes' };
    }
  },

  /**
   * Mengambil daftar peserta CONFIRMED untuk suatu kelas.
   * Join: bookings -> students -> parents
   * Digunakan untuk halaman Roster (/roster).
   */
  async getConfirmedParticipants(classUuid: string): Promise<ApiResponse<RosterParticipant[]>> {
    try {
      // 1. Ambil data bookings confirmed untuk kelas ini
      const { data: bookingsData, error: bookingsError } = await supabaseServer
        .from('bookings')
        .select('bookings_uuid, bookings_create_date, bookings_students_uuid')
        .eq('bookings_trial_classes_uuid', classUuid)
        .eq('bookings_state', 'confirmed')
        .eq('bookings_status', 1)
        .order('bookings_create_date', { ascending: true });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) {
        return { success: true, data: [] };
      }

      const studentUuuids = bookingsData.map((b) => b.bookings_students_uuid);

      // 2. Ambil data students terkait
      const { data: studentsData, error: studentsError } = await supabaseServer
        .from('students')
        .select('students_uuid, students_name, students_parents_uuid')
        .in('students_uuid', studentUuuids);

      if (studentsError) throw studentsError;
      if (!studentsData || studentsData.length === 0) {
        return { success: true, data: [] };
      }

      const parentUuuids = Array.from(new Set(studentsData.map((s) => s.students_parents_uuid)));

      // 3. Ambil data parents terkait
      const { data: parentsData, error: parentsError } = await supabaseServer
        .from('parents')
        .select('parents_uuid, parents_name, parents_phone')
        .in('parents_uuid', parentUuuids);

      if (parentsError) throw parentsError;

      // 4. Map & memory-join hasil query secara manual
      const parentsMap = new Map((parentsData || []).map((p) => [p.parents_uuid, p]));
      const studentsMap = new Map(
        studentsData.map((s) => {
          const parent = parentsMap.get(s.students_parents_uuid);
          return [
            s.students_uuid,
            {
              students_name: s.students_name,
              parents_name: parent?.parents_name ?? null,
              parents_phone: parent?.parents_phone ?? null,
            },
          ];
        })
      );

      const participants: RosterParticipant[] = bookingsData.map((b) => {
        const studentInfo = studentsMap.get(b.bookings_students_uuid);
        return {
          bookings_uuid: b.bookings_uuid,
          bookings_create_date: b.bookings_create_date,
          students_name: studentInfo?.students_name ?? null,
          parents_name: studentInfo?.parents_name ?? null,
          parents_phone: studentInfo?.parents_phone ?? null,
        };
      });

      return { success: true, data: participants };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch roster' };
    }
  },
};

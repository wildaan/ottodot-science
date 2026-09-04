import { supabaseServer } from '@/config/supabase/server';
import { BookingWithDetails, BookTrialClassResult } from '@/types/database';

export type BookingLocale = 'en' | 'id';

export const BOOKING_MESSAGES = {
  en: {
    DUPLICATE_BOOKING: 'This child already has a confirmed booking for the same class.',
    CLASS_FULL: 'This class is already full. Sorry, slots are no longer available.',
    CLASS_NOT_FOUND: 'Class not found.',
    BOOKING_FAILED: 'Booking failed.',
    FETCH_FAILED: 'Failed to fetch bookings',
    CANCEL_FAILED: 'Failed to cancel booking',
  },
  id: {
    DUPLICATE_BOOKING: 'Anak ini sudah memiliki booking confirmed untuk kelas yang sama.',
    CLASS_FULL: 'Kelas ini sudah penuh. Maaf, slot tidak tersedia lagi.',
    CLASS_NOT_FOUND: 'Kelas tidak ditemukan.',
    BOOKING_FAILED: 'Booking gagal.',
    FETCH_FAILED: 'Gagal mengambil riwayat booking',
    CANCEL_FAILED: 'Gagal membatalkan booking',
  },
} as const;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: 'DUPLICATE_BOOKING' | 'CLASS_FULL' | 'CLASS_NOT_FOUND' | 'UNKNOWN';
}

export interface BookTrialClassInput {
  studentUuid: string;
  classUuid: string;
  paymentSuccess: boolean;
}

export const bookingService = {
  /**
   * Fetch booking history for all children of a parent.
   * Join: bookings -> students (filter by parent) -> trial_classes
   */
  async getBookingsByParent(parentUuid: string, locale: BookingLocale = 'en'): Promise<ApiResponse<BookingWithDetails[]>> {
    try {
      // 1. Fetch active children (students) belonging to parent
      const { data: studentsData, error: studentsError } = await supabaseServer
        .from('students')
        .select('students_uuid, students_name, students_parents_uuid')
        .eq('students_parents_uuid', parentUuid)
        .eq('students_status', 1);

      if (studentsError) throw studentsError;
      if (!studentsData || studentsData.length === 0) {
        return { success: true, data: [] };
      }

      const studentUuuids = studentsData.map((s) => s.students_uuid);

      // 2. Fetch booking data for those children
      const { data: bookingsData, error: bookingsError } = await supabaseServer
        .from('bookings')
        .select('bookings_uuid, bookings_state, bookings_create_date, bookings_students_uuid, bookings_trial_classes_uuid')
        .eq('bookings_status', 1)
        .in('bookings_students_uuid', studentUuuids)
        .order('bookings_create_date', { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) {
        return { success: true, data: [] };
      }

      const classUuuids = Array.from(new Set(bookingsData.map((b) => b.bookings_trial_classes_uuid)));

      // 3. Fetch related trial_classes data
      const { data: classesData, error: classesError } = await supabaseServer
        .from('trial_classes')
        .select('trial_classes_uuid, trial_classes_subject, trial_classes_start_time')
        .in('trial_classes_uuid', classUuuids);

      if (classesError) throw classesError;

      // 4. Manually map query results to final data format (memory-join) to avoid schema cache / relationship lookup errors
      const studentsMap = new Map(studentsData.map((s) => [s.students_uuid, s.students_name]));
      const classesMap = new Map((classesData || []).map((c) => [c.trial_classes_uuid, c]));

      const bookings: BookingWithDetails[] = bookingsData.map((b) => {
        const studentName = studentsMap.get(b.bookings_students_uuid) || null;
        const trialClass = classesMap.get(b.bookings_trial_classes_uuid);
        return {
          bookings_uuid: b.bookings_uuid,
          bookings_state: b.bookings_state as any,
          bookings_create_date: b.bookings_create_date,
          students_name: studentName,
          trial_classes_subject: trialClass?.trial_classes_subject ?? null,
          trial_classes_start_time: trialClass?.trial_classes_start_time ?? null,
        };
      });

      return { success: true, data: bookings };
    } catch (err: any) {
      const messages = BOOKING_MESSAGES[locale] || BOOKING_MESSAGES.en;
      return { success: false, error: err.message || messages.FETCH_FAILED, errorCode: 'UNKNOWN' };
    }
  },

  /**
   * Book a trial class via RPC function book_trial_class.
   * Atomic + race-condition-safe (SELECT ... FOR UPDATE inside PL/pgSQL).
   */
  async bookTrialClass(input: BookTrialClassInput, locale: BookingLocale = 'en'): Promise<ApiResponse<BookTrialClassResult>> {
    try {
      const { data, error } = await supabaseServer.rpc('book_trial_class', {
        p_student_uuid: input.studentUuid,
        p_class_uuid: input.classUuid,
        p_payment_success: input.paymentSuccess,
      });

      if (error) {
        // Parse Supabase RAISE EXCEPTION message to extract structured error code
        const msg: string = error.message || '';
        const messages = BOOKING_MESSAGES[locale] || BOOKING_MESSAGES.en;
        if (msg.includes('DUPLICATE_BOOKING')) {
          return { success: false, error: messages.DUPLICATE_BOOKING, errorCode: 'DUPLICATE_BOOKING' };
        }
        if (msg.includes('CLASS_FULL')) {
          return { success: false, error: messages.CLASS_FULL, errorCode: 'CLASS_FULL' };
        }
        if (msg.includes('CLASS_NOT_FOUND')) {
          return { success: false, error: messages.CLASS_NOT_FOUND, errorCode: 'CLASS_NOT_FOUND' };
        }
        throw error;
      }

      // RPC returns an array (RETURNS TABLE); take the first row
      const result = Array.isArray(data) ? data[0] : data;
      const bookings_uuid = result?.bookings_uuid || result?.r_bookings_uuid || '';
      const bookings_state = result?.bookings_state || result?.r_bookings_state || '';
      return {
        success: true,
        data: {
          bookings_uuid,
          bookings_state,
        },
      };
    } catch (err: any) {
      const messages = BOOKING_MESSAGES[locale] || BOOKING_MESSAGES.en;
      return { success: false, error: err.message || messages.BOOKING_FAILED, errorCode: 'UNKNOWN' };
    }
  },

  /**
   * Cancel booking (soft-cancel: update state to 'cancelled').
   */
  async cancelBooking(bookingUuid: string, locale: BookingLocale = 'en'): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabaseServer
        .from('bookings')
        .update({ bookings_state: 'cancelled' })
        .eq('bookings_uuid', bookingUuid);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      const messages = BOOKING_MESSAGES[locale] || BOOKING_MESSAGES.en;
      return { success: false, error: err.message || messages.CANCEL_FAILED, errorCode: 'UNKNOWN' };
    }
  },
};

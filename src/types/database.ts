export interface Parent {
  parents_id: number;
  parents_uuid: string;
  parents_user_uuid: string | null;
  parents_name: string | null;
  parents_email: string | null;
  parents_phone: string | null;
  parents_create_date: string;
  parents_create_by: string | null;
  parents_status: number; // 0 = tidak aktif, 1 = aktif
}

export interface Student {
  students_id: number;
  students_uuid: string;
  students_parents_uuid: string;
  students_name: string | null;
  students_age: number | null;
  students_create_date: string;
  students_create_by: string | null;
  students_status: number; // 0 = tidak aktif, 1 = aktif
}

export interface TrialClass {
  trial_classes_id: number;
  trial_classes_uuid: string;
  trial_classes_subject: string | null;
  trial_classes_start_time: string | null;
  trial_classes_capacity: number;
  trial_classes_confirmed_count: number;
  trial_classes_create_date: string;
  trial_classes_create_by: string | null;
  trial_classes_status: number;
}

export type BookingState = 'pending_payment' | 'confirmed' | 'payment_failed' | 'cancelled';

export interface Booking {
  bookings_id: number;
  bookings_uuid: string;
  bookings_students_uuid: string;
  bookings_trial_classes_uuid: string;
  bookings_state: BookingState;
  bookings_create_date: string;
  bookings_create_by: string | null;
  bookings_status: number;
}

export interface PaymentAttempt {
  payment_attempts_id: number;
  payment_attempts_uuid: string;
  payment_attempts_bookings_uuid: string;
  payment_attempts_result: 'success' | 'failed' | null;
  payment_attempts_amount: number | null;
  payment_attempts_create_date: string;
  payment_attempts_create_by: string | null;
  payment_attempts_status: number;
}

/** Shape returned by the book_trial_class RPC */
export interface BookTrialClassResult {
  bookings_uuid: string;
  bookings_state: BookingState;
}

/** Enriched booking row for the parent's booking history view */
export interface BookingWithDetails {
  bookings_uuid: string;
  bookings_state: BookingState;
  bookings_create_date: string;
  students_name: string | null;
  trial_classes_subject: string | null;
  trial_classes_start_time: string | null;
}

/** Confirmed participant row for the roster view */
export interface RosterParticipant {
  bookings_uuid: string;
  bookings_create_date: string;
  students_name: string | null;
  parents_name: string | null;
  parents_phone: string | null;
}


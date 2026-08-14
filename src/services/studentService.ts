import { supabaseServer } from '@/config/supabase/server';
import { Student, Parent } from '@/types/database';
import { StudentCreateInput, StudentUpdateInput } from '@/validations/studentSchema';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const studentService = {
  /**
   * Mendapatkan daftar semua student aktif (students_status = 1)
   */
  async getStudents(): Promise<ApiResponse<Student[]>> {
    try {
      const { data, error } = await supabaseServer
        .from('students')
        .select('students_id, students_uuid, students_parents_uuid, students_name, students_age, students_create_date, students_create_by, students_status')
        .eq('students_status', 1)
        .order('students_create_date', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as Student[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch students' };
    }
  },

  /**
   * Mendapatkan daftar parents aktif untuk dropdown pilihan parent
   */
  async getActiveParents(): Promise<ApiResponse<Parent[]>> {
    try {
      const { data, error } = await supabaseServer
        .from('parents')
        .select('parents_id, parents_uuid, parents_name, parents_email, parents_phone, parents_status, parents_create_date')
        .eq('parents_status', 1)
        .order('parents_name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as Parent[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch parents' };
    }
  },

  /**
   * Mendapatkan detail student berdasarkan UUID
   */
  async getStudentByUuid(uuid: string): Promise<ApiResponse<Student>> {
    try {
      const { data, error } = await supabaseServer
        .from('students')
        .select('students_id, students_uuid, students_parents_uuid, students_name, students_age, students_create_date, students_create_by, students_status')
        .eq('students_uuid', uuid)
        .eq('students_status', 1)
        .single();

      if (error) throw error;
      return { success: true, data: data as Student };
    } catch (err: any) {
      return { success: false, error: err.message || 'Student not found' };
    }
  },

  /**
   * Membuat student baru
   */
  async createStudent(input: StudentCreateInput): Promise<ApiResponse<Student>> {
    try {
      const { data, error } = await supabaseServer
        .from('students')
        .insert({
          students_parents_uuid: input.students_parents_uuid,
          students_name: input.students_name,
          students_age: input.students_age,
          students_status: 1,
          students_create_by: 'system_api'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as Student };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create student' };
    }
  },

  /**
   * Memperbarui data student
   */
  async updateStudent(uuid: string, input: StudentUpdateInput): Promise<ApiResponse<Student>> {
    try {
      const { data, error } = await supabaseServer
        .from('students')
        .update({
          students_parents_uuid: input.students_parents_uuid,
          students_name: input.students_name,
          students_age: input.students_age,
        })
        .eq('students_uuid', uuid)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as Student };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update student' };
    }
  },

  /**
   * Soft delete student (students_status = 0)
   */
  async softDeleteStudent(uuid: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabaseServer
        .from('students')
        .update({ students_status: 0 })
        .eq('students_uuid', uuid);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete student' };
    }
  }
};

import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/studentService';
import { supabaseServer } from '@/config/supabase/server';

// GET /api/parents - List all active parents
export async function GET() {
  const result = await studentService.getActiveParents();
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
}

// POST /api/parents - Create a new parent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parents_name, parents_email, parents_phone } = body;

    if (!parents_name || parents_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('parents')
      .insert({
        parents_name: parents_name.trim(),
        parents_email: parents_email?.trim() || null,
        parents_phone: parents_phone?.trim() || null,
        parents_status: 1,
        parents_create_by: 'system_api',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

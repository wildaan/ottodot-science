import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/config/supabase/server';

// GET /api/parents/[uuid] - Get parent detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  try {
    const { data, error } = await supabaseServer
      .from('parents')
      .select('parents_id, parents_uuid, parents_name, parents_email, parents_phone, parents_status, parents_create_date')
      .eq('parents_uuid', uuid)
      .eq('parents_status', 1)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/parents/[uuid] - Update parent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  try {
    const body = await request.json();
    const { parents_name, parents_email, parents_phone } = body;

    const { data, error } = await supabaseServer
      .from('parents')
      .update({
        ...(parents_name !== undefined && { parents_name }),
        ...(parents_email !== undefined && { parents_email }),
        ...(parents_phone !== undefined && { parents_phone }),
      })
      .eq('parents_uuid', uuid)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/parents/[uuid] - Soft delete parent
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  try {
    const { error } = await supabaseServer
      .from('parents')
      .update({ parents_status: 0 })
      .eq('parents_uuid', uuid);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

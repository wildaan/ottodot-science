import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/studentService';
import { studentUpdateSchema } from '@/validations/studentSchema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const result = await studentService.getStudentByUuid(uuid);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: result.data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const body = await req.json();

    // Validate with Zod
    const validation = studentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.format()._errors.join(', ') || 'Validation failed'
      }, { status: 400 });
    }

    const result = await studentService.updateStudent(uuid, validation.data);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Malformed JSON body' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const result = await studentService.softDeleteStudent(uuid);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: 'Student successfully soft deleted' });
}

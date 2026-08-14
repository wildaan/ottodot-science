import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/studentService';
import { studentCreateSchema } from '@/validations/studentSchema';

export async function GET() {
  const result = await studentService.getStudents();
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate with Zod
    const validation = studentCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.format()._errors.join(', ') || 'Validation failed'
      }, { status: 400 });
    }

    const result = await studentService.createStudent(validation.data);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Malformed JSON body' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { trialClassService } from '@/services/trialClassService';

export async function GET() {
  const result = await trialClassService.getActiveTrialClasses();
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
}

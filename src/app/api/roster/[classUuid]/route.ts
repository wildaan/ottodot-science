import { NextRequest, NextResponse } from 'next/server';
import { trialClassService } from '@/services/trialClassService';

interface RouteParams {
  params: Promise<{ classUuid: string }>;
}

/** GET /api/roster/[classUuid] — daftar peserta confirmed untuk kelas tertentu */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { classUuid } = await params;

  const result = await trialClassService.getConfirmedParticipants(classUuid);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
}

import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/bookingService';

interface RouteParams {
  params: Promise<{ uuid: string }>;
}

/** PATCH /api/bookings/[uuid] — cancel booking */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { uuid } = await params;

  let body: { state?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.state !== 'cancelled') {
    return NextResponse.json(
      { success: false, error: 'Only state=cancelled is supported via this endpoint' },
      { status: 400 }
    );
  }

  const result = await bookingService.cancelBooking(uuid);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

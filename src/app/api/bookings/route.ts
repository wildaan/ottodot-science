import { NextRequest, NextResponse } from 'next/server';
import { bookingService, BookingLocale } from '@/services/bookingService';

function getLocale(request: NextRequest, bodyLocale?: string): BookingLocale {
  if (bodyLocale === 'id' || bodyLocale === 'en') return bodyLocale;
  const queryLocale = request.nextUrl.searchParams.get('locale');
  if (queryLocale === 'id' || queryLocale === 'en') return queryLocale;
  const acceptLang = request.headers.get('accept-language') || '';
  return acceptLang.startsWith('id') ? 'id' : 'en';
}

/** GET /api/bookings?parent_uuid=xxx — parent booking history */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentUuid = searchParams.get('parent_uuid');

  if (!parentUuid) {
    return NextResponse.json({ success: false, error: 'parent_uuid is required' }, { status: 400 });
  }

  const locale = getLocale(request);
  const result = await bookingService.getBookingsByParent(parentUuid, locale);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
}

/** POST /api/bookings — create new booking via RPC */
export async function POST(request: NextRequest) {
  let body: { student_uuid?: string; class_uuid?: string; payment_success?: boolean; locale?: BookingLocale };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { student_uuid, class_uuid, payment_success } = body;
  if (!student_uuid || !class_uuid) {
    return NextResponse.json(
      { success: false, error: 'student_uuid and class_uuid are required' },
      { status: 400 }
    );
  }

  const locale = getLocale(request, body.locale);
  const result = await bookingService.bookTrialClass(
    {
      studentUuid: student_uuid,
      classUuid: class_uuid,
      paymentSuccess: payment_success ?? true,
    },
    locale
  );

  if (!result.success) {
    // Return 409 for business-logic errors (duplicate / full), 500 for unknown
    const status =
      result.errorCode === 'DUPLICATE_BOOKING' || result.errorCode === 'CLASS_FULL' ? 409 : 500;
    return NextResponse.json(
      { success: false, error: result.error, errorCode: result.errorCode },
      { status }
    );
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}

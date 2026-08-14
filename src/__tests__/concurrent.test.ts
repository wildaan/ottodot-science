import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Env variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required for testing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Skenario UUIDs sesuai seed data
const CLASS_EMPTY_UUID = '770e8400-e29b-41d4-a716-446655440001';
const CLASS_LIMIT_UUID = '770e8400-e29b-41d4-a716-446655440002';
const STUDENT_1 = '660e8400-e29b-41d4-a716-446655440001';
const STUDENT_2 = '660e8400-e29b-41d4-a716-446655440002';
const STUDENT_4 = '660e8400-e29b-41d4-a716-446655440004';
const STUDENT_5 = '660e8400-e29b-41d4-a716-446655440005';

async function runTests() {
  console.log('=== STARTING AUTOMATED TEST SUITE ===\n');

  try {
    // 0. Reset status class limit and delete transient bookings
    console.log('0. Resetting state for test cleanliness...');
    // Hapus payment attempts transient terlebih dahulu untuk menghindari FK constraint error
    await supabase.from('payment_attempts').delete().not('payment_attempts_bookings_uuid', 'in', `(880e8400-e29b-41d4-a716-446655440001, 880e8400-e29b-41d4-a716-446655440002, 880e8400-e29b-41d4-a716-446655440003)`);
    await supabase.from('bookings').delete().not('bookings_uuid', 'in', `(880e8400-e29b-41d4-a716-446655440001, 880e8400-e29b-41d4-a716-446655440002, 880e8400-e29b-41d4-a716-446655440003)`);
    await supabase.from('trial_classes').update({ trial_classes_confirmed_count: 0 }).eq('trial_classes_uuid', CLASS_EMPTY_UUID);
    await supabase.from('trial_classes').update({ trial_classes_confirmed_count: 3 }).eq('trial_classes_uuid', CLASS_LIMIT_UUID);

    // 1. Test booking normal berhasil
    console.log('1. Testing normal booking (student 4 on empty class)...');
    const b1 = await supabase.rpc('book_trial_class', {
      p_student_uuid: STUDENT_4,
      p_class_uuid: CLASS_EMPTY_UUID,
      p_payment_success: true
    });
    if (b1.error) {
      console.error('FAIL: Normal booking failed:', b1.error.message);
    } else {
      console.log('SUCCESS: Normal booking returned state:', b1.data[0].r_bookings_state);
    }

    // 2. Test duplicate booking ditolak
    console.log('\n2. Testing duplicate booking (same student 4 on class empty)...');
    const b2 = await supabase.rpc('book_trial_class', {
      p_student_uuid: STUDENT_4,
      p_class_uuid: CLASS_EMPTY_UUID,
      p_payment_success: true
    });
    if (b2.error && b2.error.message.includes('DUPLICATE_BOOKING')) {
      console.log('SUCCESS: Duplicate booking was correctly rejected with error:', b2.error.message);
    } else {
      console.error('FAIL: Duplicate booking did not trigger expected error. Result:', b2.data);
    }

    // 3. Test payment failure behavior
    console.log('\n3. Testing booking with payment failure...');
    // Hapus booking sebelumnya untuk STUDENT_5 jika ada agar tidak kena duplicate booking
    await supabase.from('payment_attempts').delete().not('payment_attempts_bookings_uuid', 'in', `(880e8400-e29b-41d4-a716-446655440001, 880e8400-e29b-41d4-a716-446655440002, 880e8400-e29b-41d4-a716-446655440003)`);
    await supabase.from('bookings').delete().not('bookings_uuid', 'in', `(880e8400-e29b-41d4-a716-446655440001, 880e8400-e29b-41d4-a716-446655440002, 880e8400-e29b-41d4-a716-446655440003)`);

    const b3 = await supabase.rpc('book_trial_class', {
      p_student_uuid: STUDENT_5,
      p_class_uuid: CLASS_EMPTY_UUID,
      p_payment_success: false
    });
    if (b3.data && b3.data[0].r_bookings_state === 'payment_failed') {
      console.log('SUCCESS: Failed payment booking recorded state: payment_failed');
      const { data: classCheck } = await supabase.from('trial_classes').select('trial_classes_confirmed_count').eq('trial_classes_uuid', CLASS_EMPTY_UUID).single();
      console.log('Class confirmed count is:', classCheck?.trial_classes_confirmed_count, '(Expected: 1, payment failure must not increment)');
    } else {
      console.error('FAIL: Payment failure test failed. Result:', b3.data || b3.error);
    }

    // 4. Test overbooking ditolak
    console.log('\n4. Testing overbooking (student 5 on class limit with 3/4 capacity)...');
    // Bersihkan booking student 5 dan student 4 pada CLASS_LIMIT untuk test overbooking
    await supabase.from('bookings').delete().eq('bookings_trial_classes_uuid', CLASS_LIMIT_UUID).in('bookings_students_uuid', [STUDENT_4, STUDENT_5]);

    const b4 = await supabase.rpc('book_trial_class', {
      p_student_uuid: STUDENT_5,
      p_class_uuid: CLASS_LIMIT_UUID,
      p_payment_success: true
    });
    if (b4.data && b4.data[0].r_bookings_state === 'confirmed') {
      console.log('SUCCESS: Booked last seat (4/4). Now testing next bookings...');

      const b4_next = await supabase.rpc('book_trial_class', {
        p_student_uuid: STUDENT_4, // student 4 hasn't booked class_limit
        p_class_uuid: CLASS_LIMIT_UUID,
        p_payment_success: true
      });
      if (b4_next.error && b4_next.error.message.includes('CLASS_FULL')) {
        console.log('SUCCESS: Overbooking blocked correctly. Class capacity error returned:', b4_next.error.message);
      } else {
        console.error('FAIL: Overbooking was not blocked. Result:', b4_next.data || b4_next.error);
      }
    } else {
      console.error('FAIL: Could not book last seat for limit test. Result:', b4.error || b4.data);
    }

    // 5. Test race condition (concurrent requests)
    console.log('\n5. Testing race condition (2 concurrent bookings for 1 remaining seat on CLASS_LIMIT)...');
    // Reset limit class back to 3/4
    await supabase.from('payment_attempts').delete().not('payment_attempts_bookings_uuid', 'in', `(880e8400-e29b-41d4-a716-446655440001, 880e8400-e29b-41d4-a716-446655440002, 880e8400-e29b-41d4-a716-446655440003)`);
    await supabase.from('bookings').delete().eq('bookings_trial_classes_uuid', CLASS_LIMIT_UUID).in('bookings_students_uuid', [STUDENT_4, STUDENT_5]);
    await supabase.from('trial_classes').update({ trial_classes_confirmed_count: 3 }).eq('trial_classes_uuid', CLASS_LIMIT_UUID);

    console.log('Triggering two booking requests simultaneously for Student 4 and Student 5...');
    const results = await Promise.allSettled([
      supabase.rpc('book_trial_class', { p_student_uuid: STUDENT_4, p_class_uuid: CLASS_LIMIT_UUID, p_payment_success: true }),
      supabase.rpc('book_trial_class', { p_student_uuid: STUDENT_5, p_class_uuid: CLASS_LIMIT_UUID, p_payment_success: true })
    ]);

    let successCount = 0;
    let failCount = 0;

    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        const response = res.value;
        if (response.error) {
          console.log(`Request ${index + 1} rejected: ${response.error.message}`);
          failCount++;
        } else {
          console.log(`Request ${index + 1} succeeded. State: ${response.data[0].r_bookings_state}`);
          successCount++;
        }
      } else {
        console.log(`Request ${index + 1} crashed:`, res.reason);
        failCount++;
      }
    });

    console.log(`\nConcurrent results: ${successCount} succeeded, ${failCount} failed.`);
    const { data: finalClass } = await supabase.from('trial_classes').select('trial_classes_confirmed_count').eq('trial_classes_uuid', CLASS_LIMIT_UUID).single();
    console.log(`Final confirmed count in DB: ${finalClass?.trial_classes_confirmed_count} (Expected: 4)`);

    if (successCount === 1 && failCount === 1 && finalClass?.trial_classes_confirmed_count === 4) {
      console.log('SUCCESS: Race condition handled flawlessly by SELECT ... FOR UPDATE locking!');
    } else {
      console.error('FAIL: Race condition test failed. Expected exactly 1 success and 1 fail.');
    }

  } catch (error) {
    console.error('Test execution error:', error);
  }

  console.log('\n=== TESTING COMPLETED ===');
}

runTests();

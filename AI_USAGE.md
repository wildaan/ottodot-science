# AI Usage Log

This document records how AI was used in the development of the **Trial Booking System**.

## 1. AI Tools Used
- **Antigravity (Gemini 3.7 Flash / Gemini 3.5 Flash)**: Used as the primary pair-programming tool for generating boilerplate, designing the Postgres schema, writing service calls, and building the frontend UI.
- **Claude**: Used for planning, architecture decisions, prompt design for Antigravity, README writing, and reviewing AI-generated output before accepting it.

## 2. What AI Was Used For
- **Boilerplate & DDL Generation**: AI quickly generated the prefixed schema tables (`parents_`, `students_`, `bookings_`, etc.) consistently and without typos.
- **RPC Concurrency Design**: Drafted the atomic transaction function with `SELECT ... FOR UPDATE` locking and capacity counter updates.
- **Automated Concurrency Testing**: Generated a `Promise.allSettled`-based parallel test script to verify that Postgres row locking correctly prevents race conditions.

## 3. Where AI Output Was Corrected or Rejected
- **Next.js 15/16 Dynamic Route Type Safety**: The initial AI output used a synchronous `params.uuid` access pattern, which failed to compile on the current Next.js version. Corrected manually by typing `params` as `Promise<{ uuid: string }>` and awaiting it.
- **Ambiguous Column Name in RPC**: The Postgres RPC function initially threw an ambiguous column error for `bookings_state` and `bookings_uuid`. Fixed by renaming the return parameters to `r_bookings_state` / `r_bookings_uuid` and adding a table alias (`bookings b`).
- **Supabase Schema Cache Limitation**: A nested join query (`.select('*, students(*)')`) failed because foreign keys use `varchar(36)` instead of native `uuid`, which Supabase's PostgREST can't auto-resolve. Corrected by switching to sequential queries with manual in-memory joining in the service layer.

## 4. How the Final Implementation Was Verified
- Ran the automated test suite covering happy path, duplicate booking, overbooking, and payment failure scenarios.
- Ran the concurrency/race-condition test **5 times in a row** against a class with exactly 1 remaining slot, confirming a consistent result each time (exactly one booking confirmed, `trial_classes_confirmed_count` never exceeding capacity).
- Performed manual QA by walking through each scenario directly in the browser (not just relying on automated tests), including checking the Supabase Table Editor directly to confirm the database state matched expectations.
- Cross-checked AI-written documentation (README, this file) against the actual codebase to remove inaccurate or unverified claims before submission.

## 5. What I'd Change About My AI Workflow Next Time
- Design foreign keys using native `UUID` type from the start, to avoid Supabase relationship-parsing issues encountered later.
- Default to sequential queries with in-memory joins for relational data from the beginning, rather than discovering the join limitation midway through development.
- Ask the AI to flag any performance or benchmark-sounding claims it writes in documentation, so they can be verified or rephrased before being treated as fact.
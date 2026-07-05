import { NextRequest, NextResponse } from 'next/server';
import { TournamentState, isValidTournamentState } from '@/types/tournament';

const TABLE_NAME = 'tournament_state';
const STATE_ID = 'default';

function getConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminPin: process.env.ADMIN_PIN,
  };
}

function missingConfigResponse() {
  return NextResponse.json({ configured: false, state: null }, { status: 200 });
}

export async function GET() {
  const { supabaseUrl, serviceKey } = getConfig();
  if (!supabaseUrl || !serviceKey) return missingConfigResponse();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${TABLE_NAME}?id=eq.${STATE_ID}&select=state`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return NextResponse.json({ configured: true, state: null }, { status: 502 });
  }

  const rows = (await response.json()) as Array<{ state: TournamentState }>;
  const state = rows[0]?.state ?? null;

  if (state && !isValidTournamentState(state)) {
    return NextResponse.json({ configured: true, state: null }, { status: 502 });
  }

  return NextResponse.json({ configured: true, state });
}

export async function POST(request: NextRequest) {
  const { supabaseUrl, serviceKey, adminPin } = getConfig();
  if (!supabaseUrl || !serviceKey || !adminPin) {
    return NextResponse.json(
      { success: false, error: 'Remote database belum dikonfigurasi' },
      { status: 503 }
    );
  }

  const requestPin = request.headers.get('x-admin-pin') ?? '';
  if (requestPin !== adminPin) {
    return NextResponse.json({ success: false, error: 'PIN admin salah' }, { status: 401 });
  }

  const body = (await request.json()) as unknown;
  if (!isValidTournamentState(body)) {
    return NextResponse.json({ success: false, error: 'Data turnamen tidak valid' }, { status: 400 });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${TABLE_NAME}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: STATE_ID,
      state: body,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan data' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}

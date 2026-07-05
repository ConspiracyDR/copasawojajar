import { ImportResult, TournamentState, isValidTournamentState } from '@/types/tournament';

export interface RemoteLoadResult {
  configured: boolean;
  state: TournamentState | null;
}

export const RemoteStorage = {
  async load(): Promise<RemoteLoadResult> {
    try {
      const response = await fetch('/api/tournament-state', { cache: 'no-store' });
      if (!response.ok) return { configured: false, state: null };

      const data = (await response.json()) as RemoteLoadResult;
      if (data.state && !isValidTournamentState(data.state)) {
        return { configured: data.configured, state: null };
      }

      return {
        configured: Boolean(data.configured),
        state: data.state ?? null,
      };
    } catch {
      return { configured: false, state: null };
    }
  },

  async save(state: TournamentState, adminPin: string): Promise<ImportResult> {
    try {
      const response = await fetch('/api/tournament-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify(state),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        return { success: false, error: data?.error ?? 'Gagal menyimpan data online' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Gagal menyimpan data online' };
    }
  },
};

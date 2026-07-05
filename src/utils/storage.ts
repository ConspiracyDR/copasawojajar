import { TournamentState, ImportResult, isValidTournamentState } from '@/types/tournament';

export const STORAGE_KEY = 'copa-sawo-jajar-data';
const SCHEMA_VERSION = 1;

export const StorageUtil = {
  /**
   * Save tournament state to localStorage.
   * Returns success/failure with error message on quota exceeded.
   */
  save(state: TournamentState): { success: true } | { success: false; error: string } {
    try {
      const data: TournamentState = { ...state, version: SCHEMA_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return { success: false, error: 'Data could not be saved. Storage full.' };
      }
      return { success: false, error: 'Data could not be saved.' };
    }
  },

  /**
   * Load tournament state from localStorage.
   * Returns null if data is missing, corrupted, or invalid.
   */
  load(): TournamentState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;

      const parsed = JSON.parse(raw);
      if (!isValidTournamentState(parsed)) return null;

      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Export tournament state as a JSON file download with timestamp filename.
   */
  exportToFile(state: TournamentState): void {
    const exportData: TournamentState = {
      ...state,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `copa-sawo-jajar-backup-${timestamp}.json`;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  /**
   * Import tournament state from a JSON file.
   * Validates schema before accepting.
   */
  async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { success: false, error: 'Invalid file format.' };
      }

      if (!isValidTournamentState(parsed)) {
        return { success: false, error: 'File is missing required data.' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Invalid file format.' };
    }
  },
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageUtil, STORAGE_KEY } from '@/utils/storage';
import { TournamentState } from '@/types/tournament';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const validState: TournamentState = {
  version: 1,
  teams: [
    { id: 'team-a1', name: 'Tim Garuda', group: 'A' },
    { id: 'team-a2', name: 'Tim Elang', group: 'A' },
  ],
  matches: [
    {
      id: 'match-01',
      group: 'A',
      teamHomeId: 'team-a1',
      teamAwayId: 'team-a2',
      scoreHome: 2,
      scoreAway: 1,
      status: 'selesai',
      scorers: [
        { playerName: 'Budi', teamId: 'team-a1', minute: 10, count: 2 },
      ],
      matchOrder: 1,
      matchDate: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  playerNamesByTeam: {
    'team-a1': ['Budi', 'Andi'],
    'team-a2': ['Candra'],
  },
};

describe('StorageUtil', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('STORAGE_KEY', () => {
    it('should be "copa-sawo-jajar-data"', () => {
      expect(STORAGE_KEY).toBe('copa-sawo-jajar-data');
    });
  });

  describe('save', () => {
    it('should save valid state to localStorage and return success', () => {
      const result = StorageUtil.save(validState);

      expect(result).toEqual({ success: true });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.version).toBe(1);
      expect(savedData.teams).toEqual(validState.teams);
      expect(savedData.matches).toEqual(validState.matches);
      expect(savedData.playerNamesByTeam).toEqual(validState.playerNamesByTeam);
    });

    it('should return failure with error on QuotaExceededError', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });

      const result = StorageUtil.save(validState);

      expect(result).toEqual({
        success: false,
        error: 'Data could not be saved. Storage full.',
      });
    });

    it('should return failure with generic error on other exceptions', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Unknown error');
      });

      const result = StorageUtil.save(validState);

      expect(result).toEqual({
        success: false,
        error: 'Data could not be saved.',
      });
    });
  });

  describe('load', () => {
    it('should return null when localStorage is empty', () => {
      const result = StorageUtil.load();
      expect(result).toBeNull();
    });

    it('should load and return valid state from localStorage', () => {
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(validState));

      const result = StorageUtil.load();

      expect(result).toEqual(validState);
    });

    it('should load valid older state without player roster', () => {
      const legacyState = {
        version: validState.version,
        teams: validState.teams,
        matches: validState.matches,
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(legacyState));

      const result = StorageUtil.load();

      expect(result).toEqual(legacyState);
    });

    it('should return null for invalid player roster structure', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...validState,
          playerNamesByTeam: { 'team-a1': ['Budi', 123] },
        })
      );

      const result = StorageUtil.load();

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.setItem(STORAGE_KEY, 'not-json{{{');

      const result = StorageUtil.load();

      expect(result).toBeNull();
    });

    it('should return null for data missing required fields', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, teams: [] })
      );

      const result = StorageUtil.load();

      expect(result).toBeNull();
    });

    it('should return null for data with invalid team structure', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          teams: [{ id: 123, name: 'Bad', group: 'X' }],
          matches: [],
        })
      );

      const result = StorageUtil.load();

      expect(result).toBeNull();
    });

    it('should return null for data with invalid match structure', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          teams: [{ id: 'team-a1', name: 'Team', group: 'A' }],
          matches: [{ id: 'match-01', group: 'C' }],
        })
      );

      const result = StorageUtil.load();

      expect(result).toBeNull();
    });

    it('should return null if localStorage.getItem throws', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });

      const result = StorageUtil.load();

      expect(result).toBeNull();
    });
  });

  describe('exportToFile', () => {
    it('should create a download link with correct filename pattern and exportedAt field', () => {
      // Mock URL methods since jsdom doesn't support them
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      let clickCalled = false;
      const mockAnchor = {
        href: '',
        download: '',
        click: () => { clickCalled = true; },
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor as unknown as HTMLElement);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as unknown as HTMLElement);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node as unknown as HTMLElement);

      StorageUtil.exportToFile(validState);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toMatch(/^copa-sawo-jajar-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      expect(mockAnchor.download).toMatch(/\.json$/);
      expect(clickCalled).toBe(true);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      // Verify blob type
      const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('application/json');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('importFromFile', () => {
    it('should return success for a valid tournament state file', async () => {
      const fileContent = JSON.stringify(validState);
      const file = new File([fileContent], 'backup.json', { type: 'application/json' });

      const result = await StorageUtil.importFromFile(file);

      expect(result).toEqual({ success: true });
    });

    it('should return failure for invalid JSON file', async () => {
      const file = new File(['not valid json{{{'], 'bad.json', { type: 'application/json' });

      const result = await StorageUtil.importFromFile(file);

      expect(result).toEqual({ success: false, error: 'Invalid file format.' });
    });

    it('should return failure for JSON missing required fields', async () => {
      const fileContent = JSON.stringify({ version: 1, teams: [] });
      const file = new File([fileContent], 'incomplete.json', { type: 'application/json' });

      const result = await StorageUtil.importFromFile(file);

      expect(result).toEqual({ success: false, error: 'File is missing required data.' });
    });

    it('should return failure for JSON with invalid team structure', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        teams: [{ id: 123, name: 'Bad' }],
        matches: [],
      });
      const file = new File([fileContent], 'invalid.json', { type: 'application/json' });

      const result = await StorageUtil.importFromFile(file);

      expect(result).toEqual({ success: false, error: 'File is missing required data.' });
    });

    it('should accept a valid state with exportedAt field', async () => {
      const stateWithExport = { ...validState, exportedAt: '2024-01-01T00:00:00.000Z' };
      const fileContent = JSON.stringify(stateWithExport);
      const file = new File([fileContent], 'backup.json', { type: 'application/json' });

      const result = await StorageUtil.importFromFile(file);

      expect(result).toEqual({ success: true });
    });
  });
});

import { Match, Scorer, MatchGroup } from '@/types/tournament';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a score value.
 * Score must be an integer in the range 0-99 inclusive.
 */
export function validateScore(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Skor harus berupa bilangan bulat' };
  }
  if (value < 0 || value > 99) {
    return { valid: false, error: 'Skor harus antara 0 dan 99' };
  }
  return { valid: true };
}

/**
 * Validates that home and away teams are different.
 */
export function validateSameTeam(homeId: string, awayId: string): ValidationResult {
  if (homeId === awayId) {
    return { valid: false, error: 'Tim tuan rumah dan tamu harus berbeda' };
  }
  return { valid: true };
}

/**
 * Validates that a match pairing does not already exist in the same group.
 * Checks both orders (home/away and away/home).
 * Optionally excludes a specific match ID (for editing).
 */
export function validateDuplicateMatch(
  matches: Match[],
  group: MatchGroup,
  homeId: string,
  awayId: string,
  excludeMatchId?: string
): ValidationResult {
  const duplicate = matches.find((match) => {
    if (match.id === excludeMatchId) return false;
    if (match.group !== group) return false;
    const sameOrder = match.teamHomeId === homeId && match.teamAwayId === awayId;
    const reverseOrder = match.teamHomeId === awayId && match.teamAwayId === homeId;
    return sameOrder || reverseOrder;
  });

  if (duplicate) {
    return { valid: false, error: 'Pertandingan dengan pasangan tim ini sudah ada di grup ini' };
  }
  return { valid: true };
}

/**
 * Validates a player name.
 * Name must be 1-50 characters and not whitespace-only.
 */
export function validatePlayerName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Nama pemain tidak boleh kosong' };
  }
  if (name.trim().length > 50) {
    return { valid: false, error: 'Nama pemain maksimal 50 karakter' };
  }
  return { valid: true };
}

/**
 * Validates a scorer entry.
 * - playerName: 1-50 chars, non-whitespace-only
 * - teamId: must match one of the two match team IDs
 * - count: integer 1-20
 * - minute: null or integer 1-200
 */
export function validateScorer(
  scorer: Partial<Scorer>,
  matchTeamIds: [string, string]
): ValidationResult {
  // Validate player name
  if (!scorer.playerName || scorer.playerName.trim().length === 0) {
    return { valid: false, error: 'Nama pemain tidak boleh kosong' };
  }
  if (scorer.playerName.trim().length > 50) {
    return { valid: false, error: 'Nama pemain maksimal 50 karakter' };
  }

  // Validate teamId
  if (!scorer.teamId || !matchTeamIds.includes(scorer.teamId)) {
    return { valid: false, error: 'Tim pencetak gol harus salah satu tim dalam pertandingan' };
  }

  // Validate count
  if (scorer.count === undefined || scorer.count === null) {
    return { valid: false, error: 'Jumlah gol harus diisi' };
  }
  if (!Number.isInteger(scorer.count) || scorer.count < 1 || scorer.count > 20) {
    return { valid: false, error: 'Jumlah gol harus antara 1 dan 20' };
  }

  // Validate minute (optional)
  if (scorer.minute !== undefined && scorer.minute !== null) {
    if (!Number.isInteger(scorer.minute) || scorer.minute < 1 || scorer.minute > 200) {
      return { valid: false, error: 'Menit gol harus antara 1 dan 200' };
    }
  }

  return { valid: true };
}

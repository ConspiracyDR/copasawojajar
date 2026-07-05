import { describe, it, expect } from 'vitest';
import {
  validateScore,
  validateSameTeam,
  validateDuplicateMatch,
  validatePlayerName,
  validateScorer,
} from '@/utils/validation';
import { Match } from '@/types/tournament';

describe('validateScore', () => {
  it('accepts valid scores (0, 1, 50, 99)', () => {
    expect(validateScore(0)).toEqual({ valid: true });
    expect(validateScore(1)).toEqual({ valid: true });
    expect(validateScore(50)).toEqual({ valid: true });
    expect(validateScore(99)).toEqual({ valid: true });
  });

  it('rejects negative scores', () => {
    const result = validateScore(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects scores above 99', () => {
    const result = validateScore(100);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects decimal scores', () => {
    const result = validateScore(2.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects NaN', () => {
    const result = validateScore(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateSameTeam', () => {
  it('accepts different teams', () => {
    expect(validateSameTeam('team-a1', 'team-a2')).toEqual({ valid: true });
  });

  it('rejects same team for home and away', () => {
    const result = validateSameTeam('team-a1', 'team-a1');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateDuplicateMatch', () => {
  const existingMatches: Match[] = [
    {
      id: 'match-01',
      group: 'A',
      teamHomeId: 'team-a1',
      teamAwayId: 'team-a2',
      scoreHome: 0,
      scoreAway: 0,
      status: 'upcoming',
      scorers: [],
      matchOrder: 1,
      matchDate: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'match-02',
      group: 'A',
      teamHomeId: 'team-a3',
      teamAwayId: 'team-a4',
      scoreHome: 0,
      scoreAway: 0,
      status: 'upcoming',
      scorers: [],
      matchOrder: 2,
      matchDate: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  it('accepts a new unique pairing', () => {
    const result = validateDuplicateMatch(existingMatches, 'A', 'team-a1', 'team-a3');
    expect(result.valid).toBe(true);
  });

  it('rejects duplicate pairing in same order', () => {
    const result = validateDuplicateMatch(existingMatches, 'A', 'team-a1', 'team-a2');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects duplicate pairing in reverse order', () => {
    const result = validateDuplicateMatch(existingMatches, 'A', 'team-a2', 'team-a1');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('allows same pairing in different group', () => {
    const result = validateDuplicateMatch(existingMatches, 'B', 'team-a1', 'team-a2');
    expect(result.valid).toBe(true);
  });

  it('allows duplicate when excludeMatchId is the existing match', () => {
    const result = validateDuplicateMatch(existingMatches, 'A', 'team-a1', 'team-a2', 'match-01');
    expect(result.valid).toBe(true);
  });
});

describe('validatePlayerName', () => {
  it('accepts valid names', () => {
    expect(validatePlayerName('John Doe')).toEqual({ valid: true });
    expect(validatePlayerName('A')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    const result = validatePlayerName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects whitespace-only string', () => {
    const result = validatePlayerName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects names longer than 50 characters (after trim)', () => {
    const longName = 'A'.repeat(51);
    const result = validatePlayerName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('accepts names exactly 50 characters', () => {
    const name = 'A'.repeat(50);
    expect(validatePlayerName(name)).toEqual({ valid: true });
  });
});

describe('validateScorer', () => {
  const matchTeamIds: [string, string] = ['team-a1', 'team-a2'];

  it('accepts a valid scorer', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 1, minute: 45 },
      matchTeamIds
    );
    expect(result.valid).toBe(true);
  });

  it('accepts scorer with null minute', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 1, minute: null },
      matchTeamIds
    );
    expect(result.valid).toBe(true);
  });

  it('rejects scorer with invalid count (0)', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 0, minute: null },
      matchTeamIds
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects scorer with invalid count (21)', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 21, minute: null },
      matchTeamIds
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects scorer with invalid minute (0)', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 1, minute: 0 },
      matchTeamIds
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects scorer with invalid minute (201)', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 1, minute: 201 },
      matchTeamIds
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects scorer with team not in match', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-b1', count: 1, minute: null },
      matchTeamIds
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects scorer with whitespace-only name', () => {
    const result = validateScorer(
      { playerName: '   ', teamId: 'team-a1', count: 1, minute: null },
      matchTeamIds
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('accepts scorer with max valid count (20)', () => {
    const result = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 20, minute: null },
      matchTeamIds
    );
    expect(result.valid).toBe(true);
  });

  it('accepts scorer with boundary minute values (1, 200)', () => {
    const result1 = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 1, minute: 1 },
      matchTeamIds
    );
    expect(result1.valid).toBe(true);

    const result200 = validateScorer(
      { playerName: 'John', teamId: 'team-a1', count: 1, minute: 200 },
      matchTeamIds
    );
    expect(result200.valid).toBe(true);
  });
});

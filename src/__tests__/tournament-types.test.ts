import { describe, it, expect } from 'vitest';
import { isValidTournamentState } from '@/types/tournament';

describe('isValidTournamentState', () => {
  const validState = {
    version: 1,
    teams: [
      { id: 'team-a1', name: 'Team A1', group: 'A' },
      { id: 'team-b1', name: 'Team B1', group: 'B' },
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
          { playerName: 'Player 1', teamId: 'team-a1', minute: 23, count: 1 },
        ],
        matchOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  };

  it('returns true for a valid tournament state', () => {
    expect(isValidTournamentState(validState)).toBe(true);
  });

  it('returns true when exportedAt is present as a string', () => {
    expect(
      isValidTournamentState({ ...validState, exportedAt: '2024-01-01T00:00:00.000Z' })
    ).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidTournamentState(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidTournamentState(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isValidTournamentState('hello')).toBe(false);
  });

  it('returns false when version is missing', () => {
    const { version, ...noVersion } = validState;
    expect(isValidTournamentState(noVersion)).toBe(false);
  });

  it('returns false when version is not a number', () => {
    expect(isValidTournamentState({ ...validState, version: '1' })).toBe(false);
  });

  it('returns false when teams is not an array', () => {
    expect(isValidTournamentState({ ...validState, teams: 'not-array' })).toBe(false);
  });

  it('returns false when a team has invalid group', () => {
    expect(
      isValidTournamentState({
        ...validState,
        teams: [{ id: 'team-x1', name: 'X1', group: 'C' }],
      })
    ).toBe(false);
  });

  it('returns false when a team is missing id', () => {
    expect(
      isValidTournamentState({
        ...validState,
        teams: [{ name: 'No ID', group: 'A' }],
      })
    ).toBe(false);
  });

  it('returns false when matches is not an array', () => {
    expect(isValidTournamentState({ ...validState, matches: {} })).toBe(false);
  });

  it('returns false when a match has invalid status', () => {
    expect(
      isValidTournamentState({
        ...validState,
        matches: [
          {
            ...validState.matches[0],
            status: 'invalid',
          },
        ],
      })
    ).toBe(false);
  });

  it('returns false when a match is missing required fields', () => {
    expect(
      isValidTournamentState({
        ...validState,
        matches: [{ id: 'match-01' }],
      })
    ).toBe(false);
  });

  it('returns false when a scorer has invalid structure', () => {
    expect(
      isValidTournamentState({
        ...validState,
        matches: [
          {
            ...validState.matches[0],
            scorers: [{ playerName: 123 }],
          },
        ],
      })
    ).toBe(false);
  });

  it('returns true when scorer minute is null', () => {
    expect(
      isValidTournamentState({
        ...validState,
        matches: [
          {
            ...validState.matches[0],
            scorers: [
              { playerName: 'Player', teamId: 'team-a1', minute: null, count: 1 },
            ],
          },
        ],
      })
    ).toBe(true);
  });

  it('returns false when exportedAt is not a string', () => {
    expect(
      isValidTournamentState({ ...validState, exportedAt: 123 })
    ).toBe(false);
  });

  it('returns true for valid state with empty arrays', () => {
    expect(
      isValidTournamentState({ version: 1, teams: [], matches: [] })
    ).toBe(true);
  });
});

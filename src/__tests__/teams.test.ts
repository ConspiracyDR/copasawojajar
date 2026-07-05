import { describe, it, expect } from 'vitest';
import { TEAMS, generateMatchSlots, DEFAULT_TOURNAMENT_STATE } from '@/data/teams';

describe('TEAMS', () => {
  it('should have 8 teams total', () => {
    expect(TEAMS).toHaveLength(8);
  });

  it('should have 4 teams in Group A', () => {
    const groupA = TEAMS.filter((t) => t.group === 'A');
    expect(groupA).toHaveLength(4);
  });

  it('should have 4 teams in Group B', () => {
    const groupB = TEAMS.filter((t) => t.group === 'B');
    expect(groupB).toHaveLength(4);
  });

  it('should have unique ids for all teams', () => {
    const ids = TEAMS.map((t) => t.id);
    expect(new Set(ids).size).toBe(8);
  });

  it('should have correct team names for Group A', () => {
    const groupANames = TEAMS.filter((t) => t.group === 'A').map((t) => t.name);
    expect(groupANames).toEqual(['Tim Garuda', 'Tim Elang', 'Tim Rajawali', 'Tim Merak']);
  });

  it('should have correct team names for Group B', () => {
    const groupBNames = TEAMS.filter((t) => t.group === 'B').map((t) => t.name);
    expect(groupBNames).toEqual(['Tim Harimau', 'Tim Singa', 'Tim Macan', 'Tim Cheetah']);
  });
});

describe('generateMatchSlots', () => {
  const matches = generateMatchSlots(TEAMS);

  it('should generate 16 matches total including knockout', () => {
    expect(matches).toHaveLength(16);
  });

  it('should generate 6 matches for Group A', () => {
    const groupA = matches.filter((m) => m.group === 'A');
    expect(groupA).toHaveLength(6);
  });

  it('should generate 6 matches for Group B', () => {
    const groupB = matches.filter((m) => m.group === 'B');
    expect(groupB).toHaveLength(6);
  });

  it('should generate 4 knockout matches', () => {
    const knockout = matches.filter((m) => m.group === 'KO');
    expect(knockout).toHaveLength(4);
    expect(knockout.map((m) => m.stage)).toEqual([
      'semifinal',
      'semifinal',
      'third-place',
      'final',
    ]);
  });

  it('should assign sequential matchOrder 1-16', () => {
    const orders = matches.map((m) => m.matchOrder);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('should assign matchOrder 1-6 for Group A and 7-12 for Group B', () => {
    const groupAOrders = matches.filter((m) => m.group === 'A').map((m) => m.matchOrder);
    const groupBOrders = matches.filter((m) => m.group === 'B').map((m) => m.matchOrder);
    expect(groupAOrders).toEqual([1, 2, 3, 4, 5, 6]);
    expect(groupBOrders).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it('should pair each team with every other team in same group exactly once', () => {
    const groupATeams = TEAMS.filter((t) => t.group === 'A');
    const groupAMatches = matches.filter((m) => m.group === 'A');

    // Each team should appear in exactly 3 matches (paired with 3 other teams)
    for (const team of groupATeams) {
      const teamMatches = groupAMatches.filter(
        (m) => m.teamHomeId === team.id || m.teamAwayId === team.id
      );
      expect(teamMatches).toHaveLength(3);
    }

    // Check no duplicate pairings
    const pairings = new Set<string>();
    for (const match of groupAMatches) {
      const pair = [match.teamHomeId, match.teamAwayId].sort().join('-');
      expect(pairings.has(pair)).toBe(false);
      pairings.add(pair);
    }
  });

  it('should pair each team in Group B with every other exactly once', () => {
    const groupBTeams = TEAMS.filter((t) => t.group === 'B');
    const groupBMatches = matches.filter((m) => m.group === 'B');

    for (const team of groupBTeams) {
      const teamMatches = groupBMatches.filter(
        (m) => m.teamHomeId === team.id || m.teamAwayId === team.id
      );
      expect(teamMatches).toHaveLength(3);
    }

    const pairings = new Set<string>();
    for (const match of groupBMatches) {
      const pair = [match.teamHomeId, match.teamAwayId].sort().join('-');
      expect(pairings.has(pair)).toBe(false);
      pairings.add(pair);
    }
  });

  it('should initialize all matches with status upcoming', () => {
    for (const match of matches) {
      expect(match.status).toBe('upcoming');
    }
  });

  it('should initialize all matches with scores 0-0', () => {
    for (const match of matches) {
      expect(match.scoreHome).toBe(0);
      expect(match.scoreAway).toBe(0);
    }
  });

  it('should initialize all matches with empty scorers', () => {
    for (const match of matches) {
      expect(match.scorers).toEqual([]);
    }
  });

  it('should have valid ISO timestamps for createdAt and updatedAt', () => {
    for (const match of matches) {
      expect(() => new Date(match.createdAt)).not.toThrow();
      expect(() => new Date(match.updatedAt)).not.toThrow();
      expect(new Date(match.createdAt).toISOString()).toBe(match.createdAt);
      expect(new Date(match.updatedAt).toISOString()).toBe(match.updatedAt);
    }
  });

  it('should generate match ids in format match-XX', () => {
    for (const match of matches) {
      expect(match.id).toMatch(/^match-\d{2}$/);
    }
  });

  it('should not schedule the same team twice on the same date in one group', () => {
    const dateGroups = new Map<string, Set<string>>();

    for (const match of matches) {
      if (!match.matchDate) continue;

      const key = `${match.group}-${match.matchDate.slice(0, 10)}`;
      const usedTeams = dateGroups.get(key) ?? new Set<string>();

      expect(usedTeams.has(match.teamHomeId)).toBe(false);
      expect(usedTeams.has(match.teamAwayId)).toBe(false);

      usedTeams.add(match.teamHomeId);
      usedTeams.add(match.teamAwayId);
      dateGroups.set(key, usedTeams);
    }
  });
});

describe('DEFAULT_TOURNAMENT_STATE', () => {
  it('should have version 1', () => {
    expect(DEFAULT_TOURNAMENT_STATE.version).toBe(1);
  });

  it('should contain all 8 teams', () => {
    expect(DEFAULT_TOURNAMENT_STATE.teams).toHaveLength(8);
  });

  it('should contain all 16 matches', () => {
    expect(DEFAULT_TOURNAMENT_STATE.matches).toHaveLength(16);
  });

  it('should use the TEAMS constant for teams', () => {
    expect(DEFAULT_TOURNAMENT_STATE.teams).toBe(TEAMS);
  });
});

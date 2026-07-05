import { describe, it, expect } from 'vitest';
import { calculateStandings, getTeamStats, getTopScorers } from '@/utils/calculations';
import { Match, Team, Group, Scorer } from '@/types/tournament';

// Helper to create a team
function makeTeam(id: string, name: string, group: Group): Team {
  return { id, name, group };
}

// Helper to create a match
function makeMatch(
  id: string,
  group: Group,
  teamHomeId: string,
  teamAwayId: string,
  scoreHome: number,
  scoreAway: number,
  status: 'upcoming' | 'live' | 'selesai' = 'selesai'
): Match {
  return {
    id,
    group,
    teamHomeId,
    teamAwayId,
    scoreHome,
    scoreAway,
    status,
    scorers: [],
    matchOrder: 1,
    matchDate: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeMatchWithScorers(
  id: string,
  group: Group,
  teamHomeId: string,
  teamAwayId: string,
  scorers: Scorer[],
  status: 'upcoming' | 'live' | 'selesai' = 'selesai'
): Match {
  return {
    ...makeMatch(id, group, teamHomeId, teamAwayId, 0, 0, status),
    scorers,
  };
}

const teamsA: Team[] = [
  makeTeam('a1', 'Alpha', 'A'),
  makeTeam('a2', 'Beta', 'A'),
  makeTeam('a3', 'Charlie', 'A'),
  makeTeam('a4', 'Delta', 'A'),
];

const teamsB: Team[] = [
  makeTeam('b1', 'Echo', 'B'),
  makeTeam('b2', 'Foxtrot', 'B'),
  makeTeam('b3', 'Golf', 'B'),
  makeTeam('b4', 'Hotel', 'B'),
];

const allTeams = [...teamsA, ...teamsB];

describe('calculateStandings', () => {
  describe('empty matches (all zeros)', () => {
    it('should return all teams with zero stats when no matches exist', () => {
      const standings = calculateStandings([], allTeams, 'A');

      expect(standings).toHaveLength(4);
      for (const row of standings) {
        expect(row.played).toBe(0);
        expect(row.wins).toBe(0);
        expect(row.draws).toBe(0);
        expect(row.losses).toBe(0);
        expect(row.goalsFor).toBe(0);
        expect(row.goalsAgainst).toBe(0);
        expect(row.goalDifference).toBe(0);
        expect(row.points).toBe(0);
      }
    });

    it('should sort teams alphabetically when all have zero stats', () => {
      const standings = calculateStandings([], allTeams, 'A');

      expect(standings[0].team.name).toBe('Alpha');
      expect(standings[1].team.name).toBe('Beta');
      expect(standings[2].team.name).toBe('Charlie');
      expect(standings[3].team.name).toBe('Delta');
    });

    it('should assign ranks 1-4 correctly', () => {
      const standings = calculateStandings([], allTeams, 'A');

      expect(standings[0].rank).toBe(1);
      expect(standings[1].rank).toBe(2);
      expect(standings[2].rank).toBe(3);
      expect(standings[3].rank).toBe(4);
    });
  });

  describe('single completed match', () => {
    it('should correctly compute stats for a home win', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 3, 1, 'selesai'),
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      // Alpha (a1) won: 3 pts, GF=3, GA=1, GD=2
      const alpha = standings.find((r) => r.team.id === 'a1')!;
      expect(alpha.played).toBe(1);
      expect(alpha.wins).toBe(1);
      expect(alpha.draws).toBe(0);
      expect(alpha.losses).toBe(0);
      expect(alpha.goalsFor).toBe(3);
      expect(alpha.goalsAgainst).toBe(1);
      expect(alpha.goalDifference).toBe(2);
      expect(alpha.points).toBe(3);

      // Beta (a2) lost: 0 pts, GF=1, GA=3, GD=-2
      const beta = standings.find((r) => r.team.id === 'a2')!;
      expect(beta.played).toBe(1);
      expect(beta.wins).toBe(0);
      expect(beta.draws).toBe(0);
      expect(beta.losses).toBe(1);
      expect(beta.goalsFor).toBe(1);
      expect(beta.goalsAgainst).toBe(3);
      expect(beta.goalDifference).toBe(-2);
      expect(beta.points).toBe(0);
    });

    it('should correctly compute stats for a draw', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 2, 2, 'selesai'),
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      const alpha = standings.find((r) => r.team.id === 'a1')!;
      expect(alpha.points).toBe(1);
      expect(alpha.draws).toBe(1);
      expect(alpha.goalDifference).toBe(0);

      const beta = standings.find((r) => r.team.id === 'a2')!;
      expect(beta.points).toBe(1);
      expect(beta.draws).toBe(1);
      expect(beta.goalDifference).toBe(0);
    });
  });

  describe('multiple matches with correct point allocation', () => {
    it('should accumulate stats across multiple matches', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 2, 0, 'selesai'), // a1 wins
        makeMatch('m2', 'A', 'a1', 'a3', 1, 1, 'selesai'), // draw
        makeMatch('m3', 'A', 'a1', 'a4', 0, 1, 'selesai'), // a1 loses
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      const alpha = standings.find((r) => r.team.id === 'a1')!;
      expect(alpha.played).toBe(3);
      expect(alpha.wins).toBe(1);
      expect(alpha.draws).toBe(1);
      expect(alpha.losses).toBe(1);
      expect(alpha.goalsFor).toBe(3); // 2+1+0
      expect(alpha.goalsAgainst).toBe(2); // 0+1+1
      expect(alpha.goalDifference).toBe(1);
      expect(alpha.points).toBe(4); // 3+1+0
    });

    it('should correctly rank teams after full round of matches', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 2, 0, 'selesai'), // a1 wins
        makeMatch('m2', 'A', 'a3', 'a4', 3, 1, 'selesai'), // a3 wins
        makeMatch('m3', 'A', 'a1', 'a3', 1, 0, 'selesai'), // a1 wins
        makeMatch('m4', 'A', 'a2', 'a4', 2, 2, 'selesai'), // draw
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      // a1: 6 pts (2W), GD=3 (GF=3, GA=0)
      // a3: 3 pts (1W), GD=2 (GF=3, GA=1)
      // a2: 1 pt (1D), GD=-2 (GF=2, GA=4) - but actually GF=2, GA=2 from draw + 0 from loss... let me recalculate
      // a2: lost to a1 (0-2), drew with a4 (2-2) → GF=2, GA=4, GD=-2, Pts=1
      // a4: lost to a3 (1-3), drew with a2 (2-2) → GF=3, GA=5, GD=-2, Pts=1
      // Tiebreaker between a2 and a4: same points (1), same GD (-2), GF: a4=3 > a2=2

      expect(standings[0].team.id).toBe('a1');
      expect(standings[0].points).toBe(6);
      expect(standings[1].team.id).toBe('a3');
      expect(standings[1].points).toBe(3);
      // a4 should be above a2 (higher GF)
      expect(standings[2].team.id).toBe('a4');
      expect(standings[2].points).toBe(1);
      expect(standings[3].team.id).toBe('a2');
      expect(standings[3].points).toBe(1);
    });
  });

  describe('tiebreaker scenarios', () => {
    it('should break ties by goal difference (GD)', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a3', 3, 0, 'selesai'), // a1 wins big
        makeMatch('m2', 'A', 'a2', 'a4', 1, 0, 'selesai'), // a2 wins small
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      // Both a1 and a2 have 3 points, but a1 has GD=3 vs a2 GD=1
      expect(standings[0].team.id).toBe('a1');
      expect(standings[1].team.id).toBe('a2');
    });

    it('should break ties by goals for (GF) when GD is equal', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a3', 3, 1, 'selesai'), // a1: GF=3, GA=1, GD=2
        makeMatch('m2', 'A', 'a2', 'a4', 4, 2, 'selesai'), // a2: GF=4, GA=2, GD=2
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      // Both 3 pts, GD=2, but a2 has GF=4 > a1 GF=3
      expect(standings[0].team.id).toBe('a2');
      expect(standings[1].team.id).toBe('a1');
    });

    it('should break ties alphabetically when all stats are equal', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 1, 1, 'selesai'), // draw
        makeMatch('m2', 'A', 'a3', 'a4', 1, 1, 'selesai'), // draw
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      // a1 (Alpha) and a2 (Beta): 1 pt, GD=0, GF=1
      // a3 (Charlie) and a4 (Delta): 1 pt, GD=0, GF=1
      // All four tied on pts, GD, GF → alphabetical
      expect(standings[0].team.name).toBe('Alpha');
      expect(standings[1].team.name).toBe('Beta');
      expect(standings[2].team.name).toBe('Charlie');
      expect(standings[3].team.name).toBe('Delta');
    });
  });

  describe('only "selesai" matches count', () => {
    it('should ignore matches with status "upcoming"', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 3, 0, 'upcoming'),
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      const alpha = standings.find((r) => r.team.id === 'a1')!;
      expect(alpha.played).toBe(0);
      expect(alpha.points).toBe(0);
      expect(alpha.goalsFor).toBe(0);
    });

    it('should ignore matches with status "live"', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 2, 1, 'live'),
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      const alpha = standings.find((r) => r.team.id === 'a1')!;
      expect(alpha.played).toBe(0);
      expect(alpha.points).toBe(0);
    });

    it('should only count "selesai" matches among mixed statuses', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 2, 0, 'selesai'),
        makeMatch('m2', 'A', 'a1', 'a3', 5, 0, 'upcoming'), // should not count
        makeMatch('m3', 'A', 'a1', 'a4', 3, 0, 'live'), // should not count
      ];

      const standings = calculateStandings(matches, allTeams, 'A');

      const alpha = standings.find((r) => r.team.id === 'a1')!;
      expect(alpha.played).toBe(1);
      expect(alpha.goalsFor).toBe(2);
      expect(alpha.points).toBe(3);
    });
  });

  describe('group filtering', () => {
    it('should only include teams from the specified group', () => {
      const standings = calculateStandings([], allTeams, 'A');

      expect(standings).toHaveLength(4);
      for (const row of standings) {
        expect(row.team.group).toBe('A');
      }
    });

    it('should only consider matches from the specified group', () => {
      const matches: Match[] = [
        makeMatch('m1', 'A', 'a1', 'a2', 2, 0, 'selesai'),
        makeMatch('m2', 'B', 'b1', 'b2', 3, 1, 'selesai'),
      ];

      const standingsA = calculateStandings(matches, allTeams, 'A');
      const standingsB = calculateStandings(matches, allTeams, 'B');

      const alpha = standingsA.find((r) => r.team.id === 'a1')!;
      expect(alpha.goalsFor).toBe(2);

      const echo = standingsB.find((r) => r.team.id === 'b1')!;
      expect(echo.goalsFor).toBe(3);
    });
  });
});

describe('getTeamStats', () => {
  it('should return zero stats for a team with no matches', () => {
    const stats = getTeamStats('a1', []);
    expect(stats.played).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.draws).toBe(0);
    expect(stats.losses).toBe(0);
    expect(stats.goalsFor).toBe(0);
    expect(stats.goalsAgainst).toBe(0);
    expect(stats.goalDifference).toBe(0);
    expect(stats.points).toBe(0);
  });

  it('should compute stats when team is home', () => {
    const matches: Match[] = [
      makeMatch('m1', 'A', 'a1', 'a2', 3, 1, 'selesai'),
    ];

    const stats = getTeamStats('a1', matches);
    expect(stats.played).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.goalsFor).toBe(3);
    expect(stats.goalsAgainst).toBe(1);
    expect(stats.goalDifference).toBe(2);
    expect(stats.points).toBe(3);
  });

  it('should compute stats when team is away', () => {
    const matches: Match[] = [
      makeMatch('m1', 'A', 'a1', 'a2', 1, 3, 'selesai'),
    ];

    const stats = getTeamStats('a2', matches);
    expect(stats.played).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.goalsFor).toBe(3);
    expect(stats.goalsAgainst).toBe(1);
    expect(stats.goalDifference).toBe(2);
    expect(stats.points).toBe(3);
  });

  it('should ignore matches the team is not part of', () => {
    const matches: Match[] = [
      makeMatch('m1', 'A', 'a1', 'a2', 3, 1, 'selesai'),
    ];

    const stats = getTeamStats('a3', matches);
    expect(stats.played).toBe(0);
    expect(stats.points).toBe(0);
  });

  it('should correctly count draws', () => {
    const matches: Match[] = [
      makeMatch('m1', 'A', 'a1', 'a2', 2, 2, 'selesai'),
    ];

    const stats = getTeamStats('a1', matches);
    expect(stats.draws).toBe(1);
    expect(stats.points).toBe(1);
    expect(stats.goalDifference).toBe(0);
  });
});

describe('getTopScorers', () => {
  it('should aggregate goals per player and ignore unfinished matches', () => {
    const matches: Match[] = [
      makeMatchWithScorers('m1', 'A', 'a1', 'a2', [
        { playerName: 'Bima', teamId: 'a1', count: 2, minute: 12 },
        { playerName: 'Rafi', teamId: 'a1', count: 1, minute: 30 },
      ]),
      makeMatchWithScorers('m2', 'A', 'a1', 'a3', [
        { playerName: 'Bima', teamId: 'a1', count: 1, minute: 50 },
      ]),
      makeMatchWithScorers(
        'm3',
        'A',
        'a1',
        'a4',
        [{ playerName: 'Bima', teamId: 'a1', count: 5, minute: null }],
        'live'
      ),
    ];

    const topScorers = getTopScorers(matches, allTeams);

    expect(topScorers[0]).toMatchObject({
      rank: 1,
      playerName: 'Bima',
      goals: 3,
      matches: 2,
    });
    expect(topScorers[0].team.id).toBe('a1');
    expect(topScorers[1].playerName).toBe('Rafi');
    expect(topScorers[1].goals).toBe(1);
  });
});

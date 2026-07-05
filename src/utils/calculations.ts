import { Match, Team, Group, StandingRow, TopScorerRow } from '@/types/tournament';

/**
 * Returns aggregated stats for a single team from a set of completed matches.
 */
export function getTeamStats(
  teamId: string,
  matches: Match[]
): {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
} {
  let played = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const match of matches) {
    if (match.stage !== undefined && match.stage !== 'group') continue;

    if (match.teamHomeId === teamId) {
      played++;
      goalsFor += match.scoreHome;
      goalsAgainst += match.scoreAway;
      if (match.scoreHome > match.scoreAway) wins++;
      else if (match.scoreHome === match.scoreAway) draws++;
      else losses++;
    } else if (match.teamAwayId === teamId) {
      played++;
      goalsFor += match.scoreAway;
      goalsAgainst += match.scoreHome;
      if (match.scoreAway > match.scoreHome) wins++;
      else if (match.scoreAway === match.scoreHome) draws++;
      else losses++;
    }
  }

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: wins * 3 + draws,
  };
}

/**
 * Calculates standings for a given group based on completed matches.
 *
 * Algorithm:
 * 1. Filter teams by group
 * 2. Filter completed matches (status === 'selesai') for that group
 * 3. For each team: aggregate stats from matches where team is home or away
 * 4. Sort: Points DESC → goalDifference DESC → goalsFor DESC → team.name ASC
 * 5. Assign rank 1-N
 */
export function calculateStandings(
  matches: Match[],
  teams: Team[],
  group: Group
): StandingRow[] {
  // 1. Filter teams by group
  const groupTeams = teams.filter((t) => t.group === group);

  // 2. Filter completed matches for this group
  const completedMatches = matches.filter(
    (m) => m.group === group && (m.stage === undefined || m.stage === 'group') && m.status === 'selesai'
  );

  // 3. For each team, aggregate stats
  const rows: StandingRow[] = groupTeams.map((team) => {
    const stats = getTeamStats(team.id, completedMatches);

    return {
      rank: 0, // assigned after sort
      team,
      played: stats.played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      goalsFor: stats.goalsFor,
      goalsAgainst: stats.goalsAgainst,
      goalDifference: stats.goalDifference,
      points: stats.points,
    };
  });

  // 4. Sort: Points DESC → GD DESC → GF DESC → Name ASC
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });

  // 5. Assign ranks
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return rows;
}

/**
 * Aggregates completed-match scorers into a top scorer leaderboard.
 */
export function getTopScorers(matches: Match[], teams: Team[]): TopScorerRow[] {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const scorerMap = new Map<
    string,
    Omit<TopScorerRow, 'rank' | 'matches'> & { matchIds: Set<string> }
  >();

  for (const match of matches) {
    if (match.status !== 'selesai') continue;

    for (const scorer of match.scorers) {
      const team = teamById.get(scorer.teamId);
      if (!team) continue;

      const playerName = scorer.playerName.trim();
      const key = `${scorer.teamId}:${playerName.toLowerCase()}`;
      const existing = scorerMap.get(key);

      if (existing) {
        existing.goals += scorer.count;
        existing.matchIds.add(match.id);
      } else {
        scorerMap.set(key, {
          playerName,
          team,
          goals: scorer.count,
          matchIds: new Set([match.id]),
        });
      }
    }
  }

  return Array.from(scorerMap.values())
    .map((row) => ({
      playerName: row.playerName,
      team: row.team,
      goals: row.goals,
      matches: row.matchIds.size,
    }))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (a.matches !== b.matches) return a.matches - b.matches;
      return a.playerName.localeCompare(b.playerName);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

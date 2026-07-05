// === Core Types ===

export type Group = 'A' | 'B';
export type MatchGroup = Group | 'KO';
export type MatchStage = 'group' | 'semifinal' | 'third-place' | 'final';
export type MatchStatus = 'upcoming' | 'live' | 'selesai';
export type TabId = 'klasemen' | 'jadwal' | 'input' | 'topskor' | 'admin';

export interface Team {
  id: string;
  name: string;
  group: Group;
}

export interface Scorer {
  playerName: string;
  teamId: string;
  minute: number | null;
  count: number;
}

export interface Match {
  id: string;
  group: MatchGroup;
  stage?: MatchStage;
  title?: string;
  teamHomeId: string;
  teamAwayId: string;
  scoreHome: number;
  scoreAway: number;
  status: MatchStatus;
  scorers: Scorer[];
  matchOrder: number;
  matchDate: string | null; // ISO date string, e.g. "2025-07-12T16:00:00" or null if TBD
  createdAt: string;
  updatedAt: string;
}

// === Derived Types ===

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TopScorerRow {
  rank: number;
  playerName: string;
  team: Team;
  goals: number;
  matches: number;
}

// === Form Types ===

export interface MatchFormData {
  group: MatchGroup;
  teamHomeId: string;
  teamAwayId: string;
  scoreHome: number;
  scoreAway: number;
  status: MatchStatus;
  scorers: Scorer[];
}

// === Storage Types ===

export interface TournamentState {
  version: number;
  teams: Team[];
  matches: Match[];
  playerNamesByTeam?: Record<string, string[]>;
  exportedAt?: string;
}

// === Result Types ===

export type SubmitResult = { success: true } | { success: false; error: string };
export type ImportResult = { success: true } | { success: false; error: string };

// === Validation ===

export function isValidTournamentState(data: unknown): data is TournamentState {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number') return false;
  if (!Array.isArray(obj.teams)) return false;
  if (!Array.isArray(obj.matches)) return false;

  // Validate teams
  for (const team of obj.teams) {
    if (typeof team !== 'object' || team === null) return false;
    const t = team as Record<string, unknown>;
    if (typeof t.id !== 'string') return false;
    if (typeof t.name !== 'string') return false;
    if (t.group !== 'A' && t.group !== 'B') return false;
  }

  // Validate matches
  for (const match of obj.matches) {
    if (typeof match !== 'object' || match === null) return false;
    const m = match as Record<string, unknown>;
    if (typeof m.id !== 'string') return false;
    if (m.group !== 'A' && m.group !== 'B' && m.group !== 'KO') return false;
    if (
      m.stage !== undefined &&
      m.stage !== 'group' &&
      m.stage !== 'semifinal' &&
      m.stage !== 'third-place' &&
      m.stage !== 'final'
    ) return false;
    if (m.title !== undefined && typeof m.title !== 'string') return false;
    if (typeof m.teamHomeId !== 'string') return false;
    if (typeof m.teamAwayId !== 'string') return false;
    if (typeof m.scoreHome !== 'number') return false;
    if (typeof m.scoreAway !== 'number') return false;
    if (m.status !== 'upcoming' && m.status !== 'live' && m.status !== 'selesai') return false;
    if (!Array.isArray(m.scorers)) return false;

    // Validate each scorer in the match
    for (const scorer of m.scorers as unknown[]) {
      if (typeof scorer !== 'object' || scorer === null) return false;
      const s = scorer as Record<string, unknown>;
      if (typeof s.playerName !== 'string') return false;
      if (typeof s.teamId !== 'string') return false;
      if (s.minute !== null && typeof s.minute !== 'number') return false;
      if (typeof s.count !== 'number') return false;
    }

    if (typeof m.matchOrder !== 'number') return false;
    if (m.matchDate !== undefined && m.matchDate !== null && typeof m.matchDate !== 'string') return false;
    if (typeof m.createdAt !== 'string') return false;
    if (typeof m.updatedAt !== 'string') return false;
  }

  // exportedAt is optional, but if present must be a string
  if (obj.exportedAt !== undefined && typeof obj.exportedAt !== 'string') return false;

  if (obj.playerNamesByTeam !== undefined) {
    if (typeof obj.playerNamesByTeam !== 'object' || obj.playerNamesByTeam === null) return false;

    for (const [teamId, playerNames] of Object.entries(
      obj.playerNamesByTeam as Record<string, unknown>
    )) {
      if (typeof teamId !== 'string') return false;
      if (!Array.isArray(playerNames)) return false;
      if (!playerNames.every((name) => typeof name === 'string')) return false;
    }
  }

  return true;
}

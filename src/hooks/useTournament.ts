'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Team,
  Match,
  Group,
  Scorer,
  MatchFormData,
  StandingRow,
  SubmitResult,
  ImportResult,
  TournamentState,
} from '@/types/tournament';
import { PLAYER_NAMES_BY_TEAM, TEAMS, generateMatchSlots } from '@/data/teams';
import { StorageUtil } from '@/utils/storage';
import { RemoteStorage } from '@/utils/remoteStorage';
import { calculateStandings } from '@/utils/calculations';
import { validateScore, validateSameTeam, validateDuplicateMatch } from '@/utils/validation';

const MAX_SCORERS_PER_MATCH = 30;

export interface UseTournamentReturn {
  teams: Team[];
  matches: Match[];
  displayMatches: Match[];
  playerNamesByTeam: Record<string, string[]>;
  submitMatch: (matchId: string, data: MatchFormData) => SubmitResult;
  updateMatch: (matchId: string, data: MatchFormData) => SubmitResult;
  deleteMatch: (matchId: string) => void;
  getStandings: (group: Group) => StandingRow[];
  addScorer: (matchId: string, scorer: Scorer) => void;
  removeScorer: (matchId: string, scorerIndex: number) => void;
  exportData: () => void;
  importData: (file: File) => Promise<ImportResult>;
  resetAll: () => void;
  // Team management
  addTeam: (name: string, group: Group) => void;
  editTeam: (teamId: string, newName: string) => void;
  removeTeam: (teamId: string) => void;
  regenerateMatches: () => void;
  // Player roster management
  addPlayer: (teamId: string, playerName: string) => SubmitResult;
  editPlayer: (teamId: string, playerIndex: number, playerName: string) => SubmitResult;
  removePlayer: (teamId: string, playerIndex: number) => void;
  // Schedule management
  updateMatchDate: (matchId: string, date: string | null) => void;
  isLoaded: boolean;
}

interface UseTournamentOptions {
  isAdmin?: boolean;
  adminPin?: string;
}

export function useTournament(options: UseTournamentOptions = {}): UseTournamentReturn {
  const { isAdmin = false, adminPin = '' } = options;
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerNamesByTeam, setPlayerNamesByTeam] = useState<Record<string, string[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRemoteLoaded, setIsRemoteLoaded] = useState(false);
  const hasLocalChangesRef = useRef(false);

  function buildRoster(nextTeams: Team[], roster?: Record<string, string[]>): Record<string, string[]> {
    return nextTeams.reduce<Record<string, string[]>>((acc, team) => {
      acc[team.id] = roster?.[team.id] ?? PLAYER_NAMES_BY_TEAM[team.id] ?? [];
      return acc;
    }, {});
  }

  function isKnockoutMatch(match: Match): boolean {
    return match.group === 'KO' && match.stage !== undefined && match.stage !== 'group';
  }

  function getKnockoutKey(match: Pick<Match, 'stage' | 'title'>): string {
    return `${match.stage ?? 'group'}:${match.title ?? ''}`.toLowerCase();
  }

  function mergeWithGeneratedMatches(storedMatches: Match[], nextTeams: Team[]): Match[] {
    const generatedMatches = generateMatchSlots(nextTeams);
    const storedGroupById = new Map(
      storedMatches
        .filter((match) => !isKnockoutMatch(match))
        .map((match) => [match.id, match])
    );
    const storedKnockoutByKey = new Map(
      storedMatches
        .filter(isKnockoutMatch)
        .map((match) => [getKnockoutKey(match), match])
    );

    return generatedMatches.map((generated) => {
      const isGeneratedKnockout = isKnockoutMatch(generated);
      const stored = isGeneratedKnockout
        ? storedKnockoutByKey.get(getKnockoutKey(generated))
        : storedGroupById.get(generated.id);
      if (!stored) return generated;

      const isStoredSameStage =
        isGeneratedKnockout
          ? isKnockoutMatch(stored) && getKnockoutKey(stored) === getKnockoutKey(generated)
          : stored.group !== 'KO' && (stored.stage === undefined || stored.stage === 'group');

      if (!isStoredSameStage) {
        return generated;
      }

      return {
        ...generated,
        ...stored,
        group: generated.group,
        stage: generated.stage,
        title: generated.title,
        teamHomeId: isGeneratedKnockout ? generated.teamHomeId : stored.teamHomeId,
        teamAwayId: isGeneratedKnockout ? generated.teamAwayId : stored.teamAwayId,
        matchDate: isGeneratedKnockout ? generated.matchDate : stored.matchDate,
        matchOrder: generated.matchOrder,
      };
    });
  }

  function applyTournamentState(state: TournamentState) {
    setTeams(state.teams);
    setMatches(mergeWithGeneratedMatches(state.matches, state.teams));
    setPlayerNamesByTeam(buildRoster(state.teams, state.playerNamesByTeam));
  }

  function getInitialState(): TournamentState {
    const stored = StorageUtil.load();
    if (stored) return stored;

    const initialTeams = TEAMS;
    const initialMatches = generateMatchSlots(initialTeams);
    const initialPlayerNamesByTeam = buildRoster(initialTeams, PLAYER_NAMES_BY_TEAM);
    const initialState = {
      version: 1,
      teams: initialTeams,
      matches: initialMatches,
      playerNamesByTeam: initialPlayerNamesByTeam,
    };

    StorageUtil.save(initialState);
    return initialState;
  }

  function markLocalChange() {
    hasLocalChangesRef.current = true;
  }

  // On mount: load local/default immediately, then apply remote only if nothing changed yet.
  useEffect(() => {
    let cancelled = false;

    const initialState = getInitialState();
    applyTournamentState(initialState);
    setIsLoaded(true);

    RemoteStorage.load().then((remote) => {
      if (cancelled) return;

      if (remote.state && !hasLocalChangesRef.current) {
        applyTournamentState(remote.state);
      }
      setIsRemoteLoaded(true);
    });

    return () => {
      cancelled = true;
    };
    // Remote bootstrap must run once on mount; later edits are guarded by hasLocalChangesRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage whenever matches change (after initial load)
  useEffect(() => {
    if (isLoaded && teams.length > 0) {
      const state = { version: 1, teams, matches, playerNamesByTeam };
      StorageUtil.save(state);
      if (isAdmin && adminPin && isRemoteLoaded) {
        RemoteStorage.save(state, adminPin);
      }
    }
  }, [matches, teams, playerNamesByTeam, isLoaded, isAdmin, adminPin, isRemoteLoaded]);

  const validateMatchData = useCallback(
    (data: MatchFormData, excludeMatchId?: string, match?: Match): SubmitResult => {
      const isKnockout = match?.stage !== undefined && match.stage !== 'group';

      if (!data.teamHomeId || !data.teamAwayId) {
        return { success: false, error: 'Peserta pertandingan belum tersedia' };
      }

      // Validate same team
      const sameTeamResult = validateSameTeam(data.teamHomeId, data.teamAwayId);
      if (!sameTeamResult.valid) {
        return { success: false, error: sameTeamResult.error! };
      }

      // Validate scores
      const homeScoreResult = validateScore(data.scoreHome);
      if (!homeScoreResult.valid) {
        return { success: false, error: homeScoreResult.error! };
      }
      const awayScoreResult = validateScore(data.scoreAway);
      if (!awayScoreResult.valid) {
        return { success: false, error: awayScoreResult.error! };
      }

      if (isKnockout && data.status === 'selesai' && data.scoreHome === data.scoreAway) {
        return { success: false, error: 'Pertandingan knockout tidak boleh seri' };
      }

      // Validate duplicate match pairing
      if (!isKnockout) {
        const dupResult = validateDuplicateMatch(
          matches,
          data.group,
          data.teamHomeId,
          data.teamAwayId,
          excludeMatchId
        );
        if (!dupResult.valid) {
          return { success: false, error: dupResult.error! };
        }
      }

      return { success: true };
    },
    [matches]
  );

  const submitMatch = useCallback(
    (matchId: string, data: MatchFormData): SubmitResult => {
      // Find the pre-existing match slot by ID
      const matchIndex = matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) {
        return { success: false, error: 'Pertandingan tidak ditemukan' };
      }

      const now = new Date().toISOString();
      const updatedMatches = [...matches];
      const currentMatch = updatedMatches[matchIndex];

      // Validate (exclude current match from duplicate check since we're updating it)
      const validation = validateMatchData(data, matchId, currentMatch);
      if (!validation.success) {
        return validation;
      }

      updatedMatches[matchIndex] = {
        ...currentMatch,
        group: data.group,
        teamHomeId: data.teamHomeId,
        teamAwayId: data.teamAwayId,
        scoreHome: data.scoreHome,
        scoreAway: data.scoreAway,
        status: data.status,
        scorers: data.scorers,
        updatedAt: now,
      };

      markLocalChange();
      setMatches(updatedMatches);
      return { success: true };
    },
    [matches, validateMatchData]
  );

  const updateMatch = useCallback(
    (matchId: string, data: MatchFormData): SubmitResult => {
      const matchIndex = matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) {
        return { success: false, error: 'Pertandingan tidak ditemukan' };
      }

      const now = new Date().toISOString();
      const updatedMatches = [...matches];
      const currentMatch = updatedMatches[matchIndex];

      // Validate (exclude current match from duplicate check)
      const validation = validateMatchData(data, matchId, currentMatch);
      if (!validation.success) {
        return validation;
      }

      updatedMatches[matchIndex] = {
        ...currentMatch,
        group: data.group,
        teamHomeId: data.teamHomeId,
        teamAwayId: data.teamAwayId,
        scoreHome: data.scoreHome,
        scoreAway: data.scoreAway,
        status: data.status,
        scorers: data.scorers,
        updatedAt: now,
      };

      markLocalChange();
      setMatches(updatedMatches);
      return { success: true };
    },
    [matches, validateMatchData]
  );

  const deleteMatch = useCallback(
    (matchId: string): void => {
      const matchIndex = matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) return;

      const now = new Date().toISOString();
      const updatedMatches = [...matches];
      updatedMatches[matchIndex] = {
        ...updatedMatches[matchIndex],
        scoreHome: 0,
        scoreAway: 0,
        status: 'upcoming',
        scorers: [],
        updatedAt: now,
      };

      markLocalChange();
      setMatches(updatedMatches);
    },
    [matches]
  );

  const getStandings = useCallback(
    (group: Group): StandingRow[] => {
      return calculateStandings(matches, teams, group);
    },
    [matches, teams]
  );

  const displayMatches = (() => {
    const resolvedMatches = matches.map((match) => ({ ...match }));
    const knockoutMatches = resolvedMatches
      .filter(isKnockoutMatch)
      .sort((a, b) => a.matchOrder - b.matchOrder);
    const semifinalMatches = knockoutMatches.filter((match) => match.stage === 'semifinal');
    const semifinal1 =
      semifinalMatches.find((match) => match.title?.toLowerCase().includes('semifinal 1')) ??
      semifinalMatches[0];
    const semifinal2 =
      semifinalMatches.find((match) => match.title?.toLowerCase().includes('semifinal 2')) ??
      semifinalMatches[1];
    const thirdPlace = knockoutMatches.find((match) => match.stage === 'third-place');
    const finalMatch = knockoutMatches.find((match) => match.stage === 'final');
    const groupMatches = resolvedMatches.filter(
      (match) => match.stage === undefined || match.stage === 'group'
    );
    const groupAMatches = groupMatches.filter((match) => match.group === 'A');
    const groupBMatches = groupMatches.filter((match) => match.group === 'B');
    const groupAComplete =
      groupAMatches.length > 0 && groupAMatches.every((match) => match.status === 'selesai');
    const groupBComplete =
      groupBMatches.length > 0 && groupBMatches.every((match) => match.status === 'selesai');

    if (groupAComplete && groupBComplete) {
      const standingsA = calculateStandings(resolvedMatches, teams, 'A');
      const standingsB = calculateStandings(resolvedMatches, teams, 'B');

      if (semifinal1 && standingsA[0] && standingsB[1]) {
        semifinal1.teamHomeId = standingsA[0].team.id;
        semifinal1.teamAwayId = standingsB[1].team.id;
      }

      if (semifinal2 && standingsB[0] && standingsA[1]) {
        semifinal2.teamHomeId = standingsB[0].team.id;
        semifinal2.teamAwayId = standingsA[1].team.id;
      }
    }

    const getWinnerId = (match: Match | undefined): string | null => {
      if (!match || match.status !== 'selesai' || match.scoreHome === match.scoreAway) return null;
      return match.scoreHome > match.scoreAway ? match.teamHomeId : match.teamAwayId;
    };

    const getLoserId = (match: Match | undefined): string | null => {
      if (!match || match.status !== 'selesai' || match.scoreHome === match.scoreAway) return null;
      return match.scoreHome > match.scoreAway ? match.teamAwayId : match.teamHomeId;
    };

    const semifinal1Winner = getWinnerId(semifinal1);
    const semifinal2Winner = getWinnerId(semifinal2);
    const semifinal1Loser = getLoserId(semifinal1);
    const semifinal2Loser = getLoserId(semifinal2);

    if (thirdPlace && semifinal1Loser && semifinal2Loser) {
      thirdPlace.teamHomeId = semifinal1Loser;
      thirdPlace.teamAwayId = semifinal2Loser;
    }

    if (finalMatch && semifinal1Winner && semifinal2Winner) {
      finalMatch.teamHomeId = semifinal1Winner;
      finalMatch.teamAwayId = semifinal2Winner;
    }

    return resolvedMatches;
  })();

  const addScorer = useCallback(
    (matchId: string, scorer: Scorer): void => {
      const matchIndex = matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) return;

      const match = matches[matchIndex];
      if (match.scorers.length >= MAX_SCORERS_PER_MATCH) return;

      const now = new Date().toISOString();
      const updatedMatches = [...matches];
      updatedMatches[matchIndex] = {
        ...match,
        scorers: [...match.scorers, scorer],
        updatedAt: now,
      };

      markLocalChange();
      setMatches(updatedMatches);
    },
    [matches]
  );

  const removeScorer = useCallback(
    (matchId: string, scorerIndex: number): void => {
      const matchIndex = matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) return;

      const match = matches[matchIndex];
      if (scorerIndex < 0 || scorerIndex >= match.scorers.length) return;

      const now = new Date().toISOString();
      const updatedMatches = [...matches];
      updatedMatches[matchIndex] = {
        ...match,
        scorers: match.scorers.filter((_, i) => i !== scorerIndex),
        updatedAt: now,
      };

      markLocalChange();
      setMatches(updatedMatches);
    },
    [matches]
  );

  const exportData = useCallback((): void => {
    StorageUtil.exportToFile({ version: 1, teams, matches, playerNamesByTeam });
  }, [teams, matches, playerNamesByTeam]);

  const importData = useCallback(
    async (file: File): Promise<ImportResult> => {
      const result = await StorageUtil.importFromFile(file);
      if (!result.success) {
        return result;
      }

      // Read the file again to get the data and replace state
      const text = await file.text();
      const parsed = JSON.parse(text) as TournamentState;
      markLocalChange();
      setTeams(parsed.teams);
      setMatches(mergeWithGeneratedMatches(parsed.matches, parsed.teams));
      setPlayerNamesByTeam(buildRoster(parsed.teams, parsed.playerNamesByTeam));

      return { success: true };
    },
    // Import reads the latest file payload and then normalizes it through current helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const resetAll = useCallback((): void => {
    const now = new Date().toISOString();
    const resetMatches = matches.map((match) => ({
      ...match,
      scoreHome: 0,
      scoreAway: 0,
      status: 'upcoming' as const,
      scorers: [],
      updatedAt: now,
    }));

    markLocalChange();
    setMatches(resetMatches);
  }, [matches]);

  // === Team Management ===

  const addTeam = useCallback(
    (name: string, group: Group): void => {
      const id = `team-${group.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newTeam: Team = { id, name, group };
      markLocalChange();
      setTeams((prev) => {
        const updated = [...prev, newTeam];
        return updated;
      });
      setPlayerNamesByTeam((prev) => ({ ...prev, [id]: [] }));
    },
    []
  );

  const editTeam = useCallback(
    (teamId: string, newName: string): void => {
      markLocalChange();
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name: newName } : t)));
    },
    []
  );

  const removeTeam = useCallback(
    (teamId: string): void => {
      markLocalChange();
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setPlayerNamesByTeam((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
    },
    []
  );

  const regenerateMatches = useCallback((): void => {
    const newMatches = generateMatchSlots(teams);
    markLocalChange();
    setMatches(newMatches);
  }, [teams]);

  // === Player Roster Management ===

  const addPlayer = useCallback((teamId: string, playerName: string): SubmitResult => {
    const name = playerName.trim();
    if (!name) return { success: false, error: 'Nama pemain tidak boleh kosong' };
    if (name.length > 50) return { success: false, error: 'Nama pemain maksimal 50 karakter' };

    const existingNames = playerNamesByTeam[teamId] ?? [];
    if (existingNames.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: 'Nama pemain sudah ada di tim ini' };
    }

    markLocalChange();
    setPlayerNamesByTeam((prev) => ({
      ...prev,
      [teamId]: [...(prev[teamId] ?? []), name],
    }));
    return { success: true };
  }, [playerNamesByTeam]);

  const editPlayer = useCallback(
    (teamId: string, playerIndex: number, playerName: string): SubmitResult => {
      const name = playerName.trim();
      if (!name) return { success: false, error: 'Nama pemain tidak boleh kosong' };
      if (name.length > 50) return { success: false, error: 'Nama pemain maksimal 50 karakter' };

      const existingNames = playerNamesByTeam[teamId] ?? [];
      if (playerIndex < 0 || playerIndex >= existingNames.length) {
        return { success: false, error: 'Pemain tidak ditemukan' };
      }
      if (
        existingNames.some(
          (existing, index) => index !== playerIndex && existing.toLowerCase() === name.toLowerCase()
        )
      ) {
        return { success: false, error: 'Nama pemain sudah ada di tim ini' };
      }

      markLocalChange();
      setPlayerNamesByTeam((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] ?? []).map((existing, index) =>
          index === playerIndex ? name : existing
        ),
      }));
      return { success: true };
    },
    [playerNamesByTeam]
  );

  const removePlayer = useCallback((teamId: string, playerIndex: number): void => {
    markLocalChange();
    setPlayerNamesByTeam((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] ?? []).filter((_, index) => index !== playerIndex),
    }));
  }, []);

  // === Schedule Management ===

  const updateMatchDate = useCallback(
    (matchId: string, date: string | null): void => {
      const matchIndex = matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) return;

      const now = new Date().toISOString();
      const updatedMatches = [...matches];
      updatedMatches[matchIndex] = {
        ...updatedMatches[matchIndex],
        matchDate: date,
        updatedAt: now,
      };

      markLocalChange();
      setMatches(updatedMatches);
    },
    [matches]
  );

  return {
    teams,
    matches,
    displayMatches,
    playerNamesByTeam,
    submitMatch,
    updateMatch,
    deleteMatch,
    getStandings,
    addScorer,
    removeScorer,
    exportData,
    importData,
    resetAll,
    addTeam,
    editTeam,
    removeTeam,
    regenerateMatches,
    addPlayer,
    editPlayer,
    removePlayer,
    updateMatchDate,
    isLoaded,
  };
}

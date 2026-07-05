import { renderHook, act } from '@testing-library/react';
import { useTournament } from '@/hooks/useTournament';
import { TEAMS, generateMatchSlots } from '@/data/teams';
import { StorageUtil, STORAGE_KEY } from '@/utils/storage';
import { MatchFormData, Scorer } from '@/types/tournament';

describe('useTournament hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default teams and matches when no stored data', () => {
      const { result } = renderHook(() => useTournament());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.teams).toHaveLength(8);
      expect(result.current.matches).toHaveLength(16);
      expect(result.current.playerNamesByTeam['team-a1'].length).toBeGreaterThan(0);
    });

    it('should load existing data from localStorage', () => {
      const existingState = {
        version: 1,
        teams: TEAMS,
        matches: generateMatchSlots(TEAMS).map((m, i) =>
          i === 0 ? { ...m, scoreHome: 3, scoreAway: 1, status: 'selesai' as const } : m
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingState));

      const { result } = renderHook(() => useTournament());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.matches[0].scoreHome).toBe(3);
      expect(result.current.matches[0].scoreAway).toBe(1);
      expect(result.current.matches[0].status).toBe('selesai');
      expect(result.current.playerNamesByTeam['team-a1'].length).toBeGreaterThan(0);
    });

    it('should not modify existing valid data (idempotent init)', () => {
      const existingState = {
        version: 1,
        teams: TEAMS,
        matches: generateMatchSlots(TEAMS).map((m, i) =>
          i === 0 ? { ...m, scoreHome: 2, scoreAway: 2, status: 'selesai' as const } : m
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingState));

      renderHook(() => useTournament());

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.matches[0].scoreHome).toBe(2);
      expect(stored.matches[0].scoreAway).toBe(2);
      expect(stored.matches[0].status).toBe('selesai');
    });
  });

  describe('submitMatch', () => {
    it('should update an existing match slot with scores and status', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;
      const data: MatchFormData = {
        group: match.group,
        teamHomeId: match.teamHomeId,
        teamAwayId: match.teamAwayId,
        scoreHome: 2,
        scoreAway: 1,
        status: 'selesai',
        scorers: [],
      };

      let submitResult: ReturnType<typeof result.current.submitMatch>;
      act(() => {
        submitResult = result.current.submitMatch(matchId, data);
      });

      expect(submitResult!.success).toBe(true);
      expect(result.current.matches[0].scoreHome).toBe(2);
      expect(result.current.matches[0].scoreAway).toBe(1);
      expect(result.current.matches[0].status).toBe('selesai');
    });

    it('should reject if same team is selected for home and away', () => {
      const { result } = renderHook(() => useTournament());

      const matchId = result.current.matches[0].id;
      const data: MatchFormData = {
        group: 'A',
        teamHomeId: 'team-a1',
        teamAwayId: 'team-a1',
        scoreHome: 1,
        scoreAway: 0,
        status: 'selesai',
        scorers: [],
      };

      let submitResult: ReturnType<typeof result.current.submitMatch>;
      act(() => {
        submitResult = result.current.submitMatch(matchId, data);
      });

      expect(submitResult!.success).toBe(false);
    });

    it('should reject scores out of range', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;
      const data: MatchFormData = {
        group: match.group,
        teamHomeId: match.teamHomeId,
        teamAwayId: match.teamAwayId,
        scoreHome: 100,
        scoreAway: 0,
        status: 'selesai',
        scorers: [],
      };

      let submitResult: ReturnType<typeof result.current.submitMatch>;
      act(() => {
        submitResult = result.current.submitMatch(matchId, data);
      });

      expect(submitResult!.success).toBe(false);
    });

    it('should return error for non-existent match ID', () => {
      const { result } = renderHook(() => useTournament());

      const data: MatchFormData = {
        group: 'A',
        teamHomeId: 'team-a1',
        teamAwayId: 'team-a2',
        scoreHome: 1,
        scoreAway: 0,
        status: 'selesai',
        scorers: [],
      };

      let submitResult: ReturnType<typeof result.current.submitMatch>;
      act(() => {
        submitResult = result.current.submitMatch('non-existent', data);
      });

      expect(submitResult!.success).toBe(false);
    });
  });

  describe('updateMatch', () => {
    it('should overwrite match data', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;

      // First submit
      act(() => {
        result.current.submitMatch(matchId, {
          group: match.group,
          teamHomeId: match.teamHomeId,
          teamAwayId: match.teamAwayId,
          scoreHome: 1,
          scoreAway: 0,
          status: 'selesai',
          scorers: [],
        });
      });

      // Then update
      let updateResult: ReturnType<typeof result.current.updateMatch>;
      act(() => {
        updateResult = result.current.updateMatch(matchId, {
          group: match.group,
          teamHomeId: match.teamHomeId,
          teamAwayId: match.teamAwayId,
          scoreHome: 3,
          scoreAway: 2,
          status: 'selesai',
          scorers: [],
        });
      });

      expect(updateResult!.success).toBe(true);
      expect(result.current.matches[0].scoreHome).toBe(3);
      expect(result.current.matches[0].scoreAway).toBe(2);
    });
  });

  describe('deleteMatch', () => {
    it('should reset match to upcoming with 0 scores and empty scorers', () => {
      const { result } = renderHook(() => useTournament());

      const initialMatch = result.current.matches[0];
      const matchId = initialMatch.id;

      // Submit a match first
      act(() => {
        result.current.submitMatch(matchId, {
          group: initialMatch.group,
          teamHomeId: initialMatch.teamHomeId,
          teamAwayId: initialMatch.teamAwayId,
          scoreHome: 3,
          scoreAway: 1,
          status: 'selesai',
          scorers: [{ playerName: 'Player 1', teamId: initialMatch.teamHomeId, minute: 10, count: 1 }],
        });
      });

      // Delete it
      act(() => {
        result.current.deleteMatch(matchId);
      });

      const match = result.current.matches[0];
      expect(match.status).toBe('upcoming');
      expect(match.scoreHome).toBe(0);
      expect(match.scoreAway).toBe(0);
      expect(match.scorers).toEqual([]);
      // Should keep same id, group, teams, matchOrder
      expect(match.id).toBe(matchId);
      expect(match.teamHomeId).toBe(initialMatch.teamHomeId);
      expect(match.teamAwayId).toBe(initialMatch.teamAwayId);
    });
  });

  describe('getStandings', () => {
    it('should return standings for a group', () => {
      const { result } = renderHook(() => useTournament());

      const standings = result.current.getStandings('A');
      expect(standings).toHaveLength(4);
      // All teams start with 0 points
      standings.forEach((row) => {
        expect(row.points).toBe(0);
        expect(row.played).toBe(0);
      });
    });

    it('should reflect match results in standings', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;
      act(() => {
        result.current.submitMatch(matchId, {
          group: match.group,
          teamHomeId: match.teamHomeId,
          teamAwayId: match.teamAwayId,
          scoreHome: 2,
          scoreAway: 0,
          status: 'selesai',
          scorers: [],
        });
      });

      const standings = result.current.getStandings('A');
      const winningTeam = standings.find((s) => s.team.id === match.teamHomeId);
      expect(winningTeam!.points).toBe(3);
      expect(winningTeam!.wins).toBe(1);
      expect(winningTeam!.goalsFor).toBe(2);
    });
  });

  describe('addScorer / removeScorer', () => {
    it('should add a scorer to a match', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;
      const scorer: Scorer = {
        playerName: 'Player 1',
        teamId: match.teamHomeId,
        minute: 25,
        count: 1,
      };

      act(() => {
        result.current.addScorer(matchId, scorer);
      });

      expect(result.current.matches[0].scorers).toHaveLength(1);
      expect(result.current.matches[0].scorers[0].playerName).toBe('Player 1');
    });

    it('should not exceed 30 scorers per match', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;

      // Add 30 scorers
      for (let i = 0; i < 30; i++) {
        act(() => {
          result.current.addScorer(matchId, {
            playerName: `Player ${i}`,
            teamId: match.teamHomeId,
            minute: i + 1,
            count: 1,
          });
        });
      }

      expect(result.current.matches[0].scorers).toHaveLength(30);

      // Try to add 31st - should not add
      act(() => {
        result.current.addScorer(matchId, {
          playerName: 'Player 31',
          teamId: match.teamHomeId,
          minute: 31,
          count: 1,
        });
      });

      expect(result.current.matches[0].scorers).toHaveLength(30);
    });

    it('should remove a scorer by index', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;

      act(() => {
        result.current.addScorer(matchId, {
          playerName: 'Player A',
          teamId: match.teamHomeId,
          minute: 10,
          count: 1,
        });
      });

      act(() => {
        result.current.addScorer(matchId, {
          playerName: 'Player B',
          teamId: match.teamAwayId,
          minute: 20,
          count: 1,
        });
      });

      expect(result.current.matches[0].scorers).toHaveLength(2);

      act(() => {
        result.current.removeScorer(matchId, 0);
      });

      expect(result.current.matches[0].scorers).toHaveLength(1);
      expect(result.current.matches[0].scorers[0].playerName).toBe('Player B');
    });
  });

  describe('resetAll', () => {
    it('should reset all matches to default but keep teams and pairings', () => {
      const { result } = renderHook(() => useTournament());
      const initialMatch = result.current.matches[0];

      // Submit some matches
      act(() => {
        result.current.submitMatch(initialMatch.id, {
          group: initialMatch.group,
          teamHomeId: initialMatch.teamHomeId,
          teamAwayId: initialMatch.teamAwayId,
          scoreHome: 2,
          scoreAway: 1,
          status: 'selesai',
          scorers: [{ playerName: 'Player', teamId: initialMatch.teamHomeId, minute: 5, count: 1 }],
        });
      });

      act(() => {
        result.current.resetAll();
      });

      // Teams preserved
      expect(result.current.teams).toHaveLength(8);
      // Matches preserved in count
      expect(result.current.matches).toHaveLength(16);
      // All matches reset
      result.current.matches.forEach((match) => {
        expect(match.status).toBe('upcoming');
        expect(match.scoreHome).toBe(0);
        expect(match.scoreAway).toBe(0);
        expect(match.scorers).toEqual([]);
      });
      // Match pairings preserved
      expect(result.current.matches[0].teamHomeId).toBe(initialMatch.teamHomeId);
      expect(result.current.matches[0].teamAwayId).toBe(initialMatch.teamAwayId);
    });
  });

  describe('player roster management', () => {
    it('should add, edit, and remove player names for a team', () => {
      const { result } = renderHook(() => useTournament());
      const initialCount = result.current.playerNamesByTeam['team-a1'].length;

      act(() => {
        const addResult = result.current.addPlayer('team-a1', 'Pemain Baru');
        expect(addResult.success).toBe(true);
      });

      expect(result.current.playerNamesByTeam['team-a1']).toHaveLength(initialCount + 1);
      expect(result.current.playerNamesByTeam['team-a1']).toContain('Pemain Baru');

      act(() => {
        const editResult = result.current.editPlayer('team-a1', initialCount, 'Pemain Edit');
        expect(editResult.success).toBe(true);
      });

      expect(result.current.playerNamesByTeam['team-a1'][initialCount]).toBe('Pemain Edit');

      act(() => {
        result.current.removePlayer('team-a1', initialCount);
      });

      expect(result.current.playerNamesByTeam['team-a1']).toHaveLength(initialCount);
      expect(result.current.playerNamesByTeam['team-a1']).not.toContain('Pemain Edit');
    });

    it('should reject duplicate player names in the same team', () => {
      const { result } = renderHook(() => useTournament());
      const existingName = result.current.playerNamesByTeam['team-a1'][0];

      act(() => {
        const addResult = result.current.addPlayer('team-a1', existingName.toUpperCase());
        expect(addResult.success).toBe(false);
      });
    });
  });

  describe('persistence', () => {
    it('should persist changes to localStorage', () => {
      const { result } = renderHook(() => useTournament());

      const match = result.current.matches[0];
      const matchId = match.id;
      act(() => {
        result.current.submitMatch(matchId, {
          group: match.group,
          teamHomeId: match.teamHomeId,
          teamAwayId: match.teamAwayId,
          scoreHome: 4,
          scoreAway: 0,
          status: 'selesai',
          scorers: [],
        });
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.matches[0].scoreHome).toBe(4);
      expect(stored.matches[0].status).toBe('selesai');
    });

    it('should persist player roster changes to localStorage', () => {
      const { result } = renderHook(() => useTournament());

      act(() => {
        result.current.addPlayer('team-a1', 'Pemain Persist');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.playerNamesByTeam['team-a1']).toContain('Pemain Persist');
    });
  });
});

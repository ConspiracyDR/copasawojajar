'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Match, Team, MatchFormData, Scorer, Group, MatchStatus } from '@/types/tournament';
import { validateScore, validateSameTeam } from '@/utils/validation';
import ScorerForm from './ScorerForm';

export interface MatchFormProps {
  teams: Team[];
  matches: Match[];
  editingMatch: Match | null;
  onSubmit: (matchId: string, data: MatchFormData) => { success: boolean; error?: string };
  onCancel: () => void;
}

export default function MatchForm({
  teams,
  matches,
  editingMatch,
  onSubmit,
  onCancel,
}: MatchFormProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | ''>('');
  const [teamHomeId, setTeamHomeId] = useState('');
  const [teamAwayId, setTeamAwayId] = useState('');
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('upcoming');
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [showScorerForm, setShowScorerForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Pre-populate fields when editing
  useEffect(() => {
    if (editingMatch) {
      setSelectedGroup(editingMatch.group === 'KO' ? '' : editingMatch.group);
      setTeamHomeId(editingMatch.teamHomeId);
      setTeamAwayId(editingMatch.teamAwayId);
      setScoreHome(editingMatch.scoreHome);
      setScoreAway(editingMatch.scoreAway);
      setStatus(editingMatch.status);
      setScorers([...editingMatch.scorers]);
      setErrors({});
      setFormError('');
    }
  }, [editingMatch]);

  // Filter teams by selected group
  const filteredTeams = selectedGroup
    ? teams.filter((t) => t.group === selectedGroup)
    : [];

  // When group changes, reset team selections (unless editing)
  function handleGroupChange(group: Group) {
    setSelectedGroup(group);
    if (!editingMatch) {
      setTeamHomeId('');
      setTeamAwayId('');
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.group;
      return next;
    });
  }

  function handleScoreHomeChange(value: string) {
    const num = value === '' ? 0 : parseInt(value, 10);
    setScoreHome(isNaN(num) ? 0 : num);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.scoreHome;
      return next;
    });
  }

  function handleScoreAwayChange(value: string) {
    const num = value === '' ? 0 : parseInt(value, 10);
    setScoreAway(isNaN(num) ? 0 : num);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.scoreAway;
      return next;
    });
  }

  function handleTeamHomeChange(value: string) {
    setTeamHomeId(value);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.teamHomeId;
      delete next.sameTeam;
      return next;
    });
  }

  function handleTeamAwayChange(value: string) {
    setTeamAwayId(value);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.teamAwayId;
      delete next.sameTeam;
      return next;
    });
  }

  function handleAddScorer(scorer: Scorer) {
    setScorers((prev) => [...prev, scorer]);
    setShowScorerForm(false);
  }

  function handleRemoveScorer(index: number) {
    setScorers((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setSelectedGroup('');
    setTeamHomeId('');
    setTeamAwayId('');
    setScoreHome(0);
    setScoreAway(0);
    setStatus('upcoming');
    setScorers([]);
    setShowScorerForm(false);
    setErrors({});
    setFormError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const newErrors: Record<string, string> = {};

    // Validate group selected
    if (!selectedGroup) {
      newErrors.group = 'Pilih grup terlebih dahulu';
    }

    // Validate teams selected
    if (!teamHomeId) {
      newErrors.teamHomeId = 'Pilih tim tuan rumah';
    }
    if (!teamAwayId) {
      newErrors.teamAwayId = 'Pilih tim tamu';
    }

    // Validate same team
    if (teamHomeId && teamAwayId) {
      const sameTeamResult = validateSameTeam(teamHomeId, teamAwayId);
      if (!sameTeamResult.valid) {
        newErrors.sameTeam = sameTeamResult.error!;
      }
    }

    // Validate score range
    const scoreHomeResult = validateScore(scoreHome);
    if (!scoreHomeResult.valid) {
      newErrors.scoreHome = scoreHomeResult.error!;
    }
    const scoreAwayResult = validateScore(scoreAway);
    if (!scoreAwayResult.valid) {
      newErrors.scoreAway = scoreAwayResult.error!;
    }

    // Note: duplicate match check removed — all match slots are pre-generated
    // and unique per group, so no duplicates are possible

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Determine the match ID
    let matchId: string;
    if (editingMatch) {
      matchId = editingMatch.id;
    } else {
      // Find the match slot for this team pairing
      const matchSlot = matches.find((m) => {
        if (m.group !== selectedGroup) return false;
        const sameOrder =
          m.teamHomeId === teamHomeId && m.teamAwayId === teamAwayId;
        const reverseOrder =
          m.teamHomeId === teamAwayId && m.teamAwayId === teamHomeId;
        return sameOrder || reverseOrder;
      });
      if (!matchSlot) {
        setFormError('Match slot tidak ditemukan');
        return;
      }
      matchId = matchSlot.id;
    }

    const formData: MatchFormData = {
      group: selectedGroup as Group,
      teamHomeId,
      teamAwayId,
      scoreHome,
      scoreAway,
      status,
      scorers,
    };

    const result = onSubmit(matchId, formData);
    if (!result.success) {
      setFormError(result.error || 'Terjadi kesalahan');
    } else {
      if (!editingMatch) {
        resetForm();
      }
    }
  }

  // Resolve team names for scorer display
  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : teamId;
  };

  // Get home/away team objects for ScorerForm
  const homeTeam = teams.find((t) => t.id === teamHomeId);
  const awayTeam = teams.find((t) => t.id === teamAwayId);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4"
      aria-label="Form input pertandingan"
    >
      <h2 className="text-lg font-bold text-gray-800">
        {editingMatch ? 'Edit Pertandingan' : 'Input Pertandingan'}
      </h2>

      {/* Form-level error */}
      {formError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3" role="alert">
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      {/* Group selection - radio buttons */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          Grup
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="group"
              value="A"
              checked={selectedGroup === 'A'}
              onChange={() => handleGroupChange('A')}
              className="h-5 w-5 text-blue-600"
            />
            <span className="text-[16px]">Grup A</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="group"
              value="B"
              checked={selectedGroup === 'B'}
              onChange={() => handleGroupChange('B')}
              className="h-5 w-5 text-blue-600"
            />
            <span className="text-[16px]">Grup B</span>
          </label>
        </div>
        {errors.group && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.group}
          </p>
        )}
      </fieldset>

      {/* Home team dropdown */}
      <div>
        <label htmlFor="team-home" className="block text-sm font-medium text-gray-700 mb-1">
          Tim Tuan Rumah
        </label>
        <select
          id="team-home"
          value={teamHomeId}
          onChange={(e) => handleTeamHomeChange(e.target.value)}
          className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={!selectedGroup}
        >
          <option value="">-- Pilih Tim --</option>
          {filteredTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {errors.teamHomeId && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.teamHomeId}
          </p>
        )}
      </div>

      {/* Away team dropdown */}
      <div>
        <label htmlFor="team-away" className="block text-sm font-medium text-gray-700 mb-1">
          Tim Tamu
        </label>
        <select
          id="team-away"
          value={teamAwayId}
          onChange={(e) => handleTeamAwayChange(e.target.value)}
          className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={!selectedGroup}
        >
          <option value="">-- Pilih Tim --</option>
          {filteredTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {errors.teamAwayId && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.teamAwayId}
          </p>
        )}
        {errors.sameTeam && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.sameTeam}
          </p>
        )}
      </div>

      {/* Score inputs */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="score-home" className="block text-sm font-medium text-gray-700 mb-1">
            Skor Tuan Rumah
          </label>
          <input
            id="score-home"
            type="number"
            value={scoreHome}
            onChange={(e) => handleScoreHomeChange(e.target.value)}
            min={0}
            max={99}
            className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.scoreHome && (
            <p className="text-red-500 text-xs mt-1" role="alert">
              {errors.scoreHome}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="score-away" className="block text-sm font-medium text-gray-700 mb-1">
            Skor Tamu
          </label>
          <input
            id="score-away"
            type="number"
            value={scoreAway}
            onChange={(e) => handleScoreAwayChange(e.target.value)}
            min={0}
            max={99}
            className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.scoreAway && (
            <p className="text-red-500 text-xs mt-1" role="alert">
              {errors.scoreAway}
            </p>
          )}
        </div>
      </div>

      {/* Status select */}
      <div>
        <label htmlFor="match-status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="match-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MatchStatus)}
          className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>



      {/* Scorers section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Pencetak Gol ({scorers.length}/30)
          </h3>
        </div>

        {/* Scorer list */}
        {scorers.length > 0 && (
          <ul className="space-y-2">
            {scorers.map((scorer, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2"
              >
                <div className="flex-1 text-sm">
                  <span className="font-medium">{scorer.playerName}</span>
                  <span className="text-gray-500 ml-2">
                    ({getTeamName(scorer.teamId)})
                  </span>
                  <span className="text-gray-500 ml-1">
                    ×{scorer.count}
                  </span>
                  {scorer.minute !== null && (
                    <span className="text-gray-400 ml-1">
                      {scorer.minute}&apos;
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveScorer(index)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Hapus ${scorer.playerName}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Scorer form or add button */}
        {showScorerForm && homeTeam && awayTeam ? (
          <ScorerForm
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            onAdd={handleAddScorer}
            onCancel={() => setShowScorerForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowScorerForm(true)}
            disabled={!teamHomeId || !teamAwayId || scorers.length >= 30}
            className="min-h-[44px] w-full rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Tambah Pencetak Gol
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="min-h-[44px] flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {editingMatch ? 'Simpan Perubahan' : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

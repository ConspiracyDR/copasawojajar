'use client';

import { useState } from 'react';
import { Match, Team, Scorer, MatchStatus } from '@/types/tournament';
import ScorerForm from './ScorerForm';

export interface MatchCardProps {
  match: Match;
  teams: Team[];
  playerNamesByTeam: Record<string, string[]>;
  readOnly?: boolean;
  onSubmit: (matchId: string, scoreHome: number, scoreAway: number, status: MatchStatus, scorers: Scorer[]) => void;
  onDelete: (matchId: string) => void;
}

export default function MatchCard({
  match,
  teams,
  playerNamesByTeam,
  readOnly = false,
  onSubmit,
  onDelete,
}: MatchCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showScorers, setShowScorers] = useState(false);
  const [showScorerForm, setShowScorerForm] = useState(false);

  // Edit state
  const [scoreHome, setScoreHome] = useState(match.scoreHome);
  const [scoreAway, setScoreAway] = useState(match.scoreAway);
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [scorers, setScorers] = useState<Scorer[]>([...match.scorers]);

  const homeTeam = teams.find((t) => t.id === match.teamHomeId);
  const awayTeam = teams.find((t) => t.id === match.teamAwayId);
  const homeTeamName = homeTeam?.name ?? 'TBD';
  const awayTeamName = awayTeam?.name ?? 'TBD';
  const canInputResult = Boolean(homeTeam && awayTeam);
  const displayDate = match.matchDate ?? getKnockoutFallbackDate(match);

  function handleEditOpen() {
    // Reset to current match values
    setScoreHome(match.scoreHome);
    setScoreAway(match.scoreAway);
    setStatus(match.status);
    setScorers([...match.scorers]);
    setShowScorerForm(false);
    setIsEditing(true);
  }

  function handleSave() {
    onSubmit(match.id, scoreHome, scoreAway, status, scorers);
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setShowScorerForm(false);
  }

  function handleAddScorer(scorer: Scorer) {
    setScorers((prev) => [...prev, scorer]);
    setShowScorerForm(false);
  }

  function handleRemoveScorer(index: number) {
    setScorers((prev) => prev.filter((_, i) => i !== index));
  }

  function getTeamNameById(teamId: string): string {
    return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
  }

  return (
    <div className="overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm shadow-brand-900/5 transition-shadow hover:shadow-md hover:shadow-brand-900/10">

      {/* Card header */}
      <div className="p-4">
        {/* Status badge + date/order */}
        <div className="mb-3 flex items-center justify-between">
          <StatusBadge status={match.status} />
          <span className="text-xs text-gray-500">
            {displayDate
              ? new Date(displayDate).toLocaleDateString('id-ID', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })
              : `Match #${match.matchOrder}`}
          </span>
        </div>

        {match.title && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {match.title}
          </p>
        )}

        {/* Score display */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex-1 text-sm font-medium text-gray-900 text-left">{homeTeamName}</span>
          {match.status === 'upcoming' ? (
            <span className="shrink-0 px-3 py-1 text-sm font-semibold text-brand-300">vs</span>
          ) : (
            <span className="shrink-0 px-3 py-1 text-lg font-bold text-brand-900">
              {match.scoreHome} - {match.scoreAway}
            </span>
          )}
          <span className="flex-1 text-sm font-medium text-gray-900 text-right">{awayTeamName}</span>
        </div>

        {/* Scorer summary (show if selesai/live and has scorers) */}
        {!isEditing && match.scorers.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowScorers((p) => !p)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showScorers ? '▲ Sembunyikan pencetak gol' : `▼ ${match.scorers.length} pencetak gol`}
            </button>
            {showScorers && (
              <ul className="mt-1 space-y-0.5">
                {match.scorers.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    ⚽ {s.playerName} ({getTeamNameById(s.teamId)})
                    {s.count > 1 && ` ×${s.count}`}
                    {s.minute !== null && ` ${s.minute}'`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {/* Score inputs */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">{homeTeamName}</label>
              <input
                type="number"
                value={scoreHome}
                onChange={(e) => setScoreHome(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                min={0} max={99}
                className="w-full rounded border border-gray-300 p-2 text-[16px] text-center font-bold text-lg"
              />
            </div>
            <span className="text-gray-400 font-bold mt-5">-</span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">{awayTeamName}</label>
              <input
                type="number"
                value={scoreAway}
                onChange={(e) => setScoreAway(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                min={0} max={99}
                className="w-full rounded border border-gray-300 p-2 text-[16px] text-center font-bold text-lg"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MatchStatus)}
              className="w-full rounded border border-gray-300 p-2 text-[16px]"
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>

          {/* Scorers */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Pencetak Gol ({scorers.length}/30)</span>
            </div>

            {scorers.length > 0 && (
              <ul className="space-y-1 mb-2">
                {scorers.map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-white rounded border border-gray-100 px-2 py-1">
                    <span>
                      ⚽ <strong>{s.playerName}</strong> ({getTeamNameById(s.teamId)})
                      {s.count > 1 && ` ×${s.count}`}
                      {s.minute !== null && ` ${s.minute}'`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveScorer(i)}
                      className="ml-2 min-h-[32px] min-w-[32px] text-red-400 hover:text-red-600 flex items-center justify-center"
                    >✕</button>
                  </li>
                ))}
              </ul>
            )}

            {showScorerForm && homeTeam && awayTeam ? (
              <ScorerForm
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                playerNamesByTeam={playerNamesByTeam}
                onAdd={handleAddScorer}
                onCancel={() => setShowScorerForm(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowScorerForm(true)}
                disabled={scorers.length >= 30}
                className="w-full min-h-[40px] rounded border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
              >
                + Tambah Pencetak Gol
              </button>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 min-h-[44px] rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isEditing && !readOnly && (
        <div className="flex border-t border-gray-100">
          <button
            type="button"
            onClick={handleEditOpen}
            disabled={!canInputResult}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors rounded-bl-lg disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
          >
            <EditIcon />
            <span>{canInputResult ? 'Input Hasil' : 'Menunggu Peserta'}</span>
          </button>
          <div className="w-px bg-gray-100" />
          <button
            type="button"
            onClick={() => onDelete(match.id)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-br-lg"
          >
            <TrashIcon />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}

function getKnockoutFallbackDate(match: Match): string | null {
  const title = match.title?.toLowerCase() ?? '';

  if (match.stage === 'semifinal') {
    return title.includes('2') ? '2026-08-16T09:40:00+07:00' : '2026-08-16T09:00:00+07:00';
  }

  if (match.stage === 'third-place' || title.includes('juara 3')) {
    return '2026-08-16T16:00:00+07:00';
  }

  if (match.stage === 'final') {
    return '2026-08-16T16:40:00+07:00';
  }

  return null;
}

function StatusBadge({ status }: { status: Match['status'] }) {
  switch (status) {
    case 'upcoming':
      return <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">Upcoming</span>;
    case 'live':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Live
        </span>
      );
    case 'selesai':
      return <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800">Selesai</span>;
    default:
      return null;
  }
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

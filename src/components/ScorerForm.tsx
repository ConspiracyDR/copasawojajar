'use client';

import { useState } from 'react';
import { Team, Scorer } from '@/types/tournament';
import { validatePlayerName, validateScorer } from '@/utils/validation';

export interface ScorerFormProps {
  homeTeam: Team;
  awayTeam: Team;
  playerNamesByTeam?: Record<string, string[]>;
  onAdd: (scorer: Scorer) => void;
  onCancel?: () => void;
}

export default function ScorerForm({
  homeTeam,
  awayTeam,
  playerNamesByTeam = {},
  onAdd,
  onCancel,
}: ScorerFormProps) {
  const [playerName, setPlayerName] = useState('');
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [teamId, setTeamId] = useState(homeTeam.id);
  const [count, setCount] = useState(1);
  const [minute, setMinute] = useState('');
  const [error, setError] = useState('');
  const customOptionValue = '__custom__';
  const playerOptions = playerNamesByTeam[teamId] ?? [];
  const resolvedPlayerName =
    playerOptions.length === 0 || playerName === customOptionValue ? customPlayerName : playerName;

  function handleTeamChange(nextTeamId: string) {
    setTeamId(nextTeamId);
    setPlayerName('');
    setCustomPlayerName('');
    setError('');
  }

  function handleAdd() {
    setError('');

    // Validate player name
    const nameResult = validatePlayerName(resolvedPlayerName);
    if (!nameResult.valid) {
      setError(nameResult.error || 'Nama pemain tidak valid');
      return;
    }

    // Build scorer object
    const minuteValue = minute.trim() === '' ? null : parseInt(minute, 10);
    const scorer: Partial<Scorer> = {
      playerName: resolvedPlayerName.trim(),
      teamId,
      count,
      minute: minuteValue,
    };

    // Validate full scorer entry
    const scorerResult = validateScorer(scorer, [homeTeam.id, awayTeam.id]);
    if (!scorerResult.valid) {
      setError(scorerResult.error || 'Data pencetak gol tidak valid');
      return;
    }

    // Call onAdd with complete scorer
    onAdd({
      playerName: resolvedPlayerName.trim(),
      teamId,
      count,
      minute: minuteValue,
    });

    // Reset form
    setPlayerName('');
    setCustomPlayerName('');
    setTeamId(homeTeam.id);
    setCount(1);
    setMinute('');
    setError('');
  }

  return (
    <div
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      aria-label="Form tambah pencetak gol"
    >
      {/* Team select */}
      <div>
        <label htmlFor="scorer-team" className="block text-sm font-medium text-gray-700 mb-1">
          Tim
        </label>
        <select
          id="scorer-team"
          value={teamId}
          onChange={(e) => handleTeamChange(e.target.value)}
          className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={homeTeam.id}>{homeTeam.name}</option>
          <option value={awayTeam.id}>{awayTeam.name}</option>
        </select>
      </div>

      {/* Player name */}
      <div>
        <label htmlFor="scorer-name" className="block text-sm font-medium text-gray-700 mb-1">
          Nama Pemain
        </label>
        {playerOptions.length > 0 ? (
          <>
            <select
              id="scorer-name"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setCustomPlayerName('');
                setError('');
              }}
              className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Pilih Pemain --</option>
              {playerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value={customOptionValue}>Nama lain...</option>
            </select>
            {playerName === customOptionValue && (
              <input
                type="text"
                value={customPlayerName}
                onChange={(e) => setCustomPlayerName(e.target.value)}
                placeholder="Nama pemain"
                className="mt-2 w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={50}
              />
            )}
          </>
        ) : (
          <input
            id="scorer-name"
            type="text"
            value={customPlayerName}
            onChange={(e) => setCustomPlayerName(e.target.value)}
            placeholder="Nama pemain"
            className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            maxLength={50}
          />
        )}
      </div>

      {/* Goal count */}
      <div>
        <label htmlFor="scorer-count" className="block text-sm font-medium text-gray-700 mb-1">
          Jumlah Gol
        </label>
        <input
          id="scorer-count"
          type="number"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
          min={1}
          max={20}
          className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Minute (optional) */}
      <div>
        <label htmlFor="scorer-minute" className="block text-sm font-medium text-gray-700 mb-1">
          Menit
        </label>
        <input
          id="scorer-minute"
          type="number"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          placeholder="Menit (opsional)"
          min={1}
          max={200}
          className="w-full rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Inline validation error */}
      {error && (
        <p className="text-red-500 text-xs mt-1" role="alert">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-[44px] flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tambah
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

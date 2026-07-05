'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Team } from '@/types/tournament';

interface PlayerManagementProps {
  teams: Team[];
  playerNamesByTeam: Record<string, string[]>;
  onAddPlayer: (teamId: string, playerName: string) => { success: boolean; error?: string };
  onEditPlayer: (
    teamId: string,
    playerIndex: number,
    playerName: string
  ) => { success: boolean; error?: string };
  onRemovePlayer: (teamId: string, playerIndex: number) => void;
}

export default function PlayerManagement({
  teams,
  playerNamesByTeam,
  onAddPlayer,
  onEditPlayer,
  onRemovePlayer,
}: PlayerManagementProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? '');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? teams[0],
    [selectedTeamId, teams]
  );
  const selectedTeamPlayers = selectedTeam ? playerNamesByTeam[selectedTeam.id] ?? [] : [];
  const teamsByGroup = useMemo(
    () => ({
      A: teams.filter((team) => team.group === 'A'),
      B: teams.filter((team) => team.group === 'B'),
    }),
    [teams]
  );

  function handleAddPlayer(e: FormEvent) {
    e.preventDefault();
    if (!selectedTeam) return;

    const result = onAddPlayer(selectedTeam.id, newPlayerName);
    if (!result.success) {
      setError(result.error ?? 'Gagal menambah pemain');
      return;
    }

    setNewPlayerName('');
    setError('');
  }

  function handleStartEdit(index: number, playerName: string) {
    setEditingIndex(index);
    setEditingName(playerName);
    setError('');
  }

  function handleSaveEdit() {
    if (!selectedTeam || editingIndex === null) return;

    const result = onEditPlayer(selectedTeam.id, editingIndex, editingName);
    if (!result.success) {
      setError(result.error ?? 'Gagal mengubah nama pemain');
      return;
    }

    setEditingIndex(null);
    setEditingName('');
    setError('');
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditingName('');
    setError('');
  }

  function handleRemove(index: number) {
    if (!selectedTeam) return;
    onRemovePlayer(selectedTeam.id, index);
    if (editingIndex === index) handleCancelEdit();
  }

  if (!selectedTeam) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        Belum ada tim.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Input Pemain</h2>
        <p className="mt-1 text-xs text-gray-500">
          Nama di sini dipakai saat input pencetak gol di Jadwal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="space-y-3">
          {(['A', 'B'] as const).map((group) => (
            <div key={group}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Grup {group}
              </h3>
              <div className="space-y-1">
                {teamsByGroup[group].map((team) => {
                  const isActive = team.id === selectedTeam.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        handleCancelEdit();
                      }}
                      className={`min-h-[44px] w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {team.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{selectedTeam.name}</h3>
              <p className="text-xs text-gray-500">
                {selectedTeamPlayers.length} pemain
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              Grup {selectedTeam.group}
            </span>
          </div>

          <form onSubmit={handleAddPlayer} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => {
                setNewPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Nama pemain"
              className="min-w-0 flex-1 rounded border border-gray-300 p-2 text-[16px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={50}
            />
            <button
              type="submit"
              className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah
            </button>
          </form>

          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {selectedTeamPlayers.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Belum ada pemain di tim ini.
            </div>
          ) : (
            <ul className="space-y-2">
              {selectedTeamPlayers.map((playerName, index) => (
                <li
                  key={`${playerName}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 p-2"
                >
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="min-w-0 flex-1 rounded border border-gray-300 p-2 text-[16px]"
                        maxLength={50}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="min-h-[40px] rounded bg-green-600 px-3 text-sm font-medium text-white"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="min-h-[40px] rounded border border-gray-300 bg-white px-3 text-sm text-gray-700"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex min-h-[40px] flex-1 items-center text-sm font-medium">
                        {playerName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(index, playerName)}
                        className="min-h-[40px] rounded border border-gray-300 bg-white px-3 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="min-h-[40px] rounded border border-gray-300 bg-white px-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { Team, Match, Group } from '@/types/tournament';

export interface AdminPanelProps {
  teams: Team[];
  matches: Match[];
  onAddTeam: (name: string, group: Group) => void;
  onEditTeam: (teamId: string, newName: string) => void;
  onRemoveTeam: (teamId: string) => void;
  onRegenerateMatches: () => void;
  onUpdateMatchDate: (matchId: string, date: string | null) => void;
}

export default function AdminPanel({
  teams,
  matches,
  onAddTeam,
  onEditTeam,
  onRemoveTeam,
  onRegenerateMatches,
  onUpdateMatchDate,
}: AdminPanelProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamGroup, setNewTeamGroup] = useState<Group>('A');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [showScheduleSection, setShowScheduleSection] = useState(false);

  const teamsA = teams.filter((t) => t.group === 'A');
  const teamsB = teams.filter((t) => t.group === 'B');

  function handleAddTeam(e: FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onAddTeam(newTeamName.trim(), newTeamGroup);
    setNewTeamName('');
  }

  function handleEditStart(team: Team) {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  }

  function handleEditSave() {
    if (editingTeamId && editingTeamName.trim()) {
      onEditTeam(editingTeamId, editingTeamName.trim());
      setEditingTeamId(null);
      setEditingTeamName('');
    }
  }

  function handleEditCancel() {
    setEditingTeamId(null);
    setEditingTeamName('');
  }

  function formatMatchDate(dateStr: string | null): string {
    if (!dateStr) return 'Belum diatur';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTeamName(teamId: string): string {
    return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Pengaturan Turnamen</h2>

      {/* Team Management */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Manajemen Tim</h3>

        {/* Group A */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Grup A ({teamsA.length} tim)
          </h4>
          <ul className="space-y-2">
            {teamsA.map((team) => (
              <li key={team.id} className="flex items-center gap-2">
                {editingTeamId === team.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      className="flex-1 rounded border border-gray-300 p-1.5 text-[16px]"
                      autoFocus
                    />
                    <button
                      onClick={handleEditSave}
                      className="min-h-[44px] min-w-[44px] rounded bg-green-600 px-3 py-1 text-sm text-white"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="min-h-[44px] min-w-[44px] rounded bg-gray-300 px-3 py-1 text-sm"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{team.name}</span>
                    <button
                      onClick={() => handleEditStart(team)}
                      className="min-h-[44px] min-w-[44px] rounded border border-gray-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemoveTeam(team.id)}
                      className="min-h-[44px] min-w-[44px] rounded border border-gray-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Group B */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Grup B ({teamsB.length} tim)
          </h4>
          <ul className="space-y-2">
            {teamsB.map((team) => (
              <li key={team.id} className="flex items-center gap-2">
                {editingTeamId === team.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      className="flex-1 rounded border border-gray-300 p-1.5 text-[16px]"
                      autoFocus
                    />
                    <button
                      onClick={handleEditSave}
                      className="min-h-[44px] min-w-[44px] rounded bg-green-600 px-3 py-1 text-sm text-white"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="min-h-[44px] min-w-[44px] rounded bg-gray-300 px-3 py-1 text-sm"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{team.name}</span>
                    <button
                      onClick={() => handleEditStart(team)}
                      className="min-h-[44px] min-w-[44px] rounded border border-gray-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemoveTeam(team.id)}
                      className="min-h-[44px] min-w-[44px] rounded border border-gray-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add Team Form */}
        <form onSubmit={handleAddTeam} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Nama tim baru"
            className="flex-1 min-w-[150px] rounded border border-gray-300 p-2 text-[16px]"
          />
          <select
            value={newTeamGroup}
            onChange={(e) => setNewTeamGroup(e.target.value as Group)}
            className="rounded border border-gray-300 p-2 text-[16px]"
          >
            <option value="A">Grup A</option>
            <option value="B">Grup B</option>
          </select>
          <button
            type="submit"
            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tambah Tim
          </button>
        </form>

        {/* Regenerate Matches Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            Setelah menambah/menghapus tim, klik tombol di bawah untuk generate ulang jadwal pertandingan (round-robin).
            ⚠️ Ini akan menghapus semua hasil yang sudah di-input.
          </p>
          <button
            type="button"
            onClick={onRegenerateMatches}
            className="min-h-[44px] rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            🔄 Generate Ulang Jadwal
          </button>
        </div>
      </div>

      {/* Schedule Management */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setShowScheduleSection(!showScheduleSection)}
          className="flex w-full items-center justify-between text-lg font-semibold"
        >
          <span>Atur Jadwal Pertandingan</span>
          <span className="text-gray-400">{showScheduleSection ? '▲' : '▼'}</span>
        </button>

        {showScheduleSection && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-500">
              Atur tanggal & jam untuk setiap pertandingan. Kosongkan jika belum ditentukan.
            </p>
            {matches
              .sort((a, b) => a.matchOrder - b.matchOrder)
              .map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border border-gray-100 bg-gray-50"
                >
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-gray-500">#{match.matchOrder}</span>{' '}
                    <span className="font-medium">{getTeamName(match.teamHomeId)}</span>
                    <span className="text-gray-400"> vs </span>
                    <span className="font-medium">{getTeamName(match.teamAwayId)}</span>
                    <span className="text-xs text-gray-400 ml-2">(Grup {match.group})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={match.matchDate ? match.matchDate.slice(0, 16) : ''}
                      onChange={(e) =>
                        onUpdateMatchDate(
                          match.id,
                          e.target.value ? new Date(e.target.value).toISOString() : null
                        )
                      }
                      className="rounded border border-gray-300 p-1.5 text-[16px] text-sm"
                    />
                    {match.matchDate && (
                      <button
                        type="button"
                        onClick={() => onUpdateMatchDate(match.id, null)}
                        className="min-h-[44px] min-w-[44px] text-red-500 hover:bg-red-50 rounded flex items-center justify-center"
                        aria-label="Hapus tanggal"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

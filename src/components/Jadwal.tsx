'use client';

import { useState } from 'react';
import { Match, Team, Scorer, MatchStatus } from '@/types/tournament';
import MatchCard from './MatchCard';

interface JadwalProps {
  matches: Match[];
  teams: Team[];
  playerNamesByTeam: Record<string, string[]>;
  onSubmit: (matchId: string, scoreHome: number, scoreAway: number, status: MatchStatus, scorers: Scorer[]) => void;
  onDelete: (matchId: string) => void;
}

export default function Jadwal({
  matches,
  teams,
  playerNamesByTeam,
  onSubmit,
  onDelete,
}: JadwalProps) {
  const [groupFilter, setGroupFilter] = useState<'all' | 'A' | 'B' | 'KO'>('all');

  const filteredMatches = matches
    .filter((match) => (groupFilter === 'all' ? true : match.group === groupFilter))
    .sort((a, b) => a.matchOrder - b.matchOrder);

  const filters: { label: string; value: 'all' | 'A' | 'B' | 'KO' }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Grup A', value: 'A' },
    { label: 'Grup B', value: 'B' },
    { label: 'Knockout', value: 'KO' },
  ];

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Jadwal & Hasil</h2>

      <div className="flex gap-2 mb-4">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setGroupFilter(filter.value)}
            className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              groupFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            teams={teams}
            playerNamesByTeam={playerNamesByTeam}
            onSubmit={onSubmit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

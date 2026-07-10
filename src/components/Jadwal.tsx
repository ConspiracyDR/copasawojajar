'use client';

import { useState } from 'react';
import { Match, Team, Scorer, MatchStatus } from '@/types/tournament';
import MatchCard from './MatchCard';

interface JadwalProps {
  matches: Match[];
  teams: Team[];
  playerNamesByTeam: Record<string, string[]>;
  readOnly?: boolean;
  onSubmit: (matchId: string, scoreHome: number, scoreAway: number, status: MatchStatus, scorers: Scorer[]) => void;
  onDelete: (matchId: string) => void;
}

export default function Jadwal({
  matches,
  teams,
  playerNamesByTeam,
  readOnly = false,
  onSubmit,
  onDelete,
}: JadwalProps) {
  const [groupFilter, setGroupFilter] = useState<'all' | 'A' | 'B' | 'KO'>('all');
  const isKnockoutMatch = (match: Match) => {
    const title = match.title?.toLowerCase() ?? '';
    const hasKnockoutTitle =
      title.includes('semifinal') || title.includes('juara 3') || title === 'final';

    return (
      hasKnockoutTitle &&
      (match.stage === 'semifinal' || match.stage === 'third-place' || match.stage === 'final')
    );
  };

  const filteredMatches = matches
    .filter((match) => {
      if (groupFilter === 'all') return true;
      if (groupFilter === 'KO') return isKnockoutMatch(match);
      return match.group === groupFilter && !isKnockoutMatch(match);
    })
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

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setGroupFilter(filter.value)}
            className={`min-h-[44px] shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              groupFilter === filter.value
                ? 'bg-brand-700 text-white shadow-sm shadow-brand-700/20'
                : 'border border-brand-200 bg-white text-brand-800 hover:bg-brand-50'
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
            readOnly={readOnly}
            onSubmit={onSubmit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

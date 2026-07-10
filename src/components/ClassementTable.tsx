'use client';

import { Group, StandingRow } from '@/types/tournament';

interface ClassementTableProps {
  group: Group;
  standings: StandingRow[];
}

export default function ClassementTable({ group, standings }: ClassementTableProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-lg font-bold">Grup {group}</h3>
        <p className="text-xs font-medium text-brand-700">
          Peringkat 1 dan 2 lolos ke fase gugur
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-brand-100 bg-white shadow-sm shadow-brand-900/5">
        <table className="w-full text-sm md:text-base border-collapse">
          <thead>
            <tr className="bg-brand-700 font-semibold text-white">
              <th className="px-2 py-1 md:px-3 md:py-2 text-left">#</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-left">Tim</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">M</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">W</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">D</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">L</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">GF</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">GA</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right">GD</th>
              <th className="px-2 py-1 md:px-3 md:py-2 text-right font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr
                key={row.team.id}
                className={`border-b border-gray-200 ${
                  row.rank <= 2 ? 'bg-brand-50' : ''
                }`}
              >
                <td className="px-2 py-1 md:px-3 md:py-2 text-left">{row.rank}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-left whitespace-nowrap">
                  {row.team.name}
                </td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.played}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.wins}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.draws}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.losses}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.goalsFor}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.goalsAgainst}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right">{row.goalDifference}</td>
                <td className="px-2 py-1 md:px-3 md:py-2 text-right font-bold">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { Group, StandingRow } from '@/types/tournament';

interface ClassementTableProps {
  group: Group;
  standings: StandingRow[];
}

export default function ClassementTable({ group, standings }: ClassementTableProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">Grup {group}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base border-collapse">
          <thead>
            <tr className="bg-gray-100 font-semibold">
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
                  row.rank <= 2 ? 'bg-green-50' : ''
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

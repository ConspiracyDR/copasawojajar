'use client';

import { Match, Team } from '@/types/tournament';
import { getTopScorers } from '@/utils/calculations';

interface TopSkorProps {
  matches: Match[];
  teams: Team[];
}

export default function TopSkor({ matches, teams }: TopSkorProps) {
  const rows = getTopScorers(matches, teams).slice(0, 20);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Top Skor</h2>
          <p className="mt-1 text-xs text-gray-500">
            Dihitung dari pertandingan berstatus Selesai.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Belum ada data gol. Input hasil pertandingan dulu.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="w-10 px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">Pemain</th>
                <th className="px-3 py-2">Tim</th>
                <th className="px-3 py-2 text-center">Grup</th>
                <th className="px-3 py-2 text-center font-bold">Gol</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.playerName}-${row.team.id}`}
                  className={`border-t border-gray-100 ${index < 3 ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-3 py-2 text-center font-bold text-gray-500">
                    {row.rank}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.playerName}</td>
                  <td className="px-3 py-2 text-gray-600">{row.team.name}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{row.team.group}</td>
                  <td className="px-3 py-2 text-center text-base font-bold text-blue-700">
                    {row.goals}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

'use client';

import { StandingRow } from '@/types/tournament';
import ClassementTable from './ClassementTable';

interface KlasemenProps {
  standingsA: StandingRow[];
  standingsB: StandingRow[];
}

export default function Klasemen({ standingsA, standingsB }: KlasemenProps) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Klasemen</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClassementTable group="A" standings={standingsA} />
        <ClassementTable group="B" standings={standingsB} />
      </div>
    </section>
  );
}

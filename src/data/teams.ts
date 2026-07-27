import { Team, Match, Group, TournamentState } from '@/types/tournament';

export const TEAMS: Team[] = [
  { id: 'team-a1', name: 'Tim Garuda', group: 'A' },
  { id: 'team-a2', name: 'Tim Elang', group: 'A' },
  { id: 'team-a3', name: 'Tim Rajawali', group: 'A' },
  { id: 'team-a4', name: 'Tim Merak', group: 'A' },
  { id: 'team-b1', name: 'Tim Harimau', group: 'B' },
  { id: 'team-b2', name: 'Tim Singa', group: 'B' },
  { id: 'team-b3', name: 'Tim Macan', group: 'B' },
  { id: 'team-b4', name: 'Tim Cheetah', group: 'B' },
];

export const PLAYER_NAMES_BY_TEAM: Record<string, string[]> = {
  'team-a1': ['Bima', 'Rafi', 'Dimas', 'Adit', 'Farel', 'Nanda', 'Rizky', 'Yoga', 'Ilham', 'Arga'],
  'team-a2': ['Iqbal', 'Rama', 'Fikri', 'Bagas', 'Reza', 'Alif', 'Doni', 'Bayu', 'Hafiz', 'Tegar'],
  'team-a3': ['Galih', 'Reno', 'Arif', 'Wildan', 'Ega', 'Fauzan', 'Yusuf', 'Daffa', 'Rangga', 'Kevin'],
  'team-a4': ['Satria', 'Dio', 'Akbar', 'Rian', 'Fajar', 'Aldi', 'Naufal', 'Gilang', 'Hendra', 'Wahyu'],
  'team-b1': ['Putra', 'Raka', 'Farhan', 'Andre', 'Robby', 'Deden', 'Rizal', 'Agus', 'Yudi', 'Miko'],
  'team-b2': ['Irfan', 'Dani', 'Rendi', 'Sandi', 'Arman', 'Rudi', 'Haris', 'Aziz', 'Ridho', 'Fahmi'],
  'team-b3': ['Evan', 'Kiki', 'Luthfi', 'Tomi', 'Ari', 'Dika', 'Wawan', 'Benny', 'Rendy', 'Roni'],
  'team-b4': ['Jodi', 'Heri', 'Fathan', 'Rizwan', 'Zaki', 'Asep', 'Bowo', 'Damar', 'Faris', 'Hanif'],
};

const SCHEDULE_DATES: { date: string; slots: Array<{ group: Group; time: string }> }[] = [
  {
    date: '2026-07-12',
    slots: [
      { group: 'A', time: '16:00' },
      { group: 'A', time: '16:40' },
    ],
  },
  {
    date: '2026-07-19',
    slots: [
      { group: 'A', time: '09:00' },
      { group: 'A', time: '09:40' },
      { group: 'B', time: '16:00' },
      { group: 'B', time: '16:40' },
    ],
  },
  {
    date: '2026-07-26',
    slots: [
      { group: 'A', time: '09:00' },
      { group: 'A', time: '09:40' },
      { group: 'B', time: '16:00' },
      { group: 'B', time: '16:40' },
    ],
  },
  {
    date: '2026-08-02',
    slots: [
      { group: 'A', time: '09:00' },
      { group: 'A', time: '09:40' },
      { group: 'B', time: '16:00' },
      { group: 'B', time: '16:40' },
    ],
  },
  {
    date: '2026-08-09',
    slots: [
      { group: 'A', time: '16:00' },
      { group: 'A', time: '16:40' },
    ],
  },
];

type Pairing = { homeId: string; awayId: string };
type DateSlot = { dateTime: string };

function getDateSlots(group: Group): DateSlot[][] {
  return SCHEDULE_DATES.map((day) =>
    day.slots
      .filter((slot) => slot.group === group)
      .map((slot) => ({
        dateTime: `${day.date}T${slot.time}:00+07:00`,
      }))
  ).filter((slots) => slots.length > 0);
}

function generateRoundRobinRounds(groupTeams: Team[]): Pairing[][] {
  const rotation: Array<Team | null> =
    groupTeams.length % 2 === 0 ? [...groupTeams] : [...groupTeams, null];
  const roundCount = Math.max(0, rotation.length - 1);
  const rounds: Pairing[][] = [];

  for (let round = 0; round < roundCount; round++) {
    const pairings: Pairing[] = [];

    for (let i = 0; i < rotation.length / 2; i++) {
      const first = rotation[i];
      const second = rotation[rotation.length - 1 - i];
      if (!first || !second) continue;

      pairings.push(
        round % 2 === 0
          ? { homeId: first.id, awayId: second.id }
          : { homeId: second.id, awayId: first.id }
      );
    }

    rounds.push(pairings);

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    const last = rest.pop();
    rotation.splice(0, rotation.length, fixed, last ?? null, ...rest);
  }

  return rounds;
}

/**
 * Generates round-robin match slots per group.
 * Each round contains matches with unique teams, then each round is placed on
 * one match date. This prevents a team from playing twice on the same date
 * when the configured date has enough slots for that round.
 */
export function generateMatchSlots(teams: Team[]): Match[] {
  const matches: Match[] = [];
  let order = 1;
  const now = new Date().toISOString();

  for (const group of ['A', 'B'] as Group[]) {
    const groupTeams = teams.filter((team) => team.group === group);
    const rounds = generateRoundRobinRounds(groupTeams);
    const dateSlotGroups = getDateSlots(group);

    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const roundPairings = rounds[roundIndex];
      const daySlots = dateSlotGroups[roundIndex] ?? [];

      roundPairings.forEach((pairing, pairingIndex) => {
        matches.push({
          id: `match-${String(order).padStart(2, '0')}`,
          group,
          teamHomeId: pairing.homeId,
          teamAwayId: pairing.awayId,
          scoreHome: 0,
          scoreAway: 0,
          status: 'upcoming',
          scorers: [],
          matchOrder: order,
          matchDate: daySlots[pairingIndex]?.dateTime ?? null,
          createdAt: now,
          updatedAt: now,
        });
        order++;
      });
    }
  }

  const knockoutTemplates: Array<Pick<Match, 'group' | 'stage' | 'title' | 'matchDate'>> = [
    {
      group: 'KO',
      stage: 'semifinal',
      title: 'Semifinal 1: Juara Grup A vs Runner Up Grup B',
      matchDate: '2026-08-16T09:00:00+07:00',
    },
    {
      group: 'KO',
      stage: 'semifinal',
      title: 'Semifinal 2: Juara Grup B vs Runner Up Grup A',
      matchDate: '2026-08-16T09:40:00+07:00',
    },
    {
      group: 'KO',
      stage: 'third-place',
      title: 'Perebutan Juara 3',
      matchDate: '2026-08-16T16:00:00+07:00',
    },
    {
      group: 'KO',
      stage: 'final',
      title: 'Final',
      matchDate: '2026-08-16T16:40:00+07:00',
    },
  ];

  knockoutTemplates.forEach((match) => {
    const matchOrder = order++;
    matches.push({
      ...match,
      id: `match-${String(matchOrder).padStart(2, '0')}`,
      matchOrder,
      teamHomeId: '',
      teamAwayId: '',
      scoreHome: 0,
      scoreAway: 0,
      status: 'upcoming',
      scorers: [],
      createdAt: now,
      updatedAt: now,
    });
  });

  return matches;
}

export const DEFAULT_TOURNAMENT_STATE: TournamentState = {
  version: 1,
  teams: TEAMS,
  matches: generateMatchSlots(TEAMS),
  playerNamesByTeam: PLAYER_NAMES_BY_TEAM,
};

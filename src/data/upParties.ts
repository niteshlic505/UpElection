import { HistoricalYear, PartyConfig, SeatBand } from '../types/election';

export const TOTAL_UP_SEATS = 403;

export const SEAT_BANDS: SeatBand[] = Array.from({ length: 81 }, (_, idx) => {
  const start = idx * 5;
  const end = idx === 80 ? 403 : start + 4;
  const representative = idx === 0 ? 0 : idx === 80 ? 402 : start + 2;
  return {
    index: idx,
    start,
    end,
    label: `${start} – ${end}`,
    representative,
  };
});

export function getBandByStart(bandStart: number): SeatBand {
  const found = SEAT_BANDS.find((b) => b.start === bandStart);
  if (found) return found;
  const clamped = Math.max(0, Math.min(400, Math.floor(bandStart / 5) * 5));
  return SEAT_BANDS.find((b) => b.start === clamped) || SEAT_BANDS[0];
}

export function getBandSeatsValue(bandStart: number): number {
  const band = getBandByStart(bandStart);
  return band.start === 0 ? 0 : band.representative;
}

export function getBandDisplaySeats(bandStart: number): number {
  const band = getBandByStart(bandStart);
  if (band.start === 0) return 0;
  return band.representative;
}

export interface PartyMeta {
  shortEn: string;
  shortHi: string;
  nameHi: string;
  leaderEn: string;
  leaderHi: string;
  leaderPhotoUrl?: string;
}

export const PARTY_META_MAP: Record<string, PartyMeta> = {
  BJP: {
    shortEn: 'BJP',
    shortHi: 'BJP (भाजपा)',
    nameHi: 'भारतीय जनता पार्टी',
    leaderEn: 'Yogi Adityanath',
    leaderHi: 'योगी आदित्यनाथ',
    leaderPhotoUrl: '/assets/leaders/bjp.jpg',
  },
  SP: {
    shortEn: 'SP',
    shortHi: 'SP (सपा)',
    nameHi: 'समाजवादी पार्टी',
    leaderEn: 'Akhilesh Yadav',
    leaderHi: 'अखिलेश यादव',
    leaderPhotoUrl: '/assets/leaders/sp.jpg',
  },
  BSP: {
    shortEn: 'BSP',
    shortHi: 'BSP (बसपा)',
    nameHi: 'बहुजन समाज पार्टी',
    leaderEn: 'Mayawati',
    leaderHi: 'मायावती',
    leaderPhotoUrl: '/assets/leaders/bsp.jpg',
  },
  INC: {
    shortEn: 'INC',
    shortHi: 'कांग्रेस',
    nameHi: 'भारतीय राष्ट्रीय कांग्रेस',
    leaderEn: 'Rahul Gandhi',
    leaderHi: 'राहुल गांधी',
    leaderPhotoUrl: '/assets/leaders/inc.jpg',
  },
  RLD: {
    shortEn: 'RLD',
    shortHi: 'RLD (रालोद)',
    nameHi: 'राष्ट्रीय लोक दल',
    leaderEn: 'Jayant Chaudhary',
    leaderHi: 'जयंत चौधरी',
    leaderPhotoUrl: '/assets/leaders/rld.jpg',
  },
  AD: {
    shortEn: 'Apna Dal (S)',
    shortHi: 'अपना दल (एस)',
    nameHi: 'अपना दल (सोनेलाल)',
    leaderEn: 'Anupriya Patel',
    leaderHi: 'अनुप्रिया पटेल',
    leaderPhotoUrl: '/assets/leaders/ad.jpg',
  },
  NISHAD: {
    shortEn: 'NISHAD',
    shortHi: 'निषाद पार्टी',
    nameHi: 'निषाद पार्टी',
    leaderEn: 'Sanjay Nishad',
    leaderHi: 'संजय निषाद',
    leaderPhotoUrl: '/assets/leaders/nishad.jpg',
  },
  SBSP: {
    shortEn: 'SBSP',
    shortHi: 'SBSP (सुभासपा)',
    nameHi: 'सुहेलदेव भारतीय समाज पार्टी',
    leaderEn: 'Om Prakash Rajbhar',
    leaderHi: 'ओम प्रकाश राजभर',
    leaderPhotoUrl: '/assets/leaders/sbsp.jpg',
  },
  AIMIM: {
    shortEn: 'AIMIM',
    shortHi: 'AIMIM',
    nameHi: 'ऑल इंडिया मजलिस-ए-इत्तेहादुल मुस्लिमीन',
    leaderEn: 'Asaduddin Owaisi',
    leaderHi: 'असदुद्दीन ओवैसी',
    leaderPhotoUrl: '/assets/leaders/aimim.jpg',
  },
  ASP: {
    shortEn: 'Azad Samaj Party',
    shortHi: 'आजाद समाज पार्टी',
    nameHi: 'आजाद समाज पार्टी (कांशीराम)',
    leaderEn: 'Chandrashekhar Azad',
    leaderHi: 'चन्द्रशेखर आजाद',
    leaderPhotoUrl: '/assets/leaders/asp.jpg',
  },
  JANSATTA: {
    shortEn: 'Jansatta Dal',
    shortHi: 'जनसत्ता दल',
    nameHi: 'जनसत्ता दल लोकतांत्रिक',
    leaderEn: 'Raghuraj Pratap Singh',
    leaderHi: 'रघुराज प्रताप सिंह',
    leaderPhotoUrl: '/assets/aistudio/images__3__4371317e.jpeg',
  },
  OTH: {
    shortEn: 'Others / IND',
    shortHi: 'अन्य / निर्दलीय',
    nameHi: 'अन्य दल एवं निर्दलीय',
    leaderEn: 'Independents & Others',
    leaderHi: 'अन्य व निर्दलीय',
  },
};

export function getPartyMeta(code: string): PartyMeta | undefined {
  return PARTY_META_MAP[code.toUpperCase().trim()];
}

export const DEFAULT_PARTIES: PartyConfig[] = [
  {
    code: 'BJP',
    name: 'Bharatiya Janata Party',
    shortName: 'BJP',
    color: '#F97316',
    active: true,
    order: 1,
    results2007: 51,
    results2012: 47,
    results2017: 312,
    results2022: 255,
  },
  {
    code: 'SP',
    name: 'Samajwadi Party',
    shortName: 'SP',
    color: '#EF4444',
    active: true,
    order: 2,
    results2007: 97,
    results2012: 224,
    results2017: 47,
    results2022: 111,
  },
  {
    code: 'BSP',
    name: 'Bahujan Samaj Party',
    shortName: 'BSP',
    color: '#2563EB',
    active: true,
    order: 3,
    results2007: 206,
    results2012: 80,
    results2017: 19,
    results2022: 1,
  },
  {
    code: 'INC',
    name: 'Indian National Congress',
    shortName: 'INC',
    color: '#06B6D4',
    active: true,
    order: 4,
    results2007: 22,
    results2012: 28,
    results2017: 7,
    results2022: 2,
  },
  {
    code: 'RLD',
    name: 'Rashtriya Lok Dal',
    shortName: 'RLD',
    color: '#10B981',
    active: true,
    order: 5,
    results2007: 10,
    results2012: 9,
    results2017: 1,
    results2022: 8,
  },
  {
    code: 'AD',
    name: 'Apna Dal (Sonelal)',
    shortName: 'Apna Dal (S)',
    color: '#8B5CF6',
    active: true,
    order: 6,
    results2007: 0,
    results2012: 1,
    results2017: 9,
    results2022: 12,
  },
  {
    code: 'NISHAD',
    name: 'NISHAD Party',
    shortName: 'NISHAD',
    color: '#EC4899',
    active: true,
    order: 7,
    results2007: 0,
    results2012: 0,
    results2017: 1,
    results2022: 6,
  },
  {
    code: 'SBSP',
    name: 'Suheldev Bharatiya Samaj Party',
    shortName: 'SBSP',
    color: '#EAB308',
    active: true,
    order: 8,
    results2007: 0,
    results2012: 0,
    results2017: 4,
    results2022: 6,
  },
  {
    code: 'AIMIM',
    name: 'All India Majlis-e-Ittehadul Muslimeen',
    shortName: 'AIMIM',
    color: '#65A30D',
    active: true,
    order: 9,
    results2007: 0,
    results2012: 0,
    results2017: 0,
    results2022: 0,
  },
  {
    code: 'ASP',
    name: 'Azad Samaj Party (Kanshi Ram)',
    shortName: 'Azad Samaj Party',
    color: '#0284C7',
    active: true,
    order: 10,
    results2007: 0,
    results2012: 0,
    results2017: 0,
    results2022: 0,
  },
  {
    code: 'JANSATTA',
    name: 'Jansatta Dal Loktantrik',
    shortName: 'Jansatta Dal',
    color: '#6366F1',
    active: true,
    order: 11,
    results2007: 0,
    results2012: 0,
    results2017: 0,
    results2022: 2,
  },
  {
    code: 'OTH',
    name: 'Other Parties & Independents',
    shortName: 'Others',
    color: '#64748B',
    active: true,
    order: 12,
    results2007: 17,
    results2012: 14,
    results2017: 3,
    results2022: 0,
  },
];

export function getHistoricalPartySeats(party: PartyConfig, year: HistoricalYear): number {
  switch (year) {
    case '2007':
      return party.results2007;
    case '2012':
      return party.results2012;
    case '2017':
      return party.results2017;
    case '2022':
      return party.results2022;
  }
}

export const PARTY_COLOR_MAP: Record<string, string> = {
  BJP: '#F97316',
  SP: '#EF4444',
  BSP: '#2563EB',
  INC: '#06B6D4',
  CONGRESS: '#06B6D4',
  RLD: '#10B981',
  AD: '#8B5CF6',
  'AD(S)': '#8B5CF6',
  ADS: '#8B5CF6',
  NISHAD: '#EC4899',
  SBSP: '#EAB308',
  AIMIM: '#65A30D',
  ASP: '#0284C7',
  ASPKR: '#0284C7',
  JANSATTA: '#6366F1',
  JDL: '#6366F1',
  OTH: '#64748B',
  IND: '#64748B',
};

export function getPartyColor(code: string): string {
  const upper = code.toUpperCase().trim();
  return PARTY_COLOR_MAP[upper] || '#64748B';
}

export const DEFAULT_PARTY_BANDS: Record<string, number> = {
  BJP: 160,
  SP: 140,
  BSP: 20,
  INC: 20,
  RLD: 20,
  AD: 0,
  NISHAD: 0,
  SBSP: 0,
  AIMIM: 0,
  ASP: 0,
  JANSATTA: 0,
  OTH: 0,
};

export function calculateAllocatedSeats(partyBands: Record<string, number>, parties: PartyConfig[]): number {
  return parties.reduce((sum, p) => {
    if (!p.active) return sum;
    const bandStart = partyBands[p.code] ?? 0;
    return sum + getBandDisplaySeats(bandStart);
  }, 0);
}

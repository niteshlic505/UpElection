import { AllianceConfig, HistoricalYear } from '../types/election';
import { SEAT_BANDS, TOTAL_UP_SEATS, getBandDisplaySeats } from './upParties';

export const UP_ALLIANCES: AllianceConfig[] = [
  {
    code: 'NDA',
    shortEn: 'NDA',
    shortHi: 'NDA (राजग)',
    nameEn: 'NDA Alliance',
    nameHi: 'NDA गठबंधन (राष्ट्रीय जनतांत्रिक गठबंधन)',
    formulaEn: 'BJP + RLD + SBSP + NISHAD Party + Apna Dal (S)',
    formulaHi: 'भाजपा + रालोद + सुभासपा + निषाद पार्टी + अपना दल (एस)',
    partyCodes: ['BJP', 'RLD', 'SBSP', 'NISHAD', 'AD'],
    color: '#F97316',
    results2007: 61,
    results2012: 57,
    results2017: 327,
    results2022: 287,
  },
  {
    code: 'INDIA',
    shortEn: 'INDIA',
    shortHi: 'INDIA गठबंधन',
    nameEn: 'INDIA Alliance',
    nameHi: 'INDIA गठबंधन',
    formulaEn: 'Congress + Samajwadi Party',
    formulaHi: 'कांग्रेस + समाजवादी पार्टी',
    partyCodes: ['INC', 'SP'],
    color: '#EF4444',
    results2007: 119,
    results2012: 252,
    results2017: 54,
    results2022: 113,
  },
  {
    code: 'THIRD_FRONT',
    shortEn: '3rd Front',
    shortHi: 'तीसरा मोर्चा',
    nameEn: '3rd Front',
    nameHi: 'तीसरा मोर्चा (3rd Front)',
    formulaEn: 'Azad Samaj Party + AIMIM',
    formulaHi: 'आजाद समाज पार्टी + AIMIM',
    partyCodes: ['ASP', 'AIMIM'],
    color: '#10B981',
    results2007: 0,
    results2012: 0,
    results2017: 0,
    results2022: 0,
  },
  {
    code: 'OTH_IND',
    shortEn: 'Others & Ind',
    shortHi: 'अन्य व निर्दलीय',
    nameEn: 'Others & Independent',
    nameHi: 'अन्य एवं निर्दलीय',
    formulaEn: 'BSP + Jansatta Dal + Others & Independents',
    formulaHi: 'बसपा + जनसत्ता दल + अन्य एवं निर्दलीय',
    partyCodes: ['BSP', 'JANSATTA', 'OTH'],
    color: '#64748B',
    results2007: 223,
    results2012: 94,
    results2017: 22,
    results2022: 3,
  },
];

export const DEFAULT_ALLIANCE_BANDS: Record<string, number> = {
  NDA: 0,
  INDIA: 0,
  THIRD_FRONT: 0,
  OTH_IND: 0,
};

export function getHistoricalAllianceSeats(
  alliance: AllianceConfig,
  year: HistoricalYear,
): number {
  switch (year) {
    case '2007':
      return alliance.results2007;
    case '2012':
      return alliance.results2012;
    case '2017':
      return alliance.results2017;
    case '2022':
      return alliance.results2022;
  }
}

export function calculateAllianceAllocatedSeats(allianceBands: Record<string, number>): number {
  return UP_ALLIANCES.reduce((sum, alliance) => {
    const bandStart = allianceBands[alliance.code] ?? 0;
    return sum + getBandDisplaySeats(bandStart);
  }, 0);
}

export function snapSeatsToBandStart(seats: number): number {
  const clamped = Math.max(0, Math.min(TOTAL_UP_SEATS, seats));
  if (clamped === 0) return 0;
  const closest = SEAT_BANDS.reduce((best, band) =>
    Math.abs(band.representative - clamped) < Math.abs(best.representative - clamped)
      ? band
      : best,
  );
  return closest.start;
}

export function deriveAllianceBandsFromPartyBands(
  partyBands: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  UP_ALLIANCES.forEach((alliance) => {
    const combinedSeats = alliance.partyCodes.reduce(
      (sum, partyCode) => sum + getBandDisplaySeats(partyBands[partyCode] ?? 0),
      0,
    );
    result[alliance.code] = snapSeatsToBandStart(combinedSeats);
  });
  return result;
}

export function getAllianceCodeForParty(partyCode: string): string {
  const normalized = partyCode.toUpperCase().trim();
  const aliasMap: Record<string, string> = {
    CONGRESS: 'INC',
    'AD(S)': 'AD',
    ADS: 'AD',
    ASPKR: 'ASP',
    JDL: 'JANSATTA',
    IND: 'OTH',
  };
  const resolved = aliasMap[normalized] || normalized;
  const found = UP_ALLIANCES.find((a) => a.partyCodes.includes(resolved));
  return found ? found.code : 'OTH_IND';
}

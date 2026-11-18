import { CandidateRecord, CandidateStatus } from '../types/election';

export interface ParsedSeatCsvRow {
  acNo: number;
  name: string;
  district?: string;
  totalElectors: number | null;
  winnerName: string;
  winnerParty: string;
  winnerVotes: number | null;
  runnerUpName: string;
  runnerUpParty: string;
  runnerUpVotes: number | null;
}

export function parseCsvMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field.trim());
        field = '';
      } else if (char === '\r' && next === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}

function toIntOrNull(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = Number.parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parses uttar-pradesh-2022-seats.csv supporting unnamed runner-up column mapping:
 * Fields: ac_no, name, total_electors, winner_name, winner_party, winner_votes,
 * (unnamed or runner_up_name), runner_up_party, runner_up_votes
 */
export function parseSeatsCsv(csvText: string): ParsedSeatCsvRow[] {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length < 2) return [];

  const rawHeaders = matrix[0].map((h) => h.toLowerCase().trim());

  const findCol = (aliases: string[], fallbackIdx?: number): number => {
    const idx = rawHeaders.findIndex((h) => aliases.includes(h));
    if (idx >= 0) return idx;
    return fallbackIdx !== undefined && fallbackIdx < rawHeaders.length ? fallbackIdx : -1;
  };

  const acCol = findCol(['ac_no', 'acno', 'ac', 'constituency_no'], 0);
  const nameCol = findCol(['name', 'constituency', 'ac_name'], 1);
  const districtCol = findCol(['district', 'dist']);
  const electorsCol = findCol(['total_electors', 'electors'], 2);
  const winNameCol = findCol(['winner_name', 'winner'], 3);
  const winPartyCol = findCol(['winner_party', 'party'], 4);
  const winVotesCol = findCol(['winner_votes', 'votes'], 5);

  // Source CSV has an unnamed column containing runner-up names right before runner_up_party
  const runPartyCol = findCol(['runner_up_party', 'runnerup_party'], 7);
  let runNameCol = findCol(['runner_up_name', 'runnerup_name', 'runner_up']);
  if (runNameCol < 0) {
    // Check for empty/unnamed header between winner_votes and runner_up_party
    const emptyHeaderIdx = rawHeaders.findIndex((h, idx) => idx > winVotesCol && (h === '' || h.startsWith('unnamed')));
    runNameCol = emptyHeaderIdx >= 0 ? emptyHeaderIdx : runPartyCol > 0 ? runPartyCol - 1 : 6;
  }
  const runVotesCol = findCol(['runner_up_votes', 'runnerup_votes'], 8);

  const parsed: ParsedSeatCsvRow[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const r = matrix[i];
    const acNo = toIntOrNull(r[acCol]);
    if (!acNo || acNo < 1 || acNo > 403) continue;

    parsed.push({
      acNo,
      name: (r[nameCol] || `AC ${acNo}`).trim(),
      district: districtCol >= 0 && r[districtCol] ? r[districtCol].trim() : undefined,
      totalElectors: electorsCol >= 0 ? toIntOrNull(r[electorsCol]) : null,
      winnerName: (winNameCol >= 0 ? r[winNameCol] : '') || '',
      winnerParty: ((winPartyCol >= 0 ? r[winPartyCol] : '') || '').toUpperCase(),
      winnerVotes: winVotesCol >= 0 ? toIntOrNull(r[winVotesCol]) : null,
      runnerUpName: (runNameCol >= 0 ? r[runNameCol] : '') || '',
      runnerUpParty: ((runPartyCol >= 0 ? r[runPartyCol] : '') || '').toUpperCase(),
      runnerUpVotes: runVotesCol >= 0 ? toIntOrNull(r[runVotesCol]) : null,
    });
  }

  return parsed;
}

export function parseCandidatesCsv(csvText: string): CandidateRecord[] {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length < 2) return [];
  const headers = matrix[0].map((h) => h.toLowerCase().trim());

  const acCol = headers.findIndex((h) => ['ac_no', 'acno', 'ac'].includes(h));
  const nameCol = headers.findIndex((h) => ['name', 'candidate_name', 'candidate'].includes(h));
  const partyCol = headers.findIndex((h) => ['party', 'party_code'].includes(h));
  const statusCol = headers.findIndex((h) => ['status'].includes(h));
  const sourceCol = headers.findIndex((h) => ['source', 'reference'].includes(h));

  const out: CandidateRecord[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const r = matrix[i];
    const acNo = toIntOrNull(r[acCol >= 0 ? acCol : 0]);
    const name = (r[nameCol >= 0 ? nameCol : 1] || '').trim();
    const party = ((r[partyCol >= 0 ? partyCol : 2] || 'IND').trim() || 'IND').toUpperCase();
    if (!acNo || acNo < 1 || acNo > 403 || !name) continue;

    const rawStatus = ((statusCol >= 0 ? r[statusCol] : 'ANNOUNCED') || 'ANNOUNCED').toUpperCase();
    const status: CandidateStatus = ['HISTORICAL', 'ANNOUNCED', 'OFFICIAL', 'WITHDRAWN'].includes(rawStatus)
      ? (rawStatus as CandidateStatus)
      : 'ANNOUNCED';
    const source = (statusCol >= 0 && sourceCol >= 0 ? r[sourceCol] : '') || 'Admin CSV Import';
    const slug = `${acNo}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
    out.push({
      id: slug,
      acNo,
      name,
      party,
      status,
      source,
      updatedAt: new Date().toISOString(),
    });
  }
  return out;
}

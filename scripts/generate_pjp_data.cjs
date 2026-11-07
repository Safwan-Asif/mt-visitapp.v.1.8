const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, '../public/assets/aistudio/MT_PJP_5b1ced78');
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.trim().split('\n');

const executives = [
  { name: 'Safwan Asif', username: 'safwan_asif', repId: '#9', territory: 'Qatar Modern Trade', role: 'Senior Merchandiser Executive' },
  { name: 'SHYJU PUTHALATH KUNIYIL', username: 'shyju_puthalath', repId: '#101', territory: 'Al Meera & Safari Zone', role: 'Modern Trade Executive' },
  { name: 'NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE', username: 'nizamudeen_abdul', repId: '#102', territory: 'FFC & Airport Modern Trade', role: 'Modern Trade Executive' },
  { name: 'JOSEPH MEHAL VINCILO', username: 'joseph_mehal', repId: '#103', territory: 'Wakra & Grand Mall Sector', role: 'Modern Trade Executive' },
  { name: 'SK IMRAN AHMED', username: 'sk_imran_ahmed', repId: '#104', territory: 'Carrefour & Monoprix Zone', role: 'Modern Trade Executive' },
  { name: 'MOHAMED CASIM NISHAD', username: 'mohamed_casim', repId: '#105', territory: 'North & West Modern Trade', role: 'Modern Trade Executive' },
  { name: 'JUNAID ABDUL KAREEM VADAKKAY AZHIKK', username: 'junaid_abdul_kareem', repId: '#106', territory: 'Rawabi & Budget Sector', role: 'Modern Trade Executive' },
  { name: 'SHAFEEQ PUNNILATH ABDUL RAHIMAN', username: 'shafeeq_punnilath', repId: '#107', territory: 'Saudia & Regency Zone', role: 'Modern Trade Executive' },
  { name: 'THAJUDEEN ABDUL MAJEED ALI AHMMED', username: 'thajudeen_abdul_majeed', repId: '#108', territory: 'Lulu Hypermarkets Sector', role: 'Modern Trade Executive' },
  { name: 'SIRAJ MOHAMMED ABDUL AZIZ', username: 'siraj_mohammed', repId: '#109', territory: 'Central Modern Trade', role: 'Modern Trade Executive' }
];

const masterOutletsMap = {};
const pjpSchedules = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let c = 0; c < line.length; c++) {
    const ch = line[c];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { parts.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  parts.push(cur.trim());

  const date = parts[0];
  const day = parts[1];
  const exec = parts[2];
  const account = parts[3];
  const outlet = parts[4];
  const code = parts[5] || '';
  const area = parts[6] || '';

  if (!exec || !outlet) continue;

  const outletKey = exec + '___' + outlet;
  const safeId = 'mst-' + Math.abs((exec + outlet).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
  if (!masterOutletsMap[outletKey]) {
    masterOutletsMap[outletKey] = {
      id: safeId,
      name: account ? (account + ' — ' + outlet) : outlet,
      rawName: outlet,
      branch: area || account || 'Doha',
      address: (area ? area + ', ' : '') + (account ? account + ', ' : '') + 'Qatar',
      executive: exec,
      code: code,
      account: account
    };
  }

  pjpSchedules.push({
    date,
    day,
    executive: exec,
    account,
    outlet,
    code,
    area
  });
}

// Safwan Asif master outlets
const safwanStores = [
  { name: 'Al Meera Hypermarket', branch: 'Hyatt Plaza Mall', address: 'Al Waab St, Zone 55, Doha', account: 'Al Meera', code: '10300553' },
  { name: 'Carrefour Hypermarket', branch: 'City Center Mall', address: 'Conference Centre St, West Bay, Doha', account: 'Carrefour', code: '10300098' },
  { name: 'Lulu Hypermarket', branch: 'D-Ring Road', address: 'D-Ring Road, Nuaija, Doha', account: 'Lulu', code: '10300313' },
  { name: 'Grand Hypermarket', branch: 'Ezdan Mall Al Wakra', address: 'Al Wukair Main Rd, Al Wakra', account: 'Grand', code: '10300390' },
  { name: 'Monoprix', branch: 'West Bay Twin Towers', address: 'Omar Al Mukhtar St, West Bay', account: 'Monoprix', code: '10300341' },
  { name: 'Family Food Centre', branch: 'Old Airport Road', address: 'Airport Road, Al Matar Qadeem', account: 'FFC', code: '10300289' },
  { name: 'Safari Mall', branch: 'Abu Hamour', address: 'Wholesale Market St, Abu Hamour', account: 'Safari', code: '10300327' },
  { name: 'Quality Hypermarket', branch: 'Salwa Road', address: 'Salwa Road, Ain Khalid, Doha', account: 'Quality', code: '10300326' },
  { name: 'Spar Hypermarket', branch: '03 Mall, New Salata', address: 'Ali Bin Abi Talib St, New Salata, Doha', account: 'Spar', code: '10301460' },
  { name: 'Marza Hypermarket', branch: 'Al Wakra Main', address: 'Al Wakra Main St, Al Wakra', account: 'MARZA', code: '10305323' }
];

for (const s of safwanStores) {
  const k = 'Safwan Asif___' + s.name;
  masterOutletsMap[k] = {
    id: 'mst-safwan-' + Math.abs(s.name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
    name: s.name,
    rawName: s.name,
    branch: s.branch,
    address: s.address,
    executive: 'Safwan Asif',
    code: s.code,
    account: s.account
  };
}

const masterOutletsList = Object.values(masterOutletsMap);

const outDir = path.resolve(__dirname, '../src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targetTsPath = path.join(outDir, 'pjpMasterData.ts');

const tsHeader = `/**
 * Google Sheet Master PJP Dataset & Executive Roster
 * Source: MT_PJP Dataset & Google Sheet Link:
 * https://docs.google.com/spreadsheets/d/19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94/edit?usp=sharing
 */

export interface ExecutiveProfile {
  name: string;
  username: string;
  repId: string;
  territory: string;
  role: string;
}

export interface MasterOutletRecord {
  id: string;
  name: string;
  rawName: string;
  branch: string;
  address: string;
  executive: string;
  code?: string;
  account?: string;
}

export interface PjpVisitRow {
  date: string;
  day: string;
  executive: string;
  account: string;
  outlet: string;
  code: string;
  area: string;
}

export const PJP_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94/edit?usp=sharing';
export const PJP_GOOGLE_SHEET_ID = '19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94';
export const PJP_DEFAULT_SECURITY_PIN = '2026';

export const ALL_EXECUTIVE_PROFILES: ExecutiveProfile[] = ` + JSON.stringify(executives, null, 2) + `;\n\n` +
`export const MASTER_PJP_OUTLETS: MasterOutletRecord[] = ` + JSON.stringify(masterOutletsList, null, 2) + `;\n\n` +
`export const PJP_SCHEDULE_VISITS: PjpVisitRow[] = ` + JSON.stringify(pjpSchedules, null, 2) + `;\n\n` +
`/**
 * Filter all master outlets mapped to a specific executive.
 */
export function getMasterOutletsForExecutive(execName: string): MasterOutletRecord[] {
  if (!execName) return [];
  const cleanName = execName.trim().toLowerCase();
  const directMatches = MASTER_PJP_OUTLETS.filter(
    (o) => o.executive.trim().toLowerCase() === cleanName
  );
  if (directMatches.length > 0) return directMatches;
  return MASTER_PJP_OUTLETS.filter((o) => o.executive === 'Safwan Asif');
}

/**
 * Get route outlets for an executive for today or default active schedule.
 */
export function getPjpRouteForExecutive(execName: string, dateStr?: string): PjpVisitRow[] {
  if (!execName) return [];
  const cleanName = execName.trim().toLowerCase();
  
  if (dateStr) {
    const matched = PJP_SCHEDULE_VISITS.filter(
      (v) => v.executive.trim().toLowerCase() === cleanName && v.date === dateStr
    );
    if (matched.length > 0) return matched;
  }

  // Get most recent or first available schedule for this executive
  const execVisits = PJP_SCHEDULE_VISITS.filter(
    (v) => v.executive.trim().toLowerCase() === cleanName
  );
  if (execVisits.length === 0) return [];

  // Group by date and take the first date's visits
  const firstDate = execVisits[0].date;
  return execVisits.filter((v) => v.date === firstDate);
}
`;

fs.writeFileSync(targetTsPath, tsHeader);
console.log('Generated:', targetTsPath, 'Master Outlets:', masterOutletsList.length, 'Visits:', pjpSchedules.length);

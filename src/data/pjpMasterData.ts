/**
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

export const ALL_EXECUTIVE_PROFILES: ExecutiveProfile[] = [
  {
    "name": "Safwan Asif",
    "username": "safwan_asif",
    "repId": "#9",
    "territory": "Qatar Modern Trade",
    "role": "Senior Merchandiser Executive"
  },
  {
    "name": "SHYJU PUTHALATH KUNIYIL",
    "username": "shyju_puthalath",
    "repId": "#101",
    "territory": "Al Meera & Safari Zone",
    "role": "Modern Trade Executive"
  },
  {
    "name": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "username": "nizamudeen_abdul",
    "repId": "#102",
    "territory": "FFC & Airport Modern Trade",
    "role": "Modern Trade Executive"
  },
  {
    "name": "JOSEPH MEHAL VINCILO",
    "username": "joseph_mehal",
    "repId": "#103",
    "territory": "Wakra & Grand Mall Sector",
    "role": "Modern Trade Executive"
  },
  {
    "name": "SK IMRAN AHMED",
    "username": "sk_imran_ahmed",
    "repId": "#104",
    "territory": "Carrefour & Monoprix Zone",
    "role": "Modern Trade Executive"
  },
  {
    "name": "MOHAMED CASIM NISHAD",
    "username": "mohamed_casim",
    "repId": "#105",
    "territory": "North & West Modern Trade",
    "role": "Modern Trade Executive"
  },
  {
    "name": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "username": "junaid_abdul_kareem",
    "repId": "#106",
    "territory": "Rawabi & Budget Sector",
    "role": "Modern Trade Executive"
  },
  {
    "name": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "username": "shafeeq_punnilath",
    "repId": "#107",
    "territory": "Saudia & Regency Zone",
    "role": "Modern Trade Executive"
  },
  {
    "name": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "username": "thajudeen_abdul_majeed",
    "repId": "#108",
    "territory": "Lulu Hypermarkets Sector",
    "role": "Modern Trade Executive"
  },
  {
    "name": "SIRAJ MOHAMMED ABDUL AZIZ",
    "username": "siraj_mohammed",
    "repId": "#109",
    "territory": "Central Modern Trade",
    "role": "Modern Trade Executive"
  }
];

export const MASTER_PJP_OUTLETS: MasterOutletRecord[] = [
  {
    "id": "mst-6421848654",
    "name": "Al Meera — AL MEERA - AIN KHALID",
    "rawName": "AL MEERA - AIN KHALID",
    "branch": "AIN KHALID",
    "address": "AIN KHALID, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10320476",
    "account": "Al Meera"
  },
  {
    "id": "mst-9089208929",
    "name": "Al Meera — AL Meera - Airport Hyper Market",
    "rawName": "AL Meera - Airport Hyper Market",
    "branch": "Airport Hyper Market",
    "address": "Airport Hyper Market, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300061",
    "account": "Al Meera"
  },
  {
    "id": "mst-4241615729",
    "name": "Al Meera — Al Meera - Al Karana",
    "rawName": "Al Meera - Al Karana",
    "branch": "Al Karana",
    "address": "Al Karana, Al Meera, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10311835",
    "account": "Al Meera"
  },
  {
    "id": "mst-4834015020",
    "name": "Al Meera — AL Meera - Bin Omran",
    "rawName": "AL Meera - Bin Omran",
    "branch": "Bin Omran",
    "address": "Bin Omran, Al Meera, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300062",
    "account": "Al Meera"
  },
  {
    "id": "mst-10113515909",
    "name": "Al Meera — Al Meera-Hazm Al Markhiya",
    "rawName": "Al Meera-Hazm Al Markhiya",
    "branch": "Hazm Al Markhiya",
    "address": "Hazm Al Markhiya, Al Meera, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300066",
    "account": "Al Meera"
  },
  {
    "id": "mst-3090435968",
    "name": "Al Meera — Al Meera-Kabaan Store",
    "rawName": "Al Meera-Kabaan Store",
    "branch": "Kabaan Store",
    "address": "Kabaan Store, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300068",
    "account": "Al Meera"
  },
  {
    "id": "mst-749122563",
    "name": "Al Meera — Al Meera-Leabeeb 2",
    "rawName": "Al Meera-Leabeeb 2",
    "branch": "Leabeeb 2",
    "address": "Leabeeb 2, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300227",
    "account": "Al Meera"
  },
  {
    "id": "mst-1126866107",
    "name": "Al Meera — Al Meera-Onaiza 02",
    "rawName": "Al Meera-Onaiza 02",
    "branch": "Onaiza 02",
    "address": "Onaiza 02, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300078",
    "account": "Al Meera"
  },
  {
    "id": "mst-1854401129",
    "name": "Al Meera — Al Meera-Rawdat Eqdeem",
    "rawName": "Al Meera-Rawdat Eqdeem",
    "branch": "Rawdat Eqdeem",
    "address": "Rawdat Eqdeem, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300097",
    "account": "Al Meera"
  },
  {
    "id": "mst-1658738134",
    "name": "Al Meera — Al Meera-Shamal Store",
    "rawName": "Al Meera-Shamal Store",
    "branch": "Shamal Store",
    "address": "Shamal Store, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300086",
    "account": "Al Meera"
  },
  {
    "id": "mst-603115105",
    "name": "Ansar — Ansar Gallery Center - Al Rayyan",
    "rawName": "Ansar Gallery Center - Al Rayyan",
    "branch": "Al Rayyan",
    "address": "Al Rayyan, Ansar, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300596",
    "account": "Ansar"
  },
  {
    "id": "mst-13579650933",
    "name": "MARK & SAVE — BUDGET HYPERMARKET - AIN KHALID",
    "rawName": "BUDGET HYPERMARKET - AIN KHALID",
    "branch": "AIN KHALID",
    "address": "AIN KHALID, MARK & SAVE, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10324194",
    "account": "MARK & SAVE"
  },
  {
    "id": "mst-13843576737",
    "name": "MARK & SAVE — BUDGET HYPERMARKET - MUAITHER",
    "rawName": "BUDGET HYPERMARKET - MUAITHER",
    "branch": "MUAITHER",
    "address": "MUAITHER, MARK & SAVE, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10325171",
    "account": "MARK & SAVE"
  },
  {
    "id": "mst-5781245540",
    "name": "FFC — Family Food Center-Al Kheesha",
    "rawName": "Family Food Center-Al Kheesha",
    "branch": "Al Kheesha",
    "address": "Al Kheesha, FFC, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10301366",
    "account": "FFC"
  },
  {
    "id": "mst-6580427678",
    "name": "Family — Family Shopping Maither",
    "rawName": "Family Shopping Maither",
    "branch": "MUAITHER",
    "address": "MUAITHER, Family, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10301140",
    "account": "Family"
  },
  {
    "id": "mst-512109008",
    "name": "FP — Food Palace-Al Sadd",
    "rawName": "Food Palace-Al Sadd",
    "branch": "Al Sadd",
    "address": "Al Sadd, FP, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300298",
    "account": "FP"
  },
  {
    "id": "mst-1722736878",
    "name": "Al Meera — Geant Hyatt Plaza - Villaggio",
    "rawName": "Geant Hyatt Plaza - Villaggio",
    "branch": "Villaggio",
    "address": "Villaggio, Al Meera, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300553",
    "account": "Al Meera"
  },
  {
    "id": "mst-1197513238",
    "name": "Grand — GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "rawName": "GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "branch": "BARWA BARAHAT AL WAKRA",
    "address": "BARWA BARAHAT AL WAKRA, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10313012",
    "account": "Grand"
  },
  {
    "id": "mst-850379830",
    "name": "Rawabi — GRAND HYPER MARKET-KHERTHIYATH",
    "rawName": "GRAND HYPER MARKET-KHERTHIYATH",
    "branch": "KHERTHIYATH",
    "address": "KHERTHIYATH, Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300284",
    "account": "Rawabi"
  },
  {
    "id": "mst-3155569124",
    "name": "Grand — Grand Mall Mukaynis - Salwa Road",
    "rawName": "Grand Mall Mukaynis - Salwa Road",
    "branch": "Salwa Road",
    "address": "Salwa Road, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10311449",
    "account": "Grand"
  },
  {
    "id": "mst-870618579",
    "name": "Grand — Grand Mall Wll",
    "rawName": "Grand Mall Wll",
    "branch": "Grand",
    "address": "Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300388",
    "account": "Grand"
  },
  {
    "id": "mst-19506498636",
    "name": "Saudia — KENZ MINI MART - OLD AIRPORT",
    "rawName": "KENZ MINI MART - OLD AIRPORT",
    "branch": "OLD AIRPORT",
    "address": "OLD AIRPORT, Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10311846",
    "account": "Saudia"
  },
  {
    "id": "mst-4623179306",
    "name": "Lulu — LULU DHAKHIRA",
    "rawName": "LULU DHAKHIRA",
    "branch": "Lulu",
    "address": "Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10313477",
    "account": "Lulu"
  },
  {
    "id": "mst-4367743400",
    "name": "Lulu — Lulu Express Trading - Marina",
    "rawName": "Lulu Express Trading - Marina",
    "branch": "Marina",
    "address": "Marina, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10304739",
    "account": "Lulu"
  },
  {
    "id": "mst-9458695984",
    "name": "Lulu — Lulu Hyper Market-Al Khor",
    "rawName": "Lulu Hyper Market-Al Khor",
    "branch": "Al Khor",
    "address": "Al Khor, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300310",
    "account": "Lulu"
  },
  {
    "id": "mst-4067653059",
    "name": "Lulu — LULU PEARL QATAR",
    "rawName": "LULU PEARL QATAR",
    "branch": "Lulu",
    "address": "Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10312991",
    "account": "Lulu"
  },
  {
    "id": "mst-9357542033",
    "name": "C4 — Maf Hyper Market(Carrefour)-Wakra",
    "rawName": "Maf Hyper Market(Carrefour)-Wakra",
    "branch": "Wakra",
    "address": "Wakra, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300104",
    "account": "C4"
  },
  {
    "id": "mst-1562985619",
    "name": "C4 — Maf Hyper Market-City Center",
    "rawName": "Maf Hyper Market-City Center",
    "branch": "City Center",
    "address": "City Center, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300098",
    "account": "C4"
  },
  {
    "id": "mst-2580595159",
    "name": "C4 — Maf Hyper Market-Dar Al Salam",
    "rawName": "Maf Hyper Market-Dar Al Salam",
    "branch": "Dar Al Salam",
    "address": "Dar Al Salam, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300099",
    "account": "C4"
  },
  {
    "id": "mst-7517317754",
    "name": "MARZA — Marza Hypermarket - Hazm Al Markhiya",
    "rawName": "Marza Hypermarket - Hazm Al Markhiya",
    "branch": "Hazm Al Markhiya",
    "address": "Hazm Al Markhiya, MARZA, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10302453",
    "account": "MARZA"
  },
  {
    "id": "mst-8353270570",
    "name": "Maskar — Maskar Hyper Market",
    "rawName": "Maskar Hyper Market",
    "branch": "Maskar",
    "address": "Maskar, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300105",
    "account": "Maskar"
  },
  {
    "id": "mst-5802269535",
    "name": "NBK — Mega Mart- Q Mall",
    "rawName": "Mega Mart- Q Mall",
    "branch": "Q Mall",
    "address": "Q Mall, NBK, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301385",
    "account": "NBK"
  },
  {
    "id": "mst-1063796894",
    "name": "Stop N Shop — New Stop & Shop - Street 27",
    "rawName": "New Stop & Shop - Street 27",
    "branch": "Street 27",
    "address": "Street 27, Stop N Shop, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301965",
    "account": "Stop N Shop"
  },
  {
    "id": "mst-4846531648",
    "name": "Ansar — New World Centre",
    "rawName": "New World Centre",
    "branch": "Ansar",
    "address": "Ansar, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10302188",
    "account": "Ansar"
  },
  {
    "id": "mst-5798645407",
    "name": "PARIS — PARIS HPMKT (STREET-37)",
    "rawName": "PARIS HPMKT (STREET-37)",
    "branch": "PARIS",
    "address": "PARIS, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300939",
    "account": "PARIS"
  },
  {
    "id": "mst-2974677143",
    "name": "Al Meera — Qmc-Sana",
    "rawName": "Qmc-Sana",
    "branch": "Sana",
    "address": "Sana, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300349",
    "account": "Al Meera"
  },
  {
    "id": "mst-8189759205",
    "name": "Rawabi — RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "rawName": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "branch": "CENTRAL WAREHOUSE",
    "address": "CENTRAL WAREHOUSE, Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10323537",
    "account": "Rawabi"
  },
  {
    "id": "mst-3322972262",
    "name": "Rawabi — Rawabi hypermarket - Murra",
    "rawName": "Rawabi hypermarket - Murra",
    "branch": "Murra",
    "address": "Murra, Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "B00008",
    "account": "Rawabi"
  },
  {
    "id": "mst-7624943161",
    "name": "Rawabi — RAWABI HYPERMARKET IZGHAWA",
    "rawName": "RAWABI HYPERMARKET IZGHAWA",
    "branch": "Rawabi",
    "address": "Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "B00012",
    "account": "Rawabi"
  },
  {
    "id": "mst-13170929016",
    "name": "Regency — Regency shopping center - Ain Khalid",
    "rawName": "Regency shopping center - Ain Khalid",
    "branch": "Ain Khalid",
    "address": "Ain Khalid, Regency, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300936",
    "account": "Regency"
  },
  {
    "id": "mst-19041948138",
    "name": "Regency — REGENCY SHOPPING COMPLEX - Wakra",
    "rawName": "REGENCY SHOPPING COMPLEX - Wakra",
    "branch": "Wakra",
    "address": "Wakra, Regency, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10301891",
    "account": "Regency"
  },
  {
    "id": "mst-11509845749",
    "name": "Safari — SAFARI HYPERMARKET - BARWA VILLAGE",
    "rawName": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "branch": "BARWA VILLAGE",
    "address": "BARWA VILLAGE, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10313001",
    "account": "Safari"
  },
  {
    "id": "mst-5858363315",
    "name": "Max — Sanaya Hypermarket - Street 52",
    "rawName": "Sanaya Hypermarket - Street 52",
    "branch": "Street 52",
    "address": "Street 52, Max, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301811",
    "account": "Max"
  },
  {
    "id": "mst-10104335603",
    "name": "Saudia — SAUDIA - THUMAMA",
    "rawName": "SAUDIA - THUMAMA",
    "branch": "THUMAMA",
    "address": "THUMAMA, Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10320362",
    "account": "Saudia"
  },
  {
    "id": "mst-3593258089",
    "name": "Saudia — SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "rawName": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "branch": "QBM (UMM AL DHOOM ST)",
    "address": "QBM (UMM AL DHOOM ST), Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300959",
    "account": "Saudia"
  },
  {
    "id": "mst-11142316654",
    "name": "Spar — Spar Qatar - Tawar Mall",
    "rawName": "Spar Qatar - Tawar Mall",
    "branch": "Tawar Mall",
    "address": "Tawar Mall, Spar, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301460",
    "account": "Spar"
  },
  {
    "id": "mst-2930318658",
    "name": "Al Meera — AL Meera - Abu Nakhla",
    "rawName": "AL Meera - Abu Nakhla",
    "branch": "Abu Nakhla",
    "address": "Abu Nakhla, Al Meera, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300060",
    "account": "Al Meera"
  },
  {
    "id": "mst-3647669334",
    "name": "Al Meera — Al Meera - Central Jail",
    "rawName": "Al Meera - Central Jail",
    "branch": "Central Jail",
    "address": "Central Jail, Al Meera, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10302231",
    "account": "Al Meera"
  },
  {
    "id": "mst-2880632522",
    "name": "Al Meera — Al Meera - Leabeeb 1",
    "rawName": "Al Meera - Leabeeb 1",
    "branch": "Leabeeb 1",
    "address": "Leabeeb 1, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300243",
    "account": "Al Meera"
  },
  {
    "id": "mst-6204415016",
    "name": "Al Meera — Al Meera - Rawdat Al Hamama",
    "rawName": "Al Meera - Rawdat Al Hamama",
    "branch": "Rawdat Al Hamama",
    "address": "Rawdat Al Hamama, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10302081",
    "account": "Al Meera"
  },
  {
    "id": "mst-844463394",
    "name": "Al Meera — AL MEERA -THUMAMA NEW",
    "rawName": "AL MEERA -THUMAMA NEW",
    "branch": "THUMAMA NEW",
    "address": "THUMAMA NEW, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10322426",
    "account": "Al Meera"
  },
  {
    "id": "mst-8531192854",
    "name": "Al Meera — Al Meera-Gharafat Al Rayyan Store",
    "rawName": "Al Meera-Gharafat Al Rayyan Store",
    "branch": "Gharafat Al Rayyan Store",
    "address": "Gharafat Al Rayyan Store, Al Meera, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300063",
    "account": "Al Meera"
  },
  {
    "id": "mst-3529259011",
    "name": "Al Meera — Al Meera-Gulf Mall",
    "rawName": "Al Meera-Gulf Mall",
    "branch": "Gulf Mall",
    "address": "Gulf Mall, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300065",
    "account": "Al Meera"
  },
  {
    "id": "mst-1903668108",
    "name": "Al Meera — Al Meera-Jeryan",
    "rawName": "Al Meera-Jeryan",
    "branch": "Jeryan",
    "address": "Jeryan, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300093",
    "account": "Al Meera"
  },
  {
    "id": "mst-3028225059",
    "name": "Al Meera — Al Meera-Nuaija Store",
    "rawName": "Al Meera-Nuaija Store",
    "branch": "Nuaija Store",
    "address": "Nuaija Store, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300076",
    "account": "Al Meera"
  },
  {
    "id": "mst-3824947758",
    "name": "Al Meera — Al Meera-Rawdat Al Khail Store",
    "rawName": "Al Meera-Rawdat Al Khail Store",
    "branch": "Rawdat Al Khail Store",
    "address": "Rawdat Al Khail Store, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300082",
    "account": "Al Meera"
  },
  {
    "id": "mst-2555625757",
    "name": "Al Meera — Al Meera-Rt Al Thumama",
    "rawName": "Al Meera-Rt Al Thumama",
    "branch": "Rt Al Thumama",
    "address": "Rt Al Thumama, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300092",
    "account": "Al Meera"
  },
  {
    "id": "mst-1270224240",
    "name": "Al Meera — Al Meera-Shahaniya",
    "rawName": "Al Meera-Shahaniya",
    "branch": "Shahaniya",
    "address": "Shahaniya, Al Meera, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300085",
    "account": "Al Meera"
  },
  {
    "id": "mst-4766077090",
    "name": "Al Meera — Al Meera-Zghawa",
    "rawName": "Al Meera-Zghawa",
    "branch": "Zghawa",
    "address": "Zghawa, Al Meera, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300095",
    "account": "Al Meera"
  },
  {
    "id": "mst-4598200165",
    "name": "Ansar — Ansar Gallery Thumama",
    "rawName": "Ansar Gallery Thumama",
    "branch": "Ansar",
    "address": "Ansar, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300362",
    "account": "Ansar"
  },
  {
    "id": "mst-106179982",
    "name": "Ramez — ASWAQ RAMEZ-MAMOURA",
    "rawName": "ASWAQ RAMEZ-MAMOURA",
    "branch": "MAMOURA",
    "address": "MAMOURA, Ramez, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10302773",
    "account": "Ramez"
  },
  {
    "id": "mst-584425309",
    "name": "FFC — Family Food Center-Catering Services",
    "rawName": "Family Food Center-Catering Services",
    "branch": "Catering Services",
    "address": "Catering Services, FFC, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300292",
    "account": "FFC"
  },
  {
    "id": "mst-3219940402",
    "name": "Family — Family Shopping Complex (CREDIT) - Murra",
    "rawName": "Family Shopping Complex (CREDIT) - Murra",
    "branch": "Murra",
    "address": "Murra, Family, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10301578",
    "account": "Family"
  },
  {
    "id": "mst-4367224810",
    "name": "FP — Food Palace-Musherib",
    "rawName": "Food Palace-Musherib",
    "branch": "Musherib",
    "address": "Musherib, FP, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300299",
    "account": "FP"
  },
  {
    "id": "mst-5261667889",
    "name": "Grand — Grand Express- Ezdan Mall-Wukair",
    "rawName": "Grand Express- Ezdan Mall-Wukair",
    "branch": "Ezdan Mall",
    "address": "Ezdan Mall, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300390",
    "account": "Grand"
  },
  {
    "id": "mst-1757652907",
    "name": "Grand — GRAND EXPRESS, AL SHAHANIYA",
    "rawName": "GRAND EXPRESS, AL SHAHANIYA",
    "branch": "Grand",
    "address": "Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10302457",
    "account": "Grand"
  },
  {
    "id": "mst-6717548896",
    "name": "Lulu — LULU BARWA MADINATNA",
    "rawName": "LULU BARWA MADINATNA",
    "branch": "Lulu",
    "address": "Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10312992",
    "account": "Lulu"
  },
  {
    "id": "mst-2241163314",
    "name": "Lulu — LULU HYPER MARKET - HO",
    "rawName": "LULU HYPER MARKET - HO",
    "branch": "HO",
    "address": "HO, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300309",
    "account": "Lulu"
  },
  {
    "id": "mst-12595172851",
    "name": "Lulu — Lulu Hyper Market-Barwa City",
    "rawName": "Lulu Hyper Market-Barwa City",
    "branch": "Barwa City",
    "address": "Barwa City, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300314",
    "account": "Lulu"
  },
  {
    "id": "mst-12955265361",
    "name": "Lulu — Lulu Hyper Market-D Ring Road",
    "rawName": "Lulu Hyper Market-D Ring Road",
    "branch": "D Ring Road",
    "address": "D Ring Road, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300313",
    "account": "Lulu"
  },
  {
    "id": "mst-6032638394",
    "name": "Lulu — LuLu Hypermarket - Abu Sidra Mall",
    "rawName": "LuLu Hypermarket - Abu Sidra Mall",
    "branch": "Abu Sidra Mall",
    "address": "Abu Sidra Mall, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10302543",
    "account": "Lulu"
  },
  {
    "id": "mst-12257772999",
    "name": "C4 — Maf Hyper Market(Carrefour)-Mall Of Qata",
    "rawName": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "branch": "Mall Of Qata",
    "address": "Mall Of Qata, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300103",
    "account": "C4"
  },
  {
    "id": "mst-1542049291",
    "name": "C4 — Maf Hyper Market-Land Mark",
    "rawName": "Maf Hyper Market-Land Mark",
    "branch": "Land Mark",
    "address": "Land Mark, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300101",
    "account": "C4"
  },
  {
    "id": "mst-5133341210",
    "name": "C4 — Maf Hyper Market-Villageo",
    "rawName": "Maf Hyper Market-Villageo",
    "branch": "Villageo",
    "address": "Villageo, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300102",
    "account": "C4"
  },
  {
    "id": "mst-4254831670",
    "name": "Maskar — MASSKAR HYPERMARKET (NO REBATE)",
    "rawName": "MASSKAR HYPERMARKET (NO REBATE)",
    "branch": "Maskar",
    "address": "Maskar, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10317217",
    "account": "Maskar"
  },
  {
    "id": "mst-361875148",
    "name": "Monoprix — Monoprix - Festival City",
    "rawName": "Monoprix - Festival City",
    "branch": "Festival City",
    "address": "Festival City, Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10301279",
    "account": "Monoprix"
  },
  {
    "id": "mst-14850902021",
    "name": "Monoprix — MONOPRIX WEST WALK - SALWA ROAD",
    "rawName": "MONOPRIX WEST WALK - SALWA ROAD",
    "branch": "SALWA ROAD",
    "address": "SALWA ROAD, Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10315790",
    "account": "Monoprix"
  },
  {
    "id": "mst-4343269657",
    "name": "NESTO — NESTO HYPERMARKET",
    "rawName": "NESTO HYPERMARKET",
    "branch": "NESTO",
    "address": "NESTO, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10325018",
    "account": "NESTO"
  },
  {
    "id": "mst-6772455903",
    "name": "Panda — Panda Hypermarket WLL",
    "rawName": "Panda Hypermarket WLL",
    "branch": "Panda",
    "address": "Panda, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10301938",
    "account": "Panda"
  },
  {
    "id": "mst-19144544331",
    "name": "Baladi Group — Qatar Shopping Complex",
    "rawName": "Qatar Shopping Complex",
    "branch": "Baladi Group",
    "address": "Baladi Group, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10301189",
    "account": "Baladi Group"
  },
  {
    "id": "mst-10686033143",
    "name": "Ramez — RAMEZ SHOPPING HO",
    "rawName": "RAMEZ SHOPPING HO",
    "branch": "Ramez",
    "address": "Ramez, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300354",
    "account": "Ramez"
  },
  {
    "id": "mst-10465824684",
    "name": "Regency — Regency Hyper Market (QFI-CR)",
    "rawName": "Regency Hyper Market (QFI-CR)",
    "branch": "Regency",
    "address": "Regency, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10302186",
    "account": "Regency"
  },
  {
    "id": "mst-20156269171",
    "name": "Regency — REGENCY SHOPPING COMPLEX - IZGHAWA",
    "rawName": "REGENCY SHOPPING COMPLEX - IZGHAWA",
    "branch": "IZGHAWA",
    "address": "IZGHAWA, Regency, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10318503",
    "account": "Regency"
  },
  {
    "id": "mst-1121701668",
    "name": "Safari — Safari Mall-Abuhamour",
    "rawName": "Safari Mall-Abuhamour",
    "branch": "Abuhamour",
    "address": "Abuhamour, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300327",
    "account": "Safari"
  },
  {
    "id": "mst-8407418094",
    "name": "Saudia — SAUDIA HYPERMARKET - UMM SALAL ALI",
    "rawName": "SAUDIA HYPERMARKET - UMM SALAL ALI",
    "branch": "UMM SALAL ALI",
    "address": "UMM SALAL ALI, Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10324658",
    "account": "Saudia"
  },
  {
    "id": "mst-8441982765",
    "name": "Saudia — SAUDIA HYPERMARKET-AL KHOR",
    "rawName": "SAUDIA HYPERMARKET-AL KHOR",
    "branch": "AL KHOR",
    "address": "AL KHOR, Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300221",
    "account": "Saudia"
  },
  {
    "id": "mst-10136583563",
    "name": "Spar — SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "rawName": "SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "branch": "Bin Mahmoud",
    "address": "Bin Mahmoud, Spar, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10311799",
    "account": "Spar"
  },
  {
    "id": "mst-5697139672",
    "name": "Al Meera — AL MEERA - AL ASMAKH MALL",
    "rawName": "AL MEERA - AL ASMAKH MALL",
    "branch": "AL ASMAKH MALL",
    "address": "AL ASMAKH MALL, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10302360",
    "account": "Al Meera"
  },
  {
    "id": "mst-6221534562",
    "name": "Al Meera — AL MEERA - JERYAN JUNAIHAT",
    "rawName": "AL MEERA - JERYAN JUNAIHAT",
    "branch": "JERYAN JUNAIHAT",
    "address": "JERYAN JUNAIHAT, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10302361",
    "account": "Al Meera"
  },
  {
    "id": "mst-4321254855",
    "name": "Al Meera — Al Meera - Umm Salal Ali",
    "rawName": "Al Meera - Umm Salal Ali",
    "branch": "Umm Salal Ali",
    "address": "Umm Salal Ali, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300222",
    "account": "Al Meera"
  },
  {
    "id": "mst-885302422",
    "name": "Al Meera — Al Meera-Al Khor Branch",
    "rawName": "Al Meera-Al Khor Branch",
    "branch": "Al Khor Branch",
    "address": "Al Khor Branch, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300219",
    "account": "Al Meera"
  },
  {
    "id": "mst-9127700632",
    "name": "Al Meera — Al Meera-Al Wajba",
    "rawName": "Al Meera-Al Wajba",
    "branch": "Al Wajba",
    "address": "Al Wajba, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300094",
    "account": "Al Meera"
  },
  {
    "id": "mst-2577599817",
    "name": "Al Meera — Al Meera-Aziziah",
    "rawName": "Al Meera-Aziziah",
    "branch": "Aziziah",
    "address": "Aziziah, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300090",
    "account": "Al Meera"
  },
  {
    "id": "mst-3949053521",
    "name": "Al Meera — Al Meera-Khalifa South Branch",
    "rawName": "Al Meera-Khalifa South Branch",
    "branch": "Khalifa South Branch",
    "address": "Khalifa South Branch, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300070",
    "account": "Al Meera"
  },
  {
    "id": "mst-1972727648",
    "name": "Al Meera — Al Meera-Mamoura Store",
    "rawName": "Al Meera-Mamoura Store",
    "branch": "Mamoura Store",
    "address": "Mamoura Store, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300072",
    "account": "Al Meera"
  },
  {
    "id": "mst-5081165436",
    "name": "Al Meera — Al Meera-Mansoura",
    "rawName": "Al Meera-Mansoura",
    "branch": "Mansoura",
    "address": "Mansoura, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300073",
    "account": "Al Meera"
  },
  {
    "id": "mst-3120827080",
    "name": "Al Meera — Al Meera-Wakra",
    "rawName": "Al Meera-Wakra",
    "branch": "Wakra",
    "address": "Wakra, Al Meera, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300087",
    "account": "Al Meera"
  },
  {
    "id": "mst-1344165528",
    "name": "Al Meera — Al Meera-Wakra New",
    "rawName": "Al Meera-Wakra New",
    "branch": "Wakra New",
    "address": "Wakra New, Al Meera, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300088",
    "account": "Al Meera"
  },
  {
    "id": "mst-17432944070",
    "name": "Family — Azizia Family Shopping Complex (CREDIT)",
    "rawName": "Azizia Family Shopping Complex (CREDIT)",
    "branch": "Family",
    "address": "Family, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10301963",
    "account": "Family"
  },
  {
    "id": "mst-13598236934",
    "name": "MARK & SAVE — BUDGET HYPERMARKET - D RING ROAD",
    "rawName": "BUDGET HYPERMARKET - D RING ROAD",
    "branch": "D RING ROAD",
    "address": "D RING ROAD, MARK & SAVE, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10322513",
    "account": "MARK & SAVE"
  },
  {
    "id": "mst-11317457961",
    "name": "Day2Day — DAY TO DAY CENTER - AIRPORT STREET",
    "rawName": "DAY TO DAY CENTER - AIRPORT STREET",
    "branch": "AIRPORT STREET",
    "address": "AIRPORT STREET, Day2Day, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10323178",
    "account": "Day2Day"
  },
  {
    "id": "mst-175708222",
    "name": "Max — G MAX HYPERMARKET- BIRKAT AL AWAMER",
    "rawName": "G MAX HYPERMARKET- BIRKAT AL AWAMER",
    "branch": "BIRKAT AL AWAMER",
    "address": "BIRKAT AL AWAMER, Max, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10320223",
    "account": "Max"
  },
  {
    "id": "mst-15612582608",
    "name": "Rawabi — Grand shopping Abu Hamour",
    "rawName": "Grand shopping Abu Hamour",
    "branch": "Rawabi",
    "address": "Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "B00010",
    "account": "Rawabi"
  },
  {
    "id": "mst-146684880",
    "name": "City Hyper — HYPER CITY TRADING",
    "rawName": "HYPER CITY TRADING",
    "branch": "City Hyper",
    "address": "City Hyper, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10316565",
    "account": "City Hyper"
  },
  {
    "id": "mst-6422351645",
    "name": "Lulu — Lulu Center-Al Sadd",
    "rawName": "Lulu Center-Al Sadd",
    "branch": "Al Sadd",
    "address": "Al Sadd, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300311",
    "account": "Lulu"
  },
  {
    "id": "mst-7169925495",
    "name": "Lulu — LuLu Express - B Ring Road",
    "rawName": "LuLu Express - B Ring Road",
    "branch": "B Ring Road",
    "address": "B Ring Road, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10301901",
    "account": "Lulu"
  },
  {
    "id": "mst-1751019062",
    "name": "Lulu — LULU EXPRESS TRADING - UM AL AMAD",
    "rawName": "LULU EXPRESS TRADING - UM AL AMAD",
    "branch": "UM AL AMAD",
    "address": "UM AL AMAD, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10321291",
    "account": "Lulu"
  },
  {
    "id": "mst-8650741041",
    "name": "Lulu — LuLu Hyper - Messilla",
    "rawName": "LuLu Hyper - Messilla",
    "branch": "Messilla",
    "address": "Messilla, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300814",
    "account": "Lulu"
  },
  {
    "id": "mst-11936709879",
    "name": "Lulu — Lulu Hyper Market-Gharaffa",
    "rawName": "Lulu Hyper Market-Gharaffa",
    "branch": "Gharaffa",
    "address": "Gharaffa, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300315",
    "account": "Lulu"
  },
  {
    "id": "mst-339678318",
    "name": "C4 — Maf Hyper Market-Lagoona",
    "rawName": "Maf Hyper Market-Lagoona",
    "branch": "Lagoona",
    "address": "Lagoona, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300318",
    "account": "C4"
  },
  {
    "id": "mst-3698369889",
    "name": "MARZA — MARZA HYPERMARKET MUSHERIB",
    "rawName": "MARZA HYPERMARKET MUSHERIB",
    "branch": "MARZA",
    "address": "MARZA, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10315851",
    "account": "MARZA"
  },
  {
    "id": "mst-2298803496",
    "name": "NBK — Mega Mart-Barwa Village Waqra",
    "rawName": "Mega Mart-Barwa Village Waqra",
    "branch": "Barwa Village Waqra",
    "address": "Barwa Village Waqra, NBK, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300333",
    "account": "NBK"
  },
  {
    "id": "mst-8446274784",
    "name": "Monoprix — MONOPRIX FLORESTA - PEARL QATAR",
    "rawName": "MONOPRIX FLORESTA - PEARL QATAR",
    "branch": "PEARL QATAR",
    "address": "PEARL QATAR, Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10316174",
    "account": "Monoprix"
  },
  {
    "id": "mst-3863992327",
    "name": "Monoprix — Monoprix Medina Central",
    "rawName": "Monoprix Medina Central",
    "branch": "Monoprix",
    "address": "Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10301942",
    "account": "Monoprix"
  },
  {
    "id": "mst-8261588956",
    "name": "Retail — New Indian Super Market",
    "rawName": "New Indian Super Market",
    "branch": "Retail",
    "address": "Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300393",
    "account": "Retail"
  },
  {
    "id": "mst-6312282079",
    "name": "PARIS — Paris Hypermarket - Muntaza",
    "rawName": "Paris Hypermarket - Muntaza",
    "branch": "Muntaza",
    "address": "Muntaza, PARIS, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10309488",
    "account": "PARIS"
  },
  {
    "id": "mst-5498481365",
    "name": "PARIS — PARIS HYPERMARKET - WAKRA",
    "rawName": "PARIS HYPERMARKET - WAKRA",
    "branch": "WAKRA",
    "address": "WAKRA, PARIS, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10320594",
    "account": "PARIS"
  },
  {
    "id": "mst-4422438276",
    "name": "Grand Mart — PASSION HYPERMARKET",
    "rawName": "PASSION HYPERMARKET",
    "branch": "Grand Mart",
    "address": "Grand Mart, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10315826",
    "account": "Grand Mart"
  },
  {
    "id": "mst-954069952",
    "name": "Ramez — Ramez Shopping-Barwa",
    "rawName": "Ramez Shopping-Barwa",
    "branch": "Barwa",
    "address": "Barwa, Ramez, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300356",
    "account": "Ramez"
  },
  {
    "id": "mst-289933725",
    "name": "Rawabi — Rawabi Hypermarket - Wakra",
    "rawName": "Rawabi Hypermarket - Wakra",
    "branch": "Wakra",
    "address": "Wakra, Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "B00013",
    "account": "Rawabi"
  },
  {
    "id": "mst-15836815373",
    "name": "Regency — REGENCY SHOPPING COMPLEX",
    "rawName": "REGENCY SHOPPING COMPLEX",
    "branch": "Regency",
    "address": "Regency, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300597",
    "account": "Regency"
  },
  {
    "id": "mst-3012773314",
    "name": "Retail — Retail Mart -Wakra New",
    "rawName": "Retail Mart -Wakra New",
    "branch": "Wakra New",
    "address": "Wakra New, Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10302225",
    "account": "Retail"
  },
  {
    "id": "mst-5143891496",
    "name": "Retail — Retail Mart-Wakra",
    "rawName": "Retail Mart-Wakra",
    "branch": "Wakra",
    "address": "Wakra, Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300353",
    "account": "Retail"
  },
  {
    "id": "mst-7737918196",
    "name": "Safari — Safari Hyper Market-Salwa Road",
    "rawName": "Safari Hyper Market-Salwa Road",
    "branch": "Salwa Road",
    "address": "Salwa Road, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300326",
    "account": "Safari"
  },
  {
    "id": "mst-22004174677",
    "name": "Safari — SAFARI HYPERMARKET - BIRKAT AL AWAMER",
    "rawName": "SAFARI HYPERMARKET - BIRKAT AL AWAMER",
    "branch": "BIRKAT AL AWAMER",
    "address": "BIRKAT AL AWAMER, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10321502",
    "account": "Safari"
  },
  {
    "id": "mst-9768542490",
    "name": "Saudia — SAUDIA HYPERMARKET (CR-QFI)",
    "rawName": "SAUDIA HYPERMARKET (CR-QFI)",
    "branch": "QFI)",
    "address": "QFI), Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10302194",
    "account": "Saudia"
  },
  {
    "id": "mst-11151983738",
    "name": "Saudia — SAUDIA HYPERMARKET 500",
    "rawName": "SAUDIA HYPERMARKET 500",
    "branch": "Saudia",
    "address": "Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300958",
    "account": "Saudia"
  },
  {
    "id": "mst-4857052317",
    "name": "Snoonu — SNOONU TRADING & SERVICES",
    "rawName": "SNOONU TRADING & SERVICES",
    "branch": "Snoonu",
    "address": "Snoonu, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10302273",
    "account": "Snoonu"
  },
  {
    "id": "mst-3612193519",
    "name": "Baladi Group — Souq Al Baladi Trading",
    "rawName": "Souq Al Baladi Trading",
    "branch": "Baladi Group",
    "address": "Baladi Group, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10301379",
    "account": "Baladi Group"
  },
  {
    "id": "mst-959985973",
    "name": "Talabat — TALABAT SERVICES COMPANY. W.L.L GHARAFA",
    "rawName": "TALABAT SERVICES COMPANY. W.L.L GHARAFA",
    "branch": "Talabat",
    "address": "Talabat, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10324687",
    "account": "Talabat"
  },
  {
    "id": "mst-2532544353",
    "name": "Maskar — Al Ad Trading S/m",
    "rawName": "Al Ad Trading S/m",
    "branch": "Maskar",
    "address": "Maskar, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10302813",
    "account": "Maskar"
  },
  {
    "id": "mst-14289108565",
    "name": "Al Meera — Al Meera - Aba El Heran Branch",
    "rawName": "Al Meera - Aba El Heran Branch",
    "branch": "Aba El Heran Branch",
    "address": "Aba El Heran Branch, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300241",
    "account": "Al Meera"
  },
  {
    "id": "mst-3358738781",
    "name": "Al Meera — Al Meera - Azghawa new",
    "rawName": "Al Meera - Azghawa new",
    "branch": "Azghawa new",
    "address": "Azghawa new, Al Meera, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300242",
    "account": "Al Meera"
  },
  {
    "id": "mst-4226677413",
    "name": "Al Meera — Al Meera - Bu Sidra",
    "rawName": "Al Meera - Bu Sidra",
    "branch": "Bu Sidra",
    "address": "Bu Sidra, Al Meera, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300096",
    "account": "Al Meera"
  },
  {
    "id": "mst-5854958780",
    "name": "Al Meera — Al Meera - Doha Institute",
    "rawName": "Al Meera - Doha Institute",
    "branch": "Doha Institute",
    "address": "Doha Institute, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10301373",
    "account": "Al Meera"
  },
  {
    "id": "mst-12445278012",
    "name": "Al Meera — Al Meera - Sailiya",
    "rawName": "Al Meera - Sailiya",
    "branch": "Sailiya",
    "address": "Sailiya, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300220",
    "account": "Al Meera"
  },
  {
    "id": "mst-3993412666",
    "name": "Al Meera — Al Meera - Umm Qarn",
    "rawName": "Al Meera - Umm Qarn",
    "branch": "Umm Qarn",
    "address": "Umm Qarn, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300234",
    "account": "Al Meera"
  },
  {
    "id": "mst-5793165800",
    "name": "Al Meera — Al Meera-Al Qutaifeya Store",
    "rawName": "Al Meera-Al Qutaifeya Store",
    "branch": "Al Qutaifeya Store",
    "address": "Al Qutaifeya Store, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300071",
    "account": "Al Meera"
  },
  {
    "id": "mst-5216400885",
    "name": "Al Meera — Al Meera-Dahal Al Hamam",
    "rawName": "Al Meera-Dahal Al Hamam",
    "branch": "Dahal Al Hamam",
    "address": "Dahal Al Hamam, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300069",
    "account": "Al Meera"
  },
  {
    "id": "mst-6299802447",
    "name": "Al Meera — Al Meera-Sailiya South",
    "rawName": "Al Meera-Sailiya South",
    "branch": "Sailiya South",
    "address": "Sailiya South, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10301708",
    "account": "Al Meera"
  },
  {
    "id": "mst-1022499979",
    "name": "Ansar — Ansar Gallery Barwa Commercial Complex",
    "rawName": "Ansar Gallery Barwa Commercial Complex",
    "branch": "Ansar",
    "address": "Ansar, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300363",
    "account": "Ansar"
  },
  {
    "id": "mst-5120933844",
    "name": "Baladi Group — BALADI PREMIUM - LUSAIL",
    "rawName": "BALADI PREMIUM - LUSAIL",
    "branch": "LUSAIL",
    "address": "LUSAIL, Baladi Group, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10317606",
    "account": "Baladi Group"
  },
  {
    "id": "mst-1682436711",
    "name": "FFC — Family Food Center-Airport Branch",
    "rawName": "Family Food Center-Airport Branch",
    "branch": "Airport Branch",
    "address": "Airport Branch, FFC, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300289",
    "account": "FFC"
  },
  {
    "id": "mst-1837608803",
    "name": "FFC — Family Food Center-Al Nasr Branch",
    "rawName": "Family Food Center-Al Nasr Branch",
    "branch": "Al Nasr Branch",
    "address": "Al Nasr Branch, FFC, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300290",
    "account": "FFC"
  },
  {
    "id": "mst-113732284",
    "name": "FFC — Family Food Center-Rayyan Branch",
    "rawName": "Family Food Center-Rayyan Branch",
    "branch": "Rayyan Branch",
    "address": "Rayyan Branch, FFC, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300291",
    "account": "FFC"
  },
  {
    "id": "mst-1950575470",
    "name": "Max — G MAX HYPERMARKET - THUMAMA",
    "rawName": "G MAX HYPERMARKET - THUMAMA",
    "branch": "THUMAMA",
    "address": "THUMAMA, Max, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10322517",
    "account": "Max"
  },
  {
    "id": "mst-5139843047",
    "name": "Grand — GRAND EXPRESS - AZIZIA",
    "rawName": "GRAND EXPRESS - AZIZIA",
    "branch": "AZIZIA",
    "address": "AZIZIA, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10313011",
    "account": "Grand"
  },
  {
    "id": "mst-7685401454",
    "name": "Grand — Grand Express- Plaza Mall-2",
    "rawName": "Grand Express- Plaza Mall-2",
    "branch": "Plaza Mall",
    "address": "Plaza Mall, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300389",
    "account": "Grand"
  },
  {
    "id": "mst-7705641971",
    "name": "Grand — GRAND EXPRESS UMM GARN",
    "rawName": "GRAND EXPRESS UMM GARN",
    "branch": "Grand",
    "address": "Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10312679",
    "account": "Grand"
  },
  {
    "id": "mst-13111935884",
    "name": "Lulu — Lulu Hyper Market - Bin Mahmud",
    "rawName": "Lulu Hyper Market - Bin Mahmud",
    "branch": "Bin Mahmud",
    "address": "Bin Mahmud, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10304593",
    "account": "Lulu"
  },
  {
    "id": "mst-5272572465",
    "name": "Lulu — Lulu Hyper Market Ezdan Oasis",
    "rawName": "Lulu Hyper Market Ezdan Oasis",
    "branch": "Lulu",
    "address": "Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10301955",
    "account": "Lulu"
  },
  {
    "id": "mst-10866313348",
    "name": "Lulu — Lulu Hypermarket - Al Meshaf",
    "rawName": "Lulu Hypermarket - Al Meshaf",
    "branch": "Al Meshaf",
    "address": "Al Meshaf, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10303957",
    "account": "Lulu"
  },
  {
    "id": "mst-10007251827",
    "name": "Lulu — Lulu Hypermarket - Hilal",
    "rawName": "Lulu Hypermarket - Hilal",
    "branch": "Hilal",
    "address": "Hilal, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10303917",
    "account": "Lulu"
  },
  {
    "id": "mst-3674823556",
    "name": "Monoprix — Monoprix - Iconic 2022",
    "rawName": "Monoprix - Iconic 2022",
    "branch": "Iconic 2022",
    "address": "Iconic 2022, Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10302401",
    "account": "Monoprix"
  },
  {
    "id": "mst-10356320909",
    "name": "Max — New G Max - Al Ebb",
    "rawName": "New G Max - Al Ebb",
    "branch": "Al Ebb",
    "address": "Al Ebb, Max, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10318041",
    "account": "Max"
  },
  {
    "id": "mst-7410932561",
    "name": "Max — NEW G MAX - SHAMAL",
    "rawName": "NEW G MAX - SHAMAL",
    "branch": "SHAMAL",
    "address": "SHAMAL, Max, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10315835",
    "account": "Max"
  },
  {
    "id": "mst-7750550458",
    "name": "PARIS — PARIS HYPERMARKET - AL KHOR",
    "rawName": "PARIS HYPERMARKET - AL KHOR",
    "branch": "AL KHOR",
    "address": "AL KHOR, PARIS, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10324565",
    "account": "PARIS"
  },
  {
    "id": "mst-10092938738",
    "name": "QCC — Qatar Consumption Complex - Parco Mall",
    "rawName": "Qatar Consumption Complex - Parco Mall",
    "branch": "Parco Mall",
    "address": "Parco Mall, QCC, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10301966",
    "account": "QCC"
  },
  {
    "id": "mst-13765474990",
    "name": "Al Meera — Qmc-Sailiya",
    "rawName": "Qmc-Sailiya",
    "branch": "Sailiya",
    "address": "Sailiya, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300348",
    "account": "Al Meera"
  },
  {
    "id": "mst-11814478912",
    "name": "Rawabi — Rawabi mini Hypermarket - Ummsalal",
    "rawName": "Rawabi mini Hypermarket - Ummsalal",
    "branch": "Ummsalal",
    "address": "Ummsalal, Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "B00011",
    "account": "Rawabi"
  },
  {
    "id": "mst-5953424950",
    "name": "Retail — Retail Mart - Madinath Khalifa",
    "rawName": "Retail Mart - Madinath Khalifa",
    "branch": "Madinath Khalifa",
    "address": "Madinath Khalifa, Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10301583",
    "account": "Retail"
  },
  {
    "id": "mst-12202248356",
    "name": "Safari — SAFARI SHOPPING CENTRE - AL SHAHANIYA",
    "rawName": "SAFARI SHOPPING CENTRE - AL SHAHANIYA",
    "branch": "AL SHAHANIYA",
    "address": "AL SHAHANIYA, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10325413",
    "account": "Safari"
  },
  {
    "id": "mst-6206057580",
    "name": "Spar — Spar Hypermarket - Hilal",
    "rawName": "Spar Hypermarket - Hilal",
    "branch": "Hilal",
    "address": "Hilal, Spar, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301749",
    "account": "Spar"
  },
  {
    "id": "mst-34684897",
    "name": "Monoprix — Aba Monoprix-Aba Monoprix Qatar West Bay",
    "rawName": "Aba Monoprix-Aba Monoprix Qatar West Bay",
    "branch": "Aba Monoprix Qatar West Bay",
    "address": "Aba Monoprix Qatar West Bay, Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300341",
    "account": "Monoprix"
  },
  {
    "id": "mst-2625248997",
    "name": "Al Meera — Al Meera Fox Hill",
    "rawName": "Al Meera Fox Hill",
    "branch": "Al Meera",
    "address": "Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10312855",
    "account": "Al Meera"
  },
  {
    "id": "mst-3394772119",
    "name": "Al Meera — AL MEERA NRV",
    "rawName": "AL MEERA NRV",
    "branch": "Al Meera",
    "address": "Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10313464",
    "account": "Al Meera"
  },
  {
    "id": "mst-2267365375",
    "name": "Al Meera — Al Meera-Dakhira",
    "rawName": "Al Meera-Dakhira",
    "branch": "Dakhira",
    "address": "Dakhira, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300091",
    "account": "Al Meera"
  },
  {
    "id": "mst-7934149488",
    "name": "Al Meera — Al Meera-Muraikha",
    "rawName": "Al Meera-Muraikha",
    "branch": "Muraikha",
    "address": "Muraikha, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300074",
    "account": "Al Meera"
  },
  {
    "id": "mst-5217903386",
    "name": "Al Meera — Al Meera-Residential Complex 1 Branch",
    "rawName": "Al Meera-Residential Complex 1 Branch",
    "branch": "Residential Complex 1 Branch",
    "address": "Residential Complex 1 Branch, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300083",
    "account": "Al Meera"
  },
  {
    "id": "mst-9150665253",
    "name": "Al Meera — AL Meera-Wakra East",
    "rawName": "AL Meera-Wakra East",
    "branch": "Wakra East",
    "address": "Wakra East, Al Meera, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300223",
    "account": "Al Meera"
  },
  {
    "id": "mst-404223328",
    "name": "Ramez — Aswaq Ramez-Barwa Arkan 04",
    "rawName": "Aswaq Ramez-Barwa Arkan 04",
    "branch": "Barwa Arkan 04",
    "address": "Barwa Arkan 04, Ramez, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300355",
    "account": "Ramez"
  },
  {
    "id": "mst-2026576251",
    "name": "BIN DAWOOD — BIN DAWOOD - MADINA KHALIFA NORTH",
    "rawName": "BIN DAWOOD - MADINA KHALIFA NORTH",
    "branch": "MADINA KHALIFA NORTH",
    "address": "MADINA KHALIFA NORTH, BIN DAWOOD, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10324197",
    "account": "BIN DAWOOD"
  },
  {
    "id": "mst-3141437813",
    "name": "QCC — Duhail Complex",
    "rawName": "Duhail Complex",
    "branch": "QCC",
    "address": "QCC, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300372",
    "account": "QCC"
  },
  {
    "id": "mst-4672093690",
    "name": "Grand — GRAND EXPRESS - NAJMA",
    "rawName": "GRAND EXPRESS - NAJMA",
    "branch": "NAJMA",
    "address": "NAJMA, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10324084",
    "account": "Grand"
  },
  {
    "id": "mst-5261342238",
    "name": "Gulf Food — GULF FOOD & FRUITS CENTRE",
    "rawName": "GULF FOOD & FRUITS CENTRE",
    "branch": "Gulf Food",
    "address": "Gulf Food, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10312684",
    "account": "Gulf Food"
  },
  {
    "id": "mst-7537933729",
    "name": "QCC — Kerthiyath Complex",
    "rawName": "Kerthiyath Complex",
    "branch": "QCC",
    "address": "QCC, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300371",
    "account": "QCC"
  },
  {
    "id": "mst-2536533549",
    "name": "Lulu — LULU HYPER MARKET-CENTRAL WAREHOUSE",
    "rawName": "LULU HYPER MARKET-CENTRAL WAREHOUSE",
    "branch": "CENTRAL WAREHOUSE",
    "address": "CENTRAL WAREHOUSE, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300316",
    "account": "Lulu"
  },
  {
    "id": "mst-6738983405",
    "name": "Lulu — LULU HYPERMARKET - DOHA MALL",
    "rawName": "LULU HYPERMARKET - DOHA MALL",
    "branch": "DOHA MALL",
    "address": "DOHA MALL, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10318468",
    "account": "Lulu"
  },
  {
    "id": "mst-3845629317",
    "name": "Lulu — LULU HYPERMARKET - SALWA",
    "rawName": "LULU HYPERMARKET - SALWA",
    "branch": "SALWA",
    "address": "SALWA, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10302583",
    "account": "Lulu"
  },
  {
    "id": "mst-11740890782",
    "name": "QCC — Markhiya Complex",
    "rawName": "Markhiya Complex",
    "branch": "QCC",
    "address": "QCC, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300370",
    "account": "QCC"
  },
  {
    "id": "mst-510934751",
    "name": "NBK — Mega Mart - Gate Mall",
    "rawName": "Mega Mart - Gate Mall",
    "branch": "Gate Mall",
    "address": "Gate Mall, NBK, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301582",
    "account": "NBK"
  },
  {
    "id": "mst-8565479545",
    "name": "Rawabi — RAWABI FOOD CENTRE RAYYAN",
    "rawName": "RAWABI FOOD CENTRE RAYYAN",
    "branch": "Rawabi",
    "address": "Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "10300768",
    "account": "Rawabi"
  },
  {
    "id": "mst-695282023",
    "name": "Rawabi — Rawabi Hypermarket - Shafi street",
    "rawName": "Rawabi Hypermarket - Shafi street",
    "branch": "Shafi street",
    "address": "Shafi street, Rawabi, Qatar",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "code": "B00009",
    "account": "Rawabi"
  },
  {
    "id": "mst-3541078711",
    "name": "Retail — Retail Mart-Mesaieed",
    "rawName": "Retail Mart-Mesaieed",
    "branch": "Mesaieed",
    "address": "Mesaieed, Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300352",
    "account": "Retail"
  },
  {
    "id": "mst-12290898017",
    "name": "Safari — SAFARI HO",
    "rawName": "SAFARI HO",
    "branch": "Safari",
    "address": "Safari, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10321239",
    "account": "Safari"
  },
  {
    "id": "mst-11956633844",
    "name": "Safari — SAFARI HYPERMARKET - EZDAN MALL",
    "rawName": "SAFARI HYPERMARKET - EZDAN MALL",
    "branch": "EZDAN MALL",
    "address": "EZDAN MALL, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10324017",
    "account": "Safari"
  },
  {
    "id": "mst-21114770590",
    "name": "Saudia — Saudia Hypermarket New Murra",
    "rawName": "Saudia Hypermarket New Murra",
    "branch": "Saudia",
    "address": "Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10312851",
    "account": "Saudia"
  },
  {
    "id": "mst-7884731412",
    "name": "NBK — Shoprite Super Market-Messaid",
    "rawName": "Shoprite Super Market-Messaid",
    "branch": "Messaid",
    "address": "Messaid, NBK, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300331",
    "account": "NBK"
  },
  {
    "id": "mst-12125145713",
    "name": "Spar — SPAR RETAIL WLL",
    "rawName": "SPAR RETAIL WLL",
    "branch": "Spar",
    "address": "Spar, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10302557",
    "account": "Spar"
  },
  {
    "id": "mst-22766076245",
    "name": "Al Meera — Al Meera - Central Market Sailiya",
    "rawName": "Al Meera - Central Market Sailiya",
    "branch": "Central Market Sailiya",
    "address": "Central Market Sailiya, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10302380",
    "account": "Al Meera"
  },
  {
    "id": "mst-3894339245",
    "name": "Lulu — Lulu Express-Qatar Foundation",
    "rawName": "Lulu Express-Qatar Foundation",
    "branch": "Qatar Foundation",
    "address": "Qatar Foundation, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10300312",
    "account": "Lulu"
  },
  {
    "id": "mst-9858573024",
    "name": "Lulu — LuLu Hypermarket - Ain Khalid",
    "rawName": "LuLu Hypermarket - Ain Khalid",
    "branch": "Ain Khalid",
    "address": "Ain Khalid, Lulu, Qatar",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "code": "10311553",
    "account": "Lulu"
  },
  {
    "id": "mst-8563068210",
    "name": "C4 — Maf Hyper Market(Carrefour)-Al Mirqab",
    "rawName": "Maf Hyper Market(Carrefour)-Al Mirqab",
    "branch": "Al Mirqab",
    "address": "Al Mirqab, C4, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10300226",
    "account": "C4"
  },
  {
    "id": "mst-2795237727",
    "name": "Monoprix — Monoprix - Musherib Galleria Mall",
    "rawName": "Monoprix - Musherib Galleria Mall",
    "branch": "Musherib Galleria Mall",
    "address": "Musherib Galleria Mall, Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10302381",
    "account": "Monoprix"
  },
  {
    "id": "mst-6979165510",
    "name": "Monoprix — MONOPRIX VENDOME MALL",
    "rawName": "MONOPRIX VENDOME MALL",
    "branch": "Monoprix",
    "address": "Monoprix, Qatar",
    "executive": "SK IMRAN AHMED",
    "code": "10309533",
    "account": "Monoprix"
  },
  {
    "id": "mst-1612247978",
    "name": "Ramez — Ramez Shopping-Al Nasr",
    "rawName": "Ramez Shopping-Al Nasr",
    "branch": "Al Nasr",
    "address": "Al Nasr, Ramez, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300357",
    "account": "Ramez"
  },
  {
    "id": "mst-4498180546",
    "name": "Retail — RETAIL MART HO",
    "rawName": "RETAIL MART HO",
    "branch": "Retail",
    "address": "Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300350",
    "account": "Retail"
  },
  {
    "id": "mst-19958440032",
    "name": "Safari — SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "rawName": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "branch": "INDUSTRIAL AREA",
    "address": "INDUSTRIAL AREA, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10313010",
    "account": "Safari"
  },
  {
    "id": "mst-6149910062",
    "name": "Safari — SAFARI SHOPPING COMPLEX-UMM SALAL",
    "rawName": "SAFARI SHOPPING COMPLEX-UMM SALAL",
    "branch": "UMM SALAL",
    "address": "UMM SALAL, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300328",
    "account": "Safari"
  },
  {
    "id": "mst-5536356237",
    "name": "NBK — Shoprite Super Market-Airport",
    "rawName": "Shoprite Super Market-Airport",
    "branch": "Airport",
    "address": "Airport, NBK, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300330",
    "account": "NBK"
  },
  {
    "id": "mst-3169208916",
    "name": "Ansar — Ansar Gallery Centreal Khor",
    "rawName": "Ansar Gallery Centreal Khor",
    "branch": "Ansar",
    "address": "Ansar, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300361",
    "account": "Ansar"
  },
  {
    "id": "mst-1221530606",
    "name": "FFC — FAMILY FOOD CENTER WAREHOUSE",
    "rawName": "FAMILY FOOD CENTER WAREHOUSE",
    "branch": "FFC",
    "address": "FFC, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300293",
    "account": "FFC"
  },
  {
    "id": "mst-5401746681",
    "name": "FP — FOOD PALACE - OLD AIRPORT",
    "rawName": "FOOD PALACE - OLD AIRPORT",
    "branch": "OLD AIRPORT",
    "address": "OLD AIRPORT, FP, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10302670",
    "account": "FP"
  },
  {
    "id": "mst-3657921446",
    "name": "Grand — GRAND EXPRESS - AL ATTIYAH IND. AREA",
    "rawName": "GRAND EXPRESS - AL ATTIYAH IND. AREA",
    "branch": "AL ATTIYAH IND. AREA",
    "address": "AL ATTIYAH IND. AREA, Grand, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10322422",
    "account": "Grand"
  },
  {
    "id": "mst-4217930800",
    "name": "NBK — Mega Mart Express-Rayyan",
    "rawName": "Mega Mart Express-Rayyan",
    "branch": "Rayyan",
    "address": "Rayyan, NBK, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10300335",
    "account": "NBK"
  },
  {
    "id": "mst-5747892556",
    "name": "Retail — Retail Mart-Industrial Area",
    "rawName": "Retail Mart-Industrial Area",
    "branch": "Industrial Area",
    "address": "Industrial Area, Retail, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300351",
    "account": "Retail"
  },
  {
    "id": "mst-196627841",
    "name": "Safari — Safari Hypermarket - Al Khor",
    "rawName": "Safari Hypermarket - Al Khor",
    "branch": "Al Khor",
    "address": "Al Khor, Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10301980",
    "account": "Safari"
  },
  {
    "id": "mst-6714575137",
    "name": "Al Meera — Al Meera - The Mall",
    "rawName": "Al Meera - The Mall",
    "branch": "The Mall",
    "address": "The Mall, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10302153",
    "account": "Al Meera"
  },
  {
    "id": "mst-2301198735",
    "name": "Al Meera — Qmc-Al Nasr",
    "rawName": "Qmc-Al Nasr",
    "branch": "Al Nasr",
    "address": "Al Nasr, Al Meera, Qatar",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "code": "10300347",
    "account": "Al Meera"
  },
  {
    "id": "mst-14938241230",
    "name": "Baladi Group — SOUQ AL BALADI - DUHAIL",
    "rawName": "SOUQ AL BALADI - DUHAIL",
    "branch": "DUHAIL",
    "address": "DUHAIL, Baladi Group, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10311625",
    "account": "Baladi Group"
  },
  {
    "id": "mst-4528686745",
    "name": "MARZA — MARZA HYPERMARKET - BIN OMRAN",
    "rawName": "MARZA HYPERMARKET - BIN OMRAN",
    "branch": "BIN OMRAN",
    "address": "BIN OMRAN, MARZA, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10323881",
    "account": "MARZA"
  },
  {
    "id": "mst-7432032424",
    "name": "Al Meera — Al Meera-Ghuwairiya Store",
    "rawName": "Al Meera-Ghuwairiya Store",
    "branch": "Ghuwairiya Store",
    "address": "Ghuwairiya Store, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300064",
    "account": "Al Meera"
  },
  {
    "id": "mst-6065321133",
    "name": "Al Meera — Al Meera-Jumailiya Store",
    "rawName": "Al Meera-Jumailiya Store",
    "branch": "Jumailiya Store",
    "address": "Jumailiya Store, Al Meera, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10300067",
    "account": "Al Meera"
  },
  {
    "id": "mst-3603249540",
    "name": "NBK — Mega Mart-Zero 1 Mall",
    "rawName": "Mega Mart-Zero 1 Mall",
    "branch": "Zero 1 Mall",
    "address": "Zero 1 Mall, NBK, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300332",
    "account": "NBK"
  },
  {
    "id": "mst-1832287553",
    "name": "NBK — Megamart (The Centre)",
    "rawName": "Megamart (The Centre)",
    "branch": "NBK",
    "address": "NBK, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300334",
    "account": "NBK"
  },
  {
    "id": "mst-5620475312",
    "name": "Safari — SAFARI HO",
    "rawName": "SAFARI HO",
    "branch": "Safari",
    "address": "Safari, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300325",
    "account": "Safari"
  },
  {
    "id": "mst-5173034691",
    "name": "Al Meera — Al Meera-Sealine Beach Resort",
    "rawName": "Al Meera-Sealine Beach Resort",
    "branch": "Sealine Beach Resort",
    "address": "Sealine Beach Resort, Al Meera, Qatar",
    "executive": "JOSEPH MEHAL VINCILO",
    "code": "10300279",
    "account": "Al Meera"
  },
  {
    "id": "mst-3915249461",
    "name": "Ansar — ANSAR GALLERY HO",
    "rawName": "ANSAR GALLERY HO",
    "branch": "Ansar",
    "address": "Ansar, Qatar",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "code": "10300360",
    "account": "Ansar"
  },
  {
    "id": "mst-9879094183",
    "name": "Max — G-Max Hypermarket - ST 24",
    "rawName": "G-Max Hypermarket - ST 24",
    "branch": "Max Hypermarket",
    "address": "Max Hypermarket, Max, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10301875",
    "account": "Max"
  },
  {
    "id": "mst-16144529417",
    "name": "MARZA — MARZA HYPERMARKET - WHOLESALE STREET AIN KHALID",
    "rawName": "MARZA HYPERMARKET - WHOLESALE STREET AIN KHALID",
    "branch": "WHOLESALE STREET AIN KHALID",
    "address": "WHOLESALE STREET AIN KHALID, MARZA, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10323049",
    "account": "MARZA"
  },
  {
    "id": "mst-4489236497",
    "name": "MEGAMART — Mega Mart - Pearl Qatar",
    "rawName": "Mega Mart - Pearl Qatar",
    "branch": "Pearl Qatar",
    "address": "Pearl Qatar, MEGAMART, Qatar",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "code": "10320481",
    "account": "MEGAMART"
  },
  {
    "id": "mst-5562715636",
    "name": "MARZA — MARZA HYPERMARKET - AIN KHALID",
    "rawName": "MARZA HYPERMARKET - AIN KHALID",
    "branch": "AIN KHALID",
    "address": "AIN KHALID, MARZA, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10305323",
    "account": "MARZA"
  },
  {
    "id": "mst-6285712117",
    "name": "Saudia — SAUDIA DEPARTMENT STORE - SALWA ROAD",
    "rawName": "SAUDIA DEPARTMENT STORE - SALWA ROAD",
    "branch": "SALWA ROAD",
    "address": "SALWA ROAD, Saudia, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10303542",
    "account": "Saudia"
  },
  {
    "id": "mst-12981517626",
    "name": "MARZA — MARZA HYPERMARKET - KHALIFA SOUTH",
    "rawName": "MARZA HYPERMARKET - KHALIFA SOUTH",
    "branch": "KHALIFA SOUTH",
    "address": "KHALIFA SOUTH, MARZA, Qatar",
    "executive": "MOHAMED CASIM NISHAD",
    "code": "10325218",
    "account": "MARZA"
  },
  {
    "id": "mst-17390640003",
    "name": "Regency — REGENCY TRADE CENTRE - GHARAFA",
    "rawName": "REGENCY TRADE CENTRE - GHARAFA",
    "branch": "GHARAFA",
    "address": "GHARAFA, Regency, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10316452",
    "account": "Regency"
  },
  {
    "id": "mst-8413132145",
    "name": "Al Meera — Al Meera-Muaither",
    "rawName": "Al Meera-Muaither",
    "branch": "Muaither",
    "address": "Muaither, Al Meera, Qatar",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "code": "10300077",
    "account": "Al Meera"
  },
  {
    "id": "mst-safwan-1156255599",
    "name": "Al Meera Hypermarket",
    "rawName": "Al Meera Hypermarket",
    "branch": "Hyatt Plaza Mall",
    "address": "Al Waab St, Zone 55, Doha",
    "executive": "Safwan Asif",
    "code": "10300553",
    "account": "Al Meera"
  },
  {
    "id": "mst-safwan-1102809995",
    "name": "Carrefour Hypermarket",
    "rawName": "Carrefour Hypermarket",
    "branch": "City Center Mall",
    "address": "Conference Centre St, West Bay, Doha",
    "executive": "Safwan Asif",
    "code": "10300098",
    "account": "Carrefour"
  },
  {
    "id": "mst-safwan-920642726",
    "name": "Lulu Hypermarket",
    "rawName": "Lulu Hypermarket",
    "branch": "D-Ring Road",
    "address": "D-Ring Road, Nuaija, Doha",
    "executive": "Safwan Asif",
    "code": "10300313",
    "account": "Lulu"
  },
  {
    "id": "mst-safwan-2345104468",
    "name": "Grand Hypermarket",
    "rawName": "Grand Hypermarket",
    "branch": "Ezdan Mall Al Wakra",
    "address": "Al Wukair Main Rd, Al Wakra",
    "executive": "Safwan Asif",
    "code": "10300390",
    "account": "Grand"
  },
  {
    "id": "mst-safwan-4553697228",
    "name": "Monoprix",
    "rawName": "Monoprix",
    "branch": "West Bay Twin Towers",
    "address": "Omar Al Mukhtar St, West Bay",
    "executive": "Safwan Asif",
    "code": "10300341",
    "account": "Monoprix"
  },
  {
    "id": "mst-safwan-957315775",
    "name": "Family Food Centre",
    "rawName": "Family Food Centre",
    "branch": "Old Airport Road",
    "address": "Airport Road, Al Matar Qadeem",
    "executive": "Safwan Asif",
    "code": "10300289",
    "account": "FFC"
  },
  {
    "id": "mst-safwan-2301276852",
    "name": "Safari Mall",
    "rawName": "Safari Mall",
    "branch": "Abu Hamour",
    "address": "Wholesale Market St, Abu Hamour",
    "executive": "Safwan Asif",
    "code": "10300327",
    "account": "Safari"
  },
  {
    "id": "mst-safwan-4160772153",
    "name": "Quality Hypermarket",
    "rawName": "Quality Hypermarket",
    "branch": "Salwa Road",
    "address": "Salwa Road, Ain Khalid, Doha",
    "executive": "Safwan Asif",
    "code": "10300326",
    "account": "Quality"
  },
  {
    "id": "mst-safwan-5590787114",
    "name": "Spar Hypermarket",
    "rawName": "Spar Hypermarket",
    "branch": "03 Mall, New Salata",
    "address": "Ali Bin Abi Talib St, New Salata, Doha",
    "executive": "Safwan Asif",
    "code": "10301460",
    "account": "Spar"
  },
  {
    "id": "mst-safwan-5226191565",
    "name": "Marza Hypermarket",
    "rawName": "Marza Hypermarket",
    "branch": "Al Wakra Main",
    "address": "Al Wakra Main St, Al Wakra",
    "executive": "Safwan Asif",
    "code": "10305323",
    "account": "MARZA"
  }
];

export const PJP_SCHEDULE_VISITS: PjpVisitRow[] = [
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera - Al Karana",
    "code": "10311835",
    "area": "Al Karana"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Kabaan Store",
    "code": "10300068",
    "area": "Kabaan Store"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Onaiza 02",
    "code": "10300078",
    "area": "Onaiza 02"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Eqdeem",
    "code": "10300097",
    "area": "Rawdat Eqdeem"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Shamal Store",
    "code": "10300086",
    "area": "Shamal Store"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Center - Al Rayyan",
    "code": "10300596",
    "area": "Al Rayyan"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - MUAITHER",
    "code": "10325171",
    "area": "MUAITHER"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": "MUAITHER"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Al Sadd",
    "code": "10300298",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "code": "10313012",
    "area": "BARWA BARAHAT AL WAKRA"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "GRAND HYPER MARKET-KHERTHIYATH",
    "code": "10300284",
    "area": "KHERTHIYATH"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Mukaynis - Salwa Road",
    "code": "10311449",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "KENZ MINI MART - OLD AIRPORT",
    "code": "10311846",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU DHAKHIRA",
    "code": "10313477",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express Trading - Marina",
    "code": "10304739",
    "area": "Marina"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Al Khor",
    "code": "10300310",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU PEARL QATAR",
    "code": "10312991",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "Marza Hypermarket - Hazm Al Markhiya",
    "code": "10302453",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "NBK",
    "outlet": "Mega Mart- Q Mall",
    "code": "10301385",
    "area": "Q Mall"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Stop N Shop",
    "outlet": "New Stop & Shop - Street 27",
    "code": "10301965",
    "area": "Street 27"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "New World Centre",
    "code": "10302188",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi hypermarket - Murra",
    "code": "B00008",
    "area": "Murra"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - Wakra",
    "code": "10301891",
    "area": "Wakra"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-1",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "Al Meera - Central Jail",
    "code": "10302231",
    "area": "Central Jail"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA -THUMAMA NEW",
    "code": "10322426",
    "area": "THUMAMA NEW"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Gulf Mall",
    "code": "10300065",
    "area": "Gulf Mall"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Shahaniya",
    "code": "10300085",
    "area": "Shahaniya"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "ASWAQ RAMEZ-MAMOURA",
    "code": "10302773",
    "area": "MAMOURA"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Catering Services",
    "code": "10300292",
    "area": "Catering Services"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Complex (CREDIT) - Murra",
    "code": "10301578",
    "area": "Murra"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Musherib",
    "code": "10300299",
    "area": "Musherib"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS, AL SHAHANIYA",
    "code": "10302457",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU BARWA MADINATNA",
    "code": "10312992",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Abu Sidra Mall",
    "code": "10302543",
    "area": "Abu Sidra Mall"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "MASSKAR HYPERMARKET (NO REBATE)",
    "code": "10317217",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX WEST WALK - SALWA ROAD",
    "code": "10315790",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Qatar Shopping Complex",
    "code": "10301189",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "RAMEZ SHOPPING HO",
    "code": "10300354",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency Hyper Market (QFI-CR)",
    "code": "10302186",
    "area": ""
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - IZGHAWA",
    "code": "10318503",
    "area": "IZGHAWA"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET - UMM SALAL ALI",
    "code": "10324658",
    "area": "UMM SALAL ALI"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET-AL KHOR",
    "code": "10300221",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-3",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "code": "10311799",
    "area": "Bin Mahmoud"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL MEERA - AL ASMAKH MALL",
    "code": "10302360",
    "area": "AL ASMAKH MALL"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Aziziah",
    "code": "10300090",
    "area": "Aziziah"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Mamoura Store",
    "code": "10300072",
    "area": "Mamoura Store"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Day2Day",
    "outlet": "DAY TO DAY CENTER - AIRPORT STREET",
    "code": "10323178",
    "area": "AIRPORT STREET"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G MAX HYPERMARKET- BIRKAT AL AWAMER",
    "code": "10320223",
    "area": "BIRKAT AL AWAMER"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Grand shopping Abu Hamour",
    "code": "B00010",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "City Hyper",
    "outlet": "HYPER CITY TRADING",
    "code": "10316565",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Center-Al Sadd",
    "code": "10300311",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Express - B Ring Road",
    "code": "10301901",
    "area": "B Ring Road"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU EXPRESS TRADING - UM AL AMAD",
    "code": "10321291",
    "area": "UM AL AMAD"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Lagoona",
    "code": "10300318",
    "area": "Lagoona"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET MUSHERIB",
    "code": "10315851",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Mega Mart-Barwa Village Waqra",
    "code": "10300333",
    "area": "Barwa Village Waqra"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX FLORESTA - PEARL QATAR",
    "code": "10316174",
    "area": "PEARL QATAR"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix Medina Central",
    "code": "10301942",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Barwa",
    "code": "10300356",
    "area": "Barwa"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Wakra",
    "code": "B00013",
    "area": "Wakra"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX",
    "code": "10300597",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Wakra",
    "code": "10300353",
    "area": "Wakra"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BIRKAT AL AWAMER",
    "code": "10321502",
    "area": "BIRKAT AL AWAMER"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Snoonu",
    "outlet": "SNOONU TRADING & SERVICES",
    "code": "10302273",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Souq Al Baladi Trading",
    "code": "10301379",
    "area": ""
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-4",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Talabat",
    "outlet": "TALABAT SERVICES COMPANY. W.L.L GHARAFA",
    "code": "10324687",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Al Ad Trading S/m",
    "code": "10302813",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Aba El Heran Branch",
    "code": "10300241",
    "area": "Aba El Heran Branch"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera - Azghawa new",
    "code": "10300242",
    "area": "Azghawa new"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera - Bu Sidra",
    "code": "10300096",
    "area": "Bu Sidra"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Doha Institute",
    "code": "10301373",
    "area": "Doha Institute"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Sailiya",
    "code": "10300220",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Qarn",
    "code": "10300234",
    "area": "Umm Qarn"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Qutaifeya Store",
    "code": "10300071",
    "area": "Al Qutaifeya Store"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Dahal Al Hamam",
    "code": "10300069",
    "area": "Dahal Al Hamam"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Sailiya South",
    "code": "10301708",
    "area": "Sailiya South"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Baladi Group",
    "outlet": "BALADI PREMIUM - LUSAIL",
    "code": "10317606",
    "area": "LUSAIL"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Catering Services",
    "code": "10300292",
    "area": "Catering Services"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Rayyan Branch",
    "code": "10300291",
    "area": "Rayyan Branch"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G MAX HYPERMARKET - THUMAMA",
    "code": "10322517",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - AZIZIA",
    "code": "10313011",
    "area": "AZIZIA"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Plaza Mall-2",
    "code": "10300389",
    "area": "Plaza Mall"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS UMM GARN",
    "code": "10312679",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market - Bin Mahmud",
    "code": "10304593",
    "area": "Bin Mahmud"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market Ezdan Oasis",
    "code": "10301955",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Al Meshaf",
    "code": "10303957",
    "area": "Al Meshaf"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Hilal",
    "code": "10303917",
    "area": "Hilal"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Iconic 2022",
    "code": "10302401",
    "area": "Iconic 2022"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "New G Max - Al Ebb",
    "code": "10318041",
    "area": "Al Ebb"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "NEW G MAX - SHAMAL",
    "code": "10315835",
    "area": "SHAMAL"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - AL KHOR",
    "code": "10324565",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Qatar Consumption Complex - Parco Mall",
    "code": "10301966",
    "area": "Parco Mall"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Qmc-Sailiya",
    "code": "10300348",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi mini Hypermarket - Ummsalal",
    "code": "B00011",
    "area": "Ummsalal"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart - Madinath Khalifa",
    "code": "10301583",
    "area": "Madinath Khalifa"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI SHOPPING CENTRE - AL SHAHANIYA",
    "code": "10325413",
    "area": "AL SHAHANIYA"
  },
  {
    "date": "2026-10-5",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Hypermarket - Hilal",
    "code": "10301749",
    "area": "Hilal"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Aba Monoprix-Aba Monoprix Qatar West Bay",
    "code": "10300341",
    "area": "Aba Monoprix Qatar West Bay"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera - Bu Sidra",
    "code": "10300096",
    "area": "Bu Sidra"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera Fox Hill",
    "code": "10312855",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL MEERA NRV",
    "code": "10313464",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Aziziah",
    "code": "10300090",
    "area": "Aziziah"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Dakhira",
    "code": "10300091",
    "area": "Dakhira"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Muraikha",
    "code": "10300074",
    "area": "Muraikha"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Eqdeem",
    "code": "10300097",
    "area": "Rawdat Eqdeem"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Residential Complex 1 Branch",
    "code": "10300083",
    "area": "Residential Complex 1 Branch"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "AL Meera-Wakra East",
    "code": "10300223",
    "area": "Wakra East"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Aswaq Ramez-Barwa Arkan 04",
    "code": "10300355",
    "area": "Barwa Arkan 04"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "BIN DAWOOD",
    "outlet": "BIN DAWOOD - MADINA KHALIFA NORTH",
    "code": "10324197",
    "area": "MADINA KHALIFA NORTH"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Duhail Complex",
    "code": "10300372",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Catering Services",
    "code": "10300292",
    "area": "Catering Services"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - NAJMA",
    "code": "10324084",
    "area": "NAJMA"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Gulf Food",
    "outlet": "GULF FOOD & FRUITS CENTRE",
    "code": "10312684",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Kerthiyath Complex",
    "code": "10300371",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET-CENTRAL WAREHOUSE",
    "code": "10300316",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - DOHA MALL",
    "code": "10318468",
    "area": "DOHA MALL"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - SALWA",
    "code": "10302583",
    "area": "SALWA"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Markhiya Complex",
    "code": "10300370",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "NBK",
    "outlet": "Mega Mart - Gate Mall",
    "code": "10301582",
    "area": "Gate Mall"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI FOOD CENTRE RAYYAN",
    "code": "10300768",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Shafi street",
    "code": "B00009",
    "area": "Shafi street"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Mesaieed",
    "code": "10300352",
    "area": "Mesaieed"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Safari",
    "outlet": "SAFARI HO",
    "code": "10321239",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - EZDAN MALL",
    "code": "10324017",
    "area": "EZDAN MALL"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "Saudia Hypermarket New Murra",
    "code": "10312851",
    "area": ""
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Messaid",
    "code": "10300331",
    "area": "Messaid"
  },
  {
    "date": "2026-10-6",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR RETAIL WLL",
    "code": "10302557",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Aba El Heran Branch",
    "code": "10300241",
    "area": "Aba El Heran Branch"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Central Market Sailiya",
    "code": "10302380",
    "area": "Central Market Sailiya"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Sailiya",
    "code": "10300220",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Mamoura Store",
    "code": "10300072",
    "area": "Mamoura Store"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Sailiya South",
    "code": "10301708",
    "area": "Sailiya South"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express-Qatar Foundation",
    "code": "10300312",
    "area": "Qatar Foundation"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Ain Khalid",
    "code": "10311553",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Al Mirqab",
    "code": "10300226",
    "area": "Al Mirqab"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Musherib Galleria Mall",
    "code": "10302381",
    "area": "Musherib Galleria Mall"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX VENDOME MALL",
    "code": "10309533",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Qatar Shopping Complex",
    "code": "10301189",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Al Nasr",
    "code": "10300357",
    "area": "Al Nasr"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "RETAIL MART HO",
    "code": "10300350",
    "area": ""
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "code": "10313010",
    "area": "INDUSTRIAL AREA"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI SHOPPING COMPLEX-UMM SALAL",
    "code": "10300328",
    "area": "UMM SALAL"
  },
  {
    "date": "2026-10-7",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Airport",
    "code": "10300330",
    "area": "Airport"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Kabaan Store",
    "code": "10300068",
    "area": "Kabaan Store"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Onaiza 02",
    "code": "10300078",
    "area": "Onaiza 02"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Eqdeem",
    "code": "10300097",
    "area": "Rawdat Eqdeem"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Shamal Store",
    "code": "10300086",
    "area": "Shamal Store"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Centreal Khor",
    "code": "10300361",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - MUAITHER",
    "code": "10325171",
    "area": "MUAITHER"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "FAMILY FOOD CENTER WAREHOUSE",
    "code": "10300293",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "FOOD PALACE - OLD AIRPORT",
    "code": "10302670",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Al Sadd",
    "code": "10300298",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - AL ATTIYAH IND. AREA",
    "code": "10322422",
    "area": "AL ATTIYAH IND. AREA"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "code": "10313012",
    "area": "BARWA BARAHAT AL WAKRA"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "GRAND HYPER MARKET-KHERTHIYATH",
    "code": "10300284",
    "area": "KHERTHIYATH"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Mukaynis - Salwa Road",
    "code": "10311449",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "KENZ MINI MART - OLD AIRPORT",
    "code": "10311846",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU DHAKHIRA",
    "code": "10313477",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express Trading - Marina",
    "code": "10304739",
    "area": "Marina"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Al Khor",
    "code": "10300310",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU PEARL QATAR",
    "code": "10312991",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "NBK",
    "outlet": "Mega Mart Express-Rayyan",
    "code": "10300335",
    "area": "Rayyan"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Stop N Shop",
    "outlet": "New Stop & Shop - Street 27",
    "code": "10301965",
    "area": "Street 27"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "New World Centre",
    "code": "10302188",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi hypermarket - Murra",
    "code": "B00008",
    "area": "Murra"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - Wakra",
    "code": "10301891",
    "area": "Wakra"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Industrial Area",
    "code": "10300351",
    "area": "Industrial Area"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hypermarket - Al Khor",
    "code": "10301980",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-8",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "Al Meera - Central Jail",
    "code": "10302231",
    "area": "Central Jail"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera - The Mall",
    "code": "10302153",
    "area": "The Mall"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA -THUMAMA NEW",
    "code": "10322426",
    "area": "THUMAMA NEW"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Shahaniya",
    "code": "10300085",
    "area": "Shahaniya"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Center - Al Rayyan",
    "code": "10300596",
    "area": "Al Rayyan"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "ASWAQ RAMEZ-MAMOURA",
    "code": "10302773",
    "area": "MAMOURA"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Complex (CREDIT) - Murra",
    "code": "10301578",
    "area": "Murra"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS, AL SHAHANIYA",
    "code": "10302457",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU BARWA MADINATNA",
    "code": "10312992",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Abu Sidra Mall",
    "code": "10302543",
    "area": "Abu Sidra Mall"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "Marza Hypermarket - Hazm Al Markhiya",
    "code": "10302453",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX WEST WALK - SALWA ROAD",
    "code": "10315790",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Al Nasr",
    "code": "10300347",
    "area": "Al Nasr"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "RAMEZ SHOPPING HO",
    "code": "10300354",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency Hyper Market (QFI-CR)",
    "code": "10302186",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX",
    "code": "10300597",
    "area": ""
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET - UMM SALAL ALI",
    "code": "10324658",
    "area": "UMM SALAL ALI"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET-AL KHOR",
    "code": "10300221",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "SOUQ AL BALADI - DUHAIL",
    "code": "10311625",
    "area": "DUHAIL"
  },
  {
    "date": "2026-10-10",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "code": "10311799",
    "area": "Bin Mahmoud"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL MEERA - AL ASMAKH MALL",
    "code": "10302360",
    "area": "AL ASMAKH MALL"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Aziziah",
    "code": "10300090",
    "area": "Aziziah"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Mamoura Store",
    "code": "10300072",
    "area": "Mamoura Store"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Day2Day",
    "outlet": "DAY TO DAY CENTER - AIRPORT STREET",
    "code": "10323178",
    "area": "AIRPORT STREET"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Musherib",
    "code": "10300299",
    "area": "Musherib"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Grand shopping Abu Hamour",
    "code": "B00010",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "City Hyper",
    "outlet": "HYPER CITY TRADING",
    "code": "10316565",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Center-Al Sadd",
    "code": "10300311",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Express - B Ring Road",
    "code": "10301901",
    "area": "B Ring Road"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU EXPRESS TRADING - UM AL AMAD",
    "code": "10321291",
    "area": "UM AL AMAD"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Lagoona",
    "code": "10300318",
    "area": "Lagoona"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET - BIN OMRAN",
    "code": "10323881",
    "area": "BIN OMRAN"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "Marza Hypermarket - Hazm Al Markhiya",
    "code": "10302453",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Mega Mart-Barwa Village Waqra",
    "code": "10300333",
    "area": "Barwa Village Waqra"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX FLORESTA - PEARL QATAR",
    "code": "10316174",
    "area": "PEARL QATAR"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix Medina Central",
    "code": "10301942",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Barwa",
    "code": "10300356",
    "area": "Barwa"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Wakra",
    "code": "B00013",
    "area": "Wakra"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX",
    "code": "10300597",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Wakra",
    "code": "10300353",
    "area": "Wakra"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BIRKAT AL AWAMER",
    "code": "10321502",
    "area": "BIRKAT AL AWAMER"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "code": "10313010",
    "area": "INDUSTRIAL AREA"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Snoonu",
    "outlet": "SNOONU TRADING & SERVICES",
    "code": "10302273",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Souq Al Baladi Trading",
    "code": "10301379",
    "area": ""
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-11",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Talabat",
    "outlet": "TALABAT SERVICES COMPANY. W.L.L GHARAFA",
    "code": "10324687",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Al Ad Trading S/m",
    "code": "10302813",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Aba El Heran Branch",
    "code": "10300241",
    "area": "Aba El Heran Branch"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera - Azghawa new",
    "code": "10300242",
    "area": "Azghawa new"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Sailiya",
    "code": "10300220",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Qarn",
    "code": "10300234",
    "area": "Umm Qarn"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Qutaifeya Store",
    "code": "10300071",
    "area": "Al Qutaifeya Store"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Dahal Al Hamam",
    "code": "10300069",
    "area": "Dahal Al Hamam"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Ghuwairiya Store",
    "code": "10300064",
    "area": "Ghuwairiya Store"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jumailiya Store",
    "code": "10300067",
    "area": "Jumailiya Store"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Sailiya South",
    "code": "10301708",
    "area": "Sailiya South"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Rayyan Branch",
    "code": "10300291",
    "area": "Rayyan Branch"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G MAX HYPERMARKET - THUMAMA",
    "code": "10322517",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - AZIZIA",
    "code": "10313011",
    "area": "AZIZIA"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Plaza Mall-2",
    "code": "10300389",
    "area": "Plaza Mall"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market - Bin Mahmud",
    "code": "10304593",
    "area": "Bin Mahmud"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market Ezdan Oasis",
    "code": "10301955",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Al Meshaf",
    "code": "10303957",
    "area": "Al Meshaf"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Hilal",
    "code": "10303917",
    "area": "Hilal"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Mega Mart-Zero 1 Mall",
    "code": "10300332",
    "area": "Zero 1 Mall"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Megamart (The Centre)",
    "code": "10300334",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Iconic 2022",
    "code": "10302401",
    "area": "Iconic 2022"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "New G Max - Al Ebb",
    "code": "10318041",
    "area": "Al Ebb"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "NEW G MAX - SHAMAL",
    "code": "10315835",
    "area": "SHAMAL"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - AL KHOR",
    "code": "10324565",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Qatar Consumption Complex - Parco Mall",
    "code": "10301966",
    "area": "Parco Mall"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Qmc-Sailiya",
    "code": "10300348",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HO",
    "code": "10300325",
    "area": ""
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Hypermarket - Hilal",
    "code": "10301749",
    "area": "Hilal"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Aba Monoprix-Aba Monoprix Qatar West Bay",
    "code": "10300341",
    "area": "Aba Monoprix Qatar West Bay"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA -THUMAMA NEW",
    "code": "10322426",
    "area": "THUMAMA NEW"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Dakhira",
    "code": "10300091",
    "area": "Dakhira"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Residential Complex 1 Branch",
    "code": "10300083",
    "area": "Residential Complex 1 Branch"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Sealine Beach Resort",
    "code": "10300279",
    "area": "Sealine Beach Resort"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "AL Meera-Wakra East",
    "code": "10300223",
    "area": "Wakra East"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "ANSAR GALLERY HO",
    "code": "10300360",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Aswaq Ramez-Barwa Arkan 04",
    "code": "10300355",
    "area": "Barwa Arkan 04"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "BIN DAWOOD",
    "outlet": "BIN DAWOOD - MADINA KHALIFA NORTH",
    "code": "10324197",
    "area": "MADINA KHALIFA NORTH"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Duhail Complex",
    "code": "10300372",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Catering Services",
    "code": "10300292",
    "area": "Catering Services"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "FOOD PALACE - OLD AIRPORT",
    "code": "10302670",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G-Max Hypermarket - ST 24",
    "code": "10301875",
    "area": "Max Hypermarket"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Gulf Food",
    "outlet": "GULF FOOD & FRUITS CENTRE",
    "code": "10312684",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET-CENTRAL WAREHOUSE",
    "code": "10300316",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - DOHA MALL",
    "code": "10318468",
    "area": "DOHA MALL"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - SALWA",
    "code": "10302583",
    "area": "SALWA"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Markhiya Complex",
    "code": "10300370",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET - WHOLESALE STREET AIN KHALID",
    "code": "10323049",
    "area": "WHOLESALE STREET AIN KHALID"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "MASSKAR HYPERMARKET (NO REBATE)",
    "code": "10317217",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "MEGAMART",
    "outlet": "Mega Mart - Pearl Qatar",
    "code": "10320481",
    "area": "Pearl Qatar"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Qatar Shopping Complex",
    "code": "10301189",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI FOOD CENTRE RAYYAN",
    "code": "10300768",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Shafi street",
    "code": "B00009",
    "area": "Shafi street"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Mesaieed",
    "code": "10300352",
    "area": "Mesaieed"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - EZDAN MALL",
    "code": "10324017",
    "area": "EZDAN MALL"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI SHOPPING CENTRE - AL SHAHANIYA",
    "code": "10325413",
    "area": "AL SHAHANIYA"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "Saudia Hypermarket New Murra",
    "code": "10312851",
    "area": ""
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Messaid",
    "code": "10300331",
    "area": "Messaid"
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR RETAIL WLL",
    "code": "10302557",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Rayyan Branch",
    "code": "10300291",
    "area": "Rayyan Branch"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express-Qatar Foundation",
    "code": "10300312",
    "area": "Qatar Foundation"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Ain Khalid",
    "code": "10311553",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Al Mirqab",
    "code": "10300226",
    "area": "Al Mirqab"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET - AIN KHALID",
    "code": "10305323",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Musherib Galleria Mall",
    "code": "10302381",
    "area": "Musherib Galleria Mall"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX VENDOME MALL",
    "code": "10309533",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Al Nasr",
    "code": "10300357",
    "area": "Al Nasr"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "RETAIL MART HO",
    "code": "10300350",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "code": "10313010",
    "area": "INDUSTRIAL AREA"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI SHOPPING COMPLEX-UMM SALAL",
    "code": "10300328",
    "area": "UMM SALAL"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA DEPARTMENT STORE - SALWA ROAD",
    "code": "10303542",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Airport",
    "code": "10300330",
    "area": "Airport"
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Souq Al Baladi Trading",
    "code": "10301379",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera - Al Karana",
    "code": "10311835",
    "area": "Al Karana"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Gulf Mall",
    "code": "10300065",
    "area": "Gulf Mall"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Kabaan Store",
    "code": "10300068",
    "area": "Kabaan Store"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Onaiza 02",
    "code": "10300078",
    "area": "Onaiza 02"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Eqdeem",
    "code": "10300097",
    "area": "Rawdat Eqdeem"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Shamal Store",
    "code": "10300086",
    "area": "Shamal Store"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Center - Al Rayyan",
    "code": "10300596",
    "area": "Al Rayyan"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - MUAITHER",
    "code": "10325171",
    "area": "MUAITHER"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "FOOD PALACE - OLD AIRPORT",
    "code": "10302670",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "code": "10313012",
    "area": "BARWA BARAHAT AL WAKRA"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Mukaynis - Salwa Road",
    "code": "10311449",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "KENZ MINI MART - OLD AIRPORT",
    "code": "10311846",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU DHAKHIRA",
    "code": "10313477",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express Trading - Marina",
    "code": "10304739",
    "area": "Marina"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Al Khor",
    "code": "10300310",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU PEARL QATAR",
    "code": "10312991",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "NBK",
    "outlet": "Mega Mart- Q Mall",
    "code": "10301385",
    "area": "Q Mall"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Stop N Shop",
    "outlet": "New Stop & Shop - Street 27",
    "code": "10301965",
    "area": "Street 27"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "New World Centre",
    "code": "10302188",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi hypermarket - Murra",
    "code": "B00008",
    "area": "Murra"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - Wakra",
    "code": "10301891",
    "area": "Wakra"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "Al Meera - Central Jail",
    "code": "10302231",
    "area": "Central Jail"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera - The Mall",
    "code": "10302153",
    "area": "The Mall"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Gulf Mall",
    "code": "10300065",
    "area": "Gulf Mall"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Shahaniya",
    "code": "10300085",
    "area": "Shahaniya"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "ASWAQ RAMEZ-MAMOURA",
    "code": "10302773",
    "area": "MAMOURA"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Complex (CREDIT) - Murra",
    "code": "10301578",
    "area": "Murra"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS, AL SHAHANIYA",
    "code": "10302457",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU BARWA MADINATNA",
    "code": "10312992",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Abu Sidra Mall",
    "code": "10302543",
    "area": "Abu Sidra Mall"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "Marza Hypermarket - Hazm Al Markhiya",
    "code": "10302453",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET - KHALIFA SOUTH",
    "code": "10325218",
    "area": "KHALIFA SOUTH"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX WEST WALK - SALWA ROAD",
    "code": "10315790",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Al Nasr",
    "code": "10300347",
    "area": "Al Nasr"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "RAMEZ SHOPPING HO",
    "code": "10300354",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency Hyper Market (QFI-CR)",
    "code": "10302186",
    "area": ""
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - IZGHAWA",
    "code": "10318503",
    "area": "IZGHAWA"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET - UMM SALAL ALI",
    "code": "10324658",
    "area": "UMM SALAL ALI"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET-AL KHOR",
    "code": "10300221",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "SOUQ AL BALADI - DUHAIL",
    "code": "10311625",
    "area": "DUHAIL"
  },
  {
    "date": "2026-10-17",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "code": "10311799",
    "area": "Bin Mahmoud"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL MEERA - AL ASMAKH MALL",
    "code": "10302360",
    "area": "AL ASMAKH MALL"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Aziziah",
    "code": "10300090",
    "area": "Aziziah"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Mamoura Store",
    "code": "10300072",
    "area": "Mamoura Store"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Mamoura Store",
    "code": "10300072",
    "area": "Mamoura Store"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Day2Day",
    "outlet": "DAY TO DAY CENTER - AIRPORT STREET",
    "code": "10323178",
    "area": "AIRPORT STREET"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G MAX HYPERMARKET- BIRKAT AL AWAMER",
    "code": "10320223",
    "area": "BIRKAT AL AWAMER"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Grand shopping Abu Hamour",
    "code": "B00010",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "City Hyper",
    "outlet": "HYPER CITY TRADING",
    "code": "10316565",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Center-Al Sadd",
    "code": "10300311",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Express - B Ring Road",
    "code": "10301901",
    "area": "B Ring Road"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU EXPRESS TRADING - UM AL AMAD",
    "code": "10321291",
    "area": "UM AL AMAD"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Lagoona",
    "code": "10300318",
    "area": "Lagoona"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET - BIN OMRAN",
    "code": "10323881",
    "area": "BIN OMRAN"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET MUSHERIB",
    "code": "10315851",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Mega Mart-Barwa Village Waqra",
    "code": "10300333",
    "area": "Barwa Village Waqra"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX FLORESTA - PEARL QATAR",
    "code": "10316174",
    "area": "PEARL QATAR"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix Medina Central",
    "code": "10301942",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Qatar Shopping Complex",
    "code": "10301189",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Barwa",
    "code": "10300356",
    "area": "Barwa"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Wakra",
    "code": "B00013",
    "area": "Wakra"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY TRADE CENTRE - GHARAFA",
    "code": "10316452",
    "area": "GHARAFA"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Wakra",
    "code": "10300353",
    "area": "Wakra"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BIRKAT AL AWAMER",
    "code": "10321502",
    "area": "BIRKAT AL AWAMER"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "code": "10313010",
    "area": "INDUSTRIAL AREA"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Snoonu",
    "outlet": "SNOONU TRADING & SERVICES",
    "code": "10302273",
    "area": ""
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-18",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Talabat",
    "outlet": "TALABAT SERVICES COMPANY. W.L.L GHARAFA",
    "code": "10324687",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Al Ad Trading S/m",
    "code": "10302813",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Aba El Heran Branch",
    "code": "10300241",
    "area": "Aba El Heran Branch"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera - Azghawa new",
    "code": "10300242",
    "area": "Azghawa new"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera - Bu Sidra",
    "code": "10300096",
    "area": "Bu Sidra"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Sailiya",
    "code": "10300220",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Qarn",
    "code": "10300234",
    "area": "Umm Qarn"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Qutaifeya Store",
    "code": "10300071",
    "area": "Al Qutaifeya Store"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Dahal Al Hamam",
    "code": "10300069",
    "area": "Dahal Al Hamam"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Sailiya South",
    "code": "10301708",
    "area": "Sailiya South"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Catering Services",
    "code": "10300292",
    "area": "Catering Services"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Rayyan Branch",
    "code": "10300291",
    "area": "Rayyan Branch"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G MAX HYPERMARKET - THUMAMA",
    "code": "10322517",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - AZIZIA",
    "code": "10313011",
    "area": "AZIZIA"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Plaza Mall-2",
    "code": "10300389",
    "area": "Plaza Mall"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS UMM GARN",
    "code": "10312679",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market - Bin Mahmud",
    "code": "10304593",
    "area": "Bin Mahmud"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market Ezdan Oasis",
    "code": "10301955",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Al Meshaf",
    "code": "10303957",
    "area": "Al Meshaf"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Hilal",
    "code": "10303917",
    "area": "Hilal"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Iconic 2022",
    "code": "10302401",
    "area": "Iconic 2022"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "New G Max - Al Ebb",
    "code": "10318041",
    "area": "Al Ebb"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "NEW G MAX - SHAMAL",
    "code": "10315835",
    "area": "SHAMAL"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - AL KHOR",
    "code": "10324565",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Qatar Consumption Complex - Parco Mall",
    "code": "10301966",
    "area": "Parco Mall"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Qmc-Sailiya",
    "code": "10300348",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi mini Hypermarket - Ummsalal",
    "code": "B00011",
    "area": "Ummsalal"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart - Madinath Khalifa",
    "code": "10301583",
    "area": "Madinath Khalifa"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Hypermarket - Hilal",
    "code": "10301749",
    "area": "Hilal"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Aba Monoprix-Aba Monoprix Qatar West Bay",
    "code": "10300341",
    "area": "Aba Monoprix Qatar West Bay"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera Fox Hill",
    "code": "10312855",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL MEERA NRV",
    "code": "10313464",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Dakhira",
    "code": "10300091",
    "area": "Dakhira"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Muaither",
    "code": "10300077",
    "area": "Muaither"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Muraikha",
    "code": "10300074",
    "area": "Muraikha"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Residential Complex 1 Branch",
    "code": "10300083",
    "area": "Residential Complex 1 Branch"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "AL Meera-Wakra East",
    "code": "10300223",
    "area": "Wakra East"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Centreal Khor",
    "code": "10300361",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Aswaq Ramez-Barwa Arkan 04",
    "code": "10300355",
    "area": "Barwa Arkan 04"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "BIN DAWOOD",
    "outlet": "BIN DAWOOD - MADINA KHALIFA NORTH",
    "code": "10324197",
    "area": "MADINA KHALIFA NORTH"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Duhail Complex",
    "code": "10300372",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - NAJMA",
    "code": "10324084",
    "area": "NAJMA"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Gulf Food",
    "outlet": "GULF FOOD & FRUITS CENTRE",
    "code": "10312684",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Kerthiyath Complex",
    "code": "10300371",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET-CENTRAL WAREHOUSE",
    "code": "10300316",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - DOHA MALL",
    "code": "10318468",
    "area": "DOHA MALL"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - SALWA",
    "code": "10302583",
    "area": "SALWA"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Markhiya Complex",
    "code": "10300370",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "NBK",
    "outlet": "Mega Mart - Gate Mall",
    "code": "10301582",
    "area": "Gate Mall"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI FOOD CENTRE RAYYAN",
    "code": "10300768",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Shafi street",
    "code": "B00009",
    "area": "Shafi street"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Mesaieed",
    "code": "10300352",
    "area": "Mesaieed"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hypermarket - Al Khor",
    "code": "10301980",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - EZDAN MALL",
    "code": "10324017",
    "area": "EZDAN MALL"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "Saudia Hypermarket New Murra",
    "code": "10312851",
    "area": ""
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Messaid",
    "code": "10300331",
    "area": "Messaid"
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR RETAIL WLL",
    "code": "10302557",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "City Hyper",
    "outlet": "HYPER CITY TRADING",
    "code": "10316565",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express-Qatar Foundation",
    "code": "10300312",
    "area": "Qatar Foundation"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Ain Khalid",
    "code": "10311553",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Al Mirqab",
    "code": "10300226",
    "area": "Al Mirqab"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Musherib Galleria Mall",
    "code": "10302381",
    "area": "Musherib Galleria Mall"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX VENDOME MALL",
    "code": "10309533",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Al Nasr",
    "code": "10300357",
    "area": "Al Nasr"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "RETAIL MART HO",
    "code": "10300350",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI SHOPPING CENTRE - AL SHAHANIYA",
    "code": "10325413",
    "area": "AL SHAHANIYA"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI SHOPPING COMPLEX-UMM SALAL",
    "code": "10300328",
    "area": "UMM SALAL"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA DEPARTMENT STORE - SALWA ROAD",
    "code": "10303542",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Airport",
    "code": "10300330",
    "area": "Airport"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Dahal Al Hamam",
    "code": "10300069",
    "area": "Dahal Al Hamam"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Kabaan Store",
    "code": "10300068",
    "area": "Kabaan Store"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Onaiza 02",
    "code": "10300078",
    "area": "Onaiza 02"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Eqdeem",
    "code": "10300097",
    "area": "Rawdat Eqdeem"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Shamal Store",
    "code": "10300086",
    "area": "Shamal Store"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Center - Al Rayyan",
    "code": "10300596",
    "area": "Al Rayyan"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - MUAITHER",
    "code": "10325171",
    "area": "MUAITHER"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Al Sadd",
    "code": "10300298",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - AL ATTIYAH IND. AREA",
    "code": "10322422",
    "area": "AL ATTIYAH IND. AREA"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "code": "10313012",
    "area": "BARWA BARAHAT AL WAKRA"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "GRAND HYPER MARKET-KHERTHIYATH",
    "code": "10300284",
    "area": "KHERTHIYATH"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Mukaynis - Salwa Road",
    "code": "10311449",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "KENZ MINI MART - OLD AIRPORT",
    "code": "10311846",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU DHAKHIRA",
    "code": "10313477",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express Trading - Marina",
    "code": "10304739",
    "area": "Marina"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Al Khor",
    "code": "10300310",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU PEARL QATAR",
    "code": "10312991",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Stop N Shop",
    "outlet": "New Stop & Shop - Street 27",
    "code": "10301965",
    "area": "Street 27"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi hypermarket - Murra",
    "code": "B00008",
    "area": "Murra"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - Wakra",
    "code": "10301891",
    "area": "Wakra"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Industrial Area",
    "code": "10300351",
    "area": "Industrial Area"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "Al Meera - Central Jail",
    "code": "10302231",
    "area": "Central Jail"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera - The Mall",
    "code": "10302153",
    "area": "The Mall"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA -THUMAMA NEW",
    "code": "10322426",
    "area": "THUMAMA NEW"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Gulf Mall",
    "code": "10300065",
    "area": "Gulf Mall"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Shahaniya",
    "code": "10300085",
    "area": "Shahaniya"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "ASWAQ RAMEZ-MAMOURA",
    "code": "10302773",
    "area": "MAMOURA"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Complex (CREDIT) - Murra",
    "code": "10301578",
    "area": "Murra"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS, AL SHAHANIYA",
    "code": "10302457",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU BARWA MADINATNA",
    "code": "10312992",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Abu Sidra Mall",
    "code": "10302543",
    "area": "Abu Sidra Mall"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "Marza Hypermarket - Hazm Al Markhiya",
    "code": "10302453",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "MARZA HYPERMARKET MUSHERIB",
    "code": "10315851",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX WEST WALK - SALWA ROAD",
    "code": "10315790",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "RAMEZ SHOPPING HO",
    "code": "10300354",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency Hyper Market (QFI-CR)",
    "code": "10302186",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX",
    "code": "10300597",
    "area": ""
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET - UMM SALAL ALI",
    "code": "10324658",
    "area": "UMM SALAL ALI"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET-AL KHOR",
    "code": "10300221",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "SOUQ AL BALADI - DUHAIL",
    "code": "10311625",
    "area": "DUHAIL"
  },
  {
    "date": "2026-10-24",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "code": "10311799",
    "area": "Bin Mahmoud"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL MEERA - AL ASMAKH MALL",
    "code": "10302360",
    "area": "AL ASMAKH MALL"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Doha Institute",
    "code": "10301373",
    "area": "Doha Institute"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Mamoura Store",
    "code": "10300072",
    "area": "Mamoura Store"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Day2Day",
    "outlet": "DAY TO DAY CENTER - AIRPORT STREET",
    "code": "10323178",
    "area": "AIRPORT STREET"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Musherib",
    "code": "10300299",
    "area": "Musherib"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Grand shopping Abu Hamour",
    "code": "B00010",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "City Hyper",
    "outlet": "HYPER CITY TRADING",
    "code": "10316565",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Center-Al Sadd",
    "code": "10300311",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Express - B Ring Road",
    "code": "10301901",
    "area": "B Ring Road"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU EXPRESS TRADING - UM AL AMAD",
    "code": "10321291",
    "area": "UM AL AMAD"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Lagoona",
    "code": "10300318",
    "area": "Lagoona"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Mega Mart-Barwa Village Waqra",
    "code": "10300333",
    "area": "Barwa Village Waqra"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX FLORESTA - PEARL QATAR",
    "code": "10316174",
    "area": "PEARL QATAR"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix Medina Central",
    "code": "10301942",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Barwa",
    "code": "10300356",
    "area": "Barwa"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Wakra",
    "code": "B00013",
    "area": "Wakra"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX",
    "code": "10300597",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Wakra",
    "code": "10300353",
    "area": "Wakra"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BIRKAT AL AWAMER",
    "code": "10321502",
    "area": "BIRKAT AL AWAMER"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "code": "10313010",
    "area": "INDUSTRIAL AREA"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Snoonu",
    "outlet": "SNOONU TRADING & SERVICES",
    "code": "10302273",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Souq Al Baladi Trading",
    "code": "10301379",
    "area": ""
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-25",
    "day": "Sunday",
    "executive": "SK IMRAN AHMED",
    "account": "Talabat",
    "outlet": "TALABAT SERVICES COMPANY. W.L.L GHARAFA",
    "code": "10324687",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Al Ad Trading S/m",
    "code": "10302813",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Aba El Heran Branch",
    "code": "10300241",
    "area": "Aba El Heran Branch"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera - Azghawa new",
    "code": "10300242",
    "area": "Azghawa new"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera - Bu Sidra",
    "code": "10300096",
    "area": "Bu Sidra"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera - Sailiya",
    "code": "10300220",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Qarn",
    "code": "10300234",
    "area": "Umm Qarn"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Qutaifeya Store",
    "code": "10300071",
    "area": "Al Qutaifeya Store"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Dahal Al Hamam",
    "code": "10300069",
    "area": "Dahal Al Hamam"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Ghuwairiya Store",
    "code": "10300064",
    "area": "Ghuwairiya Store"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jumailiya Store",
    "code": "10300067",
    "area": "Jumailiya Store"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Sailiya South",
    "code": "10301708",
    "area": "Sailiya South"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Rayyan Branch",
    "code": "10300291",
    "area": "Rayyan Branch"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G MAX HYPERMARKET - THUMAMA",
    "code": "10322517",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - AZIZIA",
    "code": "10313011",
    "area": "AZIZIA"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Plaza Mall-2",
    "code": "10300389",
    "area": "Plaza Mall"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market - Bin Mahmud",
    "code": "10304593",
    "area": "Bin Mahmud"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market Ezdan Oasis",
    "code": "10301955",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Al Meshaf",
    "code": "10303957",
    "area": "Al Meshaf"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hypermarket - Hilal",
    "code": "10303917",
    "area": "Hilal"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Mega Mart-Zero 1 Mall",
    "code": "10300332",
    "area": "Zero 1 Mall"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Megamart (The Centre)",
    "code": "10300334",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Iconic 2022",
    "code": "10302401",
    "area": "Iconic 2022"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "New G Max - Al Ebb",
    "code": "10318041",
    "area": "Al Ebb"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "NEW G MAX - SHAMAL",
    "code": "10315835",
    "area": "SHAMAL"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - AL KHOR",
    "code": "10324565",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Qatar Consumption Complex - Parco Mall",
    "code": "10301966",
    "area": "Parco Mall"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Qmc-Sailiya",
    "code": "10300348",
    "area": "Sailiya"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HO",
    "code": "10300325",
    "area": ""
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Hypermarket - Hilal",
    "code": "10301749",
    "area": "Hilal"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Aba Monoprix-Aba Monoprix Qatar West Bay",
    "code": "10300341",
    "area": "Aba Monoprix Qatar West Bay"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Khor Branch",
    "code": "10300219",
    "area": "Al Khor Branch"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Dakhira",
    "code": "10300091",
    "area": "Dakhira"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Muaither",
    "code": "10300077",
    "area": "Muaither"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Muraikha",
    "code": "10300074",
    "area": "Muraikha"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Residential Complex 1 Branch",
    "code": "10300083",
    "area": "Residential Complex 1 Branch"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Sealine Beach Resort",
    "code": "10300279",
    "area": "Sealine Beach Resort"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "AL Meera-Wakra East",
    "code": "10300223",
    "area": "Wakra East"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Centreal Khor",
    "code": "10300361",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Aswaq Ramez-Barwa Arkan 04",
    "code": "10300355",
    "area": "Barwa Arkan 04"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "BIN DAWOOD",
    "outlet": "BIN DAWOOD - MADINA KHALIFA NORTH",
    "code": "10324197",
    "area": "MADINA KHALIFA NORTH"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Duhail Complex",
    "code": "10300372",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "FOOD PALACE - OLD AIRPORT",
    "code": "10302670",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "G-Max Hypermarket - ST 24",
    "code": "10301875",
    "area": "Max Hypermarket"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Gulf Food",
    "outlet": "GULF FOOD & FRUITS CENTRE",
    "code": "10312684",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET-CENTRAL WAREHOUSE",
    "code": "10300316",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - DOHA MALL",
    "code": "10318468",
    "area": "DOHA MALL"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPERMARKET - SALWA",
    "code": "10302583",
    "area": "SALWA"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "QCC",
    "outlet": "Markhiya Complex",
    "code": "10300370",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "MEGAMART",
    "outlet": "Mega Mart - Pearl Qatar",
    "code": "10320481",
    "area": "Pearl Qatar"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI FOOD CENTRE RAYYAN",
    "code": "10300768",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi Hypermarket - Shafi street",
    "code": "B00009",
    "area": "Shafi street"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart-Mesaieed",
    "code": "10300352",
    "area": "Mesaieed"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hypermarket - Al Khor",
    "code": "10301980",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - EZDAN MALL",
    "code": "10324017",
    "area": "EZDAN MALL"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "Saudia Hypermarket New Murra",
    "code": "10312851",
    "area": ""
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Messaid",
    "code": "10300331",
    "area": "Messaid"
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR RETAIL WLL",
    "code": "10302557",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "AL MEERA - JERYAN JUNAIHAT",
    "code": "10302361",
    "area": "JERYAN JUNAIHAT"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Umm Salal Ali",
    "code": "10300222",
    "area": "Umm Salal Ali"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Al Meera",
    "outlet": "Al Meera-Al Wajba",
    "code": "10300094",
    "area": "Al Wajba"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Khalifa South Branch",
    "code": "10300070",
    "area": "Khalifa South Branch"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Mansoura",
    "code": "10300073",
    "area": "Mansoura"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra",
    "code": "10300087",
    "area": "Wakra"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Wakra New",
    "code": "10300088",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Barwa Commercial Complex",
    "code": "10300363",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Azizia Family Shopping Complex (CREDIT)",
    "code": "10301963",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - D RING ROAD",
    "code": "10322513",
    "area": "D RING ROAD"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Airport Branch",
    "code": "10300289",
    "area": "Airport Branch"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Nasr Branch",
    "code": "10300290",
    "area": "Al Nasr Branch"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express-Qatar Foundation",
    "code": "10300312",
    "area": "Qatar Foundation"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hyper - Messilla",
    "code": "10300814",
    "area": "Messilla"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Gharaffa",
    "code": "10300315",
    "area": "Gharaffa"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Ain Khalid",
    "code": "10311553",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Al Mirqab",
    "code": "10300226",
    "area": "Al Mirqab"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Musherib Galleria Mall",
    "code": "10302381",
    "area": "Musherib Galleria Mall"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX VENDOME MALL",
    "code": "10309533",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "New Indian Super Market",
    "code": "10300393",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "Paris Hypermarket - Muntaza",
    "code": "10309488",
    "area": "Muntaza"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HYPERMARKET - WAKRA",
    "code": "10320594",
    "area": "WAKRA"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Grand Mart",
    "outlet": "PASSION HYPERMARKET",
    "code": "10315826",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "Ramez Shopping-Al Nasr",
    "code": "10300357",
    "area": "Al Nasr"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "RETAIL MART HO",
    "code": "10300350",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Retail",
    "outlet": "Retail Mart -Wakra New",
    "code": "10302225",
    "area": "Wakra New"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Hyper Market-Salwa Road",
    "code": "10300326",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - INDUSTRIAL AREA",
    "code": "10313010",
    "area": "INDUSTRIAL AREA"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA DEPARTMENT STORE - SALWA ROAD",
    "code": "10303542",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET (CR-QFI)",
    "code": "10302194",
    "area": "QFI)"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET 500",
    "code": "10300958",
    "area": ""
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "NBK",
    "outlet": "Shoprite Super Market-Airport",
    "code": "10300330",
    "area": "Airport"
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Souq Al Baladi Trading",
    "code": "10301379",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA - AIN KHALID",
    "code": "10320476",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera - Al Karana",
    "code": "10311835",
    "area": "Al Karana"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "AL Meera - Bin Omran",
    "code": "10300062",
    "area": "Bin Omran"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Al Meera-Hazm Al Markhiya",
    "code": "10300066",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Kabaan Store",
    "code": "10300068",
    "area": "Kabaan Store"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Leabeeb 2",
    "code": "10300227",
    "area": "Leabeeb 2"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Onaiza 02",
    "code": "10300078",
    "area": "Onaiza 02"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Eqdeem",
    "code": "10300097",
    "area": "Rawdat Eqdeem"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Shamal Store",
    "code": "10300086",
    "area": "Shamal Store"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Center - Al Rayyan",
    "code": "10300596",
    "area": "Al Rayyan"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - AIN KHALID",
    "code": "10324194",
    "area": "AIN KHALID"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "MARK & SAVE",
    "outlet": "BUDGET HYPERMARKET - MUAITHER",
    "code": "10325171",
    "area": "MUAITHER"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FFC",
    "outlet": "Family Food Center-Al Kheesha",
    "code": "10301366",
    "area": "Al Kheesha"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Al Sadd",
    "code": "10300298",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS - BARWA BARAHAT AL WAKRA",
    "code": "10313012",
    "area": "BARWA BARAHAT AL WAKRA"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Mukaynis - Salwa Road",
    "code": "10311449",
    "area": "Salwa Road"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "KENZ MINI MART - OLD AIRPORT",
    "code": "10311846",
    "area": "OLD AIRPORT"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU DHAKHIRA",
    "code": "10313477",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Express Trading - Marina",
    "code": "10304739",
    "area": "Marina"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Al Khor",
    "code": "10300310",
    "area": "Al Khor"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU PEARL QATAR",
    "code": "10312991",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Wakra",
    "code": "10300104",
    "area": "Wakra"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-City Center",
    "code": "10300098",
    "area": "City Center"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Dar Al Salam",
    "code": "10300099",
    "area": "Dar Al Salam"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "MARZA",
    "outlet": "Marza Hypermarket - Hazm Al Markhiya",
    "code": "10302453",
    "area": "Hazm Al Markhiya"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Stop N Shop",
    "outlet": "New Stop & Shop - Street 27",
    "code": "10301965",
    "area": "Street 27"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "New World Centre",
    "code": "10302188",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Qmc-Sana",
    "code": "10300349",
    "area": "Sana"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET - CENTRAL WAREHOUSE",
    "code": "10323537",
    "area": "CENTRAL WAREHOUSE"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "Rawabi hypermarket - Murra",
    "code": "B00008",
    "area": "Murra"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Rawabi",
    "outlet": "RAWABI HYPERMARKET IZGHAWA",
    "code": "B00012",
    "area": ""
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency shopping center - Ain Khalid",
    "code": "10300936",
    "area": "Ain Khalid"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - Wakra",
    "code": "10301891",
    "area": "Wakra"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "SAFARI HYPERMARKET - BARWA VILLAGE",
    "code": "10313001",
    "area": "BARWA VILLAGE"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Max",
    "outlet": "Sanaya Hypermarket - Street 52",
    "code": "10301811",
    "area": "Street 52"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA - THUMAMA",
    "code": "10320362",
    "area": "THUMAMA"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HPMKT-QBM (UMM AL DHOOM ST)",
    "code": "10300959",
    "area": "QBM (UMM AL DHOOM ST)"
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "Spar Qatar - Tawar Mall",
    "code": "10301460",
    "area": "Tawar Mall"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "AL Meera - Abu Nakhla",
    "code": "10300060",
    "area": "Abu Nakhla"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "AL Meera - Airport Hyper Market",
    "code": "10300061",
    "area": "Airport Hyper Market"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Al Meera",
    "outlet": "Al Meera - Central Jail",
    "code": "10302231",
    "area": "Central Jail"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Leabeeb 1",
    "code": "10300243",
    "area": "Leabeeb 1"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera - Rawdat Al Hamama",
    "code": "10302081",
    "area": "Rawdat Al Hamama"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "AL MEERA -THUMAMA NEW",
    "code": "10322426",
    "area": "THUMAMA NEW"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Gharafat Al Rayyan Store",
    "code": "10300063",
    "area": "Gharafat Al Rayyan Store"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Gulf Mall",
    "code": "10300065",
    "area": "Gulf Mall"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Al Meera",
    "outlet": "Al Meera-Jeryan",
    "code": "10300093",
    "area": "Jeryan"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Nuaija Store",
    "code": "10300076",
    "area": "Nuaija Store"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "Al Meera",
    "outlet": "Al Meera-Rawdat Al Khail Store",
    "code": "10300082",
    "area": "Rawdat Al Khail Store"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Al Meera",
    "outlet": "Al Meera-Rt Al Thumama",
    "code": "10300092",
    "area": "Rt Al Thumama"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Al Meera",
    "outlet": "Al Meera-Shahaniya",
    "code": "10300085",
    "area": "Shahaniya"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Al Meera",
    "outlet": "Al Meera-Zghawa",
    "code": "10300095",
    "area": "Zghawa"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Ansar",
    "outlet": "Ansar Gallery Thumama",
    "code": "10300362",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "ASWAQ RAMEZ-MAMOURA",
    "code": "10302773",
    "area": "MAMOURA"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Complex (CREDIT) - Murra",
    "code": "10301578",
    "area": "Murra"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Family",
    "outlet": "Family Shopping Maither",
    "code": "10301140",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "NIZAMUDEEN ABDUL MAJEED ABDUL MAJEE",
    "account": "FP",
    "outlet": "Food Palace-Al Sadd",
    "code": "10300298",
    "area": "Al Sadd"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Al Meera",
    "outlet": "Geant Hyatt Plaza - Villaggio",
    "code": "10300553",
    "area": "Villaggio"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Express- Ezdan Mall-Wukair",
    "code": "10300390",
    "area": "Ezdan Mall"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "GRAND EXPRESS, AL SHAHANIYA",
    "code": "10302457",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JOSEPH MEHAL VINCILO",
    "account": "Grand",
    "outlet": "Grand Mall Wll",
    "code": "10300388",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU BARWA MADINATNA",
    "code": "10312992",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LULU HYPER MARKET - HO",
    "code": "10300309",
    "area": "HO"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-Barwa City",
    "code": "10300314",
    "area": "Barwa City"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "Lulu Hyper Market-D Ring Road",
    "code": "10300313",
    "area": "D Ring Road"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "THAJUDEEN ABDUL MAJEED ALI AHMMED",
    "account": "Lulu",
    "outlet": "LuLu Hypermarket - Abu Sidra Mall",
    "code": "10302543",
    "area": "Abu Sidra Mall"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market(Carrefour)-Mall Of Qata",
    "code": "10300103",
    "area": "Mall Of Qata"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Land Mark",
    "code": "10300101",
    "area": "Land Mark"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "C4",
    "outlet": "Maf Hyper Market-Villageo",
    "code": "10300102",
    "area": "Villageo"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "Maskar Hyper Market",
    "code": "10300105",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "MOHAMED CASIM NISHAD",
    "account": "Maskar",
    "outlet": "MASSKAR HYPERMARKET (NO REBATE)",
    "code": "10317217",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "Monoprix - Festival City",
    "code": "10301279",
    "area": "Festival City"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SK IMRAN AHMED",
    "account": "Monoprix",
    "outlet": "MONOPRIX WEST WALK - SALWA ROAD",
    "code": "10315790",
    "area": "SALWA ROAD"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "NESTO",
    "outlet": "NESTO HYPERMARKET",
    "code": "10325018",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "JUNAID ABDUL KAREEM VADAKKAY AZHIKK",
    "account": "Panda",
    "outlet": "Panda Hypermarket WLL",
    "code": "10301938",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "PARIS",
    "outlet": "PARIS HPMKT (STREET-37)",
    "code": "10300939",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Baladi Group",
    "outlet": "Qatar Shopping Complex",
    "code": "10301189",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Ramez",
    "outlet": "RAMEZ SHOPPING HO",
    "code": "10300354",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "Regency Hyper Market (QFI-CR)",
    "code": "10302186",
    "area": ""
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Regency",
    "outlet": "REGENCY SHOPPING COMPLEX - IZGHAWA",
    "code": "10318503",
    "area": "IZGHAWA"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHYJU PUTHALATH KUNIYIL",
    "account": "Safari",
    "outlet": "Safari Mall-Abuhamour",
    "code": "10300327",
    "area": "Abuhamour"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET - UMM SALAL ALI",
    "code": "10324658",
    "area": "UMM SALAL ALI"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SHAFEEQ PUNNILATH ABDUL RAHIMAN",
    "account": "Saudia",
    "outlet": "SAUDIA HYPERMARKET-AL KHOR",
    "code": "10300221",
    "area": "AL KHOR"
  },
  {
    "date": "2026-10-31",
    "day": "Saturday",
    "executive": "SIRAJ MOHAMMED ABDUL AZIZ",
    "account": "Spar",
    "outlet": "SPAR AL MANA TWIN TOWER-Bin Mahmoud",
    "code": "10311799",
    "area": "Bin Mahmoud"
  }
];

/**
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

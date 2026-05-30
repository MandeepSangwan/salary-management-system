import { Icons } from './icons';

// ── Date / Month Helpers ─────────────────────────────────────────────────────

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function storageKey(year, month) {
  return `salary_${year}_${String(month + 1).padStart(2, '0')}`;
}

export function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function generateMonthOptions(count = 24) {
  const options = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return options;
}

// ── Salary Category Config ────────────────────────────────────────────────────

export const SALARY_CATEGORIES = [
  {
    key: 'cash',
    label: 'Cash',
    icon: <Icons.Cash />,
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#86efac',
    headerBg: '#14532d',
  },
  {
    key: 'cheque',
    label: 'Cheque',
    icon: <Icons.Cheque />,
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
    headerBg: '#1e3a8a',
  },
  {
    key: 'esi',
    label: 'ESI',
    icon: <Icons.ESI />,
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fcd34d',
    headerBg: '#78350f',
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  SALARY_CATEGORIES.map(c => [c.key, c])
);

// ── LocalStorage Helpers ──────────────────────────────────────────────────────

export function loadMonthData(year, month) {
  try {
    const raw = localStorage.getItem(storageKey(year, month));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate old flat format (single rows array) → new format
    if (parsed && Array.isArray(parsed.rows)) {
      return { cash: parsed.rows, cheque: [], esi: [], savedAt: parsed.savedAt };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveMonthData(year, month, data) {
  localStorage.setItem(storageKey(year, month), JSON.stringify(data));
}

export function clearMonthData(year, month) {
  localStorage.removeItem(storageKey(year, month));
}

export function getAllSavedMonths() {
  const prefix = 'salary_';
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const parts = key.replace(prefix, '').split('_');
        const year  = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const data  = JSON.parse(localStorage.getItem(key));
        if (!isNaN(year) && !isNaN(month)) {
          results.push({ year, month, data });
        }
      } catch { /* skip */ }
    }
  }
  results.sort((a, b) => b.year - a.year || b.month - a.month);
  return results;
}

// ── Row Helpers ───────────────────────────────────────────────────────────────

let _rowIdCounter = Date.now();

export function newRow(overrides = {}) {
  return {
    id: `row_${_rowIdCounter++}`,
    name: '',
    designation: '',
    baseSalary: '',
    bonus: '',
    deductions: '',
    remarks: '',
    ...overrides,
  };
}

export function computeNetSalary(row) {
  const base  = parseFloat(row.baseSalary) || 0;
  const bonus = parseFloat(row.bonus)      || 0;
  const ded   = parseFloat(row.deductions) || 0;
  return Math.max(0, base + bonus - ded);
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatINR(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '₹0';
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export function toFloat(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ── Summary Computation ───────────────────────────────────────────────────────

/** Compute summary for a single rows array */
export function computeRowsSummary(rows) {
  let totalBase = 0, totalBonus = 0, totalDeductions = 0, totalNet = 0;
  for (const row of rows) {
    totalBase       += toFloat(row.baseSalary);
    totalBonus      += toFloat(row.bonus);
    totalDeductions += toFloat(row.deductions);
    totalNet        += computeNetSalary(row);
  }
  return { employees: rows.length, totalBase, totalBonus, totalDeductions, totalNet };
}

/** Compute combined summary across all three categories */
export function computeSummary(allRows) {
  const cashS   = computeRowsSummary(allRows.cash   || []);
  const chequeS = computeRowsSummary(allRows.cheque || []);
  const esiS    = computeRowsSummary(allRows.esi    || []);

  return {
    employees:       cashS.employees + chequeS.employees + esiS.employees,
    totalBase:       cashS.totalBase + chequeS.totalBase + esiS.totalBase,
    totalBonus:      cashS.totalBonus + chequeS.totalBonus + esiS.totalBonus,
    totalDeductions: cashS.totalDeductions + chequeS.totalDeductions + esiS.totalDeductions,
    totalNet:        cashS.totalNet + chequeS.totalNet + esiS.totalNet,
    cash:            cashS,
    cheque:          chequeS,
    esi:             esiS,
  };
}

// ── Amount In Words (Indian System) ──────────────────────────────────────────

const _ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const _tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function _toHundreds(n) {
  if (n === 0) return '';
  if (n < 20)  return _ones[n];
  if (n < 100) return _tens[Math.floor(n / 10)] + (n % 10 ? ' ' + _ones[n % 10] : '');
  return _ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' And ' + _toHundreds(n % 100) : '');
}

/**
 * Convert a rupee amount to Indian words.
 * e.g. 120000 → "Rupees One Lakh Twenty Thousand Only"
 */
export function amountInWords(amount) {
  const num = Math.round(Math.abs(amount));
  if (num === 0) return 'Zero Only';

  const crore   = Math.floor(num / 10_000_000);
  const lakh    = Math.floor((num % 10_000_000) / 100_000);
  const thousand = Math.floor((num % 100_000) / 1_000);
  const rest     = num % 1_000;

  const parts = [];
  if (crore)    parts.push(_toHundreds(crore)    + ' Crore');
  if (lakh)     parts.push(_toHundreds(lakh)     + ' Lakh');
  if (thousand) parts.push(_toHundreds(thousand) + ' Thousand');
  if (rest)     parts.push(_toHundreds(rest));

  return parts.join(' ') + ' Only';
}


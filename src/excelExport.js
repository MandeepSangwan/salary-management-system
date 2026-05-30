import { computeNetSalary, toFloat, computeRowsSummary, computeSummary, monthLabel, SALARY_CATEGORIES, amountInWords } from './utils';

/**
 * Exports salary data as a .xlsx file with 4 sheets:
 * Cash, Cheque, ESI, Summary
 */
export function exportToExcel(allRows, year, month) {
  const XLSX = window.XLSX;
  if (!XLSX) {
    alert('SheetJS library not loaded. Please check your internet connection.');
    return;
  }

  const label   = monthLabel(year, month);
  const summary = computeSummary(allRows);
  const wb      = XLSX.utils.book_new();

  // ── Helper: build a category sheet ───────────────────────────────────────────
  function buildCategorySheet(rows, catLabel, catKey) {
    const catSummary = computeRowsSummary(rows);
    const data = [];
    const isBank = catKey === 'cheque' || catKey === 'esi';
    const totalCols = isBank ? 10 : 8;

    // Title
    const titleRow = [`${label} — ${catLabel} Salary`];
    for (let i = 1; i < totalCols; i++) titleRow.push('');
    data.push(titleRow);
    data.push(['']);

    // Header
    const headerRow = ['#', 'Employee Name', 'Designation', 'Base Salary (₹)'];
    if (isBank) {
      headerRow.push('Bank A/C No', 'Phone No');
    }
    headerRow.push('Bonus / Allowance (₹)', 'Deductions (₹)', 'Net Salary (₹)', 'Remarks');
    data.push(headerRow);

    // Data rows
    rows.forEach((row, idx) => {
      const rowData = [
        idx + 1,
        row.name || '',
        row.designation || '',
        toFloat(row.baseSalary),
      ];
      if (isBank) {
        rowData.push(row.bankAccount || '', row.phoneNumber || '');
      }
      rowData.push(
        toFloat(row.bonus),
        toFloat(row.deductions),
        computeNetSalary(row),
        row.remarks || ''
      );
      data.push(rowData);
    });

    data.push(['']);

    // Totals
    const totalsRow = ['', 'TOTAL', `${catSummary.employees} Employees`, catSummary.totalBase];
    if (isBank) {
      totalsRow.push('', '');
    }
    totalsRow.push(catSummary.totalBonus, catSummary.totalDeductions, catSummary.totalNet, '');
    data.push(totalsRow);

    // Amount in words
    const wordsRow = ['', `Net Salary in Words: ${amountInWords(catSummary.totalNet)}`];
    for (let i = 2; i < totalCols; i++) wordsRow.push('');
    data.push(wordsRow);

    const ws = XLSX.utils.aoa_to_sheet(data);

    const cols = [
      { wch: 4 }, { wch: 26 }, { wch: 22 }, { wch: 18 }
    ];
    if (isBank) {
      cols.push({ wch: 20 }, { wch: 18 });
    }
    cols.push({ wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 24 });
    ws['!cols'] = cols;

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },                        // Title merge
      { s: { r: rows.length + 5, c: 1 }, e: { r: rows.length + 5, c: totalCols - 1 } }, // Words merge
    ];

    // Identify which columns have numbers that need alignment
    const numericCi = new Set(isBank ? [3, 6, 7, 8] : [3, 4, 5, 6]);
    // Array of column letters for A to J
    const headerCols = isBank 
      ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] 
      : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const netIndex = isBank ? 8 : 6;

    // Title cell
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 15, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F2D55' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }

    // Header row (row index 2 = row 3 in 1-based)
    headerCols.forEach((col, ci) => {
      const ref = `${col}3`;
      if (ws[ref]) {
        ws[ref].s = {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0D8C8C' } },
          alignment: {
            horizontal: ci === 0 ? 'center' : numericCi.has(ci) ? 'right' : 'left',
            vertical: 'center',
          },
          border: { bottom: { style: 'thin', color: { rgb: 'FFFFFF' } } },
        };
      }
    });

    // Data rows
    for (let i = 0; i < rows.length; i++) {
      const excelRow = i + 4;
      headerCols.forEach((col, ci) => {
        const ref = `${col}${excelRow}`;
        if (ws[ref]) {
          const isNum = numericCi.has(ci);
          const isNet = ci === netIndex;
          ws[ref].s = {
            font: { sz: 10, color: { rgb: isNet ? '0D6E6E' : '1E293B' }, bold: isNet },
            fill: { fgColor: { rgb: i % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } },
            alignment: { horizontal: isNum ? 'right' : ci === 0 ? 'center' : 'left', vertical: 'center' },
          };
          if (isNum) ws[ref].z = '#,##0.00';
        }
      });
    }

    // Totals row style
    const totRow = rows.length + 5;
    headerCols.forEach((col, ci) => {
      const ref = `${col}${totRow}`;
      if (ws[ref]) {
        const isNum = numericCi.has(ci);
        ws[ref].s = {
          font: { bold: true, sz: 11, color: { rgb: ci === netIndex ? '0D6E6E' : '0F2D55' } },
          fill: { fgColor: { rgb: 'E0F5F5' } },
          alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'center' },
        };
        if (isNum) ws[ref].z = '#,##0.00';
      }
    });

    // Words row style
    const wordsRow = rows.length + 6;
    const wordsRef = `B${wordsRow}`;
    if (ws[wordsRef]) {
      ws[wordsRef].s = {
        font: { italic: true, bold: true, sz: 10, color: { rgb: '78350F' } },
        fill: { fgColor: { rgb: 'FFFBEB' } },
        alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      };
    }
    // Style the merged empty cells in words row too
    headerCols.slice(2).forEach(col => {
      const ref = `${col}${wordsRow}`;
      if (ws[ref]) {
        ws[ref].s = { fill: { fgColor: { rgb: 'FFFBEB' } } };
      }
    });

    return ws;
  }

  // ── Build category sheets ─────────────────────────────────────────────────────
  SALARY_CATEGORIES.forEach(cat => {
    const rows = allRows[cat.key] || [];
    const ws   = buildCategorySheet(rows, cat.label, cat.key);
    XLSX.utils.book_append_sheet(wb, ws, cat.label);
  });

  // ── Summary sheet ─────────────────────────────────────────────────────────────
  const summaryData = [
    [`Salary Summary — ${label}`, '', '', '', '', ''],
    [''],
    ['Category', 'Employees', 'Total Base (₹)', 'Total Bonus (₹)', 'Total Deductions (₹)', 'Net Payout (₹)'],
  ];

  SALARY_CATEGORIES.forEach(cat => {
    const s = summary[cat.key] || {};
    summaryData.push([
      cat.label,
      s.employees      || 0,
      s.totalBase      || 0,
      s.totalBonus     || 0,
      s.totalDeductions|| 0,
      s.totalNet       || 0,
    ]);
  });

  summaryData.push(['']);
  summaryData.push([
    'GRAND TOTAL',
    summary.employees,
    summary.totalBase,
    summary.totalBonus,
    summary.totalDeductions,
    summary.totalNet,
  ]);

  // Grand total in words
  summaryData.push(['', `Grand Total in Words: ${amountInWords(summary.totalNet)}`, '', '', '', '']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 16 }, { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 18 },
  ];

  // grandRow = 3 (header) + categories + 1 (blank) + 1 (grand total) = row index in 0-based
  const summaryGrandWordsRow = 3 + SALARY_CATEGORIES.length + 2; // 0-based row index
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },                                    // Title
    { s: { r: summaryGrandWordsRow, c: 1 }, e: { r: summaryGrandWordsRow, c: 5 } }, // Words
  ];

  if (wsSummary['A1']) {
    wsSummary['A1'].s = {
      font: { bold: true, sz: 15, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0F2D55' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  const sumHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const sumNumericCi  = new Set([1, 2, 3, 4, 5]);
  sumHeaderCols.forEach((col, ci) => {
    const ref = `${col}3`;
    if (wsSummary[ref]) {
      wsSummary[ref].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0D8C8C' } },
        alignment: { horizontal: sumNumericCi.has(ci) ? 'right' : 'left', vertical: 'center' },
      };
    }
  });

  // Category rows (rows 4-6 in 1-based)
  SALARY_CATEGORIES.forEach((cat, i) => {
    const excelRow = i + 4;
    const catColors = { cash: 'F0FDF4', cheque: 'EFF6FF', esi: 'FFFBEB' };
    sumHeaderCols.forEach((col, ci) => {
      const ref = `${col}${excelRow}`;
      if (wsSummary[ref]) {
        const isNum = sumNumericCi.has(ci);
        wsSummary[ref].s = {
          font: { sz: 10, color: { rgb: ci === 5 ? '0D6E6E' : '1E293B' }, bold: ci === 5 },
          fill: { fgColor: { rgb: catColors[cat.key] || 'FFFFFF' } },
          alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'center' },
        };
        if (isNum) wsSummary[ref].z = '#,##0.00';
      }
    });
  });

  // Grand total row
  const grandRow = SALARY_CATEGORIES.length + 5;
  sumHeaderCols.forEach((col, ci) => {
    const ref = `${col}${grandRow}`;
    if (wsSummary[ref]) {
      const isNum = sumNumericCi.has(ci);
      wsSummary[ref].s = {
        font: { bold: true, sz: 12, color: { rgb: ci === 5 ? '0D6E6E' : '0F2D55' } },
        fill: { fgColor: { rgb: 'E0F5F5' } },
        alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'center' },
      };
      if (isNum) wsSummary[ref].z = '#,##0.00';
    }
  });

  // Grand total in-words row styling (1-based = summaryGrandWordsRow + 1)
  const wordsRowRef1 = `B${summaryGrandWordsRow + 1}`;
  if (wsSummary[wordsRowRef1]) {
    wsSummary[wordsRowRef1].s = {
      font: { italic: true, bold: true, sz: 10, color: { rgb: '78350F' } },
      fill: { fgColor: { rgb: 'FFFBEB' } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    };
  }
  ['C', 'D', 'E', 'F'].forEach(col => {
    const ref = `${col}${summaryGrandWordsRow + 1}`;
    if (wsSummary[ref]) wsSummary[ref].s = { fill: { fgColor: { rgb: 'FFFBEB' } } };
  });

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // ── Write file ────────────────────────────────────────────────────────────────
  const monthName = monthLabel(year, month).replace(' ', '_');
  const fileName  = `Salary_${monthName}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

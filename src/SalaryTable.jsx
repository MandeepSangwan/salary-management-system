import { computeNetSalary, formatINR, computeRowsSummary, amountInWords, SALARY_CATEGORIES } from './utils';
import { Icons } from './icons';

const DEFAULT_CAT = SALARY_CATEGORIES[0]; // Cash — safe fallback

export function SalaryTable({ rows, onChange, onAddRow, onRemoveRow, readOnly, category }) {
  const summary = computeRowsSummary(rows);
  const cat = category || DEFAULT_CAT; // guard against undefined during HMR

  function updateCell(id, field, value) {
    onChange(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  return (
    <div className="table-wrapper">
      <table className="salary-table" aria-label={`${cat.label} Salary Table`}>
        <colgroup>
          <col style={{ width: 44 }} />
          <col style={{ width: 170 }} />
          <col style={{ width: 145 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 125 }} />
          <col style={{ width: 125 }} />
          <col style={{ width: 135 }} />
          <col style={{ width: 155 }} />
          {!readOnly && <col style={{ width: 52 }} />}
        </colgroup>

        <thead>
          <tr style={{ '--cat-header': cat.headerBg }}>
            <th scope="col" className="th-serial">#</th>
            <th scope="col">Employee Name</th>
            <th scope="col">Designation</th>
            <th scope="col" className="th-number">Base Salary</th>
            <th scope="col" className="th-number">Bonus / Allowance</th>
            <th scope="col" className="th-number">Deductions</th>
            <th scope="col" className="th-number">Net Salary</th>
            <th scope="col">Remarks</th>
            {!readOnly && <th scope="col"></th>}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 8 : 9}>
                <div className="table-empty">
                  <div className="table-empty-icon">{cat.icon}</div>
                  <div className="table-empty-title">No {cat.label} employees added</div>
                  <div className="table-empty-desc">
                    Click <strong>"＋ Add Employee"</strong> to add a {cat.label.toLowerCase()} salary entry.
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const net = computeNetSalary(row);
              return (
                <tr key={row.id}>
                  <td className="td-serial">{idx + 1}</td>

                  <td>
                    {readOnly ? <span>{row.name || '—'}</span> : (
                      <input
                        className="table-input input-wide"
                        value={row.name}
                        onChange={e => updateCell(row.id, 'name', e.target.value)}
                        placeholder="Employee name"
                        aria-label={`Name row ${idx + 1}`}
                      />
                    )}
                  </td>

                  <td>
                    {readOnly ? <span>{row.designation || '—'}</span> : (
                      <input
                        className="table-input input-wide"
                        value={row.designation}
                        onChange={e => updateCell(row.id, 'designation', e.target.value)}
                        placeholder="Designation"
                        aria-label={`Designation row ${idx + 1}`}
                      />
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {readOnly ? (
                      <span>{row.baseSalary ? formatINR(row.baseSalary) : '—'}</span>
                    ) : (
                      <input
                        className="table-input input-number"
                        type="number" min="0"
                        value={row.baseSalary}
                        onChange={e => updateCell(row.id, 'baseSalary', e.target.value)}
                        placeholder="0"
                        aria-label={`Base salary row ${idx + 1}`}
                      />
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {readOnly ? (
                      <span>{row.bonus ? formatINR(row.bonus) : '—'}</span>
                    ) : (
                      <input
                        className="table-input input-number"
                        type="number" min="0"
                        value={row.bonus}
                        onChange={e => updateCell(row.id, 'bonus', e.target.value)}
                        placeholder="0"
                        aria-label={`Bonus row ${idx + 1}`}
                      />
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {readOnly ? (
                      <span>{row.deductions ? formatINR(row.deductions) : '—'}</span>
                    ) : (
                      <input
                        className="table-input input-number"
                        type="number" min="0"
                        value={row.deductions}
                        onChange={e => updateCell(row.id, 'deductions', e.target.value)}
                        placeholder="0"
                        aria-label={`Deductions row ${idx + 1}`}
                      />
                    )}
                  </td>

                  <td>
                    <span className={`net-salary-cell${net === 0 ? ' zero' : ''}`}>
                      {formatINR(net)}
                    </span>
                  </td>

                  <td>
                    {readOnly ? <span>{row.remarks || '—'}</span> : (
                      <input
                        className="table-input"
                        value={row.remarks}
                        onChange={e => updateCell(row.id, 'remarks', e.target.value)}
                        placeholder="Optional note"
                        aria-label={`Remarks row ${idx + 1}`}
                      />
                    )}
                  </td>

                  {!readOnly && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-icon row-del-btn"
                        onClick={() => onRemoveRow(row.id)}
                        title="Remove employee"
                        aria-label={`Remove row ${idx + 1}`}
                      ><Icons.Trash /></button>
                    </td>
                  )}
                </tr>
              );
            })
          )}

          {/* Totals row */}
          {rows.length > 0 && (
            <>
              <tr className="totals-row">
                <td className="td-serial" style={{ color: 'var(--teal)', fontWeight: 700 }}>Σ</td>
                <td style={{ fontWeight: 700 }}>TOTAL</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {summary.employees} {summary.employees === 1 ? 'employee' : 'employees'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(summary.totalBase)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatINR(summary.totalBonus)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>{formatINR(summary.totalDeductions)}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="net-salary-cell" style={{ fontSize: 15 }}>
                    {formatINR(summary.totalNet)}
                  </span>
                </td>
                <td colSpan={readOnly ? 1 : 2}></td>
              </tr>
              {/* Amount in words row */}
              <tr className="words-row">
                <td colSpan={readOnly ? 8 : 9}>
                  <span className="words-label">Net Salary in Words:</span>
                  <span className="words-value">{amountInWords(summary.totalNet)}</span>
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {!readOnly && (
        <div className="table-footer-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={onAddRow}
            id={`add-employee-btn-${cat.key}`}
            aria-label={`Add ${cat.label} employee`}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
            Add {cat.label} Employee
          </button>
        </div>
      )}
    </div>
  );
}

import { formatINR, SALARY_CATEGORIES } from './utils';
import { Icons } from './icons';

export function MetricCards({ summary }) {
  const topCards = [
    { key: 'employees', cls: 'card-employees', icon: <Icons.Users />, label: 'Total Employees', value: summary.employees.toString() },
    { key: 'base',      cls: 'card-base',      icon: <Icons.Briefcase />, label: 'Total Base Salary', value: formatINR(summary.totalBase) },
    { key: 'bonus',     cls: 'card-bonus',     icon: <Icons.Gift />, label: 'Total Bonuses',     value: formatINR(summary.totalBonus) },
    { key: 'deduction', cls: 'card-deduction', icon: <Icons.TrendingDown />, label: 'Total Deductions',  value: formatINR(summary.totalDeductions) },
    { key: 'net',       cls: 'card-net',       icon: <Icons.CheckCircle />, label: 'Grand Net Payout',  value: formatINR(summary.totalNet) },
  ];

  return (
    <>
      {/* Top summary cards */}
      <section className="cards-grid" aria-label="Salary Summary">
        {topCards.map(card => (
          <div key={card.key} className={`metric-card ${card.cls}`}>
            <div className="metric-icon">{card.icon}</div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-label">{card.label}</div>
          </div>
        ))}
      </section>

      {/* Per-category breakdown strip */}
      <div className="category-breakdown" aria-label="Category Breakdown">
        {SALARY_CATEGORIES.map(cat => {
          const catSummary = summary[cat.key] || { employees: 0, totalNet: 0 };
          return (
            <div
              key={cat.key}
              className="cat-card"
              style={{
                '--cat-color':  cat.color,
                '--cat-bg':     cat.bg,
                '--cat-border': cat.border,
              }}
            >
              <div className="cat-card-icon">{cat.icon}</div>
              <div className="cat-card-body">
                <div className="cat-card-label">{cat.label} Salary</div>
                <div className="cat-card-amount">{formatINR(catSummary.totalNet)}</div>
                <div className="cat-card-meta">
                  {catSummary.employees} {catSummary.employees === 1 ? 'employee' : 'employees'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total divider */}
        <div className="cat-card cat-card-total">
          <div className="cat-card-icon"><Icons.ChartBar /></div>
          <div className="cat-card-body">
            <div className="cat-card-label">Grand Total</div>
            <div className="cat-card-amount" style={{ color: 'var(--teal)' }}>
              {formatINR(summary.totalNet)}
            </div>
            <div className="cat-card-meta">{summary.employees} total employees</div>
          </div>
        </div>
      </div>
    </>
  );
}

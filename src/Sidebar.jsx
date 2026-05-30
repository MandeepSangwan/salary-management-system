import { useState } from 'react';
import { monthLabel, formatINR, computeSummary } from './utils';
import { Icons } from './icons';

export function Sidebar({ savedMonths, activeYear, activeMonth, onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null); // { year, month }

  function handleDeleteClick(e, year, month) {
    e.stopPropagation(); // don't also trigger onSelect
    setConfirmDelete({ year, month });
  }

  function handleConfirm() {
    if (confirmDelete) {
      onDelete(confirmDelete.year, confirmDelete.month);
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Folder /> Saved Records
          </div>
        </div>
        <div className="sidebar-list">
          {savedMonths.length === 0 ? (
            <div className="sidebar-empty">
              No saved records yet.<br />
              Fill in data and click <strong>Save</strong> to get started.
            </div>
          ) : (
            savedMonths.map(({ year, month, data }) => {
              const isActive = year === activeYear && month === activeMonth;
              const summary = computeSummary(data || {});
              return (
                <div
                  key={`${year}-${month}`}
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                  onClick={() => onSelect(year, month)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onSelect(year, month)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${monthLabel(year, month)}, Net Payout ${formatINR(summary.totalNet)}`}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sidebar-item-label">{monthLabel(year, month)}</div>
                    <div className="sidebar-item-payout">
                      {summary.employees} emp · {formatINR(summary.totalNet)}
                    </div>
                  </div>
                  <span className="sidebar-item-badge">{MONTH_SHORT[month]}</span>

                  {/* Delete button */}
                  <button
                    className="sidebar-delete-btn"
                    onClick={e => handleDeleteClick(e, year, month)}
                    title={`Delete ${monthLabel(year, month)} record`}
                    aria-label={`Delete ${monthLabel(year, month)} record`}
                  >
                    <Icons.Trash />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Inline mini confirm dialog */}
      {confirmDelete && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-confirm-title"
          onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="modal">
            <div className="modal-icon"><Icons.Trash /></div>
            <h2 className="modal-title" id="del-confirm-title">Delete Record?</h2>
            <p className="modal-desc">
              Permanently delete the saved salary data for{' '}
              <strong>{monthLabel(confirmDelete.year, confirmDelete.month)}</strong>?
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                id="del-cancel-btn"
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                id="del-confirm-btn"
                className="btn btn-danger"
                onClick={handleConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

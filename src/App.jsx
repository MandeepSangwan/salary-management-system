import { useState, useEffect, useCallback } from 'react';
import {
  currentYearMonth, monthLabel, generateMonthOptions,
  newRow, computeSummary, SALARY_CATEGORIES,
} from './utils';
import { login, getSavedMonths, fetchMonthData, saveMonthData, deleteMonthData } from './api';
import { Sidebar }        from './Sidebar';
import { MetricCards }    from './MetricCards';
import { SalaryTable }    from './SalaryTable';
import { ToastContainer, useToast } from './Toast';
import { exportToExcel }  from './excelExport';
import { Icons }          from './icons';

// ── Empty data structure ──────────────────────────────────────────────────────
const emptyData = () => ({ cash: [], cheque: [], esi: [] });

// ── Build initial rows for a new month ───────────────────────────────────────
async function fetchOrBuildInitialData(year, month, savedMonths) {
  const saved = await fetchMonthData(year, month);
  if (saved && (saved.data?.cash || saved.data?.cheque || saved.data?.esi)) {
    return saved.data;
  }

  // Pre-fill names/designations from most recently saved month
  if (savedMonths.length > 0) {
    const prev = savedMonths[0];
    const d = prev.data || {};
    return {
      cash:   (d.cash   || []).map(r => newRow({ name: r.name, designation: r.designation, baseSalary: r.baseSalary, bankAccount: r.bankAccount, phoneNumber: r.phoneNumber })),
      cheque: (d.cheque || []).map(r => newRow({ name: r.name, designation: r.designation, baseSalary: r.baseSalary, bankAccount: r.bankAccount, phoneNumber: r.phoneNumber })),
      esi:    (d.esi    || []).map(r => newRow({ name: r.name, designation: r.designation, baseSalary: r.baseSalary, bankAccount: r.bankAccount, phoneNumber: r.phoneNumber })),
    };
  }

  return emptyData();
}

// ── Confirmation dialog ───────────────────────────────────────────────────────
function ConfirmDialog({ title, desc, onConfirm, onCancel }) {
  return (
    <div
      className="modal-backdrop"
      role="dialog" aria-modal="true" aria-labelledby="confirm-title"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal">
        <div className="modal-icon"><Icons.Trash /></div>
        <h2 className="modal-title" id="confirm-title">{title}</h2>
        <p className="modal-desc">{desc}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} id="confirm-cancel-btn">Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} id="confirm-ok-btn">Clear Month</button>
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      onLogin(res.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 400, background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ color: 'var(--primary)', marginBottom: 16 }}><Icons.Wallet /></div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>SalaryPro Login</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to your workspace</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Username</label>
            <input 
              className="table-input input-wide" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ padding: '10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
            <input 
              type="password" 
              className="table-input input-wide" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ padding: '10px' }}
            />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, background: '#fef2f2', padding: '8px', borderRadius: 6 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: '12px', marginTop: 8 }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main App Component ────────────────────────────────────────────────────────
function MainApp({ user, onLogout }) {
  const { year: initYear, month: initMonth } = currentYearMonth();

  const [activeYear,  setActiveYear]  = useState(initYear);
  const [activeMonth, setActiveMonth] = useState(initMonth);
  const [data, setData]               = useState(emptyData()); // { cash, cheque, esi }
  const [activeTab,   setActiveTab]   = useState('cash');
  const [savedMonths, setSavedMonths] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isSaving,    setIsSaving]    = useState(false);

  const { toasts, addToast } = useToast();
  const monthOptions = generateMonthOptions(24);

  // ── Load month ─────────────────────────────────────────────────────────────
  const loadMonth = useCallback(async (year, month, savedList) => {
    setIsLoading(true);
    try {
      const initial = await fetchOrBuildInitialData(year, month, savedList);
      setData(initial);
      setActiveYear(year);
      setActiveMonth(month);
    } catch (error) {
      if (error.message === 'Unauthorized') onLogout();
      else addToast(`Error loading data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, onLogout]);

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const saved = await getSavedMonths();
        setSavedMonths(saved);
        await loadMonth(initYear, initMonth, saved);
      } catch (error) {
        if (error.message === 'Unauthorized') {
          onLogout();
        } else {
          addToast(`Error connecting to server: ${error.message}`, 'error');
        }
        setIsLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line

  // ── Month selector ─────────────────────────────────────────────────────────
  async function handleMonthChange(e) {
    const [y, m] = e.target.value.split('-').map(Number);
    await loadMonth(y, m, savedMonths);
  }

  // ── Sidebar select ─────────────────────────────────────────────────────────
  async function handleSidebarSelect(year, month) {
    await loadMonth(year, month, savedMonths);
  }

  // ── Row updaters ───────────────────────────────────────────────────────────
  function setCategory(key, rows) {
    setData(prev => ({ ...prev, [key]: rows }));
  }

  function addRow(key) {
    setData(prev => ({ ...prev, [key]: [...(prev[key] || []), newRow()] }));
  }

  function removeRow(key, id) {
    setData(prev => ({ ...prev, [key]: (prev[key] || []).filter(r => r.id !== id) }));
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true);
    try {
      await saveMonthData(activeYear, activeMonth, { ...data, savedAt: new Date().toISOString() });
      const fresh = await getSavedMonths();
      setSavedMonths(fresh);
      addToast(`Saved! ${monthLabel(activeYear, activeMonth)} data stored.`, 'success');
    } catch (error) {
      if (error.message === 'Unauthorized') onLogout();
      else addToast(`Error saving data: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Clear month ────────────────────────────────────────────────────────────
  async function handleClearConfirm() {
    try {
      await deleteMonthData(activeYear, activeMonth);
      const fresh = await getSavedMonths();
      setSavedMonths(fresh);
      setData(emptyData());
      setShowConfirm(false);
      addToast(`${monthLabel(activeYear, activeMonth)} data cleared.`, 'info');
    } catch (error) {
      if (error.message === 'Unauthorized') onLogout();
      else addToast(`Error clearing data: ${error.message}`, 'error');
    }
  }

  // ── Delete saved record ────────────────────────────────────────────────────
  async function handleDeleteRecord(year, month) {
    try {
      await deleteMonthData(year, month);
      const fresh = await getSavedMonths();
      setSavedMonths(fresh);
      addToast(`${monthLabel(year, month)} record deleted.`, 'info');
      if (year === activeYear && month === activeMonth) {
        const initial = await fetchOrBuildInitialData(year, month, fresh);
        setData(initial);
      }
    } catch (error) {
      if (error.message === 'Unauthorized') onLogout();
      else addToast(`Error deleting data: ${error.message}`, 'error');
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function handleExport() {
    const total = (data.cash?.length || 0) + (data.cheque?.length || 0) + (data.esi?.length || 0);
    if (total === 0) {
      addToast('No data to export. Add employees first.', 'error');
      return;
    }
    try {
      const fileName = exportToExcel(data, activeYear, activeMonth);
      addToast(`Exported as ${fileName}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Export failed.', 'error');
    }
  }

  const summary          = computeSummary(data);
  const currentMonthVal  = `${activeYear}-${activeMonth}`;
  const isSaved          = savedMonths.some(s => s.year === activeYear && s.month === activeMonth);
  const activeCat        = SALARY_CATEGORIES.find(c => c.key === activeTab);
  const activeRows       = data[activeTab] || [];

  return (
    <div className="app-shell">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header" role="banner">
        <div className="app-header-brand">
          <div className="app-header-logo" aria-hidden="true" style={{ color: 'white' }}>
            <Icons.Wallet />
          </div>
          <div>
            <div className="app-header-title">SalaryPro</div>
            <div className="app-header-subtitle">Employee Salary Management System</div>
          </div>
        </div>
        <div className="header-actions" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginRight: 8, color: 'var(--text-muted)' }}>
            Welcome, <strong style={{ color: 'var(--text-main)' }}>{user}</strong>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} title="Logout" style={{ marginRight: 12 }}>
            Logout
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border)', marginRight: 12 }}></div>
          <button id="export-btn" className="btn btn-accent" onClick={handleExport} title="Export to Excel" disabled={isLoading}>
            <Icons.Download /> Export Excel
          </button>
          <button id="save-btn" className="btn btn-primary" onClick={handleSave} title="Save current month" disabled={isLoading || isSaving}>
            <Icons.Save /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="app-body">

        <Sidebar
          savedMonths={savedMonths}
          activeYear={activeYear}
          activeMonth={activeMonth}
          onSelect={handleSidebarSelect}
          onDelete={handleDeleteRecord}
        />

        <main className="main-content" role="main" id="main-content">

          {/* Month toolbar */}
          <div className="month-toolbar">
            <label className="month-label" htmlFor="month-select">Viewing:</label>
            <select
              id="month-select"
              className="month-select"
              value={currentMonthVal}
              onChange={handleMonthChange}
              aria-label="Select month"
            >
              {monthOptions.map(({ year, month }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {monthLabel(year, month)}
                </option>
              ))}
            </select>
            {isSaved && (
              <span className="badge badge-readonly" title="This month has saved data">✓ Saved</span>
            )}
            <div className="toolbar-spacer" />
            <button
              id="clear-month-btn"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
              onClick={() => setShowConfirm(true)}
            >
              <Icons.Trash /> Clear Month
            </button>
          </div>

          {/* Summary dashboard */}
          <MetricCards summary={summary} />

          {/* Salary panel with tabs */}
          <section className="panel" aria-label="Salary Table">
            <div className="panel-header">
              <h1 className="panel-title">
                {monthLabel(activeYear, activeMonth)} — Salary Sheet
                {isLoading && <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</span>}
              </h1>
            </div>

            {/* Category tabs */}
            <div className="cat-tabs" role="tablist" aria-label="Salary categories">
              {SALARY_CATEGORIES.map(cat => {
                const rowCount = (data[cat.key] || []).length;
                const isActive = activeTab === cat.key;
                return (
                  <button
                    key={cat.key}
                    id={`tab-${cat.key}`}
                    className={`cat-tab${isActive ? ' cat-tab-active' : ''}`}
                    style={{
                      '--tab-color':  cat.color,
                      '--tab-bg':     cat.bg,
                      '--tab-border': cat.border,
                    }}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${cat.key}`}
                    onClick={() => setActiveTab(cat.key)}
                  >
                    <span className="cat-tab-icon">{cat.icon}</span>
                    <span className="cat-tab-label">{cat.label}</span>
                    <span className="cat-tab-count">{rowCount}</span>
                  </button>
                );
              })}
            </div>

            {/* Active tab panel */}
            <div
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
            >
              {/* Tab header strip */}
              <div
                className="tab-panel-header"
                style={{
                  '--tab-color':  activeCat.color,
                  '--tab-bg':     activeCat.bg,
                  '--tab-border': activeCat.border,
                }}
              >
                <span className="tab-panel-icon">{activeCat.icon}</span>
                <span className="tab-panel-title">{activeCat.label} Salary Employees</span>
                <span className="tab-panel-meta">
                  {activeRows.length} {activeRows.length === 1 ? 'employee' : 'employees'}
                </span>
              </div>

              <SalaryTable
                rows={activeRows}
                onChange={rows => setCategory(activeTab, rows)}
                onAddRow={() => addRow(activeTab)}
                onRemoveRow={id => removeRow(activeTab, id)}
                readOnly={false}
                category={activeCat}
              />
            </div>
          </section>

        </main>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Clear Month Data?"
          desc={`This will permanently remove all salary data for ${monthLabel(activeYear, activeMonth)}.`}
          onConfirm={handleClearConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ── App Wrapper (Auth layer) ──────────────────────────────────────────────────
export default function AppWrapper() {
  const [user, setUser] = useState(() => localStorage.getItem('salary_user'));

  if (!user) {
    return <LoginScreen onLogin={u => {
      localStorage.setItem('salary_user', u);
      setUser(u);
    }} />;
  }

  return <MainApp user={user} onLogout={() => {
    localStorage.removeItem('salary_user');
    setUser(null);
  }} />;
}

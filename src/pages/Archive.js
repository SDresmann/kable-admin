import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders, API_URL } from '../api';
import './Archive.css';

function dateToDisplay(d) {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function KableLogo() {
  return (
    <Link to="/" className="kable-logo" aria-label="Kable Academy">
      <span className="logo-k-wrap">
        <span className="logo-k-letter">K</span>
      </span>
      <span className="logo-rest">able Academy</span>
    </Link>
  );
}

export default function ArchivePage() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactivatingId, setReactivatingId] = useState(null);
  const [reactivateError, setReactivateError] = useState(null);

  const fetchArchived = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/cohorts?archived=true`, { headers: getAuthHeaders() });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Failed to fetch archived cohorts');
      setCohorts(result.success ? (result.data || []) : []);
    } catch (err) {
      console.error('Error fetching archived cohorts:', err);
      setError(err.message || 'Failed to load archive');
      setCohorts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleReactivate = async (cohort) => {
    setReactivateError(null);
    setReactivatingId(cohort._id);
    try {
      const res = await fetch(`${API_URL}/api/cohorts/${cohort._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: cohort.name, endDate: null }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Failed to reactivate');
      setCohorts((prev) => prev.filter((c) => c._id !== cohort._id));
    } catch (err) {
      setReactivateError(err.message || 'Failed to reactivate cohort');
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div className="archive-page">
      <header className="page-header">
        <KableLogo />
        <div className="header-links">
          <Link to="/" className="header-link">Home</Link>
          <Link to="/cohorts" className="header-link">Cohorts</Link>
          <Link to="/help" className="header-link">Help</Link>
          <Link to="/logout" className="header-link">Logout</Link>
        </div>
      </header>
      <main className="archive-main">
        <h1 className="archive-heading">ARCHIVE</h1>
        <p className="archive-subheading">
          Cohorts whose end date has passed. Active cohorts are on the <Link to="/cohorts" className="archive-link">Cohorts</Link> page.
        </p>
        <div className="archive-content">
          {loading && <div className="archive-loading">Loading archive...</div>}
          {error && (
            <div className="archive-error">
              {error}
              <button type="button" onClick={fetchArchived} className="archive-retry">Retry</button>
            </div>
          )}
          {!loading && !error && cohorts.length === 0 && (
            <div className="archive-empty">No archived cohorts. Cohorts appear here after their end date has passed.</div>
          )}
          {reactivateError && <div className="archive-reactivate-error">{reactivateError}</div>}
          {!loading && !error && cohorts.length > 0 && (
            <div className="archive-table-wrap">
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Created</th>
                    <th className="archive-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort) => (
                    <tr key={cohort._id}>
                      <td className="archive-name">{cohort.name}</td>
                      <td className="archive-date-cell">{dateToDisplay(cohort.startDate)}</td>
                      <td className="archive-date-cell">{dateToDisplay(cohort.endDate)}</td>
                      <td className="archive-date-cell">{dateToDisplay(cohort.createdAt)}</td>
                      <td className="archive-actions-cell">
                        <button
                          type="button"
                          className="archive-btn archive-btn-reactivate"
                          onClick={() => handleReactivate(cohort)}
                          disabled={reactivatingId === cohort._id}
                          aria-label={`Reactivate ${cohort.name}`}
                        >
                          {reactivatingId === cohort._id ? 'Reactivating…' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

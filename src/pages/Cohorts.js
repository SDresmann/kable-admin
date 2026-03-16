import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../api';
import './Cohorts.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/** Section (week) titles – must match Kable Career sectionData.js */
const SECTION_TITLES = [
  "The Job Market in 2026: What's Real, What's Noise, and How Not to Panic",
  "Resumes, ATS, and AI: How You're Actually Being Screened",
  "Visibility Without the Slop: Indeed & LinkedIn That Actually Work",
  "Job Searching as a System: Tracking, Pace, and Burnout Prevention",
  "Resume Tailoring That Makes Sense (and When Not to Apply)",
  "Strategy Checkpoint: Are Your Results Matching Your Effort?",
  "Professionalism in 2026: What Employers Are Reacting To",
  "Networking Without Feeling Gross (and Why It's Not Magic)",
  "Career Hygiene: Staying Employed, Sane, and Ready for What's Next",
  "Interviews Aren't Tests: Behavioral Questions Demystified",
  "Proof Over Promises: Portfolios, Projects, and Showing Your Work",
  "Behind the Curtain: How Recruiting Decisions Actually Get Made",
];

function dateToInputValue(d) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
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

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [releasesCohort, setReleasesCohort] = useState(null);
  const [releaseDates, setReleaseDates] = useState({});
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesSaving, setReleasesSaving] = useState(false);
  const [releasesError, setReleasesError] = useState(null);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/cohorts`, { headers: getAuthHeaders() });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Failed to fetch cohorts');
      if (result.success) setCohorts(result.data || []);
      else setCohorts([]);
    } catch (err) {
      console.error('Error fetching cohorts:', err);
      setError(err.message || 'Failed to load cohorts');
      setCohorts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreateError(null);
    try {
      setCreating(true);
      const body = { name };
      if (newStartDate) body.startDate = newStartDate;
      if (newEndDate) body.endDate = newEndDate;
      const res = await fetch(`${API_URL}/api/cohorts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Failed to create cohort');
      if (result.success && result.data) {
        setCohorts((prev) => [result.data, ...prev]);
        setNewName('');
        setNewStartDate('');
        setNewEndDate('');
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create cohort');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cohort) => {
    setEditingId(cohort._id);
    setEditName(cohort.name || '');
    setEditStartDate(dateToInputValue(cohort.startDate));
    setEditEndDate(dateToInputValue(cohort.endDate));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditStartDate('');
    setEditEndDate('');
  };

  const handleUpdate = async () => {
    const name = editName.trim();
    if (!name || !editingId) return;
    try {
      setSaving(true);
      const body = { name };
      if (editStartDate) body.startDate = editStartDate;
      else body.startDate = null;
      if (editEndDate) body.endDate = editEndDate;
      else body.endDate = null;
      const res = await fetch(`${API_URL}/api/cohorts/${editingId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Failed to update cohort');
      if (result.success && result.data) {
        setCohorts((prev) =>
          prev.map((c) => (c._id === editingId ? { ...c, ...result.data } : c))
        );
        cancelEdit();
      }
    } catch (err) {
      setError(err.message || 'Failed to update cohort');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => setDeleteConfirmId(id);
  const cancelDelete = () => setDeleteConfirmId(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API_URL}/api/cohorts/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Failed to delete cohort');
      setCohorts((prev) => prev.filter((c) => c._id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete cohort');
    } finally {
      setDeleting(false);
    }
  };

  const openReleasesModal = (cohort) => {
    setReleasesCohort(cohort);
    setReleaseDates({});
    setReleasesError(null);
    setReleasesLoading(true);
    fetch(`${API_URL}/api/cohorts/${cohort._id}/releases`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          const bySection = {};
          result.data.forEach((r) => {
            bySection[r.sectionId] = dateToInputValue(r.startDate);
          });
          setReleaseDates(bySection);
        }
      })
      .catch(() => setReleasesError('Failed to load releases'))
      .finally(() => setReleasesLoading(false));
  };

  const closeReleasesModal = () => {
    setReleasesCohort(null);
    setReleaseDates({});
    setReleasesError(null);
  };

  const setReleaseDate = (sectionId, value) => {
    setReleaseDates((prev) => ({ ...prev, [sectionId]: value || '' }));
  };

  const saveReleases = async () => {
    if (!releasesCohort) return;
    setReleasesError(null);
    setReleasesSaving(true);
    try {
      const sectionsWithDates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
        (id) => releaseDates[id]
      );
      for (const sectionId of sectionsWithDates) {
        const res = await fetch(
          `${API_URL}/api/cohorts/${releasesCohort._id}/releases`,
          {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              sectionId,
              startDate: releaseDates[sectionId],
            }),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to save release');
        }
      }
      closeReleasesModal();
    } catch (err) {
      setReleasesError(err.message || 'Failed to save releases');
    } finally {
      setReleasesSaving(false);
    }
  };

  return (
    <div className="cohorts-page">
      <header className="page-header">
        <KableLogo />
        <div className="header-links">
          <Link to="/" className="header-link">Home</Link>
          <Link to="/help" className="header-link">Help</Link>
          <Link to="/logout" className="header-link">Logout</Link>
        </div>
      </header>
      <main className="cohorts-main">
        <h1 className="cohorts-heading">COHORTS</h1>
        <p className="cohorts-subheading">Manage classes. Use &quot;Releases&quot; to set when each week (section) goes live for a cohort; assign students to cohorts on the Students page.</p>
        <div className="cohorts-content">
          {loading && <div className="cohorts-loading">Loading cohorts...</div>}
          {error && (
            <div className="cohorts-error">
              {error}
              <button type="button" onClick={fetchCohorts} className="cohorts-retry">Retry</button>
            </div>
          )}
          {!loading && !error && (
            <>
              <form className="cohorts-create-form" onSubmit={handleCreate}>
                <input
                  type="text"
                  className="cohorts-input"
                  placeholder="Cohort name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={creating}
                  aria-label="Cohort name"
                />
                <label className="cohorts-date-label">
                  <span className="cohorts-date-label-text">Start</span>
                  <input
                    type="date"
                    className="cohorts-input cohorts-input-date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    disabled={creating}
                    aria-label="Start date"
                  />
                </label>
                <label className="cohorts-date-label">
                  <span className="cohorts-date-label-text">End</span>
                  <input
                    type="date"
                    className="cohorts-input cohorts-input-date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    disabled={creating}
                    aria-label="End date"
                  />
                </label>
                <button type="submit" className="cohorts-btn cohorts-btn-primary" disabled={creating || !newName.trim()}>
                  {creating ? 'Adding…' : 'Add cohort'}
                </button>
              </form>
              {createError && <div className="cohorts-create-error">{createError}</div>}
              {cohorts.length === 0 ? (
                <div className="cohorts-empty">No cohorts yet. Add one above.</div>
              ) : (
                <div className="cohorts-table-wrap">
                  <table className="cohorts-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Created</th>
                        <th className="cohorts-th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((cohort) => (
                        <tr key={cohort._id}>
                          <td>
                            {editingId === cohort._id ? (
                              <input
                                type="text"
                                className="cohorts-input cohorts-input-inline"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdate();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                                aria-label="Edit cohort name"
                              />
                            ) : (
                              <span className="cohorts-name">{cohort.name}</span>
                            )}
                          </td>
                          <td className="cohorts-date-cell">
                            {editingId === cohort._id ? (
                              <input
                                type="date"
                                className="cohorts-input cohorts-input-inline cohorts-input-date"
                                value={editStartDate}
                                onChange={(e) => setEditStartDate(e.target.value)}
                                aria-label="Start date"
                              />
                            ) : (
                              cohort.startDate ? new Date(cohort.startDate).toLocaleDateString() : '—'
                            )}
                          </td>
                          <td className="cohorts-date-cell">
                            {editingId === cohort._id ? (
                              <input
                                type="date"
                                className="cohorts-input cohorts-input-inline cohorts-input-date"
                                value={editEndDate}
                                onChange={(e) => setEditEndDate(e.target.value)}
                                aria-label="End date"
                              />
                            ) : (
                              cohort.endDate ? new Date(cohort.endDate).toLocaleDateString() : '—'
                            )}
                          </td>
                          <td className="cohorts-date">
                            {cohort.createdAt
                              ? new Date(cohort.createdAt).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="cohorts-actions">
                            {editingId === cohort._id ? (
                              <>
                                <button
                                  type="button"
                                  className="cohorts-btn cohorts-btn-small"
                                  onClick={handleUpdate}
                                  disabled={saving}
                                >
                                  {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="cohorts-btn cohorts-btn-small cohorts-btn-ghost"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="cohorts-btn cohorts-btn-small"
                                  onClick={() => openReleasesModal(cohort)}
                                  title="Release weeks for this cohort"
                                >
                                  Releases
                                </button>
                                <button
                                  type="button"
                                  className="cohorts-btn cohorts-btn-small"
                                  onClick={() => startEdit(cohort)}
                                >
                                  Edit
                                </button>
                                {deleteConfirmId === cohort._id ? (
                                  <span className="cohorts-delete-confirm">
                                    <button
                                      type="button"
                                      className="cohorts-btn cohorts-btn-small cohorts-btn-danger"
                                      onClick={handleDelete}
                                      disabled={deleting}
                                    >
                                      {deleting ? 'Deleting…' : 'Yes, delete'}
                                    </button>
                                    <button
                                      type="button"
                                      className="cohorts-btn cohorts-btn-small cohorts-btn-ghost"
                                      onClick={cancelDelete}
                                      disabled={deleting}
                                    >
                                      Cancel
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="cohorts-btn cohorts-btn-small cohorts-btn-ghost cohorts-btn-danger"
                                    onClick={() => confirmDelete(cohort._id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Releases modal: set which weeks (sections) go live and when for this cohort */}
      {releasesCohort && (
        <div className="cohorts-modal-overlay" onClick={closeReleasesModal}>
          <div className="cohorts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cohorts-modal-header">
              <h2 className="cohorts-modal-title">Release weeks for {releasesCohort.name}</h2>
              <button type="button" className="cohorts-modal-close" onClick={closeReleasesModal} aria-label="Close">×</button>
            </div>
            <p className="cohorts-modal-subtitle">
              Set the start date for each week. Students in this cohort will see a section only when its start date has been reached.
            </p>
            {releasesLoading ? (
              <div className="cohorts-releases-loading">Loading releases…</div>
            ) : (
              <>
                {releasesError && <div className="cohorts-create-error">{releasesError}</div>}
                <div className="cohorts-releases-table-wrap">
                  <table className="cohorts-releases-table">
                    <thead>
                      <tr>
                        <th>Week</th>
                        <th>Section</th>
                        <th>Start date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SECTION_TITLES.map((title, i) => {
                        const sectionId = i + 1;
                        return (
                          <tr key={sectionId}>
                            <td className="cohorts-releases-week">{sectionId}</td>
                            <td className="cohorts-releases-title">{title}</td>
                            <td>
                              <input
                                type="date"
                                className="cohorts-input cohorts-input-date"
                                value={releaseDates[sectionId] || ''}
                                onChange={(e) => setReleaseDate(sectionId, e.target.value)}
                                aria-label={`Start date for week ${sectionId}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="cohorts-modal-actions">
                  <button type="button" className="cohorts-btn cohorts-btn-ghost" onClick={closeReleasesModal} disabled={releasesSaving}>
                    Cancel
                  </button>
                  <button type="button" className="cohorts-btn cohorts-btn-primary" onClick={saveReleases} disabled={releasesSaving}>
                    {releasesSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

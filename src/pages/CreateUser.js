import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createUser, resetPassword, API_URL } from '../api';
import './CreateUser.css';

export default function CreateUser() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [cohortId, setCohortId] = useState('');
  const [cohorts, setCohorts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/cohorts`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setCohorts(result.data);
      })
      .catch(() => setCohorts([]));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await createUser(email.trim().toLowerCase(), password, role, role === 'student' ? (cohortId.trim() || null) : null);
      const portal = role === 'admin' ? 'admin portal' : 'student portal (Kable Career)';
      setSuccess(`${role === 'admin' ? 'Admin' : 'Student'} user ${email.trim().toLowerCase()} created. They can log in at the ${portal} and change their password.`);
      setEmail('');
      setPassword('');
      setCohortId('');
      setShowReset(false);
    } catch (err) {
      if (err.message && (err.message.includes('already') || err.message.includes('registered'))) {
        setShowReset(true);
        setError('That email is already registered. Set a new password for them below.');
      } else {
        setError(err.message || 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase(), password);
      setSuccess(`Password updated for ${email.trim().toLowerCase()}. They can log in with this password.`);
      setEmail('');
      setPassword('');
      setShowReset(false);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-user-page">
      <div className="create-user-card">
        <h1 className="create-user-title">Create user</h1>
        <p className="create-user-subtitle">
          Admin users log in here; student users log in to the student portal (Kable Career).
        </p>
        {success && (
          <div className="create-user-success">{success}</div>
        )}
        <form onSubmit={handleSubmit} className="create-user-form">
          {error && !showReset && <div className="create-user-error">{error}</div>}
          {error && showReset && <div className="create-user-error">{error}</div>}
          <label className="create-user-label">Role</label>
          <select
            className="create-user-input create-user-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="admin">Admin</option>
            <option value="student">Student</option>
          </select>
          {role === 'student' && (
            <>
              <label className="create-user-label">Cohort</label>
              <select
                className="create-user-input create-user-select"
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                aria-label="Select cohort"
              >
                <option value="">No cohort</option>
                {cohorts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="create-user-label">Email</label>
          <input
            type="text"
            inputMode="email"
            className="create-user-input"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setShowReset(false); }}
            placeholder="e.g. mkohlmorgen@kableacademy.com"
            required
          />
          <label className="create-user-label">Password (min 6 characters)</label>
          <input
            type="password"
            className="create-user-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {!showReset ? (
            <button type="submit" className="create-user-submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create user'}
            </button>
          ) : (
            <div className="create-user-actions">
              <button type="button" className="create-user-submit create-user-secondary" onClick={() => { setShowReset(false); setError(''); }} disabled={loading}>
                Cancel
              </button>
              <button type="button" className="create-user-submit" onClick={handleResetSubmit} disabled={loading}>
                {loading ? 'Updating…' : 'Set new password for this user'}
              </button>
            </div>
          )}
        </form>
        <p className="create-user-footer">
          <Link to="/">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}

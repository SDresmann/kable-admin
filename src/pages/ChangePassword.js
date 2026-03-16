import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api';
import './ChangePassword.css';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h1 className="change-password-title">Change password</h1>
        <p className="change-password-subtitle">Logged in as {user.email}</p>
        {success ? (
          <div className="change-password-success">
            <p>Your password has been updated.</p>
            <Link to="/" className="change-password-link">Back to dashboard</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="change-password-form">
            {error && <div className="change-password-error">{error}</div>}
            <label className="change-password-label">Current password</label>
            <input
              type="password"
              className="change-password-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <label className="change-password-label">New password</label>
            <input
              type="password"
              className="change-password-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <label className="change-password-label">Confirm new password</label>
            <input
              type="password"
              className="change-password-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button type="submit" className="change-password-submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
        <p className="change-password-footer">
          <Link to="/">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}

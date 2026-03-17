import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, getAuthHeaders } from '../api';
import './Assignments.css';

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

// Assignment types we track (from Kable Career)
const ASSIGNMENT_LABELS = {
  'Resume v1 Checklist': 'Resume v1 Checklist',
  // add more as needed, e.g. 'Chat GPT Exercise': 'Chat GPT Exercise'
};

export default function AssignmentsPage() {
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedStudent, setSelectedStudent] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // eslint-disable-next-line no-unused-vars
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsRes, submissionsRes] = await Promise.all([
        fetch(`${API_URL}/api/students`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/submissions`, { headers: getAuthHeaders() }),
      ]);

      if (!studentsRes.ok) throw new Error('Failed to fetch students');
      if (!submissionsRes.ok) throw new Error('Failed to fetch submissions');

      const studentsData = await studentsRes.json();
      const submissionsData = await submissionsRes.json();

      if (studentsData.success) setStudents(studentsData.data);
      if (submissionsData.success) setSubmissions(submissionsData.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(`Cannot connect to backend at ${API_URL}. Make sure the admin backend is running and using the same MongoDB as Kable Career.`);
      } else {
        setError(err.message || 'Failed to load data.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Group submissions by student email (case-insensitive)
  const submissionsByEmail = submissions.reduce((acc, sub) => {
    const email = (sub.userEmail || '').toLowerCase().trim();
    if (!email) return acc;
    if (!acc[email]) acc[email] = [];
    acc[email].push(sub);
    return acc;
  }, {});

  const downloadSubmissionFile = async (id, filename) => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/${id}/file`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.alert('Download failed. Make sure you are logged in.');
    }
  };

  // Get the latest submission for an assignment name for a student
  const getSubmission = (email, assignmentName) => {
    const list = submissionsByEmail[(email || '').toLowerCase().trim()] || [];
    const forAssignment = list.filter((s) => (s.assignmentName || '').trim() === (assignmentName || '').trim());
    if (forAssignment.length === 0) return null;
    return forAssignment.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
  };

  return (
    <div className="assignments-page">
      <header className="page-header">
        <KableLogo />
        <div className="header-links">
          <Link to="/" className="header-link">Home</Link>
          <Link to="/help" className="header-link">Help</Link>
          <Link to="/logout" className="header-link">Logout</Link>
        </div>
      </header>
      <main className="assignments-main">
        <h1 className="assignments-heading">ASSIGNMENTS</h1>
        <div className="assignments-content">
          <div className="assignments-info">
            <p className="assignments-note">
              Each student from Kable Career appears below. Completed assignments (from the Kable Career app) show status, date, and download. Admin backend must use the same MongoDB (ATLAS_URI) as Kable Career.
            </p>
          </div>
          {loading && (
            <div className="loading-message">Loading students and assignments...</div>
          )}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchData} className="retry-button">Retry</button>
            </div>
          )}
          {!loading && !error && (
            <>
              {students.length === 0 ? (
                <div className="no-students">No students found. Students are users from the Kable Career app (same MongoDB).</div>
              ) : (
                <div className="assignments-table-container">
                  <table className="assignments-table">
                    <thead>
                      <tr>
                        <th>Student Email</th>
                        {Object.keys(ASSIGNMENT_LABELS).map((key) => (
                          <th key={key}>{ASSIGNMENT_LABELS[key]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student._id || student.id || index}>
                          <td className="student-email-cell">
                            <button
                              type="button"
                              className="student-email-link"
                              onClick={() => openModal(student)}
                            >
                              {student.email || 'N/A'}
                            </button>
                          </td>
                          {Object.keys(ASSIGNMENT_LABELS).map((assignmentName) => {
                            const sub = getSubmission(student.email, assignmentName);
                            return (
                              <td key={assignmentName} className="assignment-status-cell">
                                {sub ? (
                                  <span className="assignment-completed">
                                    <span className="status-complete">Completed</span>
                                    <span className="submission-date">
                                      {sub.submittedAt
                                        ? new Date(sub.submittedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })
                                        : ''}
                                    </span>
                                    <button
                                      type="button"
                                      className="download-link button-as-link"
                                      onClick={() => downloadSubmissionFile(sub._id, sub.originalFilename)}
                                    >
                                      Download
                                    </button>
                                  </span>
                                ) : (
                                  <span className="assignment-not-done">Not submitted</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="assignments-count">
                    Total: {students.length} student{students.length !== 1 ? 's' : ''} • {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

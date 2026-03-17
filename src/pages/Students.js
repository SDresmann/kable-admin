import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, getAuthHeaders } from '../api';
import './Students.css';

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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openCommentInNewTab(comment, assignmentName, submittedAt, checklistChecked) {
  const title = [assignmentName, submittedAt ? new Date(submittedAt).toLocaleDateString() : ''].filter(Boolean).join(' – ');
  const body = escapeHtml(comment || '').replace(/\n/g, '<br>');
  let checklistSection = '';
  if (Array.isArray(checklistChecked) && checklistChecked.length > 0) {
    const checked = checklistChecked.filter(Boolean).length;
    const list = checklistChecked.map((v, i) => `Item ${i + 1}: ${v ? '✓' : '—'}`).join('<br>');
    checklistSection = `<h3>Checklist</h3><p><strong>${checked} of ${checklistChecked.length} completed</strong></p><p>${list}</p>`;
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title) || 'Comment'}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;} h3{font-size:1rem;margin-top:1.5rem;}</style></head><body><h2>${escapeHtml(assignmentName || 'Comment')}</h2>${submittedAt ? `<p><small>${escapeHtml(new Date(submittedAt).toLocaleString())}</small></p>` : ''}${checklistSection}<h3>Comment / Reflection</h3><div>${body || '—'}</div></body></html>`;
  const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function percentToLetterGrade(percent) {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

function getOverallQuizGrade(quizResults) {
  if (!Array.isArray(quizResults) || quizResults.length === 0) return null;
  let totalPercent = 0;
  let count = 0;
  quizResults.forEach((q) => {
    if (q.total != null && q.total > 0) {
      totalPercent += (q.score / q.total) * 100;
      count += 1;
    }
  });
  if (count === 0) return null;
  const avg = totalPercent / count;
  return { percent: Math.round(avg), letter: percentToLetterGrade(avg) };
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editingCohort, setEditingCohort] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [editedCohort, setEditedCohort] = useState('');
  const [editedCohortId, setEditedCohortId] = useState('');
  const [cohorts, setCohorts] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [studentQuizResults, setStudentQuizResults] = useState([]);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [studentAssignmentComments, setStudentAssignmentComments] = useState([]);
  const [assignmentCommentsLoading, setAssignmentCommentsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(null);
  const [quizResultsError, setQuizResultsError] = useState(null);
  const [assignmentCommentsError, setAssignmentCommentsError] = useState(null);
  const [cohortSaving, setCohortSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/cohorts`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setCohorts(result.data);
      })
      .catch(() => setCohorts([]));
  }, []);

  const formatCohortForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const openModal = (student) => {
    const studentCopy = { ...student };
    setSelectedStudent(studentCopy);
    setEditedName(studentCopy.name || studentCopy.email?.split('@')[0] || '');
    setEditedCohort(formatCohortForInput(studentCopy.cohort));
    setEditedCohortId(studentCopy.cohortId ? String(studentCopy.cohortId) : '');
    setEditingName(false);
    setEditingCohort(false);
    setStudentSubmissions([]);
    setStudentQuizResults([]);
    setStudentAssignmentComments([]);
    setSubmissionsError(null);
    setQuizResultsError(null);
    setAssignmentCommentsError(null);
    setIsModalOpen(true);
    if (studentCopy.email) {
      fetchSubmissionsForStudent(studentCopy.email);
      fetchQuizResultsForStudent(studentCopy.email);
      fetchAssignmentCommentsForStudent(studentCopy.email);
    }
  };

  const fetchSubmissionsForStudent = async (email) => {
    if (!email) return;
    setSubmissionsError(null);
    try {
      setSubmissionsLoading(true);
      const response = await fetch(`${API_URL}/api/submissions?userEmail=${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch submissions');
      }
      if (result.success) setStudentSubmissions(result.data);
      else setStudentSubmissions([]);
    } catch (err) {
      console.error('Error fetching student submissions:', err);
      setStudentSubmissions([]);
      setSubmissionsError(err.message || 'Could not load assignments');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchQuizResultsForStudent = async (email) => {
    if (!email) return;
    setQuizResultsError(null);
    try {
      setQuizResultsLoading(true);
      const response = await fetch(`${API_URL}/api/quiz-results?userEmail=${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch quiz results');
      }
      if (result.success) setStudentQuizResults(result.data);
      else setStudentQuizResults([]);
    } catch (err) {
      console.error('Error fetching student quiz results:', err);
      setStudentQuizResults([]);
      setQuizResultsError(err.message || 'Could not load quizzes');
    } finally {
      setQuizResultsLoading(false);
    }
  };

  const fetchAssignmentCommentsForStudent = async (email) => {
    if (!email) return;
    setAssignmentCommentsError(null);
    try {
      setAssignmentCommentsLoading(true);
      const response = await fetch(`${API_URL}/api/assignment-comments?userEmail=${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch assignment comments');
      }
      if (result.success) setStudentAssignmentComments(result.data);
      else setStudentAssignmentComments([]);
    } catch (err) {
      console.error('Error fetching assignment comments:', err);
      setStudentAssignmentComments([]);
      setAssignmentCommentsError(err.message || 'Could not load comments');
    } finally {
      setAssignmentCommentsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setEditingName(false);
    setEditingCohort(false);
    setEditedName('');
    setEditedCohort('');
    setStudentSubmissions([]);
    setStudentQuizResults([]);
    setStudentAssignmentComments([]);
  };

  const handleNameEdit = () => {
    setEditingName(true);
  };

  const handleNameSave = () => {
    if (!selectedStudent) return;
    
    const studentId = selectedStudent._id || selectedStudent.id;
    
    if (!studentId) {
      console.error('Student ID not found');
      return;
    }

    const trimmedName = editedName.trim() || null;

    // Update the student in the students array - ensure we match by ID string
    const updatedStudents = students.map(student => {
      const currentStudentId = student._id || student.id;
      // Convert both to strings for reliable comparison
      if (currentStudentId && String(currentStudentId) === String(studentId)) {
        // Return a new object with updated name, preserving all other properties
        return { ...student, name: trimmedName };
      }
      // Return unchanged student
      return student;
    });
    
    setStudents(updatedStudents);
    
    // Update the selected student in the modal with a new object
    setSelectedStudent({ ...selectedStudent, name: trimmedName });
    setEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(selectedStudent?.name || selectedStudent?.email?.split('@')[0] || '');
    setEditingName(false);
  };

  const handleCohortEdit = () => setEditingCohort(true);

  const handleCohortCancel = () => {
    setEditedCohortId(selectedStudent?.cohortId ? String(selectedStudent.cohortId) : '');
    setEditedCohort(formatCohortForInput(selectedStudent?.cohort));
    setEditingCohort(false);
  };

  const handleCohortSave = async () => {
    if (!selectedStudent) return;
    const studentId = selectedStudent._id || selectedStudent.id;
    if (!studentId) return;
    const newCohortId = editedCohortId.trim() || null;
    try {
      setCohortSaving(true);
      const res = await fetch(`${API_URL}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cohortId: newCohortId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update cohort');
      const updated = result.data;
      setSelectedStudent({ ...selectedStudent, cohortId: updated.cohortId });
      setStudents(prev =>
        prev.map(s => (String(s._id || s.id) === String(studentId) ? { ...s, cohortId: updated.cohortId } : s))
      );
      setEditingCohort(false);
    } catch (err) {
      console.error('Error updating cohort:', err);
      setError(err.message || 'Failed to update cohort');
    } finally {
      setCohortSaving(false);
    }
  };

  const getCohortName = (cohortId) => {
    if (!cohortId) return '—';
    const c = cohorts.find((x) => String(x._id) === String(cohortId));
    return c ? c.name : '—';
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/students`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStudents(result.data);
      } else {
        setError(result.message || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(`Cannot connect to backend server at ${API_URL}. Make sure the admin backend is running.`);
      } else {
        setError(err.message || 'Failed to connect to server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="students-page">
      <header className="page-header">
        <KableLogo />
        <div className="header-links">
          <Link to="/" className="header-link">Home</Link>
          <Link to="/help" className="header-link">Help</Link>
          <Link to="/logout" className="header-link">Logout</Link>
        </div>
      </header>
      <main className="students-main">
        <h1 className="students-heading">STUDENTS</h1>
        <div className="students-content">
          {loading && (
            <div className="loading-message">Loading students...</div>
          )}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchStudents} className="retry-button">Retry</button>
            </div>
          )}
          {!loading && !error && (
            <>
              {students.length === 0 ? (
                <div className="no-students">No students found in the database.</div>
              ) : (
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Cohort</th>
                        <th>Created At</th>
                        <th>User ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student._id || student.id || index}>
                          <td>
                            <button 
                              className="student-email-link"
                              onClick={() => openModal(student)}
                            >
                              {student.email || 'N/A'}
                            </button>
                          </td>
                          <td>
                            {getCohortName(student.cohortId)}
                          </td>
                          <td>
                            {student.createdAt
                              ? new Date(student.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A'}
                          </td>
                          <td className="user-id-cell">{student._id || student.id || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="students-count">
                    Total: {students.length} student{students.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Student Details Modal */}
      {isModalOpen && selectedStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Student Details</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="student-info-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    {editingName ? (
                      <div className="name-edit-container">
                        <input
                          type="text"
                          className="name-edit-input"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          autoFocus
                        />
                        <div className="name-edit-buttons">
                          <button 
                            className="name-save-button" 
                            onClick={handleNameSave}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button 
                            className="name-cancel-button" 
                            onClick={handleNameCancel}
                            title="Cancel"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="name-display-container">
                        <span className="info-value">{selectedStudent.name || selectedStudent.email?.split('@')[0] || 'N/A'}</span>
                        <button 
                          className="name-edit-icon" 
                          onClick={handleNameEdit}
                          title="Edit name"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedStudent.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">User ID:</span>
                    <span className="info-value user-id">{selectedStudent._id || selectedStudent.id || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Cohort (class):</span>
                    {editingCohort ? (
                      <div className="name-edit-container cohort-dropdown-container">
                        <select
                          className="name-edit-input cohort-select"
                          value={editedCohortId}
                          onChange={(e) => setEditedCohortId(e.target.value)}
                          autoFocus
                          aria-label="Select cohort"
                        >
                          <option value="">No cohort</option>
                          {cohorts.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="name-edit-buttons">
                          <button
                            className="name-save-button"
                            onClick={handleCohortSave}
                            disabled={cohortSaving}
                            title="Save"
                          >
                            {cohortSaving ? '…' : '✓'}
                          </button>
                          <button
                            className="name-cancel-button"
                            onClick={handleCohortCancel}
                            disabled={cohortSaving}
                            title="Cancel"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="name-display-container">
                        <span className="info-value">
                          {selectedStudent.cohortId ? getCohortName(selectedStudent.cohortId) : 'Not set'}
                        </span>
                        <button
                          className="name-edit-icon"
                          onClick={handleCohortEdit}
                          title="Edit cohort"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Created:</span>
                    <span className="info-value">
                      {selectedStudent.createdAt
                        ? new Date(selectedStudent.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  {(() => {
                    const overall = getOverallQuizGrade(studentQuizResults);
                    return overall ? (
                      <div className="info-item">
                        <span className="info-label">Overall grade (quizzes):</span>
                        <span className="info-value overall-grade">{overall.percent}% ({overall.letter})</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="student-info-section">
                <h3 className="section-title">Section Quizzes (Kable Career)</h3>
                {quizResultsLoading ? (
                  <p className="submissions-loading">Loading quizzes...</p>
                ) : quizResultsError ? (
                  <p className="submissions-error">{quizResultsError} – Check backend (e.g. <code>{API_URL}</code>) and ATLAS_URI_TEST in admin .env.</p>
                ) : studentQuizResults.length === 0 ? (
                  <p className="no-submissions">No quizzes completed yet.</p>
                ) : (
                  <div className="submissions-list">
                    <table className="submissions-table">
                      <thead>
                        <tr>
                          <th>Section</th>
                          <th>Score</th>
                          <th>Grade</th>
                          <th>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentQuizResults.map((q) => {
                          const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
                          const letter = q.total > 0 ? percentToLetterGrade((q.score / q.total) * 100) : '—';
                          return (
                            <tr key={q._id}>
                              <td>{q.sectionTitle ? `Section ${q.sectionId} – ${q.sectionTitle}` : `Section ${q.sectionId}`}</td>
                              <td>{q.score} / {q.total}</td>
                              <td>{q.total > 0 ? `${pct}% (${letter})` : '—'}</td>
                              <td>
                                {q.completedAt
                                  ? new Date(q.completedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="student-info-section">
                <h3 className="section-title">Assignment Comments / Reflections</h3>
                {assignmentCommentsLoading ? (
                  <p className="submissions-loading">Loading comments...</p>
                ) : assignmentCommentsError ? (
                  <p className="submissions-error">{assignmentCommentsError}</p>
                ) : studentAssignmentComments.length === 0 ? (
                  <p className="no-submissions">No assignment comments yet.</p>
                ) : (
                  <div className="submissions-list">
                    <table className="submissions-table">
                      <thead>
                        <tr>
                          <th>Assignment</th>
                          <th>Section</th>
                          <th>Submitted</th>
                          <th>Checklist</th>
                          <th>Comment</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAssignmentComments.map((c) => (
                          <tr key={c._id}>
                            <td>{c.assignmentName || '—'}</td>
                            <td>Section {c.sectionId}</td>
                            <td>
                              {c.submittedAt
                                ? new Date(c.submittedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </td>
                            <td>
                              {Array.isArray(c.checklistChecked) && c.checklistChecked.length > 0
                                ? `${c.checklistChecked.filter(Boolean).length}/${c.checklistChecked.length} ✓`
                                : '—'}
                            </td>
                            <td className="comment-cell">{c.comment ? (c.comment.length > 80 ? c.comment.slice(0, 80) + '…' : c.comment) : '—'}</td>
                            <td>
                              <button
                                type="button"
                                className="comment-open-link"
                                onClick={() => openCommentInNewTab(c.comment, c.assignmentName, c.submittedAt, c.checklistChecked)}
                              >
                                Open in new tab
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="student-info-section">
                <h3 className="section-title">Completed Assignments &amp; File Uploads (Kable Career)</h3>
                <p className="section-description">Resumes, checklist uploads, and other assignment files. Use &quot;Download file&quot; to open or save the file.</p>
                {submissionsLoading ? (
                  <p className="submissions-loading">Loading assignments...</p>
                ) : submissionsError ? (
                  <p className="submissions-error">{submissionsError} – Check backend and ATLAS_URI_TEST in admin .env (same URI as Kable Career).</p>
                ) : studentSubmissions.length === 0 ? (
                  <p className="no-submissions">No assignments or file uploads yet.</p>
                ) : (
                  <div className="submissions-list">
                    <table className="submissions-table">
                      <thead>
                        <tr>
                          <th>Assignment</th>
                          <th>Submitted</th>
                          <th>File</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSubmissions.map((sub) => (
                          <tr key={sub._id}>
                            <td>{sub.assignmentName || '—'}</td>
                            <td>
                              {sub.submittedAt
                                ? new Date(sub.submittedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </td>
                            <td>{sub.originalFilename || '—'}</td>
                            <td>
                              <button
                                type="button"
                                className="resume-link button-as-link"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`${API_URL}/api/submissions/${sub._id}/file`, { headers: getAuthHeaders() });
                                    if (!res.ok) throw new Error('Download failed');
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = sub.originalFilename || 'download';
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  } catch (e) {
                                    console.error(e);
                                    window.alert('Download failed. Make sure you are logged in.');
                                  }
                                }}
                              >
                                Download file
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

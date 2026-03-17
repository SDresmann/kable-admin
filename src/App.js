import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Students from './pages/Students';
import Cohorts from './pages/Cohorts';
import Archive from './pages/Archive';
import Assignments from './pages/Assignments';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/cohorts" element={<ProtectedRoute><Cohorts /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

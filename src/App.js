import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Students from './pages/Students';
import Cohorts from './pages/Cohorts';
import Archive from './pages/Archive';
import Assignments from './pages/Assignments';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import CreateUser from './pages/CreateUser';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/students" element={<Students />} />
          <Route path="/cohorts" element={<Cohorts />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/assignments" element={<Assignments />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

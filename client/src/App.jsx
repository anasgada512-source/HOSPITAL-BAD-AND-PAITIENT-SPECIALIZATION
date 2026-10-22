import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Loading } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Specializations from './pages/Specializations.jsx';
import SpecializationDetail from './pages/SpecializationDetail.jsx';
import Doctors from './pages/Doctors.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientNew from './pages/PatientNew.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import Beds from './pages/Beds.jsx';
import Admin from './pages/Admin.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/specializations" element={<Specializations />} />
          <Route path="/specializations/:slug" element={<SpecializationDetail />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/patients" element={<Protected><Patients /></Protected>} />
          <Route path="/patients/new" element={<Protected><PatientNew /></Protected>} />
          <Route path="/patients/:id" element={<Protected><PatientDetail /></Protected>} />
          <Route path="/beds" element={<Protected><Beds /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}

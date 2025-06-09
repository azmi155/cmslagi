import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Overview } from './pages/Overview';
import { Devices } from './pages/Devices';
import { Topology } from './pages/Topology';
import { WanMonitoring } from './pages/WanMonitoring';
import { HotspotUsers } from './pages/HotspotUsers';
import { PppoeUsers } from './pages/PppoeUsers';
import { HotspotProfileManagement } from './pages/HotspotProfileManagement';
import { PppoeProfileManagement } from './pages/PppoeProfileManagement';
import { ServicePackages } from './pages/ServicePackages';
import { Monitoring } from './pages/Monitoring';
import { Branding } from './pages/Branding';
import { Settings } from './pages/Settings';
import { useAuth } from './hooks/useAuth';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="devices" element={<Devices />} />
        <Route path="topology" element={<Topology />} />
        <Route path="wan-monitoring" element={<WanMonitoring />} />
        <Route path="hotspot-users" element={<HotspotUsers />} />
        <Route path="pppoe-users" element={<PppoeUsers />} />
        <Route path="hotspot-profile-management" element={<HotspotProfileManagement />} />
        <Route path="pppoe-profile-management" element={<PppoeProfileManagement />} />
        <Route path="service-packages" element={<ServicePackages />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="branding" element={<Branding />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

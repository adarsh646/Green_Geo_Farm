import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import './LandingPage.css';
import './Dashboard.css';
import './AdminDashboard.css';
import './CattleManagement.css';
import ProfileMenu from './components/ProfileMenu';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageRanchers from './pages/ManageRanchers';
import Attendance from './pages/Attendance';
import MonthlyAttendance from './pages/MonthlyAttendance';
import AttendanceSheet from './pages/AttendanceSheet';
const CattleManagement = lazy(() => import('./pages/CattleManagement'));
import CattleDetails from './pages/CattleDetails';
import CattleRecordForm from './pages/CattleRecordForm';
import CattleReport from './pages/CattleReport';
import EventLogging from './pages/EventLogging';
const FeedStock = lazy(() => import('./pages/FeedStock'));
import HealthTracking from './pages/HealthTracking';
import LandingPage from './pages/LandingPage';
import ManagementModule from './pages/ManagementModule';
import FarmAssets from './pages/FarmAssets';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerSignin from './pages/CustomerSignin';
import CustomerSignup from './pages/CustomerSignup';
import CustomerDashboard from './pages/CustomerDashboard';
import Support from './pages/Support';
import EnterpriseReport from './pages/EnterpriseReport';
import DailyUpdates from './pages/DailyUpdates';
import CarbonIntelligence from './pages/CarbonIntelligence';
import CarbonIntelligenceUpdate from './pages/CarbonIntelligenceUpdate';
import DailySummary from './pages/DailySummary';
import CustomerView from './pages/CustomerView';
import {
  clearManagementSession,
  clearLegacySession,
  getManagementRole,
  getManagementToken,
  getShopToken,
} from './utils/sessionStorage';

const LandingPageWithSessionReset = ({ onEnterLanding }) => {
  useEffect(() => {
    onEnterLanding();
  }, [onEnterLanding]);

  return <LandingPage />;
};

function AppContent() {
  const [isManagementAuthenticated, setIsManagementAuthenticated] = useState(() => Boolean(getManagementToken()));
  const [managementRole, setManagementRole] = useState(() => {
    const token = getManagementToken();
    return token ? getManagementRole() : null;
  });
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(() => Boolean(getShopToken()));
  const location = useLocation();

  const hydrateAuthState = () => {
    const managementToken = getManagementToken();
    const role = getManagementRole();
    const shopToken = getShopToken();

    setIsManagementAuthenticated(Boolean(managementToken));
    setManagementRole(managementToken ? role : null);
    setIsShopAuthenticated(Boolean(shopToken));
  };

  useEffect(() => {
    const syncAuthState = () => {
      hydrateAuthState();
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('geofarm:auth-change', syncAuthState);

    clearLegacySession();
    hydrateAuthState();

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('geofarm:auth-change', syncAuthState);
    };
  }, []);

  const handleAuth = ({ module, role = null }) => {
    if (module === 'shop') {
      setIsShopAuthenticated(true);
      return;
    }

    if (module === 'management') {
      setIsManagementAuthenticated(true);
      setManagementRole(role);
    }
  };

  const handleLandingEntry = useCallback(() => {
    clearManagementSession();
    setIsManagementAuthenticated(false);
    setManagementRole(null);
  }, []);

  const showManagementProfile = isManagementAuthenticated && !location.pathname.startsWith('/management/login') && !location.pathname.startsWith('/management/signup');

  return (
    <div className="App">
      {showManagementProfile && <ProfileMenu />}
      <main>
        <Suspense fallback={<div className="page-loader" style={{ padding: '36px', textAlign: 'center', color: '#475569' }}>Loading management view…</div>}>
          <Routes>
            <Route path="/" element={<LandingPageWithSessionReset onEnterLanding={handleLandingEntry} />} />
            <Route path="/management" element={<ManagementModule />} />
            <Route
              path="/shop"
              element={<Shop onShopLogout={() => setIsShopAuthenticated(false)} />}
            />
            <Route path="/shop/login" element={<Login setAuth={handleAuth} portal="shop" />} />
            <Route path="/shop/signup" element={<Signup portal="shop" />} />
            <Route path="/customer/signin" element={<CustomerSignin setAuth={handleAuth} />} />
            <Route path="/customer/signup" element={<CustomerSignup />} />
            <Route path="/customer/dashboard" element={isShopAuthenticated ? <CustomerDashboard /> : <Navigate to="/customer/signin" />} />
            <Route path="/management/login" element={<Login setAuth={handleAuth} portal="management" />} />
            <Route path="/management/signup" element={<Signup portal="management" />} />
            <Route path="/login" element={<Navigate to="/customer/signin" replace />} />
            <Route path="/signup" element={<Navigate to="/customer/signup" replace />} />
            <Route 
              path="/dashboard" 
              element={
                isManagementAuthenticated ? (
                  managementRole === 'admin' ? <AdminDashboard /> : <Dashboard />
                ) : (
                  <Navigate to="/management/login" />
                )
              } 
            />
            <Route 
              path="/cattle-management" 
              element={isManagementAuthenticated ? <CattleManagement /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/health-tracking" 
              element={isManagementAuthenticated ? <HealthTracking /> : <Navigate to="/management/login" />} 
            />
            <Route
              path="/cattle-details/:id"
              element={isManagementAuthenticated ? <CattleDetails /> : <Navigate to="/management/login" />}
            />
            <Route
              path="/cattle-details/:id/event-logging"
              element={isManagementAuthenticated ? <EventLogging /> : <Navigate to="/management/login" />}
            />
            <Route 
              path="/cattle-records" 
              element={isManagementAuthenticated ? <CattleRecordForm /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/cattle-report/:id" 
              element={isManagementAuthenticated ? <CattleReport /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/feed-stock" 
              element={isManagementAuthenticated ? <FeedStock /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/farm-assets" 
              element={isManagementAuthenticated ? <FarmAssets /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/manage-workers" 
              element={isManagementAuthenticated && managementRole === 'admin' ? <ManageRanchers /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/attendance" 
              element={isManagementAuthenticated && managementRole === 'admin' ? <Attendance /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/attendance/monthly" 
              element={isManagementAuthenticated && managementRole === 'admin' ? <MonthlyAttendance /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/attendance/sheet" 
              element={isManagementAuthenticated && managementRole === 'admin' ? <AttendanceSheet /> : <Navigate to="/management/login" />} 
            />
            <Route 
              path="/admin" 
              element={
                isManagementAuthenticated && managementRole === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/management/login" />
                )
              } 
            />
            <Route path="/support" element={<Support />} />
            <Route
              path="/enterprise-reports"
              element={isManagementAuthenticated && managementRole === 'admin' ? <EnterpriseReport /> : <Navigate to="/management/login" />}
            />
            <Route
              path="/daily-updates"
              element={isManagementAuthenticated && managementRole === 'admin' ? <DailyUpdates /> : <Navigate to="/management/login" />}
            />
            <Route
              path="/carbon-intelligence"
              element={isManagementAuthenticated ? <CarbonIntelligence /> : <Navigate to="/management/login" />}
            />
            <Route
              path="/carbon-intelligence-update"
              element={isManagementAuthenticated ? <CarbonIntelligenceUpdate /> : <Navigate to="/management/login" />}
            />
            <Route
              path="/daily-summary"
              element={isManagementAuthenticated ? <DailySummary /> : <Navigate to="/management/login" />}
            />
            <Route
              path="/customers"
              element={isManagementAuthenticated && managementRole === 'admin' ? <CustomerView /> : <Navigate to="/management/login" />}
            />
          </Routes>
          </Suspense>
        </main>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

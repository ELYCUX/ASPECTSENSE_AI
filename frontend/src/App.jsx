import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReviewsPage from './pages/ReviewsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import AmazonImportPage from './pages/AmazonImportPage';
import AIInsightsPage from './pages/AIInsightsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Admin Pages
import AdminDashboardPage from './admin/pages/AdminDashboardPage';
import UserManagementPage from './admin/pages/UserManagementPage';
import UserDetailsPage from './admin/pages/UserDetailsPage';
import AdminProductsPage from './admin/pages/AdminProductsPage';
import AdminReviewsPage from './admin/pages/AdminReviewsPage';
import AdminImportsPage from './admin/pages/AdminImportsPage';
import AdminAIJobsPage from './admin/pages/AdminAIJobsPage';
import AdminActivityLogsPage from './admin/pages/AdminActivityLogsPage';
import AdminSettingsPage from './admin/pages/AdminSettingsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading AspectSense AI...</p>
      </div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Verifying Administrator Privileges...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* User Portal Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
        <Route path="/import" element={<ProtectedRoute><AmazonImportPage /></ProtectedRoute>} />
        <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />

        {/* Admin Portal Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
        <Route path="/admin/users/:userId" element={<AdminRoute><UserDetailsPage /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><AdminReviewsPage /></AdminRoute>} />
        <Route path="/admin/imports" element={<AdminRoute><AdminImportsPage /></AdminRoute>} />
        <Route path="/admin/ai-jobs" element={<AdminRoute><AdminAIJobsPage /></AdminRoute>} />
        <Route path="/admin/activity-logs" element={<AdminRoute><AdminActivityLogsPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {/* Global Premium Background Elements */}
          <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-surface-900">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blob blob-1"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blob blob-2"></div>
            <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] blob blob-3"></div>
            <div className="absolute inset-0 grid-dots opacity-30"></div>
          </div>

          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

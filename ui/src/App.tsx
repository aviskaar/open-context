import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/context';
import { AuthProvider, useAuth } from './store/auth';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import PreferencesEditor from './components/PreferencesEditor';
import ContextViewer from './components/ContextViewer';
import ConversionPipeline from './components/ConversionPipeline';
import VendorExport from './components/VendorExport';
import ContextsManager from './components/ContextsManager';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="preferences" element={<PreferencesEditor />} />
              <Route path="conversations" element={<ContextViewer />} />
              <Route path="pipeline" element={<ConversionPipeline />} />
              <Route path="export" element={<VendorExport />} />
              <Route path="contexts" element={<ContextsManager />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

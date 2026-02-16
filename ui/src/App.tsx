import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/context';
import { AuthProvider } from './store/auth';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import PreferencesEditor from './components/PreferencesEditor';
import ContextViewer from './components/ContextViewer';
import ConversionPipeline from './components/ConversionPipeline';
import VendorExport from './components/VendorExport';
import ContextsManager from './components/ContextsManager';
import BubblesManager from './components/BubblesManager';
import './App.css';

// Auth is not yet available — all protected routes redirect to the landing page.
function ProtectedRoute() {
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Landing />} />
            <Route
              element={<ProtectedRoute />}
            >
              <Route index element={<Dashboard />} />
              <Route path="preferences" element={<PreferencesEditor />} />
              <Route path="conversations" element={<ContextViewer />} />
              <Route path="pipeline" element={<ConversionPipeline />} />
              <Route path="export" element={<VendorExport />} />
              <Route path="contexts" element={<ContextsManager />} />
              <Route path="bubbles" element={<BubblesManager />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

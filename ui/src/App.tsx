import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/context';
import Layout from './components/Layout';
import PreferencesEditor from './components/PreferencesEditor';
import ContextViewer from './components/ContextViewer';
import ConversionPipeline from './components/ConversionPipeline';
import VendorExport from './components/VendorExport';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PreferencesEditor />} />
            <Route path="conversations" element={<ContextViewer />} />
            <Route path="pipeline" element={<ConversionPipeline />} />
            <Route path="export" element={<VendorExport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

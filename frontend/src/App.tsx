import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout, ErrorBoundary } from '@/components';
import { SystemStatusProvider } from '@/context/SystemStatusContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AboutPage } from '@/pages/AboutPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AwarenessPage } from '@/pages/AwarenessPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExplorerPage } from '@/pages/ExplorerPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { LandingPage } from '@/pages/LandingPage';
import { ScannerPage } from '@/pages/ScannerPage';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SystemStatusProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/scanner" element={<ScannerPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/explorer" element={<ExplorerPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/awareness" element={<AwarenessPage />} />
                  <Route path="/about" element={<AboutPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </SystemStatusProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

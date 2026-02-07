
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider, useAuth } from '@/context/FirebaseAuthContext';
import { ExchangeAccountsProvider } from '@/context/ExchangeAccountsContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PositionProvider } from '@/context/PositionContext';
import { PermissionsProvider } from '@/context/PermissionsContext';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TemplatesPage from '@/pages/TemplatesPage';
import PositionsPage from '@/pages/PositionsPage'; 
import BotTradingPage from '@/pages/BotTradingPage';
import PriceMovementBotPage from '@/pages/PriceMovementBotPage';
import GridTradingBotPage from '@/pages/GridTradingBotPage';
import DCATradingBotPage from '@/pages/DCATradingBotPage';
import RSITradingBotPage from '@/pages/RSITradingBotPage';
import CandleStrikeBotPage from '@/pages/CandleStrikeBotPage';
import SettingsPage from '@/pages/SettingsPage';
import ExchangeAccountsPage from '@/pages/ExchangeAccountsPage';
import ManualTradePage from '@/pages/ManualTradePage';
import AdvancedChartPage from '@/pages/AdvancedChartPage';
import AdminPage from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/toaster';
import BotActivationToast from '@/components/BotActivationToast';

// Inner routes component
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route path="manual-trade" element={<ManualTradePage />} />
        <Route path="advanced-chart" element={<AdvancedChartPage />} />
        <Route path="bot-trading" element={<BotTradingPage />} />
        <Route path="price-movement-bot" element={<PriceMovementBotPage />} />
        <Route path="grid-trading" element={<GridTradingBotPage />} />
        <Route path="dca-trading" element={<DCATradingBotPage />} />
        <Route path="rsi-bot" element={<RSITradingBotPage />} />
        <Route path="candle-strike-bot" element={<CandleStrikeBotPage />} />
        <Route path="exchange-accounts" element={<ExchangeAccountsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Admin Route Protection - Updated to use ProtectedAdminRoute */}
        <Route 
          path="admin" 
          element={
            <ProtectedAdminRoute>
              <AdminPage />
            </ProtectedAdminRoute>
          } 
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Wrapper component to inject auth user into PermissionsProvider
function AppProviders({ children }) {
  const { user } = useAuth();
  
  return (
    <PermissionsProvider user={user}>
      <NotificationProvider>
        <ExchangeAccountsProvider>
          <PositionProvider>
            {children}
          </PositionProvider>
        </ExchangeAccountsProvider>
      </NotificationProvider>
    </PermissionsProvider>
  );
}

function App() {
  return (
    <FirebaseAuthProvider>
      <AppProviders>
        <Router>
          <ScrollToTop />
          <AppRoutes />
          <Toaster />
          <BotActivationToast />
        </Router>
      </AppProviders>
    </FirebaseAuthProvider>
  );
}

export default App;

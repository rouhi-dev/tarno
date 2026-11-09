import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TopNav } from './components/layout/TopNav';
import { Footer } from './components/layout/Footer';
import { Toasts } from './components/ui/Toasts';
import { Landing } from './pages/Landing';
import { Dossier } from './pages/Dossier';
import { Report } from './pages/Report';
import { MvpLayout } from './pages/mvp/MvpLayout';
import { Marketplace } from './pages/mvp/Marketplace';
import { ListingDetail } from './pages/mvp/ListingDetail';
import { Login } from './pages/mvp/Login';
import { SellerDashboard } from './pages/mvp/SellerDashboard';
import { NewListing } from './pages/mvp/NewListing';
import { SellerRequests } from './pages/mvp/SellerRequests';
import { BuyerRequests } from './pages/mvp/BuyerRequests';
import { BuyerOrders } from './pages/mvp/BuyerOrders';
import { AdminPanel } from './pages/mvp/AdminPanel';

/** بازگشت به بالای صفحه در تغییر مسیر، با احترام به لنگر (#id) بخش‌های پرونده. */
const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
};

export const App = () => (
  <div className="flex min-h-full flex-col">
    <ScrollManager />
    <TopNav />
    <div className="flex-1">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dossier" element={<Dossier />} />
        <Route path="/report" element={<Report />} />
        <Route path="/mvp" element={<MvpLayout />}>
          <Route index element={<Marketplace />} />
          <Route path="listing/:id" element={<ListingDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="seller" element={<SellerDashboard />} />
          <Route path="seller/new" element={<NewListing />} />
          <Route path="seller/requests" element={<SellerRequests />} />
          <Route path="buyer/requests" element={<BuyerRequests />} />
          <Route path="buyer/orders" element={<BuyerOrders />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    <Footer />
    <Toasts />
  </div>
);

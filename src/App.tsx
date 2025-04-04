import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate, useMatch } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductPage from './pages/ProductPage';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CarnimoreModelsPage from './pages/CarnimoreModelsPage';
import DuracoatPage from './pages/DuracoatPage';
import MerchPage from './pages/MerchPage';
import OpticsPage from './pages/shop/OpticsPage';
import AccessoriesPage from './pages/shop/AccessoriesPage';
import NFAPage from './pages/shop/NFAPage';
import BarreledActionPage from './pages/shop/BarreledActionPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import AboutPage from './pages/AboutPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import AccountPage from './pages/AccountPage';
import AccountOrdersPage from './pages/AccountOrdersPage';
import AccountWishlistPage from './pages/AccountWishlistPage';
import NotFoundPage from './pages/NotFoundPage';
import TrainingPage from './pages/TrainingPage';
import InfoPage from './pages/InfoPage';
import LegalPage from './pages/LegalPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ShippingPage from './pages/ShippingPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentDeclinedPage from './pages/PaymentDeclinedPage';
import PaymentErrorPage from './pages/PaymentErrorPage';
import LoadingScreen from './components/LoadingScreen';
import AgeVerification from './components/AgeVerification';
import ScrollToTop from './components/ScrollToTop';
import CartDrawer from './components/Cart/CartDrawer';
import TrainingLandingPage from './pages/training/TrainingLandingPage';
import ProtectedRoute from './components/Admin/ProtectedRoute';

// Admin imports
import AdminDashboard from './pages/Admin/AdminDashboard';
import DashboardOverview from './pages/Admin/DashboardOverview';
import SalesPage from './pages/Admin/SalesPage';
import UsersPage from './pages/Admin/UsersPage';
import ProductsPage from './pages/Admin/ProductsPage';
import CategoriesPage from './pages/Admin/CategoriesPage';
import BlogPage from './pages/Admin/BlogPage';
import SettingsPage from './pages/Admin/SettingsPage';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're in the admin dashboard
  const isAdminDashboard = location.pathname.startsWith('/admin');
  
  // Check for training view parameter
  const isTrainingView = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') === 'training';
  }, [location.search]);
  
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setIsLoading(false);
    } else {
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };
  
  const handleAgeVerificationAccept = () => {
    setIsVerified(true);
  };
  
  const handleAgeVerificationDecline = () => {
    window.location.href = 'https://shop.hasbro.com/en-us/nerf';
  };

  return (
    <div className="layout-container">
      <ScrollToTop />
      
      {isTrainingView ? (
        <TrainingLandingPage />
      ) : (
        <>
          {!isVerified && (
            <AgeVerification 
              onAccept={handleAgeVerificationAccept} 
              onDecline={handleAgeVerificationDecline} 
            />
          )}
      
          {isVerified && (
            <>
              <LoadingScreen isLoading={isLoading} onLoadingComplete={handleLoadingComplete} />
              
              <div className={`flex-grow flex flex-col ${isLoading ? 'hidden' : ''}`}>
                {!isAdminDashboard && <Navbar />}
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                
                    {/* Category listing pages */}
                    <Route path="/shop/carnimore-models" element={<CarnimoreModelsPage />} />
                    <Route path="/shop/duracoat" element={<DuracoatPage />} />
                    <Route path="/shop/merch" element={<MerchPage />} />

                    {/* Accessories Subcategories */} 
                    <Route path="/shop/scope-covers" element={<AccessoriesPage />} />
                    <Route path="/shop/sunshades" element={<AccessoriesPage />} />
                    <Route path="/shop/ard" element={<AccessoriesPage />} />
                    <Route path="/shop/mounts" element={<AccessoriesPage />} />
                    <Route path="/shop/scope-accessories" element={<AccessoriesPage />} />
                    
                    <Route path="/shop/optics" element={<OpticsPage />} />
                    <Route path="/shop/accessories" element={<AccessoriesPage />} />
                    <Route path="/shop/nfa" element={<NFAPage />} />
                    <Route path="/shop/barreled-actions" element={<BarreledActionPage />} />
                    
                    {/* Unified product details route */}
                    <Route path="/shop/:categorySlug/:productSlug" element={<ProductDetailsPage />} />
                    
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    
                    {/* Account routes */}
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/account/orders" element={<AccountOrdersPage />} />
                    <Route path="/account/wishlist" element={<AccountWishlistPage />} />
                    
                    {/* Admin Dashboard Routes - Protected by ProtectedRoute */}
                    <Route path="/admin" element={<ProtectedRoute />}>
                      <Route element={<AdminDashboard />}>
                        <Route index element={<DashboardOverview />} />
                        <Route path="overview" element={<DashboardOverview />} />
                        <Route path="sales" element={<SalesPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="blog" element={<BlogPage />} />
                        <Route path="blog/settings" element={<SettingsPage />} />
                      </Route>
                    </Route>
                    
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/info" element={<InfoPage />} />
                    <Route path="/legal" element={<LegalPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/shipping" element={<ShippingPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/payment/success" element={<PaymentSuccessPage />} />
                    <Route path="/payment/declined" element={<PaymentDeclinedPage />} />
                    <Route path="/payment/error" element={<PaymentErrorPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                {!isAdminDashboard && <Footer />}
                <CartDrawer />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
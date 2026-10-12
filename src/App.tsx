import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import AuthPage from "@/pages/AuthPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import ContactPage from "@/pages/ContactPage";
import WishlistPage from "@/pages/WishlistPage";
import AccountPage from "@/pages/AccountPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import ReturnPolicyPage from "@/pages/ReturnPolicyPage";
import ShippingInfoPage from "@/pages/ShippingInfoPage";
import FAQPage from "@/pages/FAQPage";
import NotFound from "@/pages/NotFound";
import AboutPage from '@/pages/AboutPage';
import BlogPage from '@/pages/BlogPage';
import CareersPage from '@/pages/CareersPage';
import CartPage from '@/pages/CartPage';
import ScrollToTop from '@/components/ScrollToTop';
import PaymentCallback from '@/pages/PaymentCallback';
import ErrorBoundary from '@/components/ErrorBoundary';


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Sonner />
              <BrowserRouter>
              <ScrollToTop />
                <Routes>
                  <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/home-2" element={<HomePage />} />
                  <Route path="/home-2-2" element={<HomePage />} />
                  <Route path="/home-3" element={<HomePage />} />
                  <Route path="/home-4" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/shop-2" element={<ShopPage />} />
                  <Route path="/product-category/:categorySlug" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/cart-2" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout-2" element={<CheckoutPage />} />
                  <Route path="/order-tracking" element={<OrderTrackingPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/contact-us" element={<ContactPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/my-account" element={<AccountPage />} />
                  <Route path="/my-account-2" element={<AccountPage />} />
                  <Route path="/payment-callback" element={<PaymentCallback />} />
                  {/* Policy & Info pages */}
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/privacy-policy-2" element={<PrivacyPolicyPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/terms-and-conditions" element={<TermsOfServicePage />} />
                  <Route path="/return-policy" element={<ReturnPolicyPage />} />
                  <Route path="/refund-and-returns-policy" element={<ReturnPolicyPage />} />
                  <Route path="/refund_returns-2" element={<ReturnPolicyPage />} />
                  <Route path="/shipping-info" element={<ShippingInfoPage />} />
                  <Route path="/shipping-rates-and-policies" element={<ShippingInfoPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/help-center" element={<FAQPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/about-us" element={<AboutPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog-2" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

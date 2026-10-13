import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEOHead from '@/components/SEOHead';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf6ed]">
      <SEOHead />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}

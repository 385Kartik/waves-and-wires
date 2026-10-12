import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHeaderPurchase = () => {
    if (location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('open-purchase-drawer'));
    } else {
      navigate('/');
      setTimeout(() => window.dispatchEvent(new CustomEvent('open-purchase-drawer')), 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#faf7f0]/95 backdrop-blur-md border-b border-amber-900/10 transition-all shadow-xs">
      <div className="w-full max-w-[1700px] mx-auto px-3 xs:px-4 sm:px-10 lg:px-14 h-14 sm:h-20 flex items-center justify-between gap-2">
        
        {/* Brand Logo / Wordmark in Serif Italic Bright Gold Yellow */}
        <Link to="/" className="flex items-center gap-1 group shrink-0">
          <span className="font-serif italic text-lg xs:text-xl sm:text-3xl text-[#1a1714] font-normal tracking-tight group-hover:text-[#d97706] transition-colors">
            Waves <span className="font-serif italic text-[#d97706] group-hover:text-[#eab308]">Wires</span>
          </span>
        </Link>

        {/* Minimal Nav Anchor Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b5d4d]">
          <a href="/#overview" className="hover:text-[#d97706] transition-colors">Overview</a>
          <a href="/#design" className="hover:text-[#d97706] transition-colors">Design & Quality</a>
          <a href="/#details" className="hover:text-[#d97706] transition-colors">Details</a>
          <a href="/#features" className="hover:text-[#d97706] transition-colors">Features</a>
          <a href="/#reviews" className="hover:text-[#d97706] transition-colors">Reviews (30)</a>
        </nav>

        {/* Right Actions: Purchase Button, Account, Cart & Mobile Menu Toggle */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-4 shrink-0">
          <button
            onClick={handleHeaderPurchase}
            className="group relative inline-flex items-center border-2 border-[#eab308] bg-[#fffdf7] hover:bg-[#1a1714] text-[#1a1714] hover:text-[#facc15] px-2.5 xs:px-3 sm:px-6 py-1.5 sm:py-2.5 text-[9px] xs:text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.08em] xs:tracking-[0.14em] sm:tracking-[0.18em] transition-all shadow-xs hover:shadow-md whitespace-nowrap"
          >
            <span>PURCHASE</span>
            <span className="ml-1 xs:ml-1.5 sm:ml-2 text-[#d97706] group-hover:text-[#facc15] font-black text-[9px] xs:text-[10px] sm:text-[11px]">₹2,550</span>
            {/* Folded corner triangle decoration in bright gold yellow */}
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
          </button>

          {/* Account / Sign In Link */}
          <Link
            to={user ? '/account' : '/auth'}
            aria-label="Account"
            title={user ? 'My Account & Orders' : 'Sign In'}
            className="relative p-1.5 sm:p-2 text-[#1a1714] hover:text-[#d97706] transition-colors"
          >
            <User className="h-5 w-5 stroke-[1.5]" />
          </Link>

          {/* Minimal Cart Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="View Cart"
            className="relative p-1.5 sm:p-2 text-[#1a1714] hover:text-[#d97706] transition-colors"
          >
            <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#eab308] text-black text-[9px] font-black flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="md:hidden p-1.5 text-[#1a1714] hover:text-[#d97706] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#faf7f0] border-b border-amber-900/10 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b5d4d]">
            <a
              href="/#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-white/80 border border-amber-900/10 hover:border-[#eab308] text-[#1a1714]"
            >
              Overview
            </a>
            <a
              href="/#design"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-white/80 border border-amber-900/10 hover:border-[#eab308] text-[#1a1714]"
            >
              Design & Quality
            </a>
            <a
              href="/#details"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-white/80 border border-amber-900/10 hover:border-[#eab308] text-[#1a1714]"
            >
              Details
            </a>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-white/80 border border-amber-900/10 hover:border-[#eab308] text-[#1a1714]"
            >
              Features
            </a>
            <a
              href="/#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="col-span-2 px-3 py-2.5 rounded-lg bg-yellow-400/20 border border-[#eab308]/50 hover:border-[#eab308] text-[#1a1714] text-center"
            >
              ★ Customer Reviews (30)
            </a>
            <Link
              to={user ? '/account' : '/auth'}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-white/80 border border-amber-900/10 hover:border-[#eab308] text-[#1a1714]"
            >
              {user ? 'My Account' : 'Sign In / OTP'}
            </Link>
            <Link
              to="/order-tracking"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-white/80 border border-amber-900/10 hover:border-[#eab308] text-[#1a1714]"
            >
              Track Order
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

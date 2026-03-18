import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { label: 'Home',           path: '/' },
  { label: 'Shop',           path: '/shop' },
  { label: 'Order Tracking', path: '/order-tracking' },
  { label: 'Contact',        path: '/contact' },
];

export default function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const initials = user
    ? (user.full_name || user.email || '?').charAt(0).toUpperCase()
    : null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <header className="sticky h-20 top-0 z-50 border-b border-border bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80 shadow-sm shadow-border/50">
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        {/* Logo */}
<Link to="/" className="flex items-center shrink-0">
  <img
    src="/logo-light-final.png"
    alt="Waves & Wires"
    className="h-14 w-auto object-contain"
  />
</Link>
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map(link => {
            const active = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-all  ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}>
                {link.label}
                {active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-0.5">
          {/* Search */}
          <button onClick={() => setSearchOpen(v => !v)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
              searchOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}>
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Wishlist */}
          <Link to="/wishlist"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <Heart className="h-[18px] w-[18px]" />
          </Link>

          {/* Account — avatar when logged in */}
          <Link to={user ? '/account' : '/auth'}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-secondary">
            {user ? (
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-black text-primary-foreground leading-none">{initials}</span>
              </div>
            ) : (
              <span className="text-[11px] font-semibold text-muted-foreground border border-border rounded-full h-7 w-7 flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                ?
              </span>
            )}
          </Link>

          {/* Cart */}
          <button onClick={() => setIsOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow-sm">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all md:hidden ml-1">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-border bg-white px-4 py-3">
          <form onSubmit={handleSearch} className="container flex gap-2">
            <input type="text" placeholder="Search products…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 rounded-xl border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
              autoFocus />
            <button type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border bg-white p-3 md:hidden space-y-0.5">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                location.pathname === link.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-2 mt-2">
            <Link to={user ? '/account' : '/auth'} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
              {user ? (
                <>
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-black text-primary-foreground">{initials}</span>
                  </div>
                  <span>My Account <span className="text-xs font-normal text-muted-foreground">({user.full_name || user.email})</span></span>
                </>
              ) : (
                <>
                  <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center shrink-0 text-xs">?</div>
                  Sign In
                </>
              )}
            </Link>
            <Link to="/wishlist" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
              <Heart className="h-4 w-4 shrink-0" />Wishlist
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

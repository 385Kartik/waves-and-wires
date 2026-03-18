import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Youtube } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

      <div className="container py-10 sm:py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
                <span className="text-[11px] font-black text-primary-foreground">W&W</span>
              </div>
              <div>
                <span className="text-base font-black text-foreground">Waves</span>
                <span className="text-base font-black text-primary"> & Wires</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Premium tech and kitchen appliances for modern living. Quality you can trust.
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: Instagram, href: 'https://instagram.com' },
                { Icon: Twitter, href: 'https://twitter.com' },
                { Icon: Youtube, href: 'https://youtube.com' },
              ].map(({ Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                ['Home', '/'],
                ['Shop', '/shop'],
                ['Order Tracking', '/order-tracking'],
                ['Contact', '/contact'],
                ['My Account', '/account'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Policies</h3>
            <ul className="space-y-2.5">
              {[
                ['Privacy Policy', '/privacy-policy'],
                ['Terms of Service', '/terms-of-service'],
                ['Return Policy', '/return-policy'],
                ['Shipping Info', '/shipping-info'],
                ['FAQ', '/faq'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — live from store settings */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3">
              {/* Email */}
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                <a href={`mailto:${settings.store_email}`}
                  className="text-sm text-muted-foreground font-medium hover:text-primary transition-colors break-all">
                  {settings.store_email}
                </a>
              </li>
              {/* Phones — supports multiple */}
              {settings.store_phones.map((phone, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <a href={`tel:${phone.replace(/\s/g, '')}`}
                    className="text-sm text-muted-foreground font-medium hover:text-primary transition-colors">
                    {phone}
                  </a>
                </li>
              ))}
              {/* Address */}
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-secondary/50">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} {settings.store_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</Link>
            <Link to="/return-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Returns</Link>
            <Link to="/about" className="text-xs text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            <Link to="/blog" className="text-xs text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            <Link to="/careers" className="text-xs text-muted-foreground hover:text-primary transition-colors">Careers</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

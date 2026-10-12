import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-amber-900/10 text-[#1c1917]">
      {/* Top 4-Column Links Section */}
      <div className="w-full bg-[#f5f1e8] py-12 sm:py-16">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Column 1: Useful Links */}
            <div className="space-y-4">
              <h4 className="text-sm sm:text-[15px] font-bold text-[#111827]">
                Useful Links
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#64748b] font-medium">
                <li>
                  <Link to="/privacy-policy" className="hover:text-[#d97706] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund-and-returns-policy" className="hover:text-[#d97706] transition-colors">
                    Refund and Returns Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="hover:text-[#d97706] transition-colors">
                    Terms and Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Product Categories */}
            {/* <div className="space-y-4">
              <h4 className="text-sm sm:text-[15px] font-bold text-[#111827]">
                Product Categories
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#64748b] font-medium">
                <li>
                  <Link to="/product-category/coconut-scraper" className="hover:text-[#d97706] transition-colors">
                    Coconut Scraper
                  </Link>
                </li>
                <li>
                  <Link to="/product-category/uncategorized" className="hover:text-[#d97706] transition-colors">
                    Uncategorized
                  </Link>
                </li>
              </ul>
            </div> */}

            {/* Column 3: Let Us Help You */}
            <div className="space-y-4">
              <h4 className="text-sm sm:text-[15px] font-bold text-[#111827]">
                Let Us Help You
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#64748b] font-medium">
                <li>
                  <Link to="/my-account" className="hover:text-[#d97706] transition-colors">
                    My account
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-[#d97706] transition-colors">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-rates-and-policies" className="hover:text-[#d97706] transition-colors">
                    Shipping Rates &amp; Policies
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-[#d97706] transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/help-center" className="hover:text-[#d97706] transition-colors">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Get to Know Us */}
            <div className="space-y-4">
              <h4 className="text-sm sm:text-[15px] font-bold text-[#111827]">
                Get to Know Us
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#64748b] font-medium">
                {/* <li>
                  <Link to="/careers" className="hover:text-[#d97706] transition-colors">
                    Careers
                  </Link>
                </li> */}
                <li>
                  <Link to="/about-us" className="hover:text-[#d97706] transition-colors">
                    About Us
                  </Link>
                </li>
                {/* <li>
                  <Link to="/blog" className="hover:text-[#d97706] transition-colors">
                    Blog
                  </Link>
                </li> */}
                {/* <li>
                  <Link to="/wishlist" className="hover:text-[#d97706] transition-colors">
                    Wishlist
                  </Link>
                </li> */}
                <li>
                  <Link to="/contact-us" className="hover:text-[#d97706] transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom White Brand + Copyright + Payment Logos Section */}
      <div className="w-full bg-[#fffdf9] pt-10 pb-24 sm:py-12">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14">
          {/* Middle Row: Official Company Logo + Scroll To Top */}
          <div className="flex items-center justify-between pb-8 sm:pb-10">
            <Link to="/" className="inline-block">
              <img
                src="/logo.png"
                alt="Waves and Wires Technologies LLP"
                className="h-16 sm:h-20 md:h-24 w-auto object-contain"
              />
            </Link>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#d3dae2] hover:bg-[#eab308] text-[#1e293b] flex items-center justify-center transition-colors shadow-xs"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>

          {/* Horizontal Divider */}
          <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-[13px] text-[#64748b] font-medium text-center sm:text-left">
              Copyright @ 2025. Waves and Wires Technologies LLP
            </p>

            {/* Payment Method Logos */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              {/* VISA */}
              <div className="h-8 w-13 rounded bg-[#f4f6f8] border border-gray-200/80 flex items-center justify-center px-2 shadow-2xs">
                <span className="font-sans italic font-black text-[13px] tracking-tighter text-[#1a1f71]">
                  VISA
                </span>
              </div>

              {/* MasterCard */}
              <div className="h-8 w-13 rounded bg-[#f4f6f8] border border-gray-200/80 flex items-center justify-center px-1.5 shadow-2xs relative">
                <div className="flex items-center">
                  <span className="h-4 w-4 rounded-full bg-[#eb001b] inline-block" />
                  <span className="h-4 w-4 rounded-full bg-[#f79e1b] -ml-1.5 inline-block opacity-90" />
                </div>
                <span className="absolute text-[6px] font-black text-white tracking-tighter drop-shadow">
                  MasterCard
                </span>
              </div>

              {/* PayPal */}
              <div className="h-8 w-13 rounded bg-[#f4f6f8] border border-gray-200/80 flex items-center justify-center px-1.5 shadow-2xs">
                <span className="font-sans italic font-black text-[11px] tracking-tight">
                  <span className="text-[#003087]">Pay</span>
                  <span className="text-[#0079c1]">Pal</span>
                </span>
              </div>

              {/* Skrill */}
              <div className="h-8 w-13 rounded bg-[#f4f6f8] border border-gray-200/80 flex items-center justify-center px-1.5 shadow-2xs">
                <span className="font-sans font-black text-[11px] tracking-tight text-[#811e68]">
                  Skrill
                </span>
              </div>

              {/* Maestro */}
              <div className="h-8 w-13 rounded bg-[#f4f6f8] border border-gray-200/80 flex items-center justify-center px-1.5 shadow-2xs relative">
                <div className="flex items-center">
                  <span className="h-4 w-4 rounded-full bg-[#eb001b] inline-block" />
                  <span className="h-4 w-4 rounded-full bg-[#00a2e5] -ml-1.5 inline-block opacity-90" />
                </div>
                <span className="absolute text-[6px] font-black text-white tracking-tighter drop-shadow">
                  Maestro
                </span>
              </div>

              {/* VISA Electron */}
              <div className="h-8 w-14 rounded bg-[#f4f6f8] border border-gray-200/80 flex flex-col items-center justify-center px-1.5 leading-none shadow-2xs">
                <span className="font-sans italic font-black text-[10px] tracking-tighter text-[#1a1f71]">
                  VISA
                </span>
                <span className="text-[7px] font-bold text-[#1a1f71] -mt-0.5">
                  Electron
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

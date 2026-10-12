import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-[#151311] text-[#b3a89b] pt-12 pb-24 sm:py-16 md:py-20 border-t border-amber-900/20">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-10 lg:px-14">
        
        {/* 3 Minimalist Columns with Bright Gold Yellow Headers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 text-xs">
          
          {/* Column 1: Press / Company */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-[#eab308] uppercase tracking-[0.25em] text-[11px]">
              PRESS CONTACT
            </h5>
            <div className="space-y-1 text-[#e8e2d8] font-light leading-relaxed">
              <p className="font-medium text-white">Waves and Wires Technologies LLP</p>
              <p>Mumbai, Maharashtra</p>
              <p>India - 400001</p>
            </div>
            <p className="pt-1 text-[#a89d8f]">
              <a href="mailto:press@wavesandwires.com" className="hover:text-[#facc15] transition-colors break-all">
                press@wavesandwires.com
              </a>
            </p>
          </div>

          {/* Column 2: Sales Contact */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-[#eab308] uppercase tracking-[0.25em] text-[11px]">
              SALES CONTACT
            </h5>
            <div className="space-y-1 text-[#e8e2d8] font-light leading-relaxed">
              <p className="font-medium text-white">Waves and Wires Technologies LLP</p>
              <p>Wholesale & Kitchen Appliance Retail</p>
              <p>India Distribution Hub</p>
            </div>
            <p className="pt-1 text-[#a89d8f]">
              <a href="mailto:sales@wavesandwires.com" className="hover:text-[#facc15] transition-colors break-all">
                sales@wavesandwires.com
              </a>
            </p>
          </div>

          {/* Column 3: Customer Support */}
          <div className="space-y-2.5 sm:col-span-2 md:col-span-1">
            <h5 className="font-bold text-[#eab308] uppercase tracking-[0.25em] text-[11px]">
              CUSTOMER SUPPORT
            </h5>
            <div className="space-y-1 text-[#e8e2d8] font-light leading-relaxed">
              <p className="font-medium text-white">Official 1-Year Doorstep Warranty</p>
              <p>Invoice acts as official warranty card</p>
              <p>Free Cash on Delivery across India</p>
            </div>
            <p className="pt-1 text-[#facc15] font-medium">
              <a href="mailto:support@wavesandwires.com" className="hover:underline break-all">
                support@wavesandwires.com
              </a>
            </p>
          </div>

        </div>

        {/* Minimal Bottom Bar */}
        <div className="w-full border-t border-amber-900/20 mt-10 sm:mt-14 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8c8173] text-center sm:text-left">
          <p>© {new Date().getFullYear()} Waves and Wires Technologies LLP. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 text-[#b3a89b]">
            <Link to="/privacy-policy" className="hover:text-[#facc15] transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-[#facc15] transition-colors">Terms</Link>
            <Link to="/return-policy" className="hover:text-[#facc15] transition-colors">Return Policy</Link>
            <Link to="/order-tracking" className="hover:text-[#facc15] transition-colors">Track Order</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

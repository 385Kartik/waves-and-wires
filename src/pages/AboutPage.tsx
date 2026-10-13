export default function AboutPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-2">About Us</h1>
      <h2 className="text-lg sm:text-xl font-bold text-[#d97706] mb-6">
        Innovating Everyday Comfort Since 2017
      </h2>

      <div className="space-y-6 text-sm sm:text-[15px] text-[#374151] leading-relaxed">
        <p>
          Waves and Wires Technologies LLP, established on October 10, 2017, is dedicated to bringing convenience and innovation to your daily life. Specializing in modern electric appliances, we offer products like electric coconut scrapers, hand blenders, and hot water bags, all designed to simplify household tasks and enhance your comfort. Our mission is to deliver high-quality, user-friendly, and reliable products that make life easier for our customers. At Waves and Wires Technologies, we are committed to blending technology with practicality, ensuring that every product reflects our promise of quality and customer satisfaction. Experience the perfect mix of innovation and convenience.
        </p>

        <p>
          At Waves and Wires Technologies LLP, our vision is to revolutionize everyday living through innovative and efficient electric appliances. We aspire to become a trusted household name by consistently delivering high-quality products that simplify daily tasks and improve comfort. Committed to sustainability and innovation, we aim to integrate advanced technology into practical solutions that cater to the evolving needs of modern households. Our focus is on creating value for our customers while maintaining ethical business practices. By fostering trust, innovation, and reliability, we envision a future where every home experiences the ease and convenience our products bring.
        </p>

        {/* Corporate Credentials & Legal Details */}
        <div className="mt-8 pt-6 border-t border-amber-900/15">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#1c1917] mb-4">
            Corporate Credentials &amp; Business Registration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-[13px]">
            <div className="p-4 rounded-xl border border-amber-900/15 bg-[#fffdfa]">
              <span className="block text-[11px] font-bold uppercase text-[#8c6b32]">Legal Entity</span>
              <span className="font-semibold text-[#1c1917]">Waves and Wires Technologies LLP</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-900/15 bg-[#fffdfa]">
              <span className="block text-[11px] font-bold uppercase text-[#8c6b32]">Goods &amp; Services Tax (GSTIN)</span>
              <span className="font-bold text-[#d97706] tracking-wide">27AACFW7273M1ZI</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-900/15 bg-[#fffdfa]">
              <span className="block text-[11px] font-bold uppercase text-[#8c6b32]">Official Phone / WhatsApp</span>
              <a href="https://wa.me/916009595600" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#16a34a] hover:underline">
                +91 60095 95600
              </a>
            </div>
            <div className="p-4 rounded-xl border border-amber-900/15 bg-[#fffdfa]">
              <span className="block text-[11px] font-bold uppercase text-[#8c6b32]">Official Email</span>
              <a href="mailto:support@wavesandwires.in" className="font-semibold text-[#1c1917] hover:underline">
                support@wavesandwires.in
              </a>
            </div>
            <div className="p-4 rounded-xl border border-amber-900/15 bg-[#fffdfa] sm:col-span-2">
              <span className="block text-[11px] font-bold uppercase text-[#8c6b32]">Registered Office</span>
              <span className="text-[#4a4237]">
                005, Building no.12-B, Sangeet complex, Jesal Park, Bhayandar East, Thane, Maharashtra - 401105
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
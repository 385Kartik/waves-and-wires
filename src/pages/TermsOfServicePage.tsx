import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-6">Our Terms &amp; Conditions</h1>

      <div className="space-y-6 text-sm sm:text-[15px] text-[#374151] leading-relaxed">
        <p className="text-[#111827] font-medium">
          Welcome to Waves and Wires Technologies LLP! By accessing or using our website and purchasing our products, you agree to the following terms and conditions:
        </p>

        <ul className="list-disc pl-5 space-y-3.5">
          <li>
            <strong className="text-[#111827]">Product Information:</strong> All product descriptions, images, and specifications are accurate to the best of our knowledge. However, slight variations may occur.
          </li>
          <li>
            <strong className="text-[#111827]">Pricing:</strong> Prices are subject to change without prior notice. The price at the time of purchase will be honored.
          </li>
          <li>
            <strong className="text-[#111827]">Warranty &amp; Returns:</strong> Our products come with a limited warranty against manufacturing defects. Returns or exchanges are accepted within the specified period, subject to our{' '}
            <Link to="/refund-and-returns-policy" className="text-[#d97706] hover:underline font-medium">
              return policy
            </Link>
            .
          </li>
          <li>
            <strong className="text-[#111827]">Usage:</strong> Products must be used as per the instructions provided. We are not liable for any damages caused by improper use.
          </li>
          <li>
            <strong className="text-[#111827]">Privacy:</strong> We respect your privacy and are committed to protecting your personal information as outlined in our{' '}
            <Link to="/privacy-policy" className="text-[#d97706] hover:underline font-medium">
              Privacy Policy
            </Link>
            .
          </li>
          <li>
            <strong className="text-[#111827]">Liability:</strong> Waves and Wires Technologies LLP is not responsible for any indirect or consequential damages resulting from the use of our products.
          </li>
          <li>
            <strong className="text-[#111827]">Dispute Resolution:</strong> Any disputes shall be governed by the laws of India and resolved through arbitration in accordance with Indian laws.
          </li>
          <li>
            <strong className="text-[#111827]">Changes to Terms:</strong> We reserve the right to update these terms and conditions at any time. Continued use of our services constitutes acceptance of the updated terms.
          </li>
        </ul>

        <p className="pt-2 text-[#111827] font-medium">
          By using our services, you agree to comply with these terms. If you have any questions, please{' '}
          <Link to="/contact-us" className="text-[#d97706] hover:underline font-semibold">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
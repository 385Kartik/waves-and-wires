import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  User,
  Globe,
  SquarePen,
  CheckCircle,
  FileCheck2,
  ChevronDown,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { contactAdminHtml } from '@/lib/email';
import { apiClient } from '@/api/client';

export default function ContactPage() {
  const { settings } = useStoreSettings();
  const [form, setForm] = useState({
    enquiryType: 'General Enquiry',
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    consent: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent) {
      toast.error('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    setSending(true);
    try {
      const clean = (s: string) => s.replace(/[<>]/g, '').trim().slice(0, 2000);
      const subjectLine = `${form.enquiryType}${form.company ? ` — ${clean(form.company)}` : ''}`;
      const fullMessage = `Phone: ${clean(form.phone)}\nCompany: ${clean(form.company) || 'N/A'}\nEnquiry Type: ${clean(form.enquiryType)}\n\n${clean(form.message)}`;

      const sanitized = {
        name: clean(form.name),
        email: form.email.trim().toLowerCase(),
        subject: subjectLine,
        message: fullMessage,
      };

      const res: any = await apiClient.post('/contact_messages', sanitized);
      if (!res?.success && !res?.data?.success) throw new Error('Failed to send message');

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.store_email || 'support@wavesandwires.in',
          subject: `[Contact Form] ${sanitized.subject}`,
          html: contactAdminHtml(sanitized.name, sanitized.email, sanitized.subject, sanitized.message),
        }),
      }).catch(() => {});

      setSent(true);
      setForm({
        enquiryType: 'General Enquiry',
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        consent: false,
      });
      toast.success("Message sent! We'll get back to you shortly.");
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    'w-full border border-amber-900/20 bg-[#faf5ea] pl-11 pr-4 py-3.5 text-sm text-[#1c1917] placeholder:text-[#8c7e6d] outline-none focus:border-[#eab308] focus:bg-[#fffdf9] transition-all';

  return (
    <div className="w-full bg-[#faf6ed] text-[#1c1917]">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14 space-y-8 sm:space-y-12">
        {/* Page Header */}
        <div className="border-b border-amber-900/10 pb-5">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d97706] block">
            GET IN TOUCH
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#1c1917] tracking-tight uppercase mt-1">
            CONTACT WAVES &amp; WIRES
          </h1>
        </div>

        {/* Top 2-Column Grid: Left Info Stack | Right Send a Message Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Corporate & Support + Sales Department + Social Media */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Corporate & Support */}
            <div className="border-2 border-[#eab308] bg-[#fffdf8] p-6 sm:p-8 shadow-sm space-y-6 relative">
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
              <div className="flex items-center gap-2.5 border-b border-amber-900/10 pb-3.5">
                <span className="h-2.5 w-2.5 rotate-45 bg-[#eab308] shrink-0" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#1c1917]">
                  Corporate &amp; Support
                </h2>
              </div>

              <div className="space-y-5">
                {/* HQ Address */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      Waves &amp; Wires HQ
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#5c5346] leading-relaxed mt-1">
                      005, Building no.12-B, Sangeet complex,
                      <br />
                      Jesal Park, Bhayandar East, Thane,
                      <br />
                      Maharashtra - 401105
                    </p>
                  </div>
                </div>

                {/* GST Registration */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      GST Registration
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 border border-[#eab308]/60 bg-yellow-400/20 text-[#92400e] text-[11px] font-black tracking-wider">
                      27BQXPS4248A1ZE
                    </span>
                  </div>
                </div>

                {/* Direct Phone */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      Direct Phone
                    </p>
                    <a
                      href="tel:+916009595600"
                      className="text-sm font-black text-[#1c1917] hover:text-[#d97706] transition-colors mt-0.5 block"
                    >
                      +91 60095 95600
                    </a>
                  </div>
                </div>

                {/* Email Support */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      Email Support
                    </p>
                    <a
                      href="mailto:support@wavesandwires.in"
                      className="text-xs sm:text-[13px] font-semibold text-[#5c5346] hover:text-[#d97706] transition-colors mt-0.5 block break-all"
                    >
                      support@wavesandwires.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Sales Department */}
            <div className="border-2 border-[#eab308] bg-[#fffdf8] p-6 sm:p-8 shadow-sm space-y-6 relative">
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
              <div className="flex items-center justify-between gap-2 border-b border-amber-900/10 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rotate-45 bg-[#eab308] shrink-0" />
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#1c1917]">
                    Sales Department
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 border border-green-600/30 bg-green-500/10 text-green-800 text-[10px] font-black uppercase tracking-widest">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-5">
                {/* Timings */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      Timings
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#5c5346] leading-relaxed mt-1">
                      Monday to Saturday
                      <br />
                      10:00 AM to 07:00 PM
                    </p>
                  </div>
                </div>

                {/* Sales Helpline */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      Sales Helpline
                    </p>
                    <a
                      href="tel:+916009595600"
                      className="text-sm font-black text-[#1c1917] hover:text-[#d97706] transition-colors mt-0.5 block"
                    >
                      +91 60095 95600
                    </a>
                  </div>
                </div>

                {/* Sales Email */}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border border-[#eab308]/60 bg-yellow-400/15 flex items-center justify-center shrink-0 text-[#d97706]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#1c1917]">
                      Sales Email
                    </p>
                    <a
                      href="mailto:sales@wavesandwires.in"
                      className="text-xs sm:text-[13px] font-semibold text-[#5c5346] hover:text-[#d97706] transition-colors mt-0.5 block break-all"
                    >
                      sales@wavesandwires.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Connect on Social Media */}
            <div className="border-2 border-[#eab308] bg-[#fffdf8] p-6 shadow-sm text-center space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8c6b32]">
                CONNECT ON SOCIAL MEDIA
              </p>
              <div className="flex items-center justify-center gap-3">
                {[
                  { href: 'https://wa.me/916009595600', label: 'WhatsApp', Icon: MessageCircle },
                  { href: 'https://www.instagram.com/wavesandwirestech', label: 'Instagram', Icon: Instagram },
                  { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
                  { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
                  { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-11 w-11 border border-[#eab308] bg-[#faf5ea] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#facc15] flex items-center justify-center transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Send a Message Form Card */}
          <div className="lg:col-span-7">
            <div className="border-2 border-[#eab308] bg-[#fffdf8] p-6 sm:p-10 shadow-sm relative">
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
              {sent ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="h-16 w-16 border-2 border-[#eab308] bg-yellow-400/20 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-[#d97706]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-wider text-[#1c1917]">
                      Message Sent!
                    </h3>
                    <p className="text-sm text-[#5c5346] mt-1">
                      Thank you for reaching out. Our representative will call you back shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-2 border-2 border-[#eab308] bg-[#1c1917] text-[#facc15] hover:bg-[#eab308] hover:text-[#1c1917] px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="border-b border-amber-900/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d97706] block">
                      DIRECT ENQUIRY
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#1c1917] mt-1">
                      Send a Message
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5c5346] mt-1">
                      Have inquiries? Write to us, and our representative will call you back shortly.
                    </p>
                  </div>

                  {/* Enquiry Type */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8c6b32]">
                      ENQUIRY TYPE
                    </label>
                    <div className="relative">
                      <select
                        value={form.enquiryType}
                        onChange={(e) => setForm((f) => ({ ...f, enquiryType: e.target.value }))}
                        className="w-full appearance-none border border-amber-900/20 bg-[#faf5ea] px-4 py-3.5 pr-10 text-sm font-bold text-[#1c1917] outline-none focus:border-[#eab308] focus:bg-[#fffdf9] transition-all cursor-pointer"
                      >
                        <option value="General Enquiry">General Enquiry</option>
                        <option value="Order & Shipping Support">Order &amp; Shipping Support</option>
                        <option value="Product Warranty & Service">Product Warranty &amp; Service</option>
                        <option value="Return & Refund Request">Return &amp; Refund Request</option>
                        <option value="Bulk / Wholesale Enquiry">Bulk / Wholesale Enquiry</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#d97706] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 1: Your Name & E-Mail Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8c6b32]">
                        YOUR NAME
                      </label>
                      <div className="relative">
                        <User className="h-4 w-4 text-[#d97706] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          required
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Rahul Sharma"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8c6b32]">
                        E-MAIL ADDRESS
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-[#d97706] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Mobile Number & Company Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8c6b32]">
                        MOBILE NUMBER
                      </label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-[#d97706] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          required
                          type="tel"
                          maxLength={15}
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="9876543210"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8c6b32]">
                        COMPANY NAME
                      </label>
                      <div className="relative">
                        <Globe className="h-4 w-4 text-[#d97706] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                          placeholder="Optional"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8c6b32]">
                      MESSAGE
                    </label>
                    <div className="relative">
                      <SquarePen className="h-4 w-4 text-[#d97706] absolute left-4 top-4" />
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder="Tell us about the appliance or service you are interested in..."
                        className={`${inputCls} resize-y`}
                      />
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-3 border border-amber-900/15 bg-[#faf5ea] p-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 accent-[#d97706] shrink-0"
                    />
                    <span className="text-xs text-[#5c5346] leading-relaxed">
                      * By submitting, I agree to the{' '}
                      <Link to="/terms-and-conditions" className="font-bold text-[#d97706] hover:underline">
                        Terms &amp; Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" className="font-bold text-[#d97706] hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      and consent to receive updates through SMS/Email/WhatsApp.
                    </span>
                  </label>

                  {/* Submit Button in Signature Waves & Wires Gold/Espresso Theme */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="relative group w-full border-2 border-[#eab308] bg-[#1c1917] hover:bg-[#eab308] text-[#facc15] hover:text-[#1c1917] disabled:opacity-50 py-4 text-xs sm:text-sm font-black uppercase tracking-[0.22em] transition-all active:scale-[0.99]"
                  >
                    <span>{sending ? 'SENDING MESSAGE...' : 'SEND MESSAGE'}</span>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#eab308] group-hover:bg-[#1c1917] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Our Location Section */}
        <div className="border-2 border-[#eab308] bg-[#fffdf8] p-4 sm:p-8 shadow-sm space-y-5 relative">
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d97706] block">
              HEADQUARTERS &amp;SHOWROOM
            </span>
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-[#1c1917]">
              Our Location
            </h2>
          </div>

          <div className="border-2 border-amber-900/15 overflow-hidden bg-[#faf5ea]">
            <iframe
              title="Waves and Wires Technologies LLP Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.588296426612!2d72.8594!3d19.3008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b02969ab5929%3A0x8f8a987b88702418!2sSangeet%20Complex%2C%20Jesal%20Park%2C%20Bhayandar%20East%2C%20Mira%20Bhayandar%2C%20Maharashtra%20401105!5e0!3m2!1sen!2sin!4v1710000000000"
              width="100%"
              height="420"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <p className="text-xs sm:text-sm text-[#5c5346] text-center font-semibold">
            Visit us at Waves &amp; Wires Technologies LLP — Jesal Park, Bhayandar East, Mumbai!
          </p>
        </div>
      </div>
    </div>
  );
}
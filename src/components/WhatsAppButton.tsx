import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, User, Phone, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

export default function WhatsAppButton() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const officialNumber = '916009595600';

  // Pre-fill from user or localStorage
  useEffect(() => {
    if (user) {
      if (user.full_name && user.full_name !== 'Customer') setName(user.full_name);
      if (user.phone) setPhone(user.phone.replace(/\D/g, '').slice(-10));
    } else {
      try {
        const saved = localStorage.getItem('ww_guest_lead');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) setName(parsed.name);
          if (parsed.phone) setPhone(parsed.phone);
        }
      } catch { /* ignore */ }
    }
  }, [user]);

  // Listen to external custom events (e.g. from Footer or Contact Page)
  useEffect(() => {
    const handleCustom = (e: any) => {
      const detailQty = e.detail?.quantity;
      if (detailQty) setQuantity(Number(detailQty) || 1);
      handleClick();
    };
    window.addEventListener('open-whatsapp-lead', handleCustom);
    return () => window.removeEventListener('open-whatsapp-lead', handleCustom);
  }, [user, name, phone]);

  function openWhatsAppUrl(custName: string, custQty: number) {
    const greeting = custName.trim()
      ? `Hello Waves & Wires, my name is ${custName.trim()}. I am interested in ${custQty} unit(s) of the Electric Coconut Scraper.`
      : 'Hello Waves & Wires, I am interested in your products and have an inquiry.';
    const url = `https://wa.me/${officialNumber}?text=${encodeURIComponent(greeting)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleClick(e?: React.MouseEvent) {
    if (e) e.preventDefault();

    // If user is logged in and has phone, capture lead directly & open
    if (user && user.phone) {
      const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);
      apiClient.post('/leads', {
        name: user.full_name || 'Customer',
        phone: cleanPhone,
        email: user.email?.endsWith('@ww.internal') ? '' : user.email,
        source: 'whatsapp',
        quantity: quantity || 1,
        product_name: 'Electric Coconut Scraper',
        status: 'new_lead',
        notes: 'Contacted via WhatsApp button while logged in',
        user_id: user.id,
      }).catch((err) => console.warn('[CRM WhatsApp Lead Error]', err));

      openWhatsAppUrl(user.full_name || '', quantity || 1);
      return;
    }

    // Check if guest info already saved
    try {
      const saved = localStorage.getItem('ww_guest_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.phone && parsed.phone.length >= 10) {
          apiClient.post('/leads', {
            name: parsed.name,
            phone: parsed.phone,
            source: 'whatsapp',
            quantity: quantity || 1,
            product_name: 'Electric Coconut Scraper',
            status: 'new_lead',
            notes: 'Returning visitor contacted via WhatsApp button',
          }).catch(() => {});

          openWhatsAppUrl(parsed.name, quantity || 1);
          return;
        }
      }
    } catch { /* ignore */ }

    // Otherwise open modal to capture Name & Phone
    setModalOpen(true);
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save to CRM Backend
      await apiClient.post('/leads', {
        name: name.trim(),
        phone: cleanDigits,
        source: 'whatsapp',
        quantity: quantity || 1,
        product_name: 'Electric Coconut Scraper',
        status: 'new_lead',
        notes: `WhatsApp chat initiated from website (Quantity: ${quantity})`,
      });

      // 2. Cache in localStorage
      localStorage.setItem('ww_guest_lead', JSON.stringify({ name: name.trim(), phone: cleanDigits }));

      // 3. Open WhatsApp
      openWhatsAppUrl(name.trim(), quantity || 1);
      setModalOpen(false);
      toast.success('Connecting to Waves & Wires on WhatsApp...');
    } catch (err: any) {
      // Even if network glitches, still open WhatsApp
      openWhatsAppUrl(name.trim(), quantity || 1);
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-20 xs:bottom-[82px] sm:bottom-6 right-3.5 sm:right-6 z-40 flex items-center group">
        {/* Subtle Tooltip on Hover (Desktop) */}
        <div className="hidden sm:flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-[#1c1917] text-white text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-white/10">
          <span>Chat on WhatsApp</span>
          <span className="text-emerald-400 font-bold ml-1.5">• Online</span>
        </div>

        {/* Floating WhatsApp Action Button */}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Chat with Waves and Wires on WhatsApp (+91 60095 95600)"
          className="relative flex items-center justify-center w-12 h-12 xs:w-13 xs:h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
        >
          {/* Subtle breathing glow ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

          {/* WhatsApp Official SVG Icon */}
          <svg
            className="w-6.5 h-6.5 xs:w-7 xs:h-7 sm:w-8 sm:h-8 fill-current relative z-10 drop-shadow-sm"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.507 14.307l-.009.075c-2.199-1.096-2.429-1.242-2.713-.823-.189.279-.734.916-.9 1.102-.164.187-.332.209-.618.068-.285-.143-1.21-.444-2.306-1.418-.85-.756-1.425-1.69-1.591-1.976-.167-.286-.02-.44.125-.582.13-.129.289-.335.434-.503.144-.169.19-.287.287-.478.095-.19.048-.358-.024-.502-.071-.143-.642-1.547-.88-2.119-.232-.555-.467-.479-.643-.488-.166-.008-.357-.01-.548-.01s-.5.071-.762.357c-.262.286-1 1.001-1 2.441s1.024 2.827 1.167 3.018c.143.19 2.016 3.078 4.883 4.316.682.295 1.214.472 1.629.603.684.218 1.307.187 1.8.114.549-.082 1.688-.69 1.926-1.356.237-.667.237-1.24.166-1.357-.07-.116-.261-.187-.546-.33z" />
            <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.946 3.71 1.444 5.71 1.445h.005c6.581 0 11.94-5.335 11.944-11.894 0-3.18-1.24-6.17-3.474-8.45zM12.05 21.785h-.004c-1.781 0-3.527-.477-5.05-1.378l-.362-.214-3.755.98.999-3.639-.235-.374c-.991-1.575-1.513-3.4-1.513-5.267.003-5.451 4.455-9.888 9.923-9.888 2.65 0 5.14 1.03 7.012 2.898 1.872 1.868 2.902 4.35 2.901 6.993-.004 5.452-4.456 9.889-9.916 9.889z" />
          </svg>
        </button>
      </div>

      {/* ── WhatsApp Lead Capture Modal (Shown if not logged in) ─────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm rounded-3xl bg-[#faf6ed] border-2 border-[#eab308] p-6 shadow-2xl text-[#1c1917] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Chat on WhatsApp</h3>
                  <p className="text-[11px] text-[#8c6b32] font-semibold">Official Waves &amp; Wires Support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-stone-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#5c5346] leading-relaxed">
              Please enter your details below so our team can assist you directly on WhatsApp.
            </p>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8c6b32] mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c7e6d]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-amber-900/20 bg-white py-2.5 pl-10 pr-3 text-sm text-[#1c1917] placeholder:text-[#8c7e6d] outline-none focus:border-[#eab308] focus:ring-2 focus:ring-[#eab308]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8c6b32] mb-1">
                  WhatsApp Number *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#8c6b32] select-none">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-amber-900/20 bg-white py-2.5 pl-12 pr-3 text-sm font-medium text-[#1c1917] placeholder:text-[#8c7e6d] outline-none focus:border-[#eab308] focus:ring-2 focus:ring-[#eab308]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8c6b32] mb-1">
                  Quantity Required
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(1)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      quantity === 1
                        ? 'border-[#eab308] bg-yellow-400/20 text-[#1c1917]'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    1 Unit (₹2,300)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity(2)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      quantity === 2
                        ? 'border-[#eab308] bg-yellow-400/20 text-[#1c1917]'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    2 Units Combo (Save ₹200)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Connecting...' : 'Start WhatsApp Chat'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

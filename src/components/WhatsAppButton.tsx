import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const phoneNumber = '916009595600';
  const defaultMessage = encodeURIComponent(
    'Hello Waves & Wires, I am interested in your products and have an inquiry.'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center group">
      {/* Subtle Tooltip on Hover */}
      <div className="hidden sm:flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-[#1c1917] text-white text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-white/10">
        <span>Chat on WhatsApp</span>
        <span className="text-emerald-400 font-bold ml-1.5">• Online</span>
      </div>

      {/* Floating WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Waves and Wires on WhatsApp (+91 60095 95600)"
        className="relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Subtle breathing glow ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

        {/* WhatsApp Official SVG Icon */}
        <svg
          className="w-8 h-8 fill-current relative z-10 drop-shadow-sm"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.507 14.307l-.009.075c-2.199-1.096-2.429-1.242-2.713-.823-.189.279-.734.916-.9 1.102-.164.187-.332.209-.618.068-.285-.143-1.21-.444-2.306-1.418-.85-.756-1.425-1.69-1.591-1.976-.167-.286-.02-.44.125-.582.13-.129.289-.335.434-.503.144-.169.19-.287.287-.478.095-.19.048-.358-.024-.502-.071-.143-.642-1.547-.88-2.119-.232-.555-.467-.479-.643-.488-.166-.008-.357-.01-.548-.01s-.5.071-.762.357c-.262.286-1 1.001-1 2.441s1.024 2.827 1.167 3.018c.143.19 2.016 3.078 4.883 4.316.682.295 1.214.472 1.629.603.684.218 1.307.187 1.8.114.549-.082 1.688-.69 1.926-1.356.237-.667.237-1.24.166-1.357-.07-.116-.261-.187-.546-.33z" />
          <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.946 3.71 1.444 5.71 1.445h.005c6.581 0 11.94-5.335 11.944-11.894 0-3.18-1.24-6.17-3.474-8.45zM12.05 21.785h-.004c-1.781 0-3.527-.477-5.05-1.378l-.362-.214-3.755.98.999-3.639-.235-.374c-.991-1.575-1.513-3.4-1.513-5.267.003-5.451 4.455-9.888 9.923-9.888 2.65 0 5.14 1.03 7.012 2.898 1.872 1.868 2.902 4.35 2.901 6.993-.004 5.452-4.456 9.889-9.916 9.889z" />
        </svg>
      </a>
    </div>
  );
}

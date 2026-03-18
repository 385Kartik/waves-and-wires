import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    category: 'Orders & Payments',
    items: [
      { q: 'How do I place an order?', a: 'Browse our products, add items to your cart, and proceed to checkout. You can pay via Cash on Delivery or online through Razorpay (UPI, debit/credit card, net banking).' },
      { q: 'Can I modify my order after placing it?', a: 'Orders can be modified (or cancelled) only if they are in "Pending" or "Confirmed" status. Once processing or shipped, modifications are not possible. Contact us immediately at hello@wavesandwires.com.' },
      { q: 'Is it safe to use my card on your website?', a: 'Yes. All payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We never store your card details on our servers.' },
      { q: 'What payment methods are accepted?', a: 'We accept UPI (PhonePe, GPay, Paytm), Debit/Credit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery.' },
      { q: 'I applied a coupon but it says "not a function" error. What should I do?', a: 'This was a known bug that has been fixed. Please refresh your browser and try again. If the issue persists, contact support.' },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      { q: 'How long does delivery take?', a: 'Metro cities: 2–3 business days. Tier 2 cities: 3–5 days. Rest of India: 5–7 days. See our Shipping Info page for complete details.' },
      { q: 'Is there free shipping?', a: 'Yes! Orders above ₹999 ship for free across most of India (excluding remote areas).' },
      { q: 'How do I track my order?', a: 'Visit the Order Tracking page and enter your order number (e.g. WW-0001234). You can also find it in your order confirmation email.' },
      { q: 'What if my package is damaged during delivery?', a: 'If you receive a visibly damaged package, please refuse the delivery and contact us immediately with photos. We\'ll arrange a replacement at no extra cost.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'What is your return policy?', a: 'We offer a 7-day return window from the date of delivery for defective, damaged, or incorrectly delivered products. See our Return Policy for complete details.' },
      { q: 'How do I request a refund?', a: 'Go to My Orders (Order Tracking page → My Orders tab), find your order, and click "Request Refund". Fill in the reason and submit. Our team reviews within 24–48 hours.' },
      { q: 'How long does a refund take?', a: 'Once approved, refunds are processed within 5–7 business days to your original payment method. COD refunds are made via bank transfer.' },
      { q: 'Can I exchange instead of refund?', a: 'Currently we only process refunds, not direct exchanges. You can place a new order for the replacement item after receiving your refund.' },
    ],
  },
  {
    category: 'Account & Reviews',
    items: [
      { q: 'Do I need an account to order?', a: 'You must be signed in to place an order. Creating an account is free and takes under a minute.' },
      { q: 'How do I write a product review?', a: 'Go to the product page, scroll down to the Reviews tab, and click "Write a Review". You must be signed in. Reviews from verified purchasers are highlighted with a "Verified Purchase" badge.' },
      { q: 'Can I edit or delete my review?', a: 'Yes, go to the product page, click the Reviews tab, and you\'ll see your review with an "Edit your review" link below it.' },
      { q: 'I forgot my password. What do I do?', a: 'On the sign-in page, click "Forgot password?" and enter your email. You\'ll receive a password reset link within a few minutes.' },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-none">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-4 w-full py-4 text-left">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground leading-relaxed pb-4 pr-8">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Find quick answers to common questions</p>
        </div>
      </div>

      <div className="space-y-5">
        {faqs.map(({ category, items }) => (
          <div key={category} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary/50 px-6 py-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">{category}</h2>
            </div>
            <div className="px-6">
              {items.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-foreground">Still have questions?</p>
        <p className="text-sm text-muted-foreground">Our support team is happy to help</p>
        <Link to="/contact"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
          Contact Us
        </Link>
      </div>
    </div>
  );
}

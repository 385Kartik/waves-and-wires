import { RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ReturnPolicyPage() {
  const eligible = [
    'Product is defective or damaged on arrival',
    'Wrong product delivered',
    'Product is significantly different from description',
    'Product is incomplete (missing parts/accessories)',
  ];
  const notEligible = [
    'Change of mind after 7 days of delivery',
    'Product has been used or damaged by customer',
    'Seal / packaging broken by customer (for sealed electronics)',
    'Product not in original packaging',
    'Customised or personalised items',
  ];

  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <RotateCcw className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Return Policy</h1>
          <p className="text-xs text-muted-foreground mt-0.5">7-day hassle-free returns</p>
        </div>
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Clock, label: '7-Day Window', sub: 'From delivery date' },
          { icon: RotateCcw, label: 'Free Pickup', sub: 'We collect from you' },
          { icon: CheckCircle, label: 'Full Refund', sub: 'Within 5–7 days' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">How to Return</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Initiate Return', desc: 'Go to My Orders → select your order → click "Request Refund". Provide the reason for return.' },
              { step: '2', title: 'Approval', desc: 'Our team reviews your request within 24–48 hours and approves if eligible.' },
              { step: '3', title: 'Pickup', desc: 'Our logistics partner picks up the product from your delivery address. Keep the item in original packaging.' },
              { step: '4', title: 'Inspection', desc: 'We inspect the returned product at our warehouse within 2–3 business days.' },
              { step: '5', title: 'Refund', desc: 'Once approved, refund is processed to your original payment method within 5–7 business days.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-primary-foreground">{step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />Eligible for Return
            </h2>
            <ul className="space-y-2">
              {eligible.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />Not Eligible
            </h2>
            <ul className="space-y-2">
              {notEligible.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Refund Methods</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p><strong className="text-foreground">Online payments (Razorpay):</strong> Refunded to the original payment source (UPI, card, net banking) within 5–7 business days.</p>
            <p><strong className="text-foreground">Cash on Delivery:</strong> Refunded to your bank account via NEFT. Share your bank details when initiating the return.</p>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Note:</strong> In case of a defective product, please take an unboxing video as evidence. This speeds up the approval process significantly.
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-foreground">Need Help?</h2>
          <p className="text-sm text-muted-foreground">Contact our support team at <a href="mailto:hello@wavesandwires.com" className="text-primary hover:underline font-medium">hello@wavesandwires.com</a> or call <a href="tel:+919876543210" className="text-primary hover:underline font-medium">+91 98765 43210</a>.</p>
        </div>
      </div>
    </div>
  );
}

import { RotateCcw, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <RotateCcw className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Return & Refund Policy</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Waves and Wires Technologies LLP</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6 text-sm text-amber-800">
        At Waves and Wires Technologies LLP, we strive to ensure customer satisfaction with every purchase. If you are not completely satisfied, please review our Return & Refund Policy below.
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Clock,        label: '7-Day Window',  sub: 'From delivery date' },
          { icon: RotateCcw,    label: 'Easy Returns',  sub: 'Contact us to initiate' },
          { icon: CheckCircle,  label: 'Full Refund',   sub: 'Within 7–10 business days' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-7">

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Eligibility for Returns</h2>
          <ul className="space-y-2">
            {[
              'Products can be returned within 7 days of delivery.',
              'The item must be unused, in its original packaging, and accompanied by the original receipt or proof of purchase.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Non-Returnable Items</h2>
          <ul className="space-y-2">
            {[
              'Products damaged due to misuse or negligence.',
              'Items without original packaging or missing accessories.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Process for Returns</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Contact Support', desc: 'Reach out to our customer support team with your order details to initiate a return.' },
              { step: '2', title: 'Approval', desc: 'Our team will review your request and approve if eligible.' },
              { step: '3', title: 'Ship the Product', desc: 'Once approved, ship the product back to our specified address. Shipping is at the customer\'s expense unless the item is defective.' },
              { step: '4', title: 'Inspection & Refund', desc: 'We inspect the returned product and process your refund within 7–10 business days.' },
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

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Refund Policy</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />Refunds are processed after inspection of the returned product.</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />Approved refunds will be credited to the original payment method within <strong className="text-foreground">7–10 business days</strong>.</li>
            <li className="flex items-start gap-2"><XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />Shipping charges (if any) are non-refundable.</li>
          </ul>
        </div>

        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            5. Damaged or Defective Items
          </h2>
          <p className="text-sm text-muted-foreground">
            If the product arrives damaged or defective, please notify us <strong className="text-foreground">within 48 hours of delivery</strong>. We will arrange for a replacement or full refund at no additional cost.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Contact Us</h2>
          <p className="text-sm text-muted-foreground">For any return or refund-related queries, please contact our customer support team.</p>
          <a href="mailto:support@wavesandwires.in"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Mail className="h-4 w-4" />support@wavesandwires.in
          </a>
        </div>

        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 text-center font-medium">
          We value your trust and aim to provide a hassle-free shopping experience! 🎉
        </div>
      </div>
    </div>
  );
}
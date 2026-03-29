import { Truck, Clock, MapPin, Package } from 'lucide-react';

export default function ShippingInfoPage() {
  const zones = [
    { zone: 'Metro Cities', cities: 'Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata', time: '2–3 business days', cost: 'Free above ₹999, else ₹99' },
    { zone: 'Tier 2 Cities', cities: 'Ahmedabad, Jaipur, Surat, Lucknow, Nagpur, Indore, Bhopal, etc.', time: '3–5 business days', cost: 'Free above ₹999, else ₹99' },
    { zone: 'Rest of India', cities: 'All other serviceable pin codes', time: '5–7 business days', cost: 'Free above ₹999, else ₹99' },
    { zone: 'Remote Areas', cities: 'J&K, Andaman & Nicobar, Lakshadweep, North East', time: '7–10 business days', cost: '₹149 flat (no free shipping)' },
  ];

  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shipping Information</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Fast & reliable delivery across India</p>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Package, label: 'Free Shipping', sub: 'Orders above ₹999' },
          { icon: Clock, label: 'Same Day Dispatch', sub: 'Orders before 2 PM' },
          { icon: Truck, label: 'Pan-India', sub: '28,000+ pin codes' },
          { icon: MapPin, label: 'Live Tracking', sub: 'Track your order' },
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

      <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Shipping Partners</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We ship through trusted logistics partners including Delhivery, BlueDart, and Ekart to ensure safe and timely delivery of your orders.</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Delivery Timelines & Charges</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/70">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Zone</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Cities</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.map(({ zone, cities, time, cost }) => (
                  <tr key={zone} className="bg-card hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{zone}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{cities}</td>
                    <td className="px-4 py-3 text-muted-foreground">{time}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">* Business days exclude Sundays and public holidays.</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Order Tracking</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Once your order is shipped, you'll receive a tracking number via email/SMS. You can also track your order at any time from the <a href="/order-tracking" className="text-primary hover:underline font-medium">Order Tracking</a> page.</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Packaging</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">All products are packed securely in bubble wrap and sturdy boxes to prevent damage during transit. Fragile or high-value items receive additional protective packaging.</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Failed Delivery</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">If delivery fails (wrong address, not available, refused), the courier will attempt delivery twice. After two failed attempts, the package is returned to us. In such cases, reshipping charges may apply.</p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <strong>COD Note:</strong> Cash on Delivery is available for orders up to ₹10,000. COD orders may take 1 additional business day to dispatch.
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-foreground">Shipping Issues?</h2>
          <p className="text-sm text-muted-foreground">Email us at <a href="mailto:hello@wavesandwires.com" className="text-primary hover:underline font-medium">hello@wavesandwires.com</a> or call <a href="tel:+919876543210" className="text-primary hover:underline font-medium">+91 98765 43210</a> (Mon–Sat, 9 AM – 7 PM).</p>
        </div>
      </div>
    </div>
  );
}

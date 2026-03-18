import { Shield } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h2 className="text-base font-bold text-foreground">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Last updated: January 2025</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
        <Section title="1. Information We Collect">
          <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support. This includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name, email address, phone number</li>
            <li>Delivery address and billing information</li>
            <li>Order history and preferences</li>
            <li>Communications with our support team</li>
          </ul>
          <p>We also automatically collect certain information when you use our website, including IP address, browser type, pages visited, and device information via standard web logs.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and fulfil your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Provide customer support</li>
            <li>Improve our products and services</li>
            <li>Send promotional emails (only with your consent — you can unsubscribe anytime)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Information Sharing">
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Delivery partners</strong> — to fulfil your orders (name, address, phone)</li>
            <li><strong className="text-foreground">Payment processors</strong> — Razorpay processes your payment; we do not store card details</li>
            <li><strong className="text-foreground">Legal authorities</strong> — when required by law or to protect our rights</li>
          </ul>
        </Section>

        <Section title="4. Data Security">
          <p>We take the security of your data seriously. We use industry-standard measures including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>SSL/TLS encryption for all data in transit</li>
            <li>Supabase Row Level Security (RLS) to restrict data access</li>
            <li>Password hashing — we never store plain-text passwords</li>
            <li>Regular security audits</li>
          </ul>
          <p>However, no method of transmission over the internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.</p>
        </Section>

        <Section title="5. Cookies">
          <p>We use cookies and similar technologies to keep you logged in, remember your cart, and understand how you use our site. You can control cookies through your browser settings, but disabling them may affect site functionality.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:hello@wavesandwires.com" className="text-primary hover:underline font-medium">hello@wavesandwires.com</a>.</p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors.</p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the site after changes constitutes your acceptance.</p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email: <a href="mailto:hello@wavesandwires.com" className="text-primary hover:underline">hello@wavesandwires.com</a></li>
            <li>Phone: +91 98765 43210</li>
            <li>Address: Mumbai, Maharashtra, India</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

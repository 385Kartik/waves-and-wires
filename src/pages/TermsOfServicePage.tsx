import { FileText } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h2 className="text-base font-bold text-foreground">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TermsOfServicePage() {
  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Last updated: January 2025</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          By accessing and using the Waves & Wires website and services, you agree to be bound by these Terms of Service. Please read them carefully.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>By using our website, placing an order, or creating an account, you confirm that you are at least 18 years of age and agree to these Terms. If you do not agree, please do not use our services.</p>
        </Section>

        <Section title="2. Products and Pricing">
          <p>We reserve the right to modify product descriptions, pricing, and availability at any time without prior notice. All prices are listed in Indian Rupees (₹) and include applicable GST unless stated otherwise.</p>
          <p>We make every effort to display product images and descriptions accurately; however, colours and appearances may vary slightly from the actual product due to display settings.</p>
        </Section>

        <Section title="3. Orders and Payment">
          <ul className="list-disc pl-5 space-y-1">
            <li>Orders are confirmed only after successful payment processing or COD confirmation.</li>
            <li>We reserve the right to cancel any order due to pricing errors, stock unavailability, or suspected fraud.</li>
            <li>If an order is cancelled by us, you will receive a full refund within 5–7 business days.</li>
            <li>COD orders are subject to availability in your area.</li>
          </ul>
        </Section>

        <Section title="4. Account Responsibility">
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately if you suspect unauthorised use of your account. Waves & Wires is not liable for any loss resulting from unauthorised account access caused by your failure to secure your credentials.</p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>All content on this website, including text, graphics, logos, images, and software, is the property of Waves & Wires and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
        </Section>

        <Section title="6. Prohibited Uses">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the site for any unlawful purpose</li>
            <li>Submit false or misleading information</li>
            <li>Attempt to gain unauthorised access to any part of the site</li>
            <li>Interfere with the proper working of the website</li>
            <li>Scrape or harvest data without our written permission</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the fullest extent permitted by law, Waves & Wires shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our liability to you for any cause shall not exceed the amount paid by you for the relevant order.</p>
        </Section>

        <Section title="8. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>We reserve the right to update these Terms at any time. Changes take effect immediately upon posting. Continued use of the site constitutes acceptance of the updated Terms.</p>
        </Section>

        <Section title="10. Contact">
          <p>For questions regarding these Terms, contact us at <a href="mailto:hello@wavesandwires.com" className="text-primary hover:underline font-medium">hello@wavesandwires.com</a>.</p>
        </Section>
      </div>
    </div>
  );
}

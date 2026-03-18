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
          <h1 className="text-2xl font-bold text-foreground">Terms & Conditions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Waves and Wires Technologies LLP</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-8">

        <p className="text-sm text-muted-foreground leading-relaxed">
          Welcome to Waves and Wires Technologies LLP! By accessing or using our website and purchasing our products, you agree to the following terms and conditions.
        </p>

        <Section title="1. Product Information">
          <p>All product descriptions, images, and specifications are accurate to the best of our knowledge. However, slight variations may occur.</p>
        </Section>

        <Section title="2. Pricing">
          <p>Prices are subject to change without prior notice. The price at the time of purchase will be honored.</p>
        </Section>

        <Section title="3. Warranty & Returns">
          <p>Our products come with a limited warranty against manufacturing defects. Returns or exchanges are accepted within the specified period, subject to our <a href="/return-policy" className="text-primary hover:underline font-medium">Return & Refund Policy</a>.</p>
        </Section>

        <Section title="4. Usage">
          <p>Products must be used as per the instructions provided. We are not liable for any damages caused by improper use.</p>
        </Section>

        <Section title="5. Privacy">
          <p>We respect your privacy and are committed to protecting your personal information as outlined in our <a href="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</a>.</p>
        </Section>

        <Section title="6. Liability">
          <p>Waves and Wires Technologies LLP is not responsible for any indirect or consequential damages resulting from the use of our products.</p>
        </Section>

        <Section title="7. Dispute Resolution">
          <p>Any disputes shall be governed by the laws of India and resolved through arbitration in accordance with Indian laws. All disputes are subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>
        </Section>

        <Section title="8. Changes to Terms">
          <p>We reserve the right to update these terms and conditions at any time. Continued use of our services constitutes acceptance of the updated terms.</p>
        </Section>

        <div className="rounded-xl bg-secondary/50 border border-border p-4 text-sm text-muted-foreground">
          By using our services, you agree to comply with these terms. If you have any questions, please contact us at{' '}
          <a href="mailto:support@wavesandwires.in" className="text-primary hover:underline font-medium">support@wavesandwires.in</a>.
        </div>
      </div>
    </div>
  );
}
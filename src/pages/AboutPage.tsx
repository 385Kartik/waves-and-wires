import { Link } from 'react-router-dom';
import { Zap, Heart, Shield, Award, Users, Calendar } from 'lucide-react';

export default function AboutPage() {
  const milestones = [
    { year: '2017', title: 'Company Founded', desc: 'Waves and Wires Technologies LLP incorporated on October 10, 2017 in Mumbai.' },
    { year: '2018', title: 'First Product Launch', desc: 'Launched the electric coconut scraper — our flagship product, solving a daily kitchen challenge.' },
    { year: '2020', title: 'Expanding Range', desc: 'Added hand blenders and hot water bags to our product lineup.' },
    { year: '2022', title: 'Amazon Presence', desc: 'Products listed on Amazon India, reaching customers across the country.' },
    { year: '2024', title: 'Direct-to-Consumer', desc: 'Launched wavesandwires.in for a seamless direct shopping experience.' },
    { year: '2025', title: 'Growing Strong', desc: 'Continuously innovating and expanding our range of electric appliances.' },
  ];

  const values = [
    { icon: Zap, title: 'Innovation', desc: 'We design products that bring modern technology to everyday household tasks.' },
    { icon: Shield, title: 'Quality', desc: 'Every product undergoes rigorous testing to meet our high standards before reaching you.' },
    { icon: Heart, title: 'Customer First', desc: 'Your satisfaction drives everything we do — from design to after-sales support.' },
    { icon: Award, title: 'Reliability', desc: 'We build products that last, backed by our commitment to durability and performance.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-background via-secondary/50 to-background border-b border-border">
        <div className="container py-14 sm:py-20 max-w-4xl text-center">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            Est. October 2017
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight">
            Innovating Everyday<br />
            <span className="text-primary">Comfort Since 2017</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Waves and Wires Technologies LLP is dedicated to bringing convenience and innovation to your daily life through modern electric appliances.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Calendar, label: 'Years in Business', value: '7+' },
              { icon: Users, label: 'Happy Customers', value: '10,000+' },
              { icon: Award, label: 'Products', value: '3+' },
              { icon: Shield, label: 'Quality Assured', value: '100%' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container py-12 sm:py-16 max-w-4xl">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              Waves and Wires Technologies LLP, established on <strong className="text-foreground">October 10, 2017</strong>, is a Mumbai-based company dedicated to bringing convenience and innovation to your daily life.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Specializing in modern electric appliances, we offer products like <strong className="text-foreground">electric coconut scrapers</strong>, <strong className="text-foreground">hand blenders</strong>, and <strong className="text-foreground">hot water bags</strong> — all designed to simplify household tasks and enhance your comfort.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our mission is to deliver high-quality, user-friendly, and reliable products that make life easier for our customers. We are committed to blending technology with practicality.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all">
              Explore Our Products →
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-secondary/30 aspect-video flex items-center justify-center">
            <img src="/logo.png" alt="Waves & Wires" className="h-32 w-32 object-contain opacity-80" />
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-secondary/30 border-y border-border">
        <div className="container py-12 sm:py-16 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Our Vision</h2>
          </div>
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 text-center max-w-3xl mx-auto">
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg italic">
              "To revolutionize everyday living through innovative and efficient electric appliances. We aspire to become a trusted household name by consistently delivering high-quality products that simplify daily tasks and improve comfort."
            </p>
            <p className="mt-4 text-sm font-semibold text-primary">— Waves and Wires Technologies LLP</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container py-12 sm:py-16 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Our Values</h2>
          <p className="mt-2 text-sm text-muted-foreground">What drives us every day</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 transition-all">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-secondary/30 border-y border-border">
        <div className="container py-12 sm:py-16 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Our Journey</h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-0.5 bg-border sm:-translate-x-1/2" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={m.year} className={`relative flex gap-6 sm:gap-0 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  <div className={`hidden sm:block flex-1 ${i % 2 === 0 ? 'text-right pr-8' : 'pl-8'}`}>
                    {i % 2 === 0 && (
                      <div className="inline-block bg-card border border-border rounded-2xl p-4 text-left">
                        <p className="font-black text-primary text-sm">{m.year}</p>
                        <p className="font-bold text-foreground text-sm mt-1">{m.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
                      </div>
                    )}
                  </div>
                  <div className="absolute left-5 sm:left-1/2 sm:-translate-x-1/2 h-4 w-4 rounded-full bg-primary border-2 border-background shadow-sm mt-1" />
                  <div className={`flex-1 pl-14 sm:pl-0 ${i % 2 !== 0 ? 'sm:pr-8 sm:text-right' : 'sm:pl-8'}`}>
                    {/* Mobile always shows, desktop shows only odd */}
                    <div className={`sm:${i % 2 === 0 ? 'hidden' : 'inline-block'} bg-card border border-border rounded-2xl p-4`}>
                      <p className="font-black text-primary text-sm">{m.year}</p>
                      <p className="font-bold text-foreground text-sm mt-1">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                    {/* Mobile fallback for even items */}
                    <div className="sm:hidden bg-card border border-border rounded-2xl p-4">
                      <p className="font-black text-primary text-sm">{m.year}</p>
                      <p className="font-bold text-foreground text-sm mt-1">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-12 sm:py-16 max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Have Questions?</h2>
        <p className="text-muted-foreground mb-6">Our team is always happy to help.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/contact" className="rounded-xl bg-primary px-8 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all">Contact Us</Link>
          <Link to="/shop" className="rounded-xl border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all">Shop Now</Link>
        </div>
      </section>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { Briefcase, Heart, Zap, Users, MapPin, Mail } from 'lucide-react';

const openings = [
  {
    title: 'Sales Executive',
    type: 'Full-time',
    location: 'Mira Bhayandar, Mumbai',
    dept: 'Sales',
    desc: 'Drive B2B and B2C sales for our electric appliance range. Build relationships with distributors and retail partners across Maharashtra.',
    requirements: ['1–3 years sales experience', 'Fluent in Hindi & Marathi', 'Two-wheeler preferred', 'Knowledge of consumer electronics a plus'],
  },
  {
    title: 'Customer Support Executive',
    type: 'Full-time',
    location: 'Mira Bhayandar, Mumbai',
    dept: 'Support',
    desc: 'Handle customer queries via phone, email, and WhatsApp. Process returns, replacements, and ensure customer satisfaction.',
    requirements: ['Excellent communication in Hindi & English', 'Patient and empathetic', 'Basic computer skills', 'E-commerce knowledge preferred'],
  },
  {
    title: 'Digital Marketing Intern',
    type: 'Internship (3–6 months)',
    location: 'Remote / Hybrid',
    dept: 'Marketing',
    desc: 'Assist in managing social media, creating content, and running performance marketing campaigns on Amazon and Meta.',
    requirements: ['Currently pursuing/completed graduation', 'Familiar with Instagram, Facebook Ads', 'Basic Canva / Photoshop skills', 'Passion for e-commerce and marketing'],
  },
];

const perks = [
  { icon: Heart, title: 'Health & Wellness', desc: 'Medical coverage for you and your immediate family.' },
  { icon: Zap, title: 'Growth Opportunities', desc: 'Fast-growing startup — your contributions directly impact the company.' },
  { icon: Users, title: 'Great Culture', desc: 'Small, collaborative team where everyone\'s voice matters.' },
  { icon: Briefcase, title: 'Flexible Work', desc: 'We believe in work-life balance and flexible timings.' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-background via-secondary/50 to-background border-b border-border">
        <div className="container py-14 sm:py-20 max-w-3xl text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">Join Our Team</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Be part of a fast-growing consumer electronics company bringing innovation to Indian households. We're a small team that makes a big impact.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="container py-12 max-w-4xl">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-8">Why Work With Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-bold text-foreground text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Openings */}
      <section className="bg-secondary/30 border-y border-border">
        <div className="container py-12 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Open Positions</h2>
          <p className="text-sm text-muted-foreground mb-8">{openings.length} positions available</p>
          <div className="space-y-5">
            {openings.map(job => (
              <div key={job.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-foreground">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{job.dept}</span>
                      <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2.5 py-1 rounded-full border border-border">{job.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <MapPin className="h-3.5 w-3.5" />{job.location}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Requirements</p>
                  <ul className="space-y-1">
                    {job.requirements.map(r => (
                      <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href={`mailto:support@wavesandwires.in?subject=Application for ${job.title}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
                  Apply Now →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General CTA */}
      <section className="container py-12 max-w-2xl text-center">
        <h2 className="text-xl font-bold text-foreground mb-3">Don't see a fit?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We're always looking for talented people. Send your resume and we'll keep you in mind for future openings.
        </p>
        <a href="mailto:support@wavesandwires.in?subject=General Application - Waves & Wires"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3 text-sm font-black text-background hover:bg-foreground/90 transition-all">
          <Mail className="h-4 w-4" />Send Your Resume
        </a>
        <p className="mt-4 text-xs text-muted-foreground">
          Email: <a href="mailto:support@wavesandwires.in" className="text-primary hover:underline">support@wavesandwires.in</a><br />
          Waves and Wires Technologies LLP, Mira Bhayandar, Mumbai
        </p>
      </section>
    </div>
  );
}
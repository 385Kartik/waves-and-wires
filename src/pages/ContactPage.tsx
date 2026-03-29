import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { contactAdminHtml } from '@/lib/email';

export default function ContactPage() {
  const { settings } = useStoreSettings();
  const [form,    setForm]    = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const inputCls = "w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all";

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSending(true);
  try {
    const clean = (s: string) => s.replace(/[<>]/g, '').trim().slice(0, 2000);
    const sanitized = {
      name:    clean(form.name),
      email:   form.email.trim().toLowerCase(),
      subject: clean(form.subject),
      message: clean(form.message),
    };

    const { error: dbErr } = await supabase.from('contact_messages').insert(sanitized);
    if (dbErr) throw dbErr;

    // Direct fetch instead of sendEmail wrapper
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:      settings.store_email,
        subject: `[Contact Form] ${sanitized.subject}`,
        html:    contactAdminHtml(sanitized.name, sanitized.email, sanitized.subject, sanitized.message),
      }),
    });

    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    toast.success("Message sent! We'll reply within 24 hours.");
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to send. Please try again.');
  } finally { setSending(false); }
}

  return (
    <div className="container py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="mt-2 text-sm text-muted-foreground">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
            <a href={`mailto:${settings.store_email}`}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4 hover:border-primary/30 hover:bg-primary/5 transition-all group col-span-2 lg:col-span-1">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Email</p><p className="text-xs sm:text-sm font-semibold text-foreground break-all">{settings.store_email}</p></div>
            </a>

            {settings.store_phones.map((phone, i) => (
              <a key={i} href={`tel:${phone.replace(/\s/g,'')}`}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p><p className="text-xs sm:text-sm font-semibold text-foreground">{phone}</p></div>
              </a>
            ))}

            <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Address</p><p className="text-xs sm:text-sm font-semibold text-foreground">Mumbai, India</p></div>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-3 sm:p-4 col-span-2 lg:col-span-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Support Hours</p>
              <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Mon – Sat</span><span className="font-semibold text-foreground">9 AM – 7 PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="font-semibold">Closed</span></div>
              </div>
            </div>

            {/* Google Maps */}
            <div className="rounded-2xl border border-border overflow-hidden">
              <iframe
                title="Waves & Wires Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3766.8!2d72.8617!3d19.3015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sJesal+Park%2C+Bhayandar+East%2C+Mira+Bhayandar%2C+Maharashtra+401105!5e0!3m2!1sen!2sin!4v1"
                width="100%"
                height="200"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-10 sm:p-12 text-center min-h-[280px]">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-foreground">Message Sent!</p>
                  <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
                </div>
                <button onClick={() => setSent(false)} className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <h2 className="font-bold text-foreground">Send us a message</h2>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Name *</label>
                    <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Rahul Sharma" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email *</label>
                    <input required type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Subject *</label>
                  <input required value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="How can we help you?" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Describe your query in detail…" className={`${inputCls} resize-none`} />
                </div>
                <button type="submit" disabled={sending}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 sm:px-8 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/20">
                  {sending
                    ? <><span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin"/>Sending…</>
                    : <><Send className="h-4 w-4"/>Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
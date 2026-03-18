import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function ContactPage() {
  const { settings } = useStoreSettings();
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

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

      // Save to Supabase
      const { error: dbErr } = await supabase.from('contact_messages').insert(sanitized);
      if (dbErr) throw dbErr;

      // Send email to admin via Netlify function (nodemailer)
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.store_email,
          subject: `[Contact Form] ${sanitized.subject}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
              <div style="background:#f5c018;padding:20px 28px">
                <h2 style="margin:0;font-size:18px;font-weight:900;color:#000">New Contact Message</h2>
                <p style="margin:4px 0 0;font-size:13px;color:rgba(0,0,0,0.6)">Waves &amp; Wires Store</p>
              </div>
              <div style="padding:28px">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                  <tr><td style="padding:8px 0;font-size:13px;color:#666;width:80px">From</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#111">${sanitized.name}</td></tr>
                  <tr><td style="padding:8px 0;font-size:13px;color:#666">Email</td><td style="padding:8px 0;font-size:13px"><a href="mailto:${sanitized.email}" style="color:#f5c018">${sanitized.email}</a></td></tr>
                  <tr><td style="padding:8px 0;font-size:13px;color:#666">Subject</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#111">${sanitized.subject}</td></tr>
                </table>
                <div style="background:#f8f8f8;border-left:3px solid #f5c018;padding:16px 20px;border-radius:0 8px 8px 0">
                  <p style="margin:0;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap">${sanitized.message}</p>
                </div>
                <div style="margin-top:24px">
                  <a href="mailto:${sanitized.email}?subject=Re: ${encodeURIComponent(sanitized.subject)}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">Reply to ${sanitized.name}</a>
                </div>
              </div>
            </div>
          `,
        }),
      });

      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Message sent! We\'ll reply within 24 hours.');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send. Please try again.');
    } finally { setSending(false); }
  }

  return (
    <div className="container py-10 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="mt-2 text-sm text-muted-foreground">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Info cards */}
          <div className="space-y-4">
            <a href={`mailto:${settings.store_email}`} className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors"><Mail className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Email</p><p className="text-sm font-semibold text-foreground break-all">{settings.store_email}</p></div>
            </a>

            {settings.store_phones.map((phone, i) => (
              <a key={i} href={`tel:${phone.replace(/\s/g,'')}`} className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors"><Phone className="h-5 w-5 text-primary" /></div>
                <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p><p className="text-sm font-semibold text-foreground">{phone}</p></div>
              </a>
            ))}

            <div className="flex gap-3.5 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Address</p><p className="text-sm font-semibold text-foreground">Mumbai, Maharashtra, India</p></div>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Support Hours</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Mon – Sat</span><span className="font-semibold text-foreground">9 AM – 7 PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="font-semibold">Closed</span></div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-12 text-center min-h-[320px]">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Message Sent!</p>
                  <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
                </div>
                <button onClick={() => setSent(false)} className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-bold text-foreground">Send us a message</h2>
                <div className="grid gap-4 sm:grid-cols-2">
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
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/20">
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

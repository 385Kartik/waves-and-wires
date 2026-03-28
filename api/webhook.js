// api/webhook.js
import { createClient } from '@supabase/supabase-js';

// Dhyan de: Yahan SERVICE_ROLE_KEY use karna zaroori hai taaki backend database update kar sake bina user login ke
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Yeh key apne Supabase (Settings > API) se nikal kar Vercel Env me daal dena
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const srData = req.body;
    
    // Shiprocket se aane wala data
    const shiprocketOrderId = String(srData.order_id);
    const srStatus = srData.current_status?.toUpperCase();
    const awbCode = srData.awb;

    if (!shiprocketOrderId || !srStatus) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Shiprocket ke status ko tere database ke status se map karna
    let newDbStatus = 'processing'; 
    
    if (['NEW', 'INVOICED'].includes(srStatus)) newDbStatus = 'confirmed';
    if (['READY TO SHIP', 'PICKUP SCHEDULED'].includes(srStatus)) newDbStatus = 'processing';
    if (['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY'].includes(srStatus)) newDbStatus = 'shipped';
    if (['DELIVERED'].includes(srStatus)) newDbStatus = 'delivered';
    if (['CANCELED', 'RTO INITIATED', 'RTO DELIVERED'].includes(srStatus)) newDbStatus = 'cancelled';

    // Supabase mein order update karna (Status aur AWB)
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newDbStatus,
        awb_code: awbCode || null,
        updated_at: new Date().toISOString()
      })
      .eq('shiprocket_order_id', shiprocketOrderId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Order status auto-updated!' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
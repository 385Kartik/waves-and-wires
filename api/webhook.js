import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    
    // Webhook Handshake/Test handle karna
    if (!data || Object.keys(data).length === 0 || !data.order_id) {
      return res.status(200).json({ status: "success", message: "Webhook is active" });
    }

    const srOrderId = String(data.order_id);
    const srStatus = data.current_status?.toUpperCase();
    const awb = data.awb;

    // Status Mapping
    let newStatus = 'processing';
    if (['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY'].includes(srStatus)) newStatus = 'shipped';
    if (['DELIVERED'].includes(srStatus)) newStatus = 'delivered';
    if (['CANCELED', 'RTO INITIATED', 'RTO DELIVERED'].includes(srStatus)) newStatus = 'cancelled';
    if (['NEW', 'INVOICED'].includes(srStatus)) newStatus = 'confirmed';

    // Update Supabase
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus, 
        awb_code: awb || null,
        updated_at: new Date().toISOString() 
      })
      .eq('shiprocket_order_id', srOrderId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(200).json({ error: err.message }); 
  }
}
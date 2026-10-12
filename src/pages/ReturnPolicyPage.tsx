export default function ReturnPolicyPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-6">Return &amp; Refund Policy</h1>

      <div className="space-y-6 text-sm sm:text-[15px] text-[#374151] leading-relaxed">
        <p className="text-[#111827] font-medium">
          At Waves and Wires Technologies LLP, we strive to ensure customer satisfaction with every purchase. If you are not completely satisfied, please review our Return &amp; Refund Policy below:
        </p>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#111827]">Eligibility for Returns:</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Products can be returned within 7 days of delivery.</li>
            <li>The item must be unused, in its original packaging, and accompanied by the original receipt or proof of purchase.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#111827]">Non-Returnable Items:</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Products damaged due to misuse or negligence.</li>
            <li>Items without original packaging or missing accessories.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#111827]">Process for Returns:</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To initiate a return, contact our customer support team with details of your order.</li>
            <li>Once approved, the product must be shipped back to our specified address at the customer’s expense unless the item is defective.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#111827]">Refund Policy:</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Refunds are processed after inspection of the returned product.</li>
            <li>Approved refunds will be credited to the original payment method within 7–10 business days.</li>
            <li>Shipping charges (if any) are non-refundable.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#111827]">Damaged or Defective Items:</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>If the product arrives damaged or defective, please notify us within 48 hours of delivery. We will arrange for a replacement or full refund at no additional cost.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#111827]">Contact Us:</h2>
          <p>For any return or refund-related queries, please contact our customer support team.</p>
          <p className="font-semibold text-[#111827] pt-1">
            We value your trust and aim to provide a hassle-free shopping experience!
          </p>
        </div>

        <div className="pt-2 space-y-1">
          <h3 className="text-lg font-bold text-[#111827]">Need help?</h3>
          <p>
            Contact us at{' '}
            <a
              href="mailto:support@wavesandwires.in"
              className="font-semibold text-[#d97706] hover:underline"
            >
              support@wavesandwires.in
            </a>{' '}
            for questions related to refunds and returns.
          </p>
        </div>
      </div>
    </div>
  );
}
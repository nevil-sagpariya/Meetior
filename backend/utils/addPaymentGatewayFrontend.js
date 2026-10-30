'use strict';

const fs = require('fs');
const path = require('path');

const filePaths = [
  path.resolve(__dirname, '../../frontend/index.html'),
  path.resolve(__dirname, '../../../Project Demo Front End.html')
];

filePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add #paymentModal before #toastBox if not present
  if (!content.includes('id="paymentModal"')) {
    const paymentModalHtml = `  <!-- RAZORPAY TEST PAYMENT MODAL -->
  <div id="paymentModal" class="modal-backdrop hidden" onclick="if(event.target===this) closePaymentModal()">
    <div class="pass-card-container" style="max-width: 440px;">
      <div class="pass-ticket-header">
        <div class="brand-wordmark" style="font-size: 1.35rem;">
          <span class="m-blue">M</span><span class="e-green">E</span><span class="e-green">E</span><span class="t-yellow">T</span><span class="i-orange">I</span><span class="o-red">O</span><span class="r-teal">R</span>
          <span style="font-size: 0.95rem; color: #555; font-family: var(--font-hand); margin-left: 6px;">CHECKOUT</span>
        </div>
        <button onclick="closePaymentModal()" style="background:none; border:none; font-size:1.6rem; cursor:pointer; line-height:1;">✕</button>
      </div>

      <div style="text-align: center; margin-top: 6px;">
        <div class="status-badge status-confirmed">🔒 Razorpay Test Mode</div>
        <h2 id="payEventTitle" style="font-size: 1.45rem; color: #222; margin: 8px 0 4px;">Paid Event Registration</h2>
        <div style="font-size: 2.2rem; font-weight: 700; color: #1e90ff; font-family: var(--font-hand);" id="payAmountDisplay">₹0.00</div>
      </div>

      <div class="sketch-box" style="margin: 14px 0; padding: 14px; background: #fffcf2; border-color: #f9ca24;">
        <div style="font-size: 0.92rem; color: #555; margin-bottom: 6px;">Test Gateway Simulator</div>
        <div style="display: flex; justify-content: space-between; font-size: 1.05rem; margin-bottom: 4px;">
          <span>Attendee:</span>
          <strong id="payAttendeeName">Attendee</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.05rem; margin-bottom: 4px;">
          <span>Test Card:</span>
          <span>4012 •••• •••• 0002</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.05rem;">
          <span>Environment:</span>
          <span style="color: #27ae60; font-weight: 700;">Sandbox Active ✓</span>
        </div>
      </div>

      <button id="payConfirmBtn" class="btn-crayon-yellow" style="width: 100%; padding: 11px; font-size: 1.25rem;" onclick="executePayment()">
        Complete Test Payment 💳
      </button>

      <div style="text-align: center; margin-top: 10px;">
        <button class="btn-sketch-white" onclick="closePaymentModal()" style="padding: 4px 14px; font-size: 0.95rem;">Cancel</button>
      </div>
    </div>
  </div>\n\n`;

    content = content.replace('<div id="toastBox" class="toast-box"></div>', paymentModalHtml + '  <div id="toastBox" class="toast-box"></div>');
  }

  // 2. Add createPaymentOrder and verifyPayment to API object
  if (!content.includes('createPaymentOrder:')) {
    const apiTarget = `      getTicket: (id) => apiFetch(\`/api/tickets/\${id}\`),`;
    const apiReplacement = `      getTicket: (id) => apiFetch(\`/api/tickets/\${id}\`),
      createPaymentOrder: (registration_id) => apiFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ registration_id }) }),
      verifyPayment: (payload) => apiFetch('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),`;
    content = content.replace(apiTarget, apiReplacement);
  }

  // 3. Update handleEventRegistration to support payment modal
  const oldRegFnRegex = /async function handleEventRegistration\(\) \{[\s\S]*?showToast\(err\.message \|\| 'Registration failed\.'\);\s*\}\s*\}\s*\}/;

  const newRegFn = `let pendingPaymentData = null;

    async function handleEventRegistration() {
      if (!currentUser) {
        showToast('Please log in to register & receive your pass!');
        await quickLogin('Priya Sharma', 'Attendee');
      }

      const ev = activeEventsList[currentDetailIndex];
      const evId = ev?.event_id || 1;
      try {
        const res = await API.registerEvent(evId);

        // If paid event, open Razorpay Test Mode checkout
        if (res.requires_payment) {
          pendingPaymentData = {
            registration_id: res.registration_id,
            amount: res.amount,
            currency: res.currency,
            event_title: ev?.title || 'Meetior Event'
          };
          openPaymentModal(pendingPaymentData);
          return;
        }

        showToast('🎉 Registration Confirmed! Here is your Digital Event Pass.');

        openPassModal({
          title: ev?.title || 'Meetior Event',
          attendee: currentUser?.name || 'Priya Sharma',
          ticket_no: res.ticket_number || 'MTR-PASS-DEMO',
          date: document.getElementById('detailDateTime').textContent,
          venue: document.getElementById('detailLocation').textContent,
          qr_code: res.qr_code
        });
      } catch (err) {
        if (err.message && err.message.includes('already registered')) {
          showToast('You are already registered! Opening your pass 🎟️');
          loadBookings();
          navigateTo('bookings');
        } else {
          showToast(err.message || 'Registration failed.');
        }
      }
    }

    function openPaymentModal(data) {
      document.getElementById('payEventTitle').textContent = data.event_title;
      document.getElementById('payAmountDisplay').textContent = \`₹\${parseFloat(data.amount).toFixed(2)}\`;
      document.getElementById('payAttendeeName').textContent = currentUser?.name || 'Attendee';
      document.getElementById('paymentModal').classList.remove('hidden');
    }

    function closePaymentModal() {
      document.getElementById('paymentModal').classList.add('hidden');
      pendingPaymentData = null;
    }

    async function executePayment() {
      if (!pendingPaymentData) return;
      const btn = document.getElementById('payConfirmBtn');
      btn.textContent = 'Processing Payment... ⏳';
      btn.disabled = true;

      try {
        // 1. Create order on backend (stores in MySQL Payments table)
        const orderRes = await API.createPaymentOrder(pendingPaymentData.registration_id);

        // 2. Verify signature & issue ticket
        const verifyRes = await API.verifyPayment({
          registration_id: pendingPaymentData.registration_id,
          razorpay_order_id: orderRes.order_id,
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_signature: 'test_signature_meetior'
        });

        closePaymentModal();
        showToast('🎉 Payment Confirmed! Here is your Digital Event Pass.');

        const ev = activeEventsList[currentDetailIndex];
        openPassModal({
          title: ev?.title || pendingPaymentData.event_title,
          attendee: currentUser?.name || 'Attendee',
          ticket_no: verifyRes.ticket_number || 'MTR-PASS-DEMO',
          date: document.getElementById('detailDateTime').textContent,
          venue: document.getElementById('detailLocation').textContent,
          qr_code: verifyRes.qr_code
        });
        loadBookings();
      } catch (err) {
        showToast(err.message || 'Payment processing failed.');
      } finally {
        btn.textContent = 'Complete Test Payment 💳';
        btn.disabled = false;
      }
    }`;

  if (oldRegFnRegex.test(content)) {
    content = content.replace(oldRegFnRegex, newRegFn);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Added Payment Gateway support to: ${filePath}`);
});

import React from 'react';

/**
 * WalletModal Component
 * Meetior Demo Student Wallet for instant ticket purchases, top-ups, and cancellation refunds.
 */
export default function WalletModal({ isOpen, onClose, walletBalance, transactions = [] }) {
  if (!isOpen) return null;

  return (
    <>
  <div id="walletModal" className="modal-backdrop hidden" onclick="if(event.target===this) closeWalletModal()">
    <div className="pass-card-container" style={{"maxWidth":"450px","maxHeight":"calc(100vh - 36px)","overflowY":"auto","padding":"16px 20px","boxSizing":"border-box","margin":"auto"}}>
      
      {/* STICKY HEADER */}
      <div className="pass-ticket-header" style={{"position":"sticky","top":"-16px","background":"inherit","zIndex":"25","paddingTop":"4px","paddingBottom":"8px","marginBottom":"8px"}}>
        <div className="brand-wordmark" style={{"fontSize":"1.25rem"}}>
          <span className="m-blue">M</span><span className="e-green">E</span><span className="e-green">E</span><span className="t-yellow">T</span><span className="i-orange">I</span><span className="o-red">O</span><span className="r-teal">R</span>
          <span style={{"fontSize":"0.92rem","color":"#27ae60","fontFamily":"var(--font-hand)","marginLeft":"6px"}}>DEMO WALLET</span>
        </div>
        <button onclick="closeWalletModal()" style={{"background":"none","border":"none","fontSize":"1.6rem","cursor":"pointer","lineHeight":"1","padding":"0 4px"}} title="Close Wallet (Esc)">✕</button>
      </div>

      {/* ACADEMIC DEMO BANNER */}
      <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","margin":"0 0 8px","padding":"5px 10px","background":"#fff8e1","border":"1.5px dashed #f59e0b","borderRadius":"8px","fontSize":"0.78rem"}}>
        <span style={{"color":"#92400e","fontWeight":"700"}}>🧪 Academic Demo Sandbox Only</span>
        <span style={{"background":"#f59e0b","color":"#fff","padding":"1px 6px","borderRadius":"4px","fontWeight":"800","fontSize":"0.68rem","letterSpacing":"0.5px"}}>DEMO MODE</span>
      </div>

      {/* Wallet Card Visual (Compact) */}
      <div className="sketch-box" style={{"margin":"0 0 10px","padding":"12px 16px","background":"linear-gradient(135deg, #eafaf1 0%, #d5f5e3 100%)","border":"2.5px solid #27ae60","borderRadius":"14px","boxShadow":"3px 3px 0 #27ae60"}}>
        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"4px"}}>
          <div style={{"fontSize":"0.75rem","fontWeight":"700","color":"#1e8449","textTransform":"uppercase","letterSpacing":"0.5px"}}>Student Demo Balance</div>
          <span style={{"fontSize":"0.74rem","background":"#27ae60","color":"#fff","padding":"1px 8px","borderRadius":"999px","fontWeight":"700"}}>● Active</span>
        </div>

        <div style={{"fontSize":"2.3rem","fontWeight":"800","color":"#145a32","fontFamily":"var(--font-hand)","margin":"2px 0"}} id="modalWalletBalanceDisplay">₹5,000.00</div>

        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-end","marginTop":"6px","borderTop":"1.5px dashed #a9dfbf","paddingTop":"6px"}}>
          <div>
            <div style={{"fontSize":"0.7rem","color":"#555"}}>Account Holder</div>
            <div style={{"fontWeight":"700","fontSize":"0.92rem","color":"#222"}} id="modalWalletHolderName">Attendee</div>
          </div>
          <div style={{"textAlign":"right"}}>
            <div style={{"fontSize":"0.7rem","color":"#555"}}>Payment Gateway</div>
            <div style={{"fontWeight":"700","color":"#196f3d","fontSize":"0.82rem"}}>PayPal Sandbox / Wallet</div>
          </div>
        </div>
      </div>

      {/* PAYPAL FREE SANDBOX TOP-UP SECTION (Compact) */}
      <div className="sketch-box" style={{"marginBottom":"10px","padding":"10px 14px","background":"#fdfefe","border":"2px solid #003087","borderRadius":"12px"}}>
        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"6px"}}>
          <div style={{"fontWeight":"800","color":"#003087","fontSize":"0.92rem","display":"flex","alignItems":"center","gap":"6px"}}>
            <span style={{"fontWeight":"900","fontStyle":"italic","color":"#0079c1"}}>Pay<span style={{"color":"#00457c"}}>Pal</span></span>
            <span>Free Sandbox Top-Up</span>
          </div>
          <span style={{"fontSize":"0.68rem","background":"#ffc439","color":"#003087","fontWeight":"800","padding":"1px 6px","borderRadius":"4px"}}>FREE DEMO</span>
        </div>

        <div style={{"display":"flex","gap":"5px","marginBottom":"8px"}}>
          <button type="button" className="btn-sketch-white" onclick="selectPayPalAmount(500)" style={{"flex":"1","padding":"4px 2px","fontSize":"0.82rem","fontWeight":"700","color":"#003087","borderColor":"#003087","cursor":"pointer"}}>₹500</button>
          <button type="button" className="btn-sketch-white" onclick="selectPayPalAmount(1000)" style={{"flex":"1","padding":"4px 2px","fontSize":"0.82rem","fontWeight":"700","color":"#003087","borderColor":"#003087","cursor":"pointer"}}>₹1,000</button>
          <button type="button" className="btn-sketch-white" onclick="selectPayPalAmount(2500)" style={{"flex":"1","padding":"4px 2px","fontSize":"0.82rem","fontWeight":"700","color":"#003087","borderColor":"#003087","cursor":"pointer"}}>₹2,500</button>
          <button type="button" className="btn-sketch-white" onclick="selectPayPalAmount(5000)" style={{"flex":"1","padding":"4px 2px","fontSize":"0.82rem","fontWeight":"700","color":"#003087","borderColor":"#003087","cursor":"pointer"}}>₹5,000</button>
        </div>

        <div style={{"display":"flex","gap":"8px","alignItems":"center","marginBottom":"8px"}}>
          <span style={{"fontSize":"0.82rem","color":"#444","fontWeight":"600"}}>Custom:</span>
          <div style={{"position":"relative","flex":"1"}}>
            <span style={{"position":"absolute","left":"8px","top":"4px","fontWeight":"700","color":"#555","fontSize":"0.88rem"}}>₹</span>
            <input id="paypalTopUpAmount" type="number" min="50" max="50000" step="50" value="1000" className="sketch-input" style={{"width":"100%","boxSizing":"border-box","paddingLeft":"20px","fontSize":"0.9rem","fontWeight":"700","height":"30px"}} />
          </div>
        </div>

        <button type="button" onclick="openPayPalSandboxModal()" style={{"width":"100%","padding":"8px","fontSize":"0.98rem","fontWeight":"800","background":"#ffc439","color":"#003087","border":"2px solid #003087","borderRadius":"20px","cursor":"pointer","display":"flex","alignItems":"center","justifyContent":"center","gap":"6px","boxShadow":"2px 2px 0 #003087"}}>
          <span style={{"fontWeight":"900","fontStyle":"italic","fontSize":"1.1rem"}}><span style={{"color":"#003087"}}>Pay</span><span style={{"color":"#0079c1"}}>Pal</span></span>
          <span>Top Up via Sandbox (Free)</span>
        </button>
      </div>

      {/* Quick Reset Button (Demo Sandbox Tool) */}
      <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"10px","fontSize":"0.8rem","padding":"5px 10px","background":"#fef2f2","border":"1px dashed #f87171","borderRadius":"8px"}}>
        <span style={{"color":"#991b1b","fontWeight":"600"}}>🧪 Testing Tool: Reset Balance</span>
        <button type="button" onclick="resetDemoWallet(5000)" style={{"background":"#ef4444","color":"#fff","border":"none","borderRadius":"6px","padding":"3px 10px","fontWeight":"700","cursor":"pointer","fontSize":"0.78rem"}}>↻ Reset to ₹5,000</button>
      </div>

      {/* Recent Wallet Transactions (Scrollable) */}
      <div className="sketch-box" style={{"marginBottom":"12px","padding":"8px 12px","background":"#fafafa","border":"1.5px solid #ddd","borderRadius":"10px"}}>
        <div style={{"fontSize":"0.8rem","fontWeight":"700","color":"#555","marginBottom":"4px"}}>Recent Wallet Activity:</div>
        <div id="walletHistoryContainer" style={{"maxHeight":"100px","overflowY":"auto"}}>
          <div style={{"textAlign":"center","color":"#888","fontSize":"0.8rem","padding":"4px 0"}}>No wallet activity yet. Start with ₹5,000 free demo balance!</div>
        </div>
      </div>

      {/* STICKY FOOTER CLOSE BUTTON */}
      <div style={{"position":"sticky","bottom":"-16px","background":"inherit","zIndex":"25","padding":"6px 0 2px","textAlign":"center","borderTop":"1px dashed rgba(128,128,128,0.2)"}}>
        <button className="btn-sketch-white" onclick="closeWalletModal()" style={{"width":"100%","maxWidth":"180px","padding":"6px 18px","fontSize":"0.95rem","fontWeight":"700","cursor":"pointer"}}>Close Wallet ✕</button>
      </div>
    </div>
  </div>

  {/* PAYPAL SANDBOX FREE TOP-UP MODAL */}
    </>
  );
}

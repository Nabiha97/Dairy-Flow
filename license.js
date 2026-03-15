const BASE_URL = "https://dairy-flow-1.onrender.com";

async function checkLicense() {
    try {
        const res = await fetch(`${BASE_URL}/api/check-license`);
        const data = await res.json();
    if (!data.active) {
        window.location.href = "/lockscreen";
    }
    } catch (err) {
        console.error('License check failed:', err);
    }
}

function showLockScreen(expiryDate, balance) {
    const WHATSAPP_NUMBER = "919876543210"; // replace with your boss's number
    const whatsappMsg = encodeURIComponent("Hello, I want to recharge my Dairy Flow subscription.");
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

    document.body.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center;
                justify-content:center; min-height:100vh; background:#ffffff;
                font-family:'Segoe UI', sans-serif; padding:24px;">

        <img src="icons/icon-192.png" alt="Dairy Flow Logo"
             style="width:90px; height:90px; border-radius:50%;
                    margin-bottom:16px; object-fit:cover;"/>

        <h2 style="font-size:26px; font-weight:700; color:#1a1a2e; margin:0 0 20px;">
            Dairy Flow
        </h2>

        <div style="width:64px; height:64px; background:#eef2ff; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    margin-bottom:16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#4a6cf7" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
        </div>

        <h3 style="font-size:22px; font-weight:700; color:#1a1a2e; margin:0 0 10px;">
            Account Locked
        </h3>

        <p style="color:#666; font-size:15px; text-align:center; margin:0 0 6px;">
            Your account access has been suspended due to insufficient balance.
        </p>

        <p style="color:#4a6cf7; font-size:14px; font-weight:600;
                  text-align:center; margin:0 0 6px;">
            Please recharge immediately to continue using services.
        </p>

        <p style="color:#999; font-size:13px; margin:0 0 20px;">
            Expired on: <strong style="color:#e53e3e;">${expiryDate}</strong>
        </p>

        <div style="width:100%; max-width:400px; background:#f8f9ff;
                    border-radius:12px; padding:16px 20px;
                    display:flex; justify-content:space-between;
                    align-items:center; margin-bottom:20px;
                    border:1px solid #e8ecff;">
            <span style="color:#444; font-size:15px; font-weight:500;">
                Current Balance
            </span>
            <span style="color:#1a1a2e; font-size:18px; font-weight:700;">
                ₹${balance.toFixed(2)}
            </span>
        </div>

        <a href="${whatsappLink}" target="_blank"
           style="width:100%; max-width:400px; background:#4a6cf7;
                  color:white; text-align:center; padding:16px;
                  border-radius:12px; font-size:16px; font-weight:600;
                  text-decoration:none; margin-bottom:16px; display:block;">
            Recharge Now
        </a>

        <a href="tel:+916302860355"
           style="color:#888; font-size:14px; text-decoration:none;">
            Need Help? Contact Support
        </a>

    </div>`;
}

checkLicense();
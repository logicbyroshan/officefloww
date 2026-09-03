import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

interface FacilitySlide {
  badge: string;
  title: string;
  quote: string;
  author: string;
  role: string;
}

const FACILITY_SLIDES: FacilitySlide[] = [
  {
    badge: "Rule #2 • File Lock Guard",
    title: "The Production File Lock Guard.",
    quote:
      "Presses must never run on unapproved artwork. The engine cryptographically enforces that referenced FileVersion is in state APPROVED before job tickets release to thermal and sublimation lines.",
    author: "Production Safety Rule",
    role: "Adharsh Bhopal • Press Floor & Prepress Spec",
  },
  {
    badge: "Rule #1 • Stock Separation",
    title: "Physical vs Reserved Stock Invariant.",
    quote:
      "Available Stock = Physical Stock − Reserved Stock. Placing an order reserves materials without decrementing physical inventory. Material is consumed only when loaded onto machines or issued to workers.",
    author: "Inventory Engine",
    role: "Zero-Leakage Raw Material Tracking",
  },
  {
    badge: "Rule #5 • Order Completion",
    title: "Tripartite Order Completion Invariant.",
    quote:
      "Orders cannot be marked completed by button clicks. The engine strictly validates: all workflow steps completed ∧ dual-signoff packing verified ∧ net packed good units match or exceed ordered quantities.",
    author: "Order Lifecycle Engine",
    role: "Cryptographic Milestone Verification",
  },
  {
    badge: "Rule #3 • Outside Contractors",
    title: "Labour Material Credit Ledger.",
    quote:
      "Hardware issued in bulk (hooks, clips, reels) is tracked non-destructively as company-owned material. Payouts are calculated strictly from verified good accepted output, never from issued raw stock.",
    author: "Contractor Payout Rule",
    role: "Labour Payout & Hardware Reconciliation",
  },
  {
    badge: "Core Products • High Custom Variety",
    title: "Multicolor Lanyards & Smart RFID Cards.",
    quote:
      "Centralized production management engineered for high-throughput facilities: Multicolor Printed Lanyards (MPL), ID Cards, Acrylic Badges, Marksheets, and Custom Engineered Print Products.",
    author: "Facility Specialization",
    role: "Industrial Print Facility Operating System",
  },
];

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@adharshbhopal.in");
  const [password, setPassword] = useState("OfficeFloww@2026");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const currentSlide = FACILITY_SLIDES[slideIndex];

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % FACILITY_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + FACILITY_SLIDES.length) % FACILITY_SLIDES.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // Strict firm domain verification: must be @adharshbhopal.in
    if (!cleanEmail.endsWith("@adharshbhopal.in")) {
      setErrorMsg(
        "Access restricted: Only authorized @adharshbhopal.in workstation accounts are permitted to authenticate."
      );
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please check workstation credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-root {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #090c13;
        }

        /* Ambient vibrant glowing grid mesh background */
        .auth-bg-ambient {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          background: 
            linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            radial-gradient(ellipse at 8% 45%, rgba(217, 70, 239, 0.42) 0%, transparent 60%),
            radial-gradient(ellipse at 92% 55%, rgba(244, 63, 94, 0.38) 0%, transparent 55%),
            radial-gradient(circle at 45% 15%, rgba(168, 85, 247, 0.32) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(251, 146, 60, 0.28) 0%, transparent 50%),
            #080a0f;
          background-size: 40px 40px, 40px 40px, 100% 100%, 100% 100%, 100% 100%, 100% 100%, auto;
        }

        /* Main Industrial Card Chassis with Sharp 8px Border Radius */
        .auth-card-container {
          position: relative;
          z-index: 1;
          width: 1140px;
          max-width: 96vw;
          min-height: 660px;
          display: grid;
          grid-template-columns: 1.02fr 1.08fr;
          background: rgba(22, 25, 34, 0.82);
          backdrop-filter: blur(48px);
          -webkit-backdrop-filter: blur(48px);
          border-radius: 8px; /* Sharp industrial radius */
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 40px 90px -15px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        @media (max-width: 960px) {
          .auth-card-container {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .auth-showcase-panel {
            display: none !important;
          }
        }

        /* Left Column: Authentic Workstation Login */
        .auth-form-panel {
          padding: 56px 48px 48px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        .auth-brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 44px;
        }

        .auth-logo-badge {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #ff9980 0%, #ff6b8b 100%);
          border-radius: 4px; /* Sharp 4px */
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: -0.5px;
        }

        .auth-firm-name {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.2px;
        }

        .auth-firm-sub {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .auth-title {
          font-size: 34px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.7px;
          line-height: 1.15;
          margin-bottom: 8px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 400;
          margin-bottom: 32px;
          line-height: 1.4;
        }

        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 22px;
        }

        .auth-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #cbd5e1;
        }

        /* Sharp 4px Border Radius for Inputs */
        .auth-sharp-input {
          width: 100%;
          height: 48px;
          border-radius: 4px; /* Sharp industrial radius */
          background: #0d1017;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0 16px;
          color: #f8fafc;
          font-size: 14.5px;
          font-family: inherit;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          box-sizing: border-box;
        }

        .auth-sharp-input:focus {
          border-color: #ff8a73;
          box-shadow: 
            0 0 0 2px rgba(255, 138, 115, 0.25),
            inset 0 2px 4px rgba(0, 0, 0, 0.6);
          background: #11151f;
        }

        .auth-sharp-input::placeholder {
          color: #475569;
        }

        .auth-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          margin-bottom: 26px;
          font-size: 13.5px;
        }

        .auth-remember-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #cbd5e1;
          cursor: pointer;
          user-select: none;
        }

        /* Sharp 3px Checkbox */
        .auth-custom-checkbox {
          width: 17px;
          height: 17px;
          border-radius: 3px; /* Sharp 3px */
          background: #0d1017;
          border: 1px solid rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .auth-remember-label:hover .auth-custom-checkbox {
          border-color: #ff8a73;
        }

        .auth-custom-checkbox.checked {
          background: linear-gradient(135deg, #ff8a73, #ff6b8b);
          border-color: transparent;
        }

        .auth-forgot-link {
          color: #cbd5e1;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
          font-size: 13px;
          transition: color 0.15s ease;
        }

        .auth-forgot-link:hover {
          color: #ff8a73;
        }

        /* Sharp 4px Border Radius for Primary Button */
        .auth-submit-btn {
          width: 100%;
          height: 48px;
          border-radius: 4px; /* Sharp industrial radius */
          border: none;
          background: linear-gradient(90deg, #ff9980 0%, #ff6b8b 100%);
          color: #111827;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          box-shadow: 0 8px 20px -3px rgba(255, 107, 139, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .auth-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px -3px rgba(255, 107, 139, 0.55);
          filter: brightness(1.05);
        }

        .auth-submit-btn:active {
          transform: translateY(0px);
          box-shadow: 0 4px 12px -2px rgba(255, 107, 139, 0.35);
        }

        .auth-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .auth-domain-notice {
          margin-top: 18px;
          padding: 10px 14px;
          background: rgba(14, 165, 233, 0.08);
          border: 1px solid rgba(14, 165, 233, 0.22);
          border-radius: 4px;
          font-size: 12px;
          color: #7dd3fc;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Right Column: Showcase Card with Sharp 6px Radius */
        .auth-showcase-panel {
          padding: 16px;
          position: relative;
        }

        .auth-showcase-inner {
          width: 100%;
          height: 100%;
          background: #090c12;
          border-radius: 6px; /* Sharp 6px */
          padding: 44px 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        /* Ambient blue/purple glow in the showcase card */
        .auth-showcase-glow {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.38) 0%, rgba(168, 85, 247, 0.2) 45%, transparent 70%);
          pointer-events: none;
          filter: blur(25px);
        }

        /* Starburst geometric decorative wireframe */
        .auth-starburst-svg {
          position: absolute;
          right: -30px;
          bottom: 30px;
          width: 340px;
          height: 340px;
          opacity: 0.7;
          pointer-events: none;
        }

        .auth-slide-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: #ff8a73;
          background: rgba(255, 138, 115, 0.12);
          border: 1px solid rgba(255, 138, 115, 0.28);
          border-radius: 3px;
          padding: 4px 10px;
          margin-bottom: 16px;
        }

        .auth-quote-title {
          font-size: 30px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.6px;
          max-width: 420px;
          margin-bottom: 16px;
          min-height: 76px;
        }

        .auth-quote-mark {
          font-size: 40px;
          line-height: 1;
          color: #ffffff;
          font-family: Georgia, serif;
          margin-bottom: 10px;
          opacity: 0.9;
        }

        .auth-quote-text {
          font-size: 14.5px;
          line-height: 1.65;
          color: #cbd5e1;
          max-width: 420px;
          margin-bottom: 24px;
          min-height: 84px;
        }

        .auth-author-name {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .auth-author-role {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 400;
        }

        /* Fixed Navigation Arrow Controls with Sharp 4px Border Radius */
        .auth-arrows-row {
          position: absolute;
          bottom: 36px;
          left: 40px;
          display: flex;
          gap: 10px;
          align-items: center;
          z-index: 20;
        }

        .auth-arrow-btn {
          width: 40px;
          height: 40px;
          border-radius: 4px; /* Sharp 4px */
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease, filter 0.15s ease;
        }

        .auth-arrow-btn.prev {
          background: #ff8a73;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(255, 138, 115, 0.35);
        }

        .auth-arrow-btn.next {
          background: #142823;
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.25);
        }

        .auth-arrow-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.12);
        }

        .auth-arrow-btn:active {
          transform: translateY(0);
        }

        /* Floating Highlight Card with Sharp 6px Radius */
        .auth-floating-card {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 310px;
          background: #ffffff;
          border-radius: 6px; /* Sharp 6px */
          padding: 18px 20px;
          box-shadow: 
            0 24px 44px -8px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.9);
          z-index: 10;
          animation: floatCard 6s ease-in-out infinite;
        }

        .auth-floating-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          margin-bottom: 6px;
        }

        .auth-floating-desc {
          font-size: 11.5px;
          line-height: 1.45;
          color: #475569;
          margin-bottom: 12px;
        }

        .auth-roles-strip {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .auth-role-tag {
          padding: 3px 6px;
          border-radius: 3px; /* Sharp 3px */
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          background: #0f172a;
          color: #ffffff;
        }
      `}</style>

      {/* Ambient background mesh */}
      <div className="auth-bg-ambient" />

      {/* Main Glassmorphic Container Card with Sharp 8px Radius */}
      <div className="auth-card-container">
        {/* Left Side: Authentic In-House Workstation Login */}
        <div className="auth-form-panel">
          <div>
            {/* Top Brand Mark */}
            <div className="auth-brand-logo">
              <img
                src="./assets/logo.png"
                alt="PrintFlow"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "6px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 10px rgba(124, 58, 237, 0.45))",
                }}
              />
              <div>
                <div className="auth-firm-name">PrintFlow</div>
                <div className="auth-firm-sub">Adharsh Bhopal • Production OS</div>
              </div>
            </div>

            <h1 className="auth-title">Workstation Login</h1>
            <p className="auth-subtitle">
              Enter your official @adharshbhopal.in credentials to access the production terminal.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "4px",
                  color: "#f87171",
                  fontSize: "12.5px",
                  lineHeight: 1.4,
                  marginBottom: "20px",
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-input-group">
                <label className="auth-label">Firm Workstation Email</label>
                <input
                  type="email"
                  className="auth-sharp-input"
                  placeholder="operator@adharshbhopal.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className="auth-sharp-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  required
                />
              </div>

              <div className="auth-options-row">
                <label
                  className="auth-remember-label"
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                >
                  <div className={`auth-custom-checkbox ${keepLoggedIn ? "checked" : ""}`}>
                    {keepLoggedIn && (
                      <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
                          stroke="#ffffff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  Keep me logged in
                </label>

                <span
                  className="auth-forgot-link"
                  onClick={() =>
                    alert("Contact Adharsh Bhopal IT Admin at admin@adharshbhopal.in for password resets.")
                  }
                >
                  Forgot Password?
                </span>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #111827",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                ) : (
                  "Authenticate Workstation"
                )}
              </button>

              <div className="auth-domain-notice">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>Authorized firm domain: <strong>@adharshbhopal.in</strong></span>
              </div>
            </form>
          </div>

          <div style={{ marginTop: "24px", fontSize: "11.5px", color: "#475569", textAlign: "center" }}>
            Adharsh Bhopal Printing Facility • OfficeFloww v3.0.0
          </div>
        </div>

        {/* Right Side: Showcase Panel with Sharp 6px Radius */}
        <div className="auth-showcase-panel">
          <div className="auth-showcase-inner">
            {/* Ambient inner glow */}
            <div className="auth-showcase-glow" />

            {/* Glowing geometric Starburst SVG vector */}
            <svg
              className="auth-starburst-svg"
              viewBox="0 0 260 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="starGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              {/* Radial Rays */}
              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((angle, i) => (
                <line
                  key={i}
                  x1="130"
                  y1="10"
                  x2="130"
                  y2="250"
                  stroke="url(#starGrad1)"
                  strokeWidth="1.6"
                  transform={`rotate(${angle} 130 130)`}
                />
              ))}
              {/* Outer faceted geometric star */}
              <polygon
                points="130,12 148,88 226,62 174,122 248,130 174,138 226,198 148,172 130,248 112,172 34,198 86,138 12,130 86,122 34,62 112,88"
                stroke="url(#starGrad1)"
                strokeWidth="1.4"
                fill="none"
              />
              {/* Inner faceted geometric star */}
              <polygon
                points="130,42 142,98 196,78 160,124 212,130 160,136 196,182 142,162 130,218 118,162 64,182 100,136 48,130 100,124 64,78 118,98"
                stroke="url(#starGrad1)"
                strokeWidth="1.2"
                fill="none"
                opacity="0.85"
              />
            </svg>

            {/* Testimonial / Invariant Content */}
            <div style={{ position: "relative", zIndex: 2 }}>
              <div className="auth-slide-badge">{currentSlide.badge}</div>
              <h2 className="auth-quote-title">{currentSlide.title}</h2>
              <div className="auth-quote-mark">“</div>
              <p className="auth-quote-text">“{currentSlide.quote}”</p>

              <div className="auth-author-name">{currentSlide.author}</div>
              <div className="auth-author-role">{currentSlide.role}</div>
            </div>

            {/* Fixed Navigation Arrow Controls with Sharp 4px Border Radius */}
            <div className="auth-arrows-row">
              <button
                type="button"
                className="auth-arrow-btn prev"
                onClick={handlePrevSlide}
                title="Previous invariant"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="auth-arrow-btn next"
                onClick={handleNextSlide}
                title="Next invariant"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Floating Highlight Card with Sharp 6px Radius */}
            <div className="auth-floating-card">
              <div className="auth-floating-title">
                Adharsh Bhopal Facility Terminal
              </div>
              <div className="auth-floating-desc">
                High-throughput ID cards, multicolor lanyards, dual-signoff packing, and zero-leakage contractor credit ledgers.
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="auth-roles-strip">
                  <span className="auth-role-tag" style={{ background: "#e11d48" }}>OWNER</span>
                  <span className="auth-role-tag" style={{ background: "#2563eb" }}>ADMIN</span>
                  <span className="auth-role-tag" style={{ background: "#7c3aed" }}>PROD</span>
                  <span className="auth-role-tag" style={{ background: "#059669" }}>QC</span>
                  <span className="auth-role-tag" style={{ background: "#334155" }}>+6</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                  Live Sync
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

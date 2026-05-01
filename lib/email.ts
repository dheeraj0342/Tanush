import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? "Tanush <noreply@tanush.in>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Shared layout ─────────────────────────────────────────────────────────────

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tanush Jewelry</title>
</head>
<body style="margin:0;padding:0;background:#faf9f6;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e3db;border-radius:4px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-family:'Georgia',serif;font-size:11px;letter-spacing:0.3em;color:#c9a84c;text-transform:uppercase;">Tanush</p>
            <p style="margin:6px 0 0;font-family:'Georgia',serif;font-size:22px;font-style:italic;color:#ffffff;letter-spacing:0.05em;">Jewelry Atelier</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e8e3db;text-align:center;">
            <p style="margin:0;font-size:11px;color:#999;letter-spacing:0.1em;">© ${new Date().getFullYear()} TANUSH JEWELRY ATELIER</p>
            <p style="margin:6px 0 0;font-size:11px;color:#bbb;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function goldButton(href: string, label: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td style="background:#c9a84c;border-radius:3px;">
        <a href="${href}" style="display:inline-block;padding:14px 36px;font-size:12px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

async function sendMail(to: string, subject: string, html: string) {
  return transporter.sendMail({ from: FROM, to, subject, html });
}

// ── 1. Welcome email ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(" ")[0];
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#c9a84c;">Welcome</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Welcome, ${firstName}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Your account has been created. You now have access to our exclusive collections, early previews, and a curated world of timeless jewellery.
    </p>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Explore pieces crafted to illuminate your unique radiance.
    </p>
    ${goldButton(`${APP_URL}/collections`, "Explore Collections")}
  `);
  return sendMail(to, "Welcome to Tanush Jewelry", html);
}

// ── 2. Login notification ─────────────────────────────────────────────────────

export async function sendLoginNotificationEmail(to: string, name: string) {
  const firstName = name?.split(" ")[0] ?? "there";
  const time = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "long",
    timeStyle: "short",
  });

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#c9a84c;">Security Notice</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">New Sign-In Detected</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, a new sign-in to your Tanush account was detected at:
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#faf9f6;border-left:3px solid #c9a84c;border-radius:2px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;font-weight:600;">${time} (IST)</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;line-height:1.7;color:#6b6b6b;font-family:Arial,sans-serif;">
      If this was you, no action is needed. If you did not sign in, please reset your password immediately.
    </p>
  `);
  return sendMail(to, "New sign-in to your Tanush account", html);
}

// ── 3. Password reset ─────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const firstName = name?.split(" ")[0] ?? "there";
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#c9a84c;">Password Reset</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Reset Your Password</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, we received a request to reset the password for your Tanush account.
      Click the button below to choose a new password.
    </p>
    ${goldButton(resetUrl, "Reset Password")}
    <p style="margin:28px 0 0;font-size:13px;line-height:1.7;color:#999;font-family:Arial,sans-serif;">
      This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#bbb;font-family:Arial,sans-serif;word-break:break-all;">
      Or copy this link: ${resetUrl}
    </p>
  `);
  return sendMail(to, "Reset your Tanush password", html);
}

// ── 4. Order confirmation ─────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderNumber: string,
  items: { productName: string; quantity: number; price: number }[],
  subtotal: number,
  shippingCost: number,
  tax: number,
  total: number,
  paymentMethod: string,
  estimatedDelivery: Date,
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const itemRows = items.map((i) =>
    `<tr>
      <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:#4a4a4a;border-bottom:1px solid #f0e6d0;">${i.productName} × ${i.quantity}</td>
      <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;border-bottom:1px solid #f0e6d0;">₹${(i.price * i.quantity).toLocaleString("en-IN")}</td>
    </tr>`
  ).join("");

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#c9a84c;">Order Confirmed</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Thank you, ${firstName}!</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Your order <strong>${orderNumber}</strong> has been placed successfully. We'll notify you as it progresses.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-top:1px solid #f0e6d0;">
      ${itemRows}
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:12px;color:#999;">Shipping</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:12px;color:#4a4a4a;text-align:right;">${shippingCost === 0 ? "Free" : `₹${shippingCost.toLocaleString("en-IN")}`}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:12px;color:#999;">Tax (3%)</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:12px;color:#4a4a4a;text-align:right;">₹${tax.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#1a1a1a;border-top:2px solid #e8e3db;">Total</td>
        <td style="padding:12px 0 0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#c9a84c;text-align:right;border-top:2px solid #e8e3db;">₹${total.toLocaleString("en-IN")}</td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:14px 18px;background:#faf9f6;border-left:3px solid #c9a84c;border-radius:2px;">
          <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Payment</p>
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;">${paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"}</p>
          <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Expected Delivery</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#1a1a1a;">${estimatedDelivery.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </td>
      </tr>
    </table>
    ${goldButton(`${APP_URL}/orders`, "Track My Order")}
  `);
  return sendMail(to, `Order confirmed — ${orderNumber}`, html);
}

// ── 5. Order status update ────────────────────────────────────────────────────

const STATUS_MESSAGES: Record<string, { subject: string; heading: string; body: string; color: string }> = {
  CONFIRMED: {
    subject: "Order confirmed",
    heading: "Your order is confirmed!",
    body: "Great news — your order has been confirmed and is being prepared.",
    color: "#2e7d32",
  },
  PROCESSING: {
    subject: "Order is being processed",
    heading: "We're packing your order",
    body: "Your order is currently being processed and packed with care. We'll update you once it's shipped.",
    color: "#1565c0",
  },
  SHIPPED: {
    subject: "Your order is on the way",
    heading: "Your order has shipped!",
    body: "Your order is on its way to you. Use the tracking details on your order page to follow its journey.",
    color: "#6a1b9a",
  },
  DELIVERED: {
    subject: "Order delivered",
    heading: "Your order has arrived!",
    body: "Your order has been delivered. We hope you love your new jewellery. If you have any issues, you can request a return within 3 days.",
    color: "#1b5e20",
  },
  CANCELLED: {
    subject: "Order cancelled",
    heading: "Your order has been cancelled",
    body: "Your order has been cancelled. If you did not request this cancellation or have any questions, please contact our support team.",
    color: "#b71c1c",
  },
};

export async function sendOrderStatusEmail(
  to: string,
  name: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string | null,
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const info = STATUS_MESSAGES[status];
  if (!info) return;

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:${info.color};">${status.charAt(0) + status.slice(1).toLowerCase()}</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">${info.heading}</h1>
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;color:#888;">Order: <strong style="color:#1a1a1a;">${orderNumber}</strong></p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">${info.body}</p>
    ${trackingNumber ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:14px 18px;background:#faf9f6;border-left:3px solid #c9a84c;border-radius:2px;">
          <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Tracking Number</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1a1a1a;">${trackingNumber}</p>
        </td>
      </tr>
    </table>` : ""}
    ${goldButton(`${APP_URL}/orders`, "View Order")}
  `);
  return sendMail(to, `${info.subject} — ${orderNumber}`, html);
}

// ── 6. Return request confirmation ────────────────────────────────────────────

const RETURN_REASON_LABELS: Record<string, string> = {
  DAMAGED: "Item Damaged",
  WRONG_ITEM: "Wrong Item Received",
  QUALITY_ISSUE: "Quality Issue",
  CHANGED_MIND: "Changed Mind",
  OTHER: "Other",
};

export async function sendReturnRequestConfirmationEmail(
  to: string,
  name: string,
  orderNumber: string,
  returnReason: string,
  refundAmount: number,
  deliveryCharges: number,
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const reasonLabel = RETURN_REASON_LABELS[returnReason] ?? returnReason;

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#c9a84c;">Return Request</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Request Received</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, we've received your return request for order <strong>${orderNumber}</strong>. Our team will review it within 24–48 hours and notify you of the outcome.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#faf9f6;border-left:3px solid #c9a84c;border-radius:2px;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Return Reason</p>
          <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;font-weight:600;">${reasonLabel}</p>
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Refund Breakdown</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:13px;color:#4a4a4a;">Product Price</td>
              <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">₹${refundAmount.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:13px;color:#999;">Delivery Charges</td>
              <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:12px;color:#b71c1c;text-align:right;font-style:italic;">Non-refundable${deliveryCharges > 0 ? ` (₹${deliveryCharges.toLocaleString("en-IN")})` : ""}</td>
            </tr>
            <tr style="border-top:1px solid #e8e3db;">
              <td style="padding:8px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;font-weight:700;">You will receive</td>
              <td style="padding:8px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#c9a84c;font-weight:700;text-align:right;">₹${refundAmount.toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;line-height:1.7;color:#888;font-family:Arial,sans-serif;">
      Please do not ship the item until you receive our approval email with return instructions.
    </p>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Return request received — Order ${orderNumber}`, html);
}

// ── 6b. Return completed (legacy — kept for backward compat) ──────────────────

export async function sendReturnCompletedEmail(to: string, name: string, orderNumber: string, adminNote: string) {
  const firstName = name?.split(" ")[0] ?? "there";
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#2e7d32;">Return Complete</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Return Processed</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, we have received and inspected the returned item(s) for order <strong>${orderNumber}</strong>. Your refund has been initiated.
    </p>
    ${adminNote ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:14px 18px;background:#e8f5e9;border-left:3px solid #2e7d32;border-radius:2px;">
          <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Note</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#4a4a4a;">${adminNote}</p>
        </td>
      </tr>
    </table>` : ""}
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Refunds typically reflect within 5–7 business days depending on your bank or payment provider.
    </p>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Refund initiated — Order ${orderNumber}`, html);
}

// ── 8. Return approved ────────────────────────────────────────────────────────

export async function sendReturnApprovedEmail(
  to: string, name: string, orderNumber: string, returnWaybill: string, refundAmount: number
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#2e7d32;">Return Approved</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Your Return is Approved</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, your return request for order <strong>${orderNumber}</strong> has been approved. Our courier will pick up the item from your address.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#faf9f6;border-left:3px solid #c9a84c;border-radius:2px;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Return Waybill / Tracking</p>
          <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;">${returnWaybill}</p>
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Refund Amount (after inspection)</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#c9a84c;">₹${refundAmount.toLocaleString("en-IN")}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Please keep the item(s) securely packed and ready for pickup. Your refund will be processed within 5–7 business days of us receiving the item.
    </p>
    <p style="margin:0 0 16px;font-size:13px;line-height:1.7;color:#888;font-family:Arial,sans-serif;">
      Note: Delivery charges are non-refundable. Only the product price will be refunded.
    </p>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Return approved — Order ${orderNumber}`, html);
}

// ── 10. Return received ───────────────────────────────────────────────────────

export async function sendReturnReceivedEmail(
  to: string, name: string, orderNumber: string, refundAmount: number
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#1565c0;">Item Received</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">We've Received Your Return</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, we have received the returned item(s) for order <strong>${orderNumber}</strong> and are inspecting them.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#e3f2fd;border-left:3px solid #1565c0;border-radius:2px;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Refund Amount</p>
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;">₹${refundAmount.toLocaleString("en-IN")}</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#4a4a4a;">Your refund will be processed within 48 hours.</p>
        </td>
      </tr>
    </table>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Return received — Refund processing soon — Order ${orderNumber}`, html);
}

// ── 11. Refund processed ──────────────────────────────────────────────────────

export async function sendRefundProcessedEmail(
  to: string,
  name: string,
  orderNumber: string,
  refundAmount: number,
  trackingNumber: string | null,
  razorpayRefundId: string | null,
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#2e7d32;">Refund Processed</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Your Refund is On Its Way</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, your refund for order <strong>${orderNumber}</strong> has been successfully processed.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#e8f5e9;border-left:3px solid #2e7d32;border-radius:2px;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Amount Refunded</p>
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#1b5e20;">₹${refundAmount.toLocaleString("en-IN")}</p>
          ${razorpayRefundId ? `
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Refund Reference ID</p>
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#1a1a1a;">${razorpayRefundId}</p>` : ""}
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#4a4a4a;">The amount has been sent to your UPI ID. Please check your UPI app for the credit.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:13px;line-height:1.7;color:#888;font-family:Arial,sans-serif;">
      Note: Delivery charges were non-refundable and have not been included in this refund.
    </p>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Refund of ₹${refundAmount.toLocaleString("en-IN")} processed — Order ${orderNumber}`, html);
}

// ── 12. Refund failed ─────────────────────────────────────────────────────────

export async function sendRefundFailedEmail(
  to: string, name: string, orderNumber: string, refundAmount: number
) {
  const firstName = name?.split(" ")[0] ?? "there";
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#b71c1c;">Refund Issue</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Refund Could Not Be Processed</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, we encountered an issue processing your refund of <strong>₹${refundAmount.toLocaleString("en-IN")}</strong> for order <strong>${orderNumber}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Our team has been notified and will resolve this manually. You can expect to hear from us within 24 hours. We apologise for the inconvenience.
    </p>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Refund issue — Order ${orderNumber}`, html);
}

// ── 9. Return rejected ────────────────────────────────────────────────────────

export async function sendReturnRejectedEmail(to: string, name: string, orderNumber: string, adminNote: string) {
  const firstName = name?.split(" ")[0] ?? "there";
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#b71c1c;">Return Request</p>
    <h1 style="margin:0 0 20px;font-family:'Georgia',serif;font-size:28px;font-style:italic;color:#1a1a1a;font-weight:400;">Return Not Approved</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      Hello ${firstName}, unfortunately your return request for order <strong>${orderNumber}</strong> could not be approved.
    </p>
    ${adminNote ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#fce4ec;border-left:3px solid #b71c1c;border-radius:2px;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Reason</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#4a4a4a;">${adminNote}</p>
        </td>
      </tr>
    </table>` : ""}
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4a4a4a;font-family:Arial,sans-serif;">
      If you have further questions, please contact our support team.
    </p>
    ${goldButton(`${APP_URL}/orders`, "View My Orders")}
  `);
  return sendMail(to, `Return request update — Order ${orderNumber}`, html);
}

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

const isMailerConfigured =
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

if (isMailerConfigured) {
  const isGmail = 
    process.env.SMTP_HOST && 
    (process.env.SMTP_HOST.toLowerCase() === 'gmail' || process.env.SMTP_HOST.toLowerCase().includes('gmail.com'));

  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  console.log('Nodemailer SMTP Transporter configured.');
} else {
  console.warn(
    'WARNING: SMTP email configurations (SMTP_HOST, SMTP_USER, SMTP_PASS) are missing. Fallback mode is active: OTP codes will be printed to the server console log for verification.'
  );
}

export const sendOtpEmail = async (email, otp, purpose = 'Verification') => {
  const mailOptions = {
    from: `"VelocityWear" <${process.env.SMTP_USER || 'noreply@velocitywear.com'}>`,
    to: email,
    subject: `VelocityWear - ${purpose} OTP Code`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">VelocityWear</h2>
        <p>Hello,</p>
        <p>You requested a one-time password (OTP) for <strong>${purpose}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f1f5f9; padding: 10px 20px; border-radius: 5px; border: 1px solid #cbd5e1; color: #0f172a;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP Email successfully sent to ${email} for ${purpose}.`);
      return true;
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error.message);
      // Even if SMTP fails, we'll log the OTP to the console so the developer isn't locked out.
      console.log(`\n======================================================`);
      console.log(`[SMTP-FAILURE FALLBACK] OTP for ${email} (${purpose}) is: ${otp}`);
      console.log(`======================================================\n`);
      return false;
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[DEVELOPMENT ONLY] OTP for ${email} (${purpose}) is: ${otp}`);
    console.log(`======================================================\n`);
    return true;
  }
};

export const sendStatusUpdateEmail = async (email, name, orderId, status, message = '') => {
  const getStatusLabel = (s) => {
    switch (s) {
      case 'placed': return 'Placed';
      case 'confirmed': return 'Order Confirmed';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out For Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return s;
    }
  };

  const mailOptions = {
    from: `"VelocityWear" <${process.env.SMTP_USER || 'noreply@velocitywear.com'}>`,
    to: email,
    subject: `VelocityWear - Order #${orderId.toString().substring(0, 10)} Update: ${getStatusLabel(status)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">VelocityWear</h2>
        <p>Hello ${name},</p>
        <p>Your order status has been updated. Details are as follows:</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderId}</p>
          <p style="margin: 0 0 8px 0;"><strong>New Status:</strong> <span style="color: #2563eb; font-weight: bold;">${getStatusLabel(status)}</span></p>
          ${message ? `<p style="margin: 0;"><strong>Shipping/Tracking Note:</strong> "${message}"</p>` : ''}
        </div>

        <p style="color: #64748b; font-size: 14px;">You can track this order directly inside your account profile dashboard under "Order History".</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">VelocityWear E-Commerce Team</p>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Status email successfully sent to ${email} for Order #${orderId}.`);
      return true;
    } catch (error) {
      console.error(`Failed to send status update email to ${email}:`, error.message);
      console.log(`\n======================================================`);
      console.log(`[SMTP-FAILURE FALLBACK] Email Alert for ${email} regarding Order #${orderId}:`);
      console.log(`New Status: ${getStatusLabel(status)} | Message: ${message}`);
      console.log(`======================================================\n`);
      return false;
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[DEVELOPMENT ONLY] Email Alert for ${email} regarding Order #${orderId}:`);
    console.log(`New Status: ${getStatusLabel(status)} | Message: ${message}`);
    console.log(`======================================================\n`);
    return true;
  }
};

export default sendOtpEmail;

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import https from 'https';

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
} else if (!process.env.RESEND_API_KEY) {
  console.warn(
    'WARNING: SMTP email configurations (SMTP_HOST, SMTP_USER, SMTP_PASS) and RESEND_API_KEY are missing. Fallback mode is active: OTP codes will be printed to the server console log for verification.'
  );
}

// Helper function to send email via Resend's HTTPS API
const sendEmailViaResend = async (to, subject, html) => {
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  if (typeof fetch !== 'undefined') {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`Email successfully sent via Resend API to ${to}. ID: ${data.id}`);
        return true;
      }
      console.error(`Resend API error:`, data);
      return false;
    } catch (error) {
      console.error(`Failed to send email via Resend:`, error.message);
      return false;
    }
  }

  // Fallback to native https module if fetch is not globally defined in this Node.js runtime
  return new Promise((resolve) => {
    const postData = JSON.stringify({ from, to, subject, html });
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Email successfully sent via Resend API (https fallback) to ${to}.`);
          resolve(true);
        } else {
          console.error(`Resend API error (https fallback): Status ${res.statusCode}, Body ${body}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Failed to send email via Resend (https fallback):`, error.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

export const sendOtpEmail = async (email, otp, purpose = 'Verification') => {
  const subject = `Deb Clothes - ${purpose} OTP Code`;
  const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Deb Clothes</h2>
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
    `;

  if (process.env.RESEND_API_KEY) {
    const success = await sendEmailViaResend(email, subject, htmlContent);
    if (success) return true;
    
    // Log fallback if Resend fails in production
    console.log(`\n======================================================`);
    console.log(`[RESEND-FAILURE FALLBACK] OTP for ${email} (${purpose}) is: ${otp}`);
    console.log(`======================================================\n`);
    return false;
  }

  const mailOptions = {
    from: `"Deb Clothes" <${process.env.SMTP_USER || 'noreply@debclothes.com'}>`,
    to: email,
    subject: subject,
    html: htmlContent,
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
// In-memory queue storage for background email jobs
const emailQueue = [];
let isProcessingQueue = false;

// Process the email queue sequentially in the background
const processQueue = async () => {
  if (isProcessingQueue || emailQueue.length === 0) return;
  isProcessingQueue = true;

  while (emailQueue.length > 0) {
    const job = emailQueue[0];
    console.log(`[Email Queue] Processing job for ${job.email}. Jobs left in queue: ${emailQueue.length}`);
    
    let success = false;
    try {
      success = await job.handler();
    } catch (error) {
      console.error(`[Email Queue] Error during email handler execution:`, error.message);
    }

    if (success) {
      console.log(`[Email Queue] Email sent successfully to ${job.email}.`);
      emailQueue.shift(); // Remove the completed job
    } else {
      job.retries += 1;
      if (job.retries >= 3) {
        console.error(`[Email Queue] Job for ${job.email} failed after 3 attempts. Discarding job.`);
        emailQueue.shift(); // Discard the job
      } else {
        console.warn(`[Email Queue] Job for ${job.email} failed. Will retry. (Attempt ${job.retries}/3)`);
        // Shift from front, push to the back to avoid blocking other emails
        const failedJob = emailQueue.shift();
        emailQueue.push(failedJob);
        // Wait 5 seconds before processing the next job to give the server / API a break
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Add a small 1-second delay between processing subsequent jobs to prevent rate limiting
    if (emailQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  isProcessingQueue = false;
};

// Queue helper function
export const queueEmail = (email, handler) => {
  emailQueue.push({ email, handler, retries: 0 });
  console.log(`[Email Queue] Queued new email for ${email}. Total queue size: ${emailQueue.length}`);
  
  // Kick off queue processing without awaiting
  processQueue().catch(err => {
    console.error(`[Email Queue] Background processor crashed:`, err.message);
    isProcessingQueue = false; // reset flag in case of unhandled failure
  });
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

  const subject = `Deb Clothes - Order #${orderId.toString().substring(0, 10)} Update: ${getStatusLabel(status)}`;
  const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Deb Clothes</h2>
        <p>Hello ${name},</p>
        <p>Your order status has been updated. Details are as follows:</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderId}</p>
          <p style="margin: 0 0 8px 0;"><strong>New Status:</strong> <span style="color: #2563eb; font-weight: bold;">${getStatusLabel(status)}</span></p>
          ${message ? `<p style="margin: 0;"><strong>Shipping/Tracking Note:</strong> "${message}"</p>` : ''}
        </div>

        <p style="color: #64748b; font-size: 14px;">You can track this order directly inside your account profile dashboard under "Order History".</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Deb Clothes E-Commerce Team</p>
      </div>
    `;

  // Push the email sending execution to the background queue
  queueEmail(email, async () => {
    if (process.env.RESEND_API_KEY) {
      const success = await sendEmailViaResend(email, subject, htmlContent);
      if (success) return true;
      
      console.log(`\n======================================================`);
      console.log(`[RESEND-FAILURE FALLBACK] Email Alert for ${email} regarding Order #${orderId}:`);
      console.log(`New Status: ${getStatusLabel(status)} | Message: ${message}`);
      console.log(`======================================================\n`);
      return false;
    }

    const mailOptions = {
      from: `"Deb Clothes" <${process.env.SMTP_USER || 'noreply@debclothes.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent,
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
  });

  // Return true immediately to unblock the caller (controller)
  return true;
};

export default sendOtpEmail;

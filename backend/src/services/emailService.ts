import axios from 'axios';

const ZEPTO_API_KEY = process.env.ZEPTO_API_TOKEN || '';
const ZEPTO_BASE_URL = 'https://api.zoho.com/v1.1/email';
const FROM_EMAIL = process.env.ZEPTO_FROM || 'no-reply@replysys.com';
const FROM_NAME = 'Replysys';
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@replysys.com';
const ENABLE_EMAIL = process.env.ENABLE_EMAIL !== 'false';

const sendViaZepto = async (email: string, subject: string, htmlbody: string) => {
  try {
    await axios.post(
      `${ZEPTO_BASE_URL}/send`,
      {
        from_email: FROM_EMAIL,
        from_name: FROM_NAME,
        to_email: email,
        subject: subject,
        htmlbody: htmlbody
      },
      {
        headers: {
          'Authorization': `Zoho-endusertoken ${ZEPTO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error('❌ Zepto email failed:', error.response?.data || error.message);
    throw error;
  }
};

export const emailService = {
  sendWelcomeEmail: async (email: string, name: string) => {
    try {
      console.log('📧 Sending welcome email to', email);
      
      if (!ENABLE_EMAIL) {
        console.log('✅ Email service disabled');
        return { success: true, skipped: true };
      }

      const htmlbody = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: white; padding: 30px; }
              .button { background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
              .features { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .features ul { margin: 10px 0; padding-left: 20px; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Replysys! 🚀</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${name}</strong>,</p>
                <p>Welcome aboard! Your account has been created successfully.</p>
                <div class="features">
                  <h3>What You Can Do:</h3>
                  <ul>
                    <li>✅ Connect your WhatsApp Business Account</li>
                    <li>✅ Send messages to customers</li>
                    <li>✅ Manage conversations</li>
                    <li>✅ Track analytics</li>
                  </ul>
                </div>
                <p style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'https://app.replysys.com'}/dashboard" class="button">Go to Dashboard →</a>
                </p>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Replysys. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendViaZepto(email, `Welcome to Replysys, ${name}! 🚀`, htmlbody);
      console.log('✅ Welcome email sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Welcome email failed:', error.message);
      return { success: false };
    }
  },

  sendAdminSignupNotification: async (email: string, name: string, company?: string, role?: string) => {
    try {
      if (!ENABLE_EMAIL) return { success: true, skipped: true };

      const signupTime = new Date().toLocaleString('en-IN');
      
      const htmlbody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; border-radius: 4px; }
            .details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { margin: 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .label { font-weight: bold; color: #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 New Signup Alert!</h2>
            </div>
            <p>A new user has registered on Replysys:</p>
            <div class="details">
              <div class="detail-row">
                <span class="label">Name:</span> ${name}
              </div>
              <div class="detail-row">
                <span class="label">Email:</span> ${email}
              </div>
              <div class="detail-row">
                <span class="label">Role:</span> ${role || 'client'}
              </div>
              <div class="detail-row">
                <span class="label">Signup Time:</span> ${signupTime}
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await axios.post(
        `${ZEPTO_BASE_URL}/send`,
        {
          from_email: FROM_EMAIL,
          from_name: 'Replysys Notifications',
          to_email: ADMIN_EMAIL,
          subject: `🎉 New Signup: ${name}`,
          htmlbody: htmlbody
        },
        {
          headers: {
            'Authorization': `Zoho-endusertoken ${ZEPTO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Admin notification sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Admin notification failed:', error.message);
      return { success: false };
    }
  }
};

/**
 * Email utility for sending OTP and notifications
 * This is a simple implementation that can be extended with actual email service
 */

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Send OTP email to user
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // In production, integrate with email service (SendGrid, AWS SES, Nodemailer, etc.)
    // For now, we'll log to console
    
    const emailOptions: EmailOptions = {
      to: email,
      subject: 'StockMaster - Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; background-color: #f9f9f9; }
              .otp-box { background-color: white; border: 2px solid #4F46E5; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>StockMaster</h1>
              </div>
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password. Use the OTP below to proceed:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                <p><strong>This OTP will expire in 10 minutes.</strong></p>
                <p>If you didn't request this password reset, please ignore this email or contact support if you're concerned.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }

    // Check if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // TODO: Implement actual SMTP sending with nodemailer or similar
      // const nodemailer = require('nodemailer')
      // const transporter = nodemailer.createTransport({...})
      // await transporter.sendMail(emailOptions)
      console.log('Email service configured - would send:', emailOptions)
    } else {
      // Development mode - just log
      console.log('=== EMAIL (Development Mode) ===')
      console.log(`To: ${emailOptions.to}`)
      console.log(`Subject: ${emailOptions.subject}`)
      console.log(`OTP: ${otp}`)
      console.log('================================')
    }

    return true
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    return false
  }
}

/**
 * Send notification email (for future use)
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    const emailOptions: EmailOptions = {
      to: email,
      subject: `StockMaster - ${subject}`,
      text: message,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; background-color: #f9f9f9; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>StockMaster</h1>
              </div>
              <div class="content">
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }

    console.log('Notification email:', emailOptions)
    return true
  } catch (error) {
    console.error('Failed to send notification email:', error)
    return false
  }
}

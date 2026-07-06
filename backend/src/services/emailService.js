import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import EmailHistory from '../models/EmailHistory.js';

dotenv.config();

// Configure Nodemailer transporter with Gmail SMTP
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  offer: (candidate, job, company = 'RecruitAI') => {
    const { name, email, role } = candidate;
    const companyEmail = process.env.COMPANY_EMAIL || 'hr@company.com';
    const logoUrl = process.env.COMPANY_LOGO || 'https://via.placeholder.com/200x50?text=Company+Logo';

    return {
      subject: 'Congratulations! Your Application Has Been Selected',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .logo { height: 50px; margin-bottom: 20px; }
            .content { padding: 40px; }
            .greeting { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .congratulations { font-size: 18px; color: #667eea; font-weight: 600; margin: 20px 0; }
            .details { background-color: #f9f9f9; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .detail-item { margin: 10px 0; color: #555; }
            .label { font-weight: 600; color: #333; }
            .next-steps { margin: 30px 0; }
            .steps-list { list-style: none; padding: 0; }
            .steps-list li { margin: 12px 0; padding-left: 30px; position: relative; color: #555; }
            .steps-list li:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
            .contact-info { background-color: #f0f4ff; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .contact-label { font-weight: 600; color: #333; margin-bottom: 10px; }
            .contact-item { margin: 8px 0; color: #555; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
            .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
            .button:hover { background-color: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Company Logo" class="logo" style="max-height: 50px;">
              <h1 style="margin: 0; font-size: 32px;">Great News!</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Dear ${name},</div>
              
              <p style="color: #555; line-height: 1.6;">We are pleased to inform you that we have selected your application for the position of <strong>${role}</strong> at ${company}.</p>
              
              <div class="congratulations">
                🎉 Congratulations! 🎉
              </div>
              
              <p style="color: #555; line-height: 1.6;">Your skills, experience, and qualifications impressed our hiring team. We are excited about the possibility of having you join our organization.</p>
              
              <div class="details">
                <div class="detail-item">
                  <span class="label">Position:</span> ${role}
                </div>
                <div class="detail-item">
                  <span class="label">Company:</span> ${company}
                </div>
                <div class="detail-item">
                  <span class="label">Email:</span> ${email}
                </div>
              </div>
              
              <div class="next-steps">
                <h3 style="color: #333; margin-top: 0;">Next Steps:</h3>
                <ul class="steps-list">
                  <li>Review the attached job description and offer details</li>
                  <li>Schedule a call with our HR representative</li>
                  <li>Complete any required documentation</li>
                  <li>Finalize your employment agreement</li>
                </ul>
              </div>
              
              <div class="contact-info">
                <div class="contact-label">📞 Next Steps & Questions</div>
                <div class="contact-item"><strong>HR Contact:</strong> ${companyEmail}</div>
                <div class="contact-item"><strong>Response Deadline:</strong> 5 business days</div>
                <div class="contact-item" style="margin-top: 15px; font-size: 13px; color: #999;">Please reply to this email or contact us directly to confirm your interest.</div>
              </div>
              
              <p style="color: #555; line-height: 1.6;">We look forward to the opportunity to work with you and are confident that you will make a valuable contribution to our team.</p>
              
              <p style="color: #555;">Best regards,<br><strong>${company} Hiring Team</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">This is an automated email. Please do not reply to this address.</p>
              <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Dear ${name},\n\nWe are pleased to inform you that we have selected your application for the position of ${role} at ${company}.\n\nCongratulations! Your skills, experience, and qualifications impressed our hiring team.\n\nNext Steps:\n- Review the attached job description\n- Schedule a call with our HR representative\n- Complete required documentation\n- Finalize your employment agreement\n\nPlease contact us at ${companyEmail} for more information.\n\nBest regards,\n${company} Hiring Team`
    };
  },

  rejection: (candidate, job, company = 'RecruitAI') => {
    const { name, email, role } = candidate;
    const companyEmail = process.env.COMPANY_EMAIL || 'hr@company.com';
    const logoUrl = process.env.COMPANY_LOGO || 'https://via.placeholder.com/200x50?text=Company+Logo';

    return {
      subject: 'Update Regarding Your Job Application',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .logo { height: 50px; margin-bottom: 20px; }
            .content { padding: 40px; }
            .greeting { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .message { font-size: 16px; color: #555; line-height: 1.6; margin: 20px 0; }
            .details { background-color: #f9f9f9; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .detail-item { margin: 10px 0; color: #555; }
            .label { font-weight: 600; color: #333; }
            .encouragement { background-color: #eff6ff; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .encouragement-text { color: #1e40af; line-height: 1.6; }
            .contact-info { background-color: #f0f4ff; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .contact-label { font-weight: 600; color: #333; margin-bottom: 10px; }
            .contact-item { margin: 8px 0; color: #555; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Company Logo" class="logo" style="max-height: 50px;">
              <h1 style="margin: 0; font-size: 28px;">Application Status</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Dear ${name},</div>
              
              <div class="message">
                Thank you for your interest in the <strong>${role}</strong> position at <strong>${company}</strong>. We truly appreciate the time and effort you invested in your application and throughout our interview process.
              </div>
              
              <div class="details">
                <div class="detail-item">
                  <span class="label">Position:</span> ${role}
                </div>
                <div class="detail-item">
                  <span class="label">Company:</span> ${company}
                </div>
                <div class="detail-item">
                  <span class="label">Status:</span> <strong style="color: #f59e0b;">Not Selected for This Round</strong>
                </div>
              </div>
              
              <div class="message">
                After careful consideration, we have decided to move forward with another candidate whose profile closely matched the specific requirements of this role. This was not an easy decision, as we were impressed with your qualifications.
              </div>
              
              <div class="encouragement">
                <div class="encouragement-text">
                  <strong>💡 We Encourage You to Apply Again</strong><br>
                  We recognize your potential and would like to encourage you to apply for other positions at ${company} that match your skills and experience. Your resume and profile will remain in our system for future opportunities.
                </div>
              </div>
              
              <div class="message">
                We hope you will keep us in mind for future opportunities, and we wish you success in your career endeavors. Your dedication and professionalism made a positive impression on our team.
              </div>
              
              <div class="contact-info">
                <div class="contact-label">📧 Stay Connected</div>
                <div class="contact-item"><strong>Future Opportunities:</strong> ${companyEmail}</div>
                <div class="contact-item"><strong>Feedback:</strong> Feel free to reach out if you'd like constructive feedback</div>
              </div>
              
              <p style="color: #555;">Best regards,<br><strong>${company} Hiring Team</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">This is an automated email. Please do not reply to this address.</p>
              <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Dear ${name},\n\nThank you for your interest in the ${role} position at ${company}. After careful consideration, we have decided to move forward with another candidate.\n\nWe encourage you to apply for other positions at ${company} that match your skills and experience.\n\nBest regards,\n${company} Hiring Team`
    };
  }
};

/**
 * Send offer email to candidate
 */
const sendOfferEmail = async (candidate, job, recruiterInfo = {}) => {
  try {
    const template = emailTemplates.offer(candidate, job);

    const transporter = createTransporter();

    const isMockEmail = candidate.email &&
      (candidate.email.endsWith('@example.com') ||
       candidate.email.endsWith('@test.com') ||
       candidate.email.includes('example.com'));

    if (isMockEmail) {
      return {
        success: false,
        error: 'Candidate has a placeholder email. Please update it with a real email address before sending.'
      };
    }

    if (!transporter) {
      return {
        success: true,
        message: 'Offer email skipped because SMTP is not configured',
        skipped: true,
        messageId: 'skipped'
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: candidate.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Log to email history
    await logEmailHistory({
      candidateId: candidate._id || candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      emailType: 'offer',
      jobId: job?._id || job?.id,
      jobTitle: job?.title || candidate.role,
      subject: template.subject,
      recruiterEmail: recruiterInfo.email,
      status: 'sent',
      messageId: result.messageId,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Offer email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending offer email:', error);
    
    // Log failed attempt
    await logEmailHistory({
      candidateId: candidate._id || candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      emailType: 'offer',
      jobId: job?._id || job?.id,
      jobTitle: job?.title || candidate.role,
      subject: emailTemplates.offer(candidate, job).subject,
      recruiterEmail: recruiterInfo.email,
      status: 'failed',
      error: error.message,
      timestamp: new Date()
    });

    return {
      success: false,
      message: 'Failed to send offer email',
      error: error.message
    };
  }
};

/**
 * Send rejection email to candidate
 */
const sendRejectionEmail = async (candidate, job, recruiterInfo = {}) => {
  try {
    const template = emailTemplates.rejection(candidate, job);

    const transporter = createTransporter();

    const isMockEmail = candidate.email &&
      (candidate.email.endsWith('@example.com') ||
       candidate.email.endsWith('@test.com') ||
       candidate.email.includes('example.com'));

    if (isMockEmail) {
      return {
        success: false,
        error: 'Candidate has a placeholder email. Please update it with a real email address before sending.'
      };
    }

    if (!transporter) {
      return {
        success: true,
        message: 'Rejection email skipped because SMTP is not configured',
        skipped: true,
        messageId: 'skipped'
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: candidate.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Log to email history
    await logEmailHistory({
      candidateId: candidate._id || candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      emailType: 'rejection',
      jobId: job?._id || job?.id,
      jobTitle: job?.title || candidate.role,
      subject: template.subject,
      recruiterEmail: recruiterInfo.email,
      status: 'sent',
      messageId: result.messageId,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Rejection email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    
    // Log failed attempt
    await logEmailHistory({
      candidateId: candidate._id || candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      emailType: 'rejection',
      jobId: job?._id || job?.id,
      jobTitle: job?.title || candidate.role,
      subject: emailTemplates.rejection(candidate, job).subject,
      recruiterEmail: recruiterInfo.email,
      status: 'failed',
      error: error.message,
      timestamp: new Date()
    });

    return {
      success: false,
      message: 'Failed to send rejection email',
      error: error.message
    };
  }
};

/**
 * Get email preview (for UI modal)
 */
const getOfferEmailPreview = (candidate, job) => {
  const template = emailTemplates.offer(candidate, job);
  return {
    type: 'offer',
    subject: template.subject,
    html: template.html,
    text: template.text,
    to: candidate.email
  };
};

/**
 * Get rejection email preview (for UI modal)
 */
const getRejectionEmailPreview = (candidate, job) => {
  const template = emailTemplates.rejection(candidate, job);
  return {
    type: 'rejection',
    subject: template.subject,
    html: template.html,
    text: template.text,
    to: candidate.email
  };
};

/**
 * Log email to database
 */
const logEmailHistory = async (emailData) => {
  try {
    const history = new EmailHistory(emailData);
    await history.save();
  } catch (error) {
    console.error('Error logging email to database:', error);
  }
};

/**
 * Get email history for candidate
 */
const getEmailHistory = async (candidateId) => {
  try {
    const history = await EmailHistory.find({ candidateId })
      .sort({ timestamp: -1 })
      .limit(10);
    return history;
  } catch (error) {
    console.error('Error retrieving email history:', error);
    return [];
  }
};

/**
 * Send test email
 */
const sendTestEmail = async (testEmail) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return {
        success: true,
        message: 'Email service not configured; test skipped',
        skipped: true
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: 'RecruitAI - Test Email',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 20px auto;">
          <h2 style="color: #667eea;">Test Email from RecruitAI</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p><strong>Status:</strong> ✅ Email service is operational</p>
          <hr>
          <p style="font-size: 12px; color: #999;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    const transporter = createTransporter();
    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return {
      success: false,
      message: 'Failed to send test email',
      error: error.message
    };
  }
};

export {
  sendOfferEmail,
  sendRejectionEmail,
  getOfferEmailPreview,
  getRejectionEmailPreview,
  getEmailHistory,
  sendTestEmail,
  emailTemplates
};

export default {
  sendOfferEmail,
  sendRejectionEmail,
  getOfferEmailPreview,
  getRejectionEmailPreview,
  getEmailHistory,
  sendTestEmail,
  emailTemplates
};

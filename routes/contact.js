/**
 * routes/contact.js
 * Contact form submission routes using Resend for emails
 */

const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const { supabase } = require('../supabase');

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'shubhranshukhatua@gmail.com'; // Change this to your email

/**
 * POST /api/contact
 * Submit a contact form message and send email
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, subject, message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Message length validation - remove minimum, just max
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message must not exceed 5000 characters' });
    }

    // Send email to admin
    const emailResult = await resend.emails.send({
      from: 'DevJam <onboarding@resend.dev>', // Use Resend's default sender
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[DevJam Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Contact Form Submission</h2>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <div style="margin-bottom: 15px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">From:</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${name}</p>
              <p style="margin: 2px 0 0 0; color: #0066cc;"><a href="mailto:${email}">${email}</a></p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Subject:</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${subject}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Message:</p>
              <p style="margin: 10px 0 0 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">Sent from DevJam Contact Form • ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error.message}`);
    }

    // Send confirmation email to user
    await resend.emails.send({
      from: 'DevJam <onboarding@resend.dev>',
      to: email,
      subject: 'We received your message',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Message Received! 🎉</h2>
            <p style="color: #666; margin-top: 10px;">Hi ${name},</p>
            <p style="color: #666; line-height: 1.6;">
              Thank you for reaching out to DevJam. We've received your message and will get back to you as soon as possible.
            </p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #999; font-size: 12px;">Your message:</p>
              <p style="margin: 10px 0 0 0; color: #333;">${subject}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Best regards,<br><strong>The DevJam Team</strong></p>
          </div>
        </div>
      `,
    }).catch(err => console.log('User confirmation email failed:', err));

    console.log('✅ Contact email sent successfully');
    console.log(`📧 From: ${name} <${email}>`);
    console.log(`📝 Subject: ${subject}`);

    res.json({
      success: true,
      message: 'Message received! We will get back to you soon.',
      data: {
        name,
        email,
        subject,
        receivedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Contact form error:', err);
    next(err);
  }
});

/**
 * POST /api/contact/newsletter
 * Subscribe to newsletter
 */
router.post('/newsletter', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Send welcome email
    const result = await resend.emails.send({
      from: 'DevJam <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to DevJam Newsletter! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00ff41; margin: 0;">Welcome to DevJam! 🚀</h2>
            <p style="color: #666; margin-top: 15px; line-height: 1.6;">
              You've subscribed to the DevJam newsletter. You'll now receive updates about:
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>🏆 New winning projects and builders</li>
              <li>💡 Featured project spotlights</li>
              <li>🎉 Community highlights and achievements</li>
              <li>📰 DevJam news and announcements</li>
              <li>🔥 Trending projects and technologies</li>
            </ul>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #999; font-size: 12px;">Got questions?</p>
              <p style="margin: 5px 0 0 0; color: #0066cc;"><a href="https://devjam.dev/contact">Contact us</a></p>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              You can unsubscribe at any time by clicking the unsubscribe link in our emails.
            </p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      throw new Error(`Failed to send welcome email: ${result.error.message}`);
    }

    // Store subscriber in Supabase
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, status: 'active' }])
      .select();

    if (dbError && !dbError.message.includes('duplicate')) {
      console.error('Supabase insert error:', dbError);
      // Don't throw - email was sent successfully, DB error is secondary
    }

    console.log(`✅ Newsletter subscriber added: ${email}`);

    res.json({
      success: true,
      message: 'Welcome to DevJam newsletter!',
      data: {
        email,
        subscribedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    next(err);
  }
});

module.exports = router;

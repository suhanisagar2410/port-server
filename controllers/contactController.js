import Contact from '../models/Contact.js';
import { Resend } from 'resend';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export const submitContact = async (req, res) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Resend API key is missing on the server.',
      });
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { name, email, message } = req.body;

    // Save to database
    const contact = await Contact.create({ 
      name, 
      email, 
      message,
      status: 'new'
    });

    // Send email notification to you
    const { error: adminError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
      to: process.env.EMAIL_USER || 'suhaniisagar33@gmail.com',
      subject: `🎯 New Portfolio Contact: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #6C63FF;">📨 New Contact Form Submission</h2>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
            <p><strong>👤 Name:</strong> ${name}</p>
            <p><strong>📧 Email:</strong> ${email}</p>
            <p><strong>💬 Message:</strong></p>
            <p style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 3px;">${message}</p>
          </div>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">
            Submitted on: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    if (adminError) {
      console.error('Resend Admin Email Error:', adminError);
      throw new Error(adminError.message);
    }

    // Send confirmation email to user
    const { error: confirmError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
      to: email,
      subject: '✅ Message Received - Suhani Sagar Portfolio',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #6C63FF;">Thank You, ${name}!</h2>
          <p>I've received your message and will get back to you as soon as possible.</p>
          <p>Your message:</p>
          <p style="white-space: pre-wrap; background: #f4f4f4; padding: 10px; border-radius: 3px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            Suhani Sagar<br>
            Full Stack Developer
          </p>
        </div>
      `,
    });

    if (confirmError) {
      console.error('Could not send confirmation to user (Domain might not be verified on Resend):', confirmError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! I\'ll get back to you soon.',
      data: contact,
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or email me directly.',
      error: error.message,
    });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts',
      error: error.message,
    });
  }
};

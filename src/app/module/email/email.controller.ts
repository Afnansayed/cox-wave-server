import nodemailer from 'nodemailer';
import { Request, Response } from 'express';
import { envVars } from '../../config/env';


const subscribeNewsletter = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: envVars.EMAIL_SENDER_SMTP_USER,
                pass: envVars.EMAIL_SENDER_SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"CoxWave Events" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to CoxWave!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #f97316;">Welcome to CoxWave! 🌊</h2>
          <p>Thanks for subscribing. We will notify you about the next big <strong>Beach BBQ</strong> and <strong>Bonfire</strong> events in Cox's Bazar.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">You're receiving this because you signed up at CoxWave.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Subscription successful! Check your email.' });
    } catch (error) {
        console.error("Nodemailer Error:", error);
        res.status(500).json({ success: false, message: 'Failed to send email.' });
    }
};

export const emailController = {
    subscribeNewsletter
};


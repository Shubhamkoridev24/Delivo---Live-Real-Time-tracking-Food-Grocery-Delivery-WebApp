// backend/utils/mail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Use real env values (no quotes)
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL, // <-- environment variable
    pass: process.env.PASS,  // <-- environment variable (app password)
  },
});

export const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Reset Your Password",
    html: `<p>Your Otp for password reset is <b> ${otp}</b>. It expires in 5 minutes.</p>`,
  });
};

export const sendDeliveryOtpMail = async (user, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "Delivery OTP",
    html: `<p>Your Otp for delivery is <b> ${otp}</b>. It expires in 5 minutes.</p>`,
  });
};

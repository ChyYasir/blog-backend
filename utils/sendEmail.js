/** @format */

import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Verification from "../models/emailVerification.js";
import { generateOTP, hashString } from "./index.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD } = process.env;

let transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Outlook SMTP server
  port: 587, // Port for TLS (you can also use 465 for SSL, but it's less common)
  service: "outlook",
  auth: {
    user: AUTH_EMAIL,
    pass: AUTH_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // logger: true, // Enable logging
  // debug: true,
});

export const sendVerificationEmailTenant = async (tenant, res, token) => {
  const { _id, email, name } = tenant;
  console.log({ tenant });
  const otp = generateOTP();

  //   mail options
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div
    style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
    <h3 style="color: rgb(8, 56, 188)">Please verify your email address</h3>
    <hr>
    <h4>Hi, ${name},</h4>
    <p>
        Please verify your email address with the OTP.
        <br>
        <h1 styles='font-size: 20px; color: rgb(8, 56, 188);'>${otp}</h1>
    <p>This OTP <b>expires in 2 mins</b></p>
    </p>
    <div style="margin-top: 20px;">
        <h5>Regards</h5>
        <h5>BreakByte</h5>
    </div>
</div>`,
  };

  try {
    const hashedToken = await hashString(String(otp));
    console.log({ _id });
    console.log({ hashedToken });
    const newVerifiedEmail = await Verification.create({
      tenantId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 120000,
    });

    if (newVerifiedEmail) {
      console.log(newVerifiedEmail);
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING",
            message:
              "OTP has been sent to your account. Check your email and verify your email.",
            tenant,
            token,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(404).json({ message: "Couldn't Send OTP to your Email" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};

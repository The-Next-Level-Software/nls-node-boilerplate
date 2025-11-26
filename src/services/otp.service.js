// src/services/otp.service.js

import crypto from "crypto";

import { emailService } from "./email.service.js";
import constants from "../config/constants.js";
import { otpModel } from "../models/otp.model.js"; // Optional (if saving in DB)

class OTPService {
  constructor() {
    this.expiryMinutes = 5; // OTP expiry time
    this.maxAttempts = 3; // Verify attempts per OTP
  }

  /**
   * Generate a random OTP (6-digit)
   */
  generateOTP(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  /**
   * Hash OTP for secure database store
   */
  hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  /**
   * Create & store OTP (DB optional)
   */
  async create(email) {
    const otp = this.generateOTP();
    const hashed = this.hashOTP(otp);

    // Optional DB write (if using otpModel)
    await otpModel.findOneAndUpdate(
      { email },
      {
        email,
        otp: hashed,
        attempts: 0,
        expiresAt: new Date(Date.now() + this.expiryMinutes * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // Send OTP Email
    await emailService.sendOTPEmail(email, otp);

    return {
      message: "OTP sent successfully.",
      email,
      expiryMinutes: this.expiryMinutes,
    };
  }

  /**
   * Verify OTP
   */
  async verify(email, otp) {
    const record = await otpModel.findOne({ email });

    if (!record) return { success: false, message: "OTP not found." };

    // Check expiry
    if (record.expiresAt < new Date()) {
      return { success: false, message: "OTP has expired." };
    }

    // Check attempt limit
    if (record.attempts >= this.maxAttempts) {
      return {
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      };
    }

    // Compare hash
    const hashed = this.hashOTP(otp);

    if (hashed !== record.otp) {
      await otpModel.updateOne({ email }, { $inc: { attempts: 1 } });

      return { success: false, message: "Invalid OTP." };
    }

    // OTP valid → delete record
    await otpModel.deleteOne({ email });

    return {
      success: true,
      message: "OTP verified successfully.",
    };
  }

  /**
   * Delete OTP
   */
  async clear(email) {
    await otpModel.deleteOne({ email });
  }
}

export const otpService = new OTPService();

// src/models/user.model.js
import mongoose from "mongoose";

import AuthService from "../services/auth.service.js";
import { PasswordUtils } from "../utils/password.util.js";
import { StringUtils } from "../utils/string.util.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

/**
 * Hashing password + generating username
 */
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await PasswordUtils.hash(this.password);
  }

  if (this.isNew && !this.username) {
    this.username = StringUtils.generateUsername(this.name);
  }

  next();
});

/**
 * Compare hashed password
 */
userSchema.methods.comparePassword = function (password) {
  return PasswordUtils.compare(password, this.password);
};

/**
 * Generate and return Access + Refresh token pair
 */
userSchema.methods.generateAuthToken = function (req) {
  return AuthService.generateAuthTokens(this, req);
};

/**
 * Logout from current session
 */
userSchema.methods.logout = async function (refreshToken) {
  return AuthService.logout(refreshToken);
};

export default mongoose.model("User", userSchema);

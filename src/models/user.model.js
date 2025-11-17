// src/models/user.model.js
import mongoose from "mongoose";
import { PasswordUtils } from "../utils/password.util.js"
import { generateAuthTokens } from "../services/auth.service.js";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await PasswordUtils.hash(this.password);
    next();
});

userSchema.methods.comparePassword = function (password) {
    return PasswordUtils.compare(password, this.password);
};

/**
 * Generate Access + Refresh Token Pair
 */
userSchema.methods.generateAuthToken = function () {
    return generateAuthTokens(this);
}

export default mongoose.model("User", userSchema);

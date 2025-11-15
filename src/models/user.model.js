// src/models/user.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.util";
import { hashPassword } from "../utils/password.util";

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
    this.password = await hashPassword(this.password);
    next();
});

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.tokenPayload = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
    };
};

userSchema.methods.generateAuthToken = function () {
    return generateToken(this.tokenPayload());
}

export default mongoose.model("User", userSchema);

import { StatusCodes } from "http-status-codes";

import AuthService from "../services/auth.service.js";
import { Role, User } from "../startup/models.js";
import { generateApiResponse, generateErrorApiResponse } from "../utils/response.util.js";

class AuthController {
  /** ---------------------------------------
     * REGISTER
     ----------------------------------------*/
  static async register(req, res) {
    const { name, email, password } = req.body;

    const findRole = await Role.findOne({ name: "user" });

    const existing = await User.findOne({ email });

    if (existing) {
      return generateErrorApiResponse(res, StatusCodes.CONFLICT, "User already exists");
    }

    const user = await User.create({ name, email, password, role: findRole && findRole._id });

    return generateApiResponse(res, StatusCodes.CREATED, "Registration successful", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    });
  }

  /** ---------------------------------------
     * LOGIN
     ----------------------------------------*/
  static async login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return generateErrorApiResponse(
        res,
        StatusCodes.NOT_FOUND,
        "User does not exist with this email"
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, "Incorrect password!");
    }

    // Generate token pair + create session
    const tokens = await user.generateAuthToken(req);

    return generateApiResponse(res, StatusCodes.OK, "Login successful", {
      data: {
        tokens,
        user: AuthService.getUserPayload(user),
      },
    });
  }

  /** ---------------------------------------
     * REFRESH TOKEN
     ----------------------------------------*/
  static async refreshToken(req, res) {
    const { refreshToken } = req.body;
    const newTokens = await AuthService.refreshToken(refreshToken);
    return generateApiResponse(res, StatusCodes.OK, "Token refreshed", newTokens);
  }

  /** ---------------------------------------
     * LOGOUT (current session)
     ----------------------------------------*/
  static async logout(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, "Refresh token is required");
    }

    await AuthService.logout(refreshToken);

    return generateApiResponse(res, StatusCodes.OK, "Logged out successfully");
  }

  /** ---------------------------------------
     * LOGOUT ALL DEVICES
     ----------------------------------------*/
  static async logoutAll(req, res) {
    const userId = req.user.id;

    await AuthService.logoutAll(userId);

    return generateApiResponse(res, StatusCodes.OK, "Logged out from all devices");
  }

  /** ---------------------------------------
     * ME (get logged in user)
     ----------------------------------------*/
  static async getMe(req, res) {
    const { _id: user } = req.user;

    const foundedUser = await User.findById(user);

    if (!foundedUser) {
      return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "User not found");
    }

    return generateApiResponse(res, StatusCodes.OK, "User details fetched", {
      user: AuthService.getUserPayload(foundedUser),
    });
  }
}

export default AuthController;

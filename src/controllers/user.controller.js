import { StatusCodes } from "http-status-codes";

import QueryEngine from "../services/query.service.js";
import { Role, User } from "../startup/models.js";
import { generateApiResponse } from "../utils/response.util.js";
// import { PaginationService } from '../services/pagination.service.js';
// import { searchService } from '../services/search.service.js';

class UserController {
  static async getAllUsers(req, res) {
    const { role = "user" } = req.query;

    const adminRoles = await Role.find({ name: role }).select("_id");

    const engine = new QueryEngine(User, req.query, {
      where: {
        isActive: true,
        role: { $in: adminRoles.map((r) => r._id) }, // <-- REAL FILTER
      },
      searchable: ["name", "email"],
      select: "-password -isActive -__v -createdAt -updatedAt",
    });

    const result = await engine.exec("users");

    return generateApiResponse(res, StatusCodes.OK, "Users retrieved successfully", result);
  }
}

export default UserController;

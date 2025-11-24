import { StatusCodes } from 'http-status-codes';
import { User } from '../startup/models.js';
import { generateApiResponse } from '../utils/response.util.js';
// import { PaginationService } from '../services/pagination.service.js';
// import { searchService } from '../services/search.service.js';
import { QueryEngine } from '../services/query.service.js';

class UserController {
    static async getAllUsers(req, res) {

        const whereStatement = {
            // role: 'user',
        };
        const engine = new QueryEngine(
            User,
            {
                ...req.query,
                ...whereStatement,
            },
            {
                // Default searchable fields
                searchable: ["name", "email", "username"],
                // Always exclude password by default
                select: "-password",
            }
        );

        // Execute query with optional filter schema
        const result = await engine.exec({
            includeFilterSchema: false,
            includeDistinctFilterValues: false,
        });

        return generateApiResponse(
            res,
            StatusCodes.OK,
            "Users retrieved successfully",
            result
        );
    }

}


export default UserController;

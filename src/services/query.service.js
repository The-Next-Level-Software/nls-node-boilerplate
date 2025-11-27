// services/queryEngine.service.js
export default class QueryEngine {
  constructor(model, query = {}, options = {}) {
    this.model = model;

    // queries from URL ?page=1&limit=10
    this.query = query;

    // custom filters from controller
    this.where = options.where || {};

    // search fields e.g. ['name','email']
    this.searchable = options.searchable || [];

    // default select fields
    this.select = options.select || "";

    // default populate
    this.populate = options.populate || [];
  }

  /**
   * Builds filters from query parameters using bracket notation:
   * ?age[gte]=20  ➝ { age: { $gte: 20 } }
   */
  buildFilters() {
    let queryObj = { ...this.query };

    // Reserved params that should not be part of filtering
    const reserved = ["page", "limit", "sort", "fields", "search", "populate"];
    reserved.forEach((key) => delete queryObj[key]);

    // Convert operators (gte, lte, in etc)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin|ne)\b/g, (match) => `$${match}`);

    return JSON.parse(queryStr);
  }

  /**
   * Builds search conditions across multiple fields
   */
  buildSearch() {
    if (!this.query.search || this.searchable.length === 0) return {};

    const regex = new RegExp(this.query.search, "i");

    return {
      $or: this.searchable.map((field) => ({
        [field]: regex,
      })),
    };
  }

  /**
   * Executes the full pagination + filter pipeline
   */
  async exec(name = "results") {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Merge all filters
    const filters = {
      ...this.buildFilters(),
      ...this.buildSearch(),
      ...this.where,
    };

    let dbQuery = this.model.find(filters);

    // Field selection
    if (this.query.fields || this.select) {
      const fields = (this.query.fields || this.select).replace(/,/g, " ");
      dbQuery = dbQuery.select(fields);
    }

    // Sorting
    if (this.query.sort) {
      dbQuery = dbQuery.sort(this.query.sort.replace(/,/g, " "));
    } else {
      dbQuery = dbQuery.sort("-createdAt");
    }

    // -------------------------------
    // 🚀 Improved Populate System
    // -------------------------------
    let populateOptions = [];

    // 1. Populate from query string: ?populate=role,company
    if (this.query.populate) {
      const parts = this.query.populate.split(",");
      parts.forEach((p) => {
        populateOptions.push({ path: p.trim() });
      });
    }

    // 2. Populate from controller options (advanced)
    if (Array.isArray(this.populate)) {
      this.populate.forEach((pop) => {
        if (typeof pop === "string") {
          // simple populate
          populateOptions.push({ path: pop });
        } else if (typeof pop === "object") {
          // full populate object with match/select/options
          populateOptions.push(pop);
        }
      });
    }

    // Apply all populate configurations
    populateOptions.forEach((pop) => {
      dbQuery = dbQuery.populate(pop);
    });

    // Pagination
    dbQuery = dbQuery.skip(skip).limit(limit);

    const [results, total] = await Promise.all([dbQuery, this.model.countDocuments(filters)]);

    return {
      [name]: results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }
}

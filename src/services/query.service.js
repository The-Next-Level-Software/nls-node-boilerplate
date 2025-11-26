// services/queryEngine.service.js
import appConfig from "../config/index.js";

/**
 * QueryEngine
 *
 * Usage:
 *   const engine = new QueryEngine(User, req.query, { searchable: ['name','email'], select: '-password' });
 *   const result = await engine.exec(); // { results, pagination }
 *   const filterSchema = await engine.getFilterSchema({ includeDistinct: true });
 */
export class QueryEngine {
  constructor(model, rawQuery = {}, options = {}) {
    this.model = model;
    this.q = rawQuery || {};

    this.options = {
      searchable: options.searchable || null,
      defaultSort: options.defaultSort || appConfig.pagination.defaultSortBy,
      select: options.select || "",
      ...options,
    };

    this.schemaInfo = this._extractSchemaInfo();
  }

  // --- Public entry point
  async exec({ includeFilterSchema = false, includeDistinctFilterValues = false } = {}) {
    const { searchQuery, finalQueryObject, mongoQuery, page, limit, sortBy, selectFields } =
      this._buildAll();

    // Apply sorting & selecting
    const sorted = this._applySorting(mongoQuery, sortBy);
    const selected = this._applySelect(sorted, selectFields);

    // Paginate and fetch
    const result = await this._paginate(selected, page, limit);

    if (includeFilterSchema) {
      const schema = await this.getFilterSchema({
        includeDistinct: includeDistinctFilterValues,
      });
      return {
        ...result,
        filterSchema: schema,
        _internalQuery: finalQueryObject,
        _searchQuery: searchQuery,
      };
    }

    return result;
  }

  // --- Build everything from this.q and schema
  _buildAll() {
    const {
      page = appConfig.pagination.defaultPage,
      limit = appConfig.pagination.defaultLimit,
      sort = undefined,
      fields = undefined,
      term = undefined,
    } = this.q;

    const pageNum = Number(page) || appConfig.pagination.defaultPage;
    const limitNum = Number(limit) || appConfig.pagination.defaultLimit;

    const filterObject = this._buildFiltersFromQuery();
    const searchQuery = this._buildSearchQuery(term);

    const finalQueryObject = Object.keys(searchQuery).length
      ? { $and: [filterObject, searchQuery] }
      : filterObject;

    const mongoQuery = this.model.find(finalQueryObject);

    // --- Merge fields from query + controller options
    const selectFieldsFromQuery = fields
      ? fields
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    const selectFieldsFromOptions = this.options.select
      ? this.options.select.split(" ").filter(Boolean)
      : [];

    const selectFields = this.options.select
      ? this.options.select.split(" ").filter(Boolean)
      : fields
        ? fields
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        : [];

    return {
      searchQuery,
      finalQueryObject,
      mongoQuery,
      page: pageNum,
      limit: limitNum,
      sortBy: sort || this.options.defaultSort,
      // selectFields: [...selectFieldsFromQuery, ...selectFieldsFromOptions],
      selectFields: selectFields,
    };
  }

  // --- Build search object from term
  _buildSearchQuery(term) {
    if (!term) return {};
    const tokens = String(term)
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const fieldsToSearch = this.options.searchable || this._autoDetectStringFields();
    if (!fieldsToSearch.length) return {};

    const orClauses = [];
    for (const token of tokens) {
      for (const field of fieldsToSearch) {
        orClauses.push({ [field]: { $regex: token, $options: "i" } });
      }
    }
    return orClauses.length ? { $or: orClauses } : {};
  }

  // --- Build filters
  _buildFiltersFromQuery() {
    const q = this.q;
    const schemaInfo = this.schemaInfo;
    const filter = {};

    for (const [key, rawVal] of Object.entries(q)) {
      if (["term", "page", "limit", "sort", "fields"].includes(key)) continue;

      const opMatch = key.match(/^(.+)\[(.+)\]$/);
      if (opMatch) {
        const field = opMatch[1];
        const op = opMatch[2];
        if (!schemaInfo[field]) continue;
        filter[field] = filter[field] || {};
        filter[field][`$${op}`] = this._castValue(rawVal, schemaInfo[field].type);
        continue;
      }

      const minMatch = key.match(/^min(.+)$/i);
      const maxMatch = key.match(/^max(.+)$/i);
      if (minMatch && schemaInfo[this._lcFirst(minMatch[1])]) {
        const field = this._lcFirst(minMatch[1]);
        filter[field] = filter[field] || {};
        filter[field]["$gte"] = this._castValue(rawVal, schemaInfo[field].type);
        continue;
      }
      if (maxMatch && schemaInfo[this._lcFirst(maxMatch[1])]) {
        const field = this._lcFirst(maxMatch[1]);
        filter[field] = filter[field] || {};
        filter[field]["$lte"] = this._castValue(rawVal, schemaInfo[field].type);
        continue;
      }

      if (!schemaInfo[key]) continue;
      if (String(rawVal).includes(",")) {
        const vals = String(rawVal)
          .split(",")
          .map((v) => this._castValue(v.trim(), schemaInfo[key].type))
          .filter((v) => v !== undefined);
        if (vals.length) filter[key] = { $in: vals };
        continue;
      }

      filter[key] = this._castValue(rawVal, schemaInfo[key].type);
    }

    return filter;
  }

  // --- Sorting
  _applySorting(query, sortParam) {
    if (!sortParam) return query;
    const clauses = String(sortParam)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!clauses.length) return query;
    const sortObj = {};
    for (const c of clauses)
      sortObj[c.startsWith("-") ? c.slice(1) : c] = c.startsWith("-") ? -1 : 1;
    return query.sort(sortObj);
  }

  // --- Select
  _applySelect(query, fields = []) {
    if (!fields.length) return query;
    const selectStr = fields.join(" ");
    return query.select(selectStr);
  }

  // --- Pagination
  async _paginate(query, page, limit) {
    const skip = (page - 1) * limit;
    const [total, results] = await Promise.all([
      this.model.countDocuments(query.getQuery ? query.getQuery() : {}),
      query.skip(skip).limit(limit).exec(),
    ]);
    return {
      results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        nextPage: page * limit < total ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        // hasNextPage: page * limit < total,
        // hasPrevPage: page > 1,
      },
    };
  }

  // --- Filter schema
  async getFilterSchema({ includeDistinct = false } = {}) {
    const info = this.schemaInfo;
    const searchable = this.options.searchable || this._autoDetectStringFields();
    const sortable = Object.keys(info);

    const filterable = {};
    for (const [field, meta] of Object.entries(info)) {
      if (["String", "Number", "Boolean", "Date", "ObjectId"].includes(meta.instance)) {
        const entry = { type: meta.type, instance: meta.instance };
        if (meta.enumValues.length) entry.enum = meta.enumValues;
        filterable[field] = entry;
      }
    }

    if (includeDistinct) {
      const distinctResults = await Promise.all(
        Object.keys(filterable).map(async (f) => {
          try {
            const vals = await this.model.distinct(f);
            return [f, vals.filter((v) => v != null)];
          } catch {
            return [f, []];
          }
        })
      );
      for (const [f, vals] of distinctResults) filterable[f].distinctValues = vals;
    }

    return { searchable, sortable, filterable };
  }

  // --- Extract schema info
  _extractSchemaInfo() {
    const paths = this.model.schema.paths || {};
    const info = {};
    for (const [pathName, schemaType] of Object.entries(paths)) {
      if (["_id", "__v"].includes(pathName)) continue;
      const instance = schemaType.instance || schemaType.options?.type?.name || "Mixed";
      const enumValues = schemaType.options?.enum || [];
      let type = "string";
      if (["Number"].includes(instance)) type = "number";
      if (["Boolean"].includes(instance)) type = "boolean";
      if (["Date"].includes(instance)) type = "date";
      if (["ObjectID", "ObjectId"].includes(instance) || pathName.endsWith("Id")) type = "objectId";
      info[pathName] = { instance, enumValues, type };
    }
    return info;
  }

  _autoDetectStringFields() {
    const candidates = ["name", "title", "email", "username", "description", "phone"];
    const available = Object.keys(this.schemaInfo).filter(
      (k) => this.schemaInfo[k].type === "string"
    );
    return [
      ...candidates.filter((c) => available.includes(c)),
      ...available.filter((a) => !candidates.includes(a)),
    ];
  }

  _castValue(raw, type) {
    if (raw == null) return undefined;
    if (type === "number") return isNaN(Number(raw)) ? undefined : Number(raw);
    if (type === "boolean")
      return raw.toString().toLowerCase() === "true"
        ? true
        : raw.toString().toLowerCase() === "false"
          ? false
          : undefined;
    if (type === "date") {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return raw;
  }

  _lcFirst(str) {
    return str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
  }
}

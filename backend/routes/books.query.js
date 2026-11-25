const SEARCH_FIELDS = ['title', 'author', 'isbn', 'borrower'];
const STATUS_VALUES = ['available', 'borrowed', 'overdue'];
const SORT_FIELDS = ['title', 'author', 'status', 'dueDate', 'createdAt', '_id'];
const DEFAULT_SORT_FIELD = 'createdAt';
const DEFAULT_SORT_DIRECTION = -1;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Express may expose bracket syntax either as an object/array under the key or,
 * with the default simple parser, as a literal key such as `status[]`.
 */
const hasBracketSyntax = (query, key) =>
  Boolean(query) && Object.keys(query).some((param) => param.startsWith(`${key}[`));

/**
 * Read a query parameter that must be a single string.
 * Repeated keys and bracket syntax are rejected instead of being silently
 * ignored, because they can hide client bugs or query-operator injection.
 */
const readStringParam = (query, key) => {
  if (hasBracketSyntax(query, key)) {
    return { error: `Invalid ${key} parameter. Expected a single string value.` };
  }

  const value = query ? query[key] : undefined;

  if (value === undefined) {
    return { value: undefined };
  }

  if (typeof value !== 'string') {
    return { error: `Invalid ${key} parameter. Expected a single string value.` };
  }

  return { value };
};

const buildSearchCondition = (search) => {
  const value = typeof search === 'string' ? search.trim() : '';

  if (!value) {
    return null;
  }

  const pattern = { $regex: escapeRegex(value), $options: 'i' };

  return {
    $or: SEARCH_FIELDS.map((field) => ({ [field]: pattern }))
  };
};

const buildStatusCondition = (status) => ({ status });

const parseOrder = (value) => {
  if (value === undefined) {
    return { direction: null };
  }

  const order = value.trim().toLowerCase();

  if (!order) {
    return { direction: null };
  }

  if (order !== 'asc' && order !== 'desc') {
    return { error: "Invalid order. Allowed values: 'asc', 'desc'" };
  }

  return { direction: order === 'desc' ? -1 : 1 };
};

const buildSort = (rawSort, orderDirection) => {
  let sortField = DEFAULT_SORT_FIELD;
  let sortDirection = DEFAULT_SORT_DIRECTION;

  if (rawSort) {
    const hasDescendingPrefix = rawSort.startsWith('-');
    const rawField = hasDescendingPrefix ? rawSort.slice(1).trim() : rawSort;
    const sortFieldMatch = SORT_FIELDS.find(
      (field) => field.toLowerCase() === rawField.toLowerCase()
    );

    if (!sortFieldMatch) {
      return {
        error: `Invalid sort field. Allowed values: ${SORT_FIELDS.join(', ')}`
      };
    }

    sortField = sortFieldMatch;

    if (orderDirection !== null) {
      if (hasDescendingPrefix && orderDirection !== -1) {
        return {
          error: 'Conflicting sort direction. Remove the "-" prefix or set order=desc.'
        };
      }

      sortDirection = orderDirection;
    } else {
      sortDirection = hasDescendingPrefix ? -1 : 1;
    }
  }

  return {
    sort: {
      [sortField]: sortDirection,
      ...(sortField === '_id' ? {} : { _id: sortDirection })
    }
  };
};

/**
 * Parse and validate the query string for GET /api/books.
 * Returns { filter, sort } on success or { error } when a parameter is invalid.
 */
const parseBookQuery = (query = {}) => {
  const searchParam = readStringParam(query, 'search');

  if (searchParam.error) {
    return { error: searchParam.error };
  }

  const qParam = readStringParam(query, 'q');

  if (qParam.error) {
    return { error: qParam.error };
  }

  const statusParam = readStringParam(query, 'status');

  if (statusParam.error) {
    return { error: statusParam.error };
  }

  const sortParam = readStringParam(query, 'sort');

  if (sortParam.error) {
    return { error: sortParam.error };
  }

  const orderParam = readStringParam(query, 'order');

  if (orderParam.error) {
    return { error: orderParam.error };
  }

  const conditions = [];
  const rawSearch = searchParam.value !== undefined ? searchParam.value : qParam.value;
  const searchCondition = buildSearchCondition(rawSearch);

  if (searchCondition) {
    conditions.push(searchCondition);
  }

  const status = statusParam.value === undefined ? '' : statusParam.value.trim().toLowerCase();

  if (status && status !== 'all') {
    if (!STATUS_VALUES.includes(status)) {
      return {
        error: `Invalid status filter. Allowed values: ${STATUS_VALUES.join(', ')}`
      };
    }

    conditions.push(buildStatusCondition(status));
  }

  let filter = {};

  if (conditions.length === 1) {
    filter = conditions[0];
  } else if (conditions.length > 1) {
    filter = { $and: conditions };
  }

  const order = parseOrder(orderParam.value);

  if (order.error) {
    return { error: order.error };
  }

  const rawSort = sortParam.value === undefined ? '' : sortParam.value.trim();
  const sortResult = buildSort(rawSort, order.direction);

  if (sortResult.error) {
    return { error: sortResult.error };
  }

  return { filter, sort: sortResult.sort };
};

module.exports = {
  parseBookQuery,
  readStringParam,
  buildStatusCondition,
  escapeRegex,
  SEARCH_FIELDS,
  STATUS_VALUES,
  SORT_FIELDS
};

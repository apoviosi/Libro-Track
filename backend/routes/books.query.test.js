const test = require('node:test');
const assert = require('node:assert/strict');

const { parseBookQuery } = require('./books.query');

const NOW = new Date('2026-11-25T12:00:00.000Z');
const SEARCH_FIELDS = ['title', 'author', 'isbn', 'borrower'];

const assertValidationError = (result) => {
  assert.equal(typeof result.error, 'string');
  assert.equal(result.filter, undefined);
  assert.equal(result.sort, undefined);
};

test('defaults to newest first with an _id tiebreaker', () => {
  assert.deepEqual(parseBookQuery({}), {
    filter: {},
    sort: { createdAt: -1, _id: -1 }
  });
});

test('search builds a case-insensitive partial match across searchable fields', () => {
  const { filter, sort } = parseBookQuery({ search: 'Clean Code' });

  assert.deepEqual(filter, {
    $or: SEARCH_FIELDS.map((field) => ({
      [field]: { $regex: 'Clean Code', $options: 'i' }
    }))
  });
  assert.deepEqual(sort, { createdAt: -1, _id: -1 });
});

test('q is accepted as an alias for search', () => {
  assert.deepEqual(parseBookQuery({ q: 'orwell' }).filter, parseBookQuery({ search: 'orwell' }).filter);
});

test('search escapes regular expression special characters', () => {
  const { filter } = parseBookQuery({ search: '.*' });
  const pattern = { $regex: '\\.\\*', $options: 'i' };

  assert.deepEqual(filter, {
    $or: SEARCH_FIELDS.map((field) => ({ [field]: pattern }))
  });
});

test('status filters available books only', () => {
  assert.deepEqual(parseBookQuery({ status: 'available' }).filter, { status: 'available' });
});

test('status is trimmed and matched case-insensitively', () => {
  for (const status of ['AVAILABLE', 'Available', '  available  ']) {
    assert.deepEqual(parseBookQuery({ status }).filter, { status: 'available' });
  }
});

test('status all and empty values leave the query unfiltered', () => {
  for (const status of ['all', 'ALL', '  all  ', '']) {
    assert.deepEqual(parseBookQuery({ status }).filter, {});
  }
});

test('borrowed status matches effective borrowed books only', () => {
  const { filter } = parseBookQuery({ status: 'borrowed' }, NOW);

  assert.deepEqual(filter, {
    status: 'borrowed',
    $or: [{ dueDate: null }, { dueDate: { $gte: NOW } }]
  });
});

test('overdue status matches stored overdue and past-due borrowed books', () => {
  const { filter } = parseBookQuery({ status: 'overdue' }, NOW);

  assert.deepEqual(filter, {
    $or: [{ status: 'overdue' }, { status: 'borrowed', dueDate: { $lt: NOW } }]
  });
});

test('search and status conditions are combined without clobbering $or', () => {
  const { filter } = parseBookQuery({ search: 'dune', status: 'overdue' }, NOW);

  assert.deepEqual(filter, {
    $and: [
      {
        $or: SEARCH_FIELDS.map((field) => ({
          [field]: { $regex: 'dune', $options: 'i' }
        }))
      },
      { $or: [{ status: 'overdue' }, { status: 'borrowed', dueDate: { $lt: NOW } }] }
    ]
  });
});

test('an invalid status returns a validation error', () => {
  assertValidationError(parseBookQuery({ status: 'bogus' }));
});

test('non-string parameters are rejected instead of silently ignored', () => {
  const invalidQueries = [
    { status: ['available'] },
    { status: ['available', 'borrowed'] },
    { status: { $ne: 'available' } },
    { status: null },
    { 'status[]': 'available' },
    { 'status[$ne]': 'available' },
    { search: ['clean', 'code'] },
    { 'search[]': 'clean' },
    { q: { $ne: 'orwell' } },
    { 'q[$ne]': 'orwell' },
    { sort: ['title'] },
    { 'sort[]': 'title' },
    { order: ['desc'] },
    { 'order[]': 'desc' }
  ];

  for (const query of invalidQueries) {
    assertValidationError(parseBookQuery(query));
  }
});

test('sort field with order=desc sorts descending with an _id tiebreaker', () => {
  assert.deepEqual(parseBookQuery({ sort: 'title', order: 'desc' }).sort, {
    title: -1,
    _id: -1
  });
});

test('a - prefix sorts descending without an order parameter', () => {
  assert.deepEqual(parseBookQuery({ sort: '-dueDate' }).sort, {
    dueDate: -1,
    _id: -1
  });
});

test('sort field names are matched case-insensitively', () => {
  assert.deepEqual(parseBookQuery({ sort: 'Title', order: 'asc' }).sort, {
    title: 1,
    _id: 1
  });
  assert.deepEqual(parseBookQuery({ sort: '-DUEDATE' }).sort, {
    dueDate: -1,
    _id: -1
  });
  assert.deepEqual(parseBookQuery({ sort: 'STATUS' }).sort, {
    status: 1,
    _id: 1
  });
});

test('sort defaults to ascending when only a field is provided', () => {
  assert.deepEqual(parseBookQuery({ sort: 'title' }).sort, {
    title: 1,
    _id: 1
  });
});

test('sorting by _id does not duplicate the tiebreaker', () => {
  assert.deepEqual(parseBookQuery({ sort: '_id' }).sort, { _id: 1 });
  assert.deepEqual(parseBookQuery({ sort: '-_id' }).sort, { _id: -1 });
});

test('an invalid sort field returns a validation error', () => {
  assertValidationError(parseBookQuery({ sort: 'publishedAt' }));
});

test('an invalid order returns a validation error', () => {
  assertValidationError(parseBookQuery({ sort: 'title', order: 'sideways' }));
  assertValidationError(parseBookQuery({ order: 'sideways' }));
});

test('a conflicting - prefix and order returns a validation error', () => {
  assertValidationError(parseBookQuery({ sort: '-title', order: 'asc' }));
});

test('a - prefix that agrees with order is accepted', () => {
  assert.deepEqual(parseBookQuery({ sort: '-title', order: 'desc' }).sort, {
    title: -1,
    _id: -1
  });
});

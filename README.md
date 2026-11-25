# LibroTrack

Library lending tracker built with Angular, Express, and MongoDB. The Angular application lives at the repository root and the API lives in [`backend/`](backend/).

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.6.

## Development server

To start the Angular development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

To start the API, run:

```bash
cd backend
npm install
cp ../.env.example .env
npm run dev
```

Set the values in `backend/.env` before starting the server.

## API

The Express API in [`backend/`](backend/) serves book endpoints under `/api/books`.

### `GET /api/books`

Returns the book catalog. Every query parameter is optional and must be supplied at most once as a plain string. Repeated parameters (`?search=a&search=b`), array syntax (`?status[]=available`), or object syntax (`?status[$ne]=available`) return `400 Bad Request` with `{ "message": "..." }` instead of being silently ignored.

| Parameter        | Description                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search` / `q`   | Case-insensitive partial match across `title`, `author`, `isbn`, and `borrower`. `q` is an alias used when `search` is absent. Regular expression special characters are escaped, so `?search=.*` matches literal text rather than acting as a wildcard.       |
| `status`         | `available`, `borrowed`, `overdue`, or `all` (case-insensitive and whitespace-trimmed). Empty values and `all` disable status filtering. Any other value returns `400`.                                                                                     |
| `sort`           | One of `title`, `author`, `status`, `dueDate`, `createdAt`, or `_id` (case-insensitive). Prefix the field with `-` for descending order, for example `?sort=-dueDate`. When omitted, sorting defaults to `createdAt` descending.                              |
| `order`          | `asc` or `desc` (case-insensitive). Used together with `sort`; without `sort` the default `createdAt` descending order is kept. An invalid value returns `400`, as does a direction that conflicts with a `-` prefix (for example `?sort=-title&order=asc`). |

Without an explicit direction, a supplied sort field defaults to ascending (`?sort=title`). Every sort includes `_id` in the same direction as a tiebreaker, so records that share the same timestamp (such as seeded books inserted in one batch) always have a deterministic order. The default is equivalent to:

```js
Book.find(filter).sort({ createdAt: -1, _id: -1 });
```

#### Effective overdue status

A book is treated as `overdue` when its stored status is `overdue`, or when its stored status is `borrowed` and its `dueDate` is before the current time. A `borrowed` book remains `borrowed` only when `dueDate` is `null` or greater than or equal to the current time. The `status=borrowed` and `status=overdue` filters use these same effective rules, so their results match the dashboard counts.

### `GET /api/books/summary`

Returns dashboard counts computed from the effective statuses described above:

```json
{
  "total": 10,
  "available": 5,
  "borrowed": 2,
  "overdue": 3
}
```

`total` is the number of all book records, and the `available`, `borrowed`, and `overdue` counts add up to `total`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

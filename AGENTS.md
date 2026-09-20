<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.

Before writing or modifying Next.js code:

- Read the relevant guide in `node_modules/next/dist/docs/`.
- Resolve the documentation path relative to this file's directory.
- In monorepos, the `next` package may not be visible from the repository root.
- Follow all current deprecation notices and conventions.

This block is written and re-added by `next dev`.

Verify its behavior at:

`node_modules/next/dist/server/lib/generate-agent-files.js`

Removing this block from a diff will only cause the uncommitted change to be recreated. Committing it with the project keeps the working tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project Overview

This project is a hackathon web application built with:

- Next.js
- React
- TypeScript
- Supabase
- Leaflet / React-Leaflet

The main feature is a shared map where users can:

- View map markers.
- Create new map markers.
- Store marker information in Supabase.
- Retrieve shared map information through Next.js API routes.

The application is specifically designed to support low-resolution displays.

Target resolutions include:

- QVGA: `240 × 320`
- QQVGA: `160 × 120`

All the operation should be done by number button, arrow key, sharp, asterisk

All frontend changes should consider these display constraints.

---

## Project Priorities

This is a hackathon project.

Prioritize work in the following order:

1. Working functionality
2. Stability
3. Simple implementation
4. Fast integration
5. Usability on low-resolution displays
6. Code readability
7. Advanced architecture

Prefer a simple working implementation over an unnecessarily complex production-grade solution.

---

## General Rules

When modifying this project:

- Keep changes minimal and focused.
- Inspect related files before modifying code.
- Preserve existing functionality whenever possible.
- Do not rewrite unrelated files.
- Do not perform large refactors unless explicitly requested.
- Do not delete existing code unless necessary.
- Do not introduce unnecessary abstractions.
- Follow the existing project structure and naming conventions.
- Prefer readable and straightforward implementations.
- Avoid creating duplicate implementations of functionality that already exists.

If an existing implementation can reasonably be extended, prefer extending it rather than replacing it.

---

## Next.js Rules

This project uses the Next.js App Router.

Before changing Next.js-specific code, follow the instructions in the automatically generated `nextjs-agent-rules` section at the top of this file.

Use the following conventions:

```text
app/**/page.tsx
```

For application pages.

```text
app/api/**/route.ts
```

For API routes.

```text
components/
```

For reusable React components.

```text
lib/
```

For shared utilities, configuration, database clients, and external service clients.

Do not create API endpoints using `.tsx` files.

For example:

```text
app/api/mapinfo/route.ts
```

corresponds to:

```text
GET /api/mapinfo
```

and:

```text
app/api/newMapInfo/route.ts
```

corresponds to:

```text
POST /api/newMapInfo
```

---

## API Rules

API routes should:

- Use `NextResponse.json()` for JSON responses.
- Validate incoming request data.
- Return appropriate HTTP status codes.
- Handle database errors explicitly.
- Handle malformed requests explicitly.
- Log useful server-side errors when debugging.
- Avoid exposing sensitive internal information to clients.
- Keep response structures reasonably consistent.

Successful responses should generally follow this structure:

```json
{
  "success": true,
  "data": {}
}
```

Error responses should generally follow this structure:

```json
{
  "success": false,
  "error": "Error message"
}
```

For newly created resources, prefer HTTP status:

```text
201 Created
```

For invalid client input, prefer:

```text
400 Bad Request
```

For server or database failures, prefer:

```text
500 Internal Server Error
```

---

## Current API Endpoints

### `GET /api/mapinfo`

Purpose:

Return information that should be displayed on the map.

Expected responsibilities:

- Read marker information from Supabase.
- Return map marker data as JSON.
- Optionally filter nearby markers with `longtitude` and/or `latitude` query
  parameters.
- Treat "nearby" as within `0.01` degrees of each valid supplied coordinate.
- If either supplied coordinate is empty, non-numeric, or outside its valid
  range, ignore all coordinate filters and return every marker.
- Keep an in-memory refresh timestamp and, at most once every five minutes per
  server instance, remove expired records before returning map data.
- Determine expiry from `events` and `created_at` using these lifetimes:

```text
car_crash:          60 minutes
traffic_jam:        30 minutes
roadwork:           24 hours
unknown_danger:     60 minutes
natural_disaster:   24 hours
null event:          5 minutes
```

- Records whose `events` value is `null` expire after five minutes. Records
  with an unrecognized non-null event or invalid `created_at` must not be
  deleted automatically.
- Perform automatic deletion with the server-only Supabase client. A cleanup
  failure should be logged but should not prevent the GET endpoint from
  returning map data.
- Handle database errors.

Examples:

```text
GET /api/mapinfo?longtitude=120.123456&latitude=24.123456
GET /api/mapinfo?latitude=24.123456
```

---

### `POST /api/newMapInfo`

Purpose:

Insert a new map marker into Supabase.

Expected request data:

```json
{
  "longtitude": 120.123456,
  "latitude": 24.123456,
  "title": "Example title",
  "description": "Example description",
  "events": "traffic_jam"
}
```

`events` is optional for backward compatibility. When provided, it must be one
of:

```text
car_crash
traffic_jam
roadwork
unknown_danger
natural_disaster
```

The API should:

1. Parse the request body.
2. Validate coordinates and required fields.
3. Convert coordinates to JavaScript numbers when necessary.
4. Insert the data into Supabase.
5. Return the newly created database record.

Do not require the client to provide:

- `id`
- `created_at`

These values are generated automatically by the database.

---

### `GET /api/griddensity`

Purpose:

Return aggregated high-density map regions from the `GridDensity` table.

Grid density rules:

- A successful `POST /api/newMapInfo` schedules a refresh.
- Reset the timer whenever another map record is created.
- Refresh after one full minute passes without another successful `MapInfo`
  insert.
- Divide valid coordinates into `0.01 × 0.01` degree grid cells.
- Store only cells containing at least three events.
- Store the grid-center coordinate, a meter radius that covers the grid, and
  the event count.
- Ignore MapInfo records with invalid coordinates while calculating density.
- Replace stale density cells after every successful refresh.

The endpoint returns:

```json
{
  "success": true,
  "data": []
}
```

---

## Supabase Rules

Supabase is the primary database backend.

Use the project's existing shared Supabase client.

Do not create a new Supabase client in every API route unless there is a specific reason.

Prefer a shared client such as:

```text
lib/supabase.ts
```

or the equivalent existing project location.

Never hard-code Supabase credentials.

Environment variables should be stored in:

```text
.env.local
```

Do not commit `.env.local`.

Do not expose privileged Supabase credentials to client-side code.

In particular:

- Never expose the Supabase `service_role` key in browser code.
- Do not place privileged secrets in `NEXT_PUBLIC_*` environment variables.
- Use public/publishable credentials only where appropriate.

---

## Current Map Data Schema

The current map information table contains:

```text
id
created_at
longtitude
latitude
title
description
events
```

The aggregated density table `GridDensity` contains:

```text
id
create_at
latitude
longtitude
radius
even_num
```

The `events` column uses the PostgreSQL enum type `map_event` and is nullable
for compatibility with existing records and older API clients. Do not add new
event values in application code without updating the database enum and this
document at the same time.

### Important Naming Constraint

The database currently uses:

```text
longtitude
```

Although the conventional English spelling is:

```text
longitude
```

do not rename this database column unless explicitly requested.

Existing code may depend on the current spelling.

When working with database records, use the exact database column name.

---

## Coordinate Validation

Map coordinates must be numeric.

When accepting coordinate values from API requests, convert them explicitly:

```ts
const lng = Number(longtitude);
const lat = Number(latitude);
```

Validate them using:

```ts
if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
  // Return a validation error
}
```

Valid coordinate ranges are:

```text
Latitude:  -90  to  90
Longitude: -180 to 180
```

Reject coordinates outside these ranges.

Supabase coordinate columns should use an appropriate floating-point numeric type.

---

## TypeScript Rules

Prefer TypeScript for application code.

- Avoid `any` when practical.
- Define reusable types for shared data structures.
- Keep types simple.
- Do not create complex generic abstractions unless necessary.

A map information type may look like:

```ts
export interface MapInfo {
  id: string;
  created_at: string;
  longtitude: number;
  latitude: number;
  title: string;
  description: string | null;
  events: "car_crash" | "traffic_jam" | "roadwork" | "unknown_danger" | "natural_disaster" | null;
}
```

If the actual database type of `id` differs, follow the database schema rather than this example.

---

## React Rules

Use React functional components.

Use:

```ts
"use client";
```

only when client-side behavior is required, such as:

- React state
- React effects
- Browser APIs
- User interaction
- Leaflet map interaction

Prefer Server Components when client-side behavior is not necessary.

Do not move server-side secrets or privileged database logic into Client Components.

---

## Map and Leaflet Rules

Use Leaflet / React-Leaflet for map functionality.

Prefer React-Leaflet components over manually manipulating Leaflet DOM elements unless manual access is specifically required.

Map-related code should remain understandable and lightweight.

A typical marker creation flow should be:

```text
User selects location
        ↓
Leaflet provides latitude / longitude
        ↓
User enters title / description
        ↓
Frontend sends POST /api/newMapInfo
        ↓
Next.js validates request
        ↓
Supabase stores marker
        ↓
API returns created marker
        ↓
Frontend updates map
```

---

## Low-Resolution UI Requirements

The application must remain usable on very small screens.

Primary target resolutions:

```text
QVGA   240 × 320
QQVGA  160 × 120
```

When modifying UI:

- Avoid large margins and padding.
- Avoid unnecessarily large fonts.
- Avoid wide fixed-width elements.
- Avoid layouts that depend on desktop screen sizes.
- Avoid unnecessary visual decoration.
- Keep important controls visible.
- Prefer compact controls.
- Prefer simple vertical or map-overlay layouts.
- Test whether buttons remain usable at `160 × 120`.
- Avoid long text where shorter labels are sufficient.
- Do not assume mouse hover is available.
- Ensure critical interactions can work with the project's intended input method.

Do not introduce a responsive framework solely for this purpose unless explicitly requested.

---

## Scope

Do not optimize for production-scale architecture unless explicitly requested.

Do not introduce the following unless the task specifically requires them:

- Docker
- Redis
- Separate backend services
- ORMs
- Microservices
- Complex state management systems
- Message queues
- Additional databases
- Large UI frameworks

For simple state, prefer built-in React functionality.

For simple API/database access, prefer the existing Next.js + Supabase architecture.

---

## Dependency Rules

The project uses the existing package manager defined by the repository.

Before installing a new package:

- Check whether an existing dependency already provides the required functionality.
- Avoid large dependencies for simple tasks.
- Avoid replacing existing libraries without a strong reason.
- Avoid changing package managers.

Do not install packages merely to avoid writing a small amount of straightforward code.

---

## Git and Environment Safety

Do not:

- Commit `.env.local`.
- Commit API secrets.
- Commit database passwords.
- Expose privileged Supabase keys.
- Rewrite Git history.
- Force push.
- Delete branches.
- Modify `.gitignore` unnecessarily.

Do not modify generated files unless required by the framework or explicitly requested.

---

## Database Safety

Do not silently:

- Rename database columns.
- Delete database columns.
- Delete tables.
- Change database types.
- Remove existing data.
- Change Row Level Security behavior.
- Change authentication behavior.

If a requested change requires modifying the database schema, preserve compatibility whenever practical.

---

## Agent Behavior

Before implementing a change:

1. Inspect the relevant existing files.
2. Understand the current implementation.
3. Check current Next.js documentation when the task involves Next.js APIs or conventions.
4. Modify only the files required for the task.
5. Preserve existing APIs unless a change is explicitly requested.
6. Prefer completing the requested functionality over unrelated cleanup.

Do not silently redesign the project architecture.

When multiple valid approaches exist, prefer the simplest approach that fits the current project.

---

## Definition of Done

A change is considered complete when:

- The requested functionality works.
- Existing related functionality remains intact.
- TypeScript code is valid.
- API errors are handled reasonably.
- Supabase interactions match the current schema.
- The UI remains usable at the target low resolutions when frontend code is affected.
- No secrets are introduced into source code.
- No unnecessary architectural complexity is added.

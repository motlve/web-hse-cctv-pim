# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This is a monorepo of independently deployed services for an HSE/CCTV/Paramedis company platform, glued together at runtime by a single nginx reverse proxy (`nginx/nginx.conf`) and `docker-compose.yml`:

- `company-profile/` — public marketing site (React + Vite). Served at `/`.
- `frontend-cctv/` — CCTV dashboard SPA (React + Vite, React Router with `basename="/cctv"`). Served at `/cctv/`.
- `frontend-hse/`, `frontend-paramedis/` — dashboard SPAs served at `/login/hse/` and `/login/paramedis/` respectively.
- `backend-cctv/` — Go REST API (net/http + gorilla/mux + GORM/MySQL), the only backend actually wired into `docker-compose.yml` and nginx (proxied at `/api/`, listens on `:8081`).
- `backend-hse/`, `backend-paramedis/` — Go services that are byte-for-byte structural clones of `backend-cctv` (same models/routes, only the listen port differs: `:8082` / `:8083`). They are **not** included in `docker-compose.yml` or `nginx.conf` — treat them as unwired scaffolding, not live services, unless you're the one wiring them up.
- The root-level `src/`, `package.json`, `vite.config.js`, `index.html` are leftovers from before the "restructure into frontend/backend services" refactor (see commit `53c7990`). `src/` is empty. Don't add new app code there — real frontends live in `company-profile/`, `frontend-cctv/`, `frontend-hse/`, `frontend-paramedis/`.

Each frontend has an identical internal layout (`src/dashboard/{pages,components,api,utils,assets}`, `src/locales`, `src/i18n.js`) — they were forked from the CCTV frontend, so page/component names (e.g. `CCTVPerformanceLayout`) may not match the app's actual domain (HSE/Paramedis) yet.

## Commands

Each frontend (`company-profile/`, `frontend-cctv/`, `frontend-hse/`, `frontend-paramedis/`) and the vestigial root are independent Vite/npm projects with the same scripts — run them from inside that service's directory:

```
npm install
npm run dev       # vite dev server, port 5173 (fixed via strictPort in some configs)
npm run build     # vite build -> dist/
npm run lint      # eslint .
npm run preview
```

There is no test runner configured anywhere in this repo (no Jest/Vitest/Go tests exist).

Each Go backend (`backend-cctv/`, `backend-hse/`, `backend-paramedis/`) is a standalone module (`module backend`) — run from inside that service's directory:

```
go run main.go       # runs migrations, seeds default users, starts the HTTP server
go build ./...
go vet ./...
```

Backend requires a MySQL instance and a `.env` with `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, plus `DEFAULT_ADMIN_*` and `SMTP_*` (used for OTP email) — see `backend-cctv/.env` for the full key set (not committed).

### Docker / full-stack orchestration

Helper scripts at the repo root wrap `docker compose` for the whole stack (mysql + backend-cctv + all frontends + nginx):

```
./docker-manager.sh start|stop|restart|status|health   # lifecycle
./docker-manager.sh build|rebuild                       # docker compose build [--no-cache]
./docker-manager.sh logs <container-name>                # tail -f a specific container
./docker-manager.sh mysql                                # exec into mysql-main
./docker-manager.sh test                                 # curl-check the main routes
./rebuild.sh [frontend|backend] [--hard]                 # force clean rebuild (drops cached image layers so stale COPY/npm-ci layers can't linger); --hard also prunes the builder cache
./debug-routes.sh                                        # curl every key route through nginx and report status codes with a legend (200s ok, 404 = route/nginx-location missing, 502/504 = nginx can't reach the upstream container)
```

`git.sh "<commit message>" [-f file1 file2]` wraps `git add` → `git commit` → `git push origin <current branch>`, and refuses to proceed if any `.env*` file is tracked or gets staged. This is a convenience wrapper the user may invoke themselves — don't assume it should replace a normal `git commit` review flow when working here.

## Backend architecture (Go, applies to all three backend-* services)

- `main.go`: connects DB (`config.ConnectionDatabase`), runs `AutoMigrate` for all models, seeds default users (`models.SeedDefaultUsers`), builds the router (`routers.SetupRouters`), wraps it in `middlewares.RecoveryMiddleware` then `middlewares.CorsMiddlewares`, and listens.
- `routers/router.go`'s `SetupRouters()` registers auth routes and a few directly-inlined protected routes (`/api/logout`, `/api/dashboard`, `/api/holiday`, `/api/profile`, each wrapped individually in `middlewares.AuthMiddleware`), then delegates to one `Register*Routes(router)` function per domain module (incident, category, CCTV officer, location, camera trouble, CCTV id, summary request camera, user, camera occupancy, recording duration, service performance). Adding a new resource means adding a new `routers/<Thing>Router.go` with a `Register<Thing>Routes` func and calling it from `SetupRouters`.
- Auth: JWT-based, `middlewares/authMiddlewares.go` guards protected routes; `middlewares/corsMiddleware.go` and `middlewares/recoveryMiddleware.go` wrap the whole mux.
- DB access is GORM over MySQL (`config.DB`), configured entirely from environment variables read via `godotenv`.
- Because the three backend-* directories are structural clones, a fix to shared logic (middleware, config, auth flow) found in one likely needs the same fix applied in the others if/when they get activated — check whether the change is CCTV-specific or platform-wide before deciding scope.

## Frontend architecture (applies to all React apps)

- Vite + React 19, Tailwind v4 (via `@tailwindcss/vite`), React Router v7, i18next for translations (`src/i18n.js`, `src/locales/`).
- Each dashboard SPA's axios instance (`src/dashboard/api/axios.js`) is set to `baseURL: '/api'` and relies on nginx to proxy `/api/` to the backend — it does not point at a backend host directly. A bearer token is read from `localStorage` and attached per-request; a `401` response clears the token and dispatches a `session-expired` window event.
- Local dev proxying: `vite.config.js` files that define a `server.proxy['/api']` point at `http://localhost:8081` (backend-cctv) since that's the only backend actually running; keep the dev port fixed at `5173` (`strictPort: true`) since the backend/proxy setup assumes it.
- Routing prefixes matter here: each dashboard app mounts its `BrowserRouter` with a `basename` matching its nginx location block (e.g. `frontend-cctv` uses `basename="/cctv"` to match nginx's `location ^~ /cctv/`). If you add routes or change a `basename`, update the matching nginx `location` block (and vice versa) or the app will break in the deployed stack even though it works standalone in dev.

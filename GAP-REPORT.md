# Gap Report: teledenistry-backend (NestJS) → teledentistry-express (ElysiaJS)

> Generated: 2026-07-25
> Source: NestJS (`teledenistry-backend`), Target: ElysiaJS (`teledentistry-express`)

---

## 1. Endpoint Coverage

### Auth (`/auth`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| POST | `/auth/register` | ✅ | ❌ | |
| POST | `/auth/login` | ✅ | ❌ | |
| POST | `/auth/refresh-token` | ✅ | ❌ | |
| POST | `/auth/reset-password` | ✅ | ❌ | send reset email |
| PATCH | `/auth/reset-password` | ✅ | ❌ | actually reset |
| GET | `/auth/me` | ✅ | ❌ | |

### Users (`/users`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| GET | `/users` | ✅ | ❌ | |
| PATCH | `/users` | ✅ | ❌ | update profile |

### Appointments (`/appointments`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| POST | `/appointments` | ✅ | ❌ | HUB only |
| PATCH | `/:id/start` | ✅ | ❌ | |
| GET | `/appointments/doctor` | ✅ | ❌ | DOCTOR only |
| GET | `/appointments/hub` | ✅ | ❌ | HUB only |
| GET | `/:id` | ✅ | ❌ | |
| POST | `/:id/queue` | ✅ | ❌ | HUB only |
| GET | `/:id/history` | ✅ | ❌ | |
| GET | `/:id/doctor` | ✅ | ❌ | **MISSING** — by doctor ID |
| DELETE | `/:id` | ✅ | ❌ | HUB only |
| PATCH | `/:id` | ✅ | ❌ | HUB only |
| PATCH | `/:id/consultation` | ✅ | ❌ | |
| PATCH | `/:id/notes` | ✅ | ❌ | |
| PATCH | `/:id/end` | ✅ | ❌ | |
| POST | `/:id/files` | ✅ | ❌ | multipart upload |

### Patients (`/patients`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| POST | `/patients` | ✅ | ❌ | HUB only |
| GET | `/patients/hub` | ✅ | ❌ | HUB only |
| GET | `/patients/doctor` | ✅ | ❌ | DOCTOR only |
| GET | `/:id` | ✅ | ❌ | |
| PATCH | `/:id` | ✅ | ❌ | HUB only |

### Message (`/message`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| GET | `/:id` | ✅ | ❌ | by chat ID |
| DELETE | `/:id` | ✅ | ❌ | by sender |

### Chat (`/chat`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| GET | `/chat` | ✅ | ❌ | |
| GET | `/chat/unread-count` | ✅ | ❌ | |
| PATCH | `/:id/read` | ✅ | ❌ | |
| GET | `/:id/unread-count` | ✅ | ❌ | |
| GET | `/:id` | ✅ | ❌ | |
| GET | `/appointment/:id` | ✅ | ❌ | |

### Calls (`/calls`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| POST | `/calls` | ✅ | ❌ | |
| POST | `/calls/validate` | ✅ | ❌ | |
| POST | `/calls/join` | ✅ | ❌ | |
| GET | `/:appointment` | ✅ | ❌ | |
| POST | `/:id/end` | ✅ | ❌ | |

### Admin (`/admin`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| POST | `/admin/invites` | ✅ | ❌ | ADMIN only |
| GET | `/:id/resend` | ✅ | ❌ | |
| DELETE | `/:id` | ✅ | ❌ | |
| GET | `/admin/invites` | ✅ | ❌ | |
| GET | `/:id` | ✅ | ❌ | |
| GET | `/admin/users` | ✅ | ❌ | |
| GET | `/admin/users/:id` | ✅ | ❌ | |
| GET | `/admin/appointments` | ✅ | ❌ | |
| GET | `/admin/appointments/:id` | ✅ | ❌ | |
| PATCH | `/admin/users/:id/approve` | ✅ | ❌ | |

### Stats (`/stats`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| GET | `/stats` | ✅ | ❌ | HUB only |

### Misc (`/misc`)
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| POST | `/misc/aws/upload` | ✅ | ❌ | |
| DELETE | `/misc/aws/delete` | ✅ | ❌ | |

### Other
| Method | Path | NestJS | ElysiaJS | Notes |
|--------|------|--------|----------|-------|
| GET | `/` | ✅ | ❌ | health/hello |

**Total: 54 endpoints — 0 implemented (ElysiaJS migration pending)**

---

## 2. Feature Gaps

### Missing from Express

| Feature | NestJS | Express | Impact |
|---------|--------|---------|--------|
| Swagger `/api-docs` | ✅ | ❌ | No API docs UI |
| Request validation (DTO/class-validator) | ✅ | ✅ Joi | Parity achievable |
| Cron: mark passed appointments | ✅ | ❌ | Stale appointments never auto-expire |
| Cron: auto-complete in-progress | ✅ | ❌ | Appointments stuck IN_PROGRESS |
| Global ValidationPipe (whitelist/forbidNonWhitelisted) | ✅ | ❌ | Unknown fields silently accepted |
| Handlebars email templates | ✅ | ❌ | Plain-text emails only in Express |
| Admin seed on startup | ✅ | ❌ | No default admin created |
| Health endpoint | ❌ (via Terminus planned) | ❌ | No health check |
| Auth: password reset flow | ✅ | ❌ | No reset-password routes |
| Auth: refresh token | ✅ | ✅ | Parity achieved |
| Auth: register with invite validation | ✅ | ❌ | No invite check on register |
| ApprovedUserGuard | ✅ | ❌ | Unapproved users can access |
| Role-based decorator `@Roles()` | ✅ | ✅ `requireRole` | Parity achievable |
| CurrentUser decorator | ✅ | ❌ | req.user used manually |
| SOCKET_EVENTS.NOTIFICATION on call join/leave | ✅ | ❌ | No call notifications over socket |
| Unread count via WebSocket | ✅ | ❌ | REST-only unread counts |
| Redis session persistence | ✅ | ✅ | Parity achieved |
| Activity tracking (lastActivity) | ❌ | ✅ chat-session-manager | Express has extra |
| `notifications:unread` socket event | ❌ | ✅ | Express has extra |

### Schema/Model Gaps

| Field | NestJS | Express | Notes |
|-------|--------|---------|-------|
| Appointment: `status` enum — `PASSED` | ✅ | ❌ | Missing from `APPOINTMENT_STATUS` |
| Appointment: `doctor` populated | ✅ | ✅ | |
| User: `centre_id` auto-increment | ✅ | ✅ | |
| Patient: `age` virtual | ✅ | ✅ | |
| Patient: text index on name+email | ✅ | ✅ | |
| Invite: compound index email+is_active | ✅ | ✅ | |
| File schema (embedded in call/appointment) | ✅ | ✅ | |

### Validation DTO Gaps

| NestJS DTO | Express Schema | Status |
|------------|----------------|--------|
| `RegisterDto` | `registerSchema` | ✅ parity |
| `LoginDto` | `loginSchema` | ✅ parity |
| `RefreshTokenDto` | `refreshTokenSchema` | ✅ parity |
| `ResetPasswordDto` | `resetPasswordRequestSchema` | ✅ parity |
| `UpdatePasswordDto` | `resetPasswordUpdateSchema` | ✅ parity |
| `CreatePatientDto` | `createPatientSchema` | ✅ parity |
| `UpdatePatientDto` | `updatePatientSchema` | ✅ parity |
| `CreateAppointmentDto` | `createAppointmentSchema` | ✅ parity |
| `UpdateAppointmentDto` | — | ❌ missing |
| `AddAppointmentQueueDto` | `queueAppointmentSchema` | ❌ only validates `doctor`, missing all medical fields |
| `StartAppointmentDto` | — | ❌ missing |
| `SubmitConsultationDto` | `submitConsultationSchema` | ✅ parity |
| `UpdateNotesDto` | `updateNotesSchema` | ✅ parity |
| `FetchConsultationQueryDto` | — | ❌ missing `status` filter |
| `CreateCallDto` | `createCallSchema` | ✅ parity |
| `JoinCallDto` | `joinCallSchema` | ✅ parity |
| `CallMetadataDto` | — | ❌ missing |
| `CreateMessageDto` | — | ❌ missing |
| `CreateChatDto` | — | ❌ missing |
| `CreateInviteDto` | `createInviteSchema` | ❌ missing `role` field |
| `FetchUsersDto` (admin) | `fetchUsersQuerySchema` | ✅ parity |
| `FetchAppointmentsDto` | `fetchAppointmentsAdminQuerySchema` | ✅ parity |
| `FetchUsersDto` (users) | — | ❌ missing |
| `UpdateProfileDto` | — | ❌ missing |

---

## 3. Notable Issues & Bugs in Both Codebases

### NestJS
1. **src/auth/auth.controller.ts** — `updateResetPassword()` missing `@Body()` decorator → `body` will be undefined
2. **src/appointments/appointments.type.ts** — field name `compplaints` (double 'p')
3. **src/admin/dto/fetch-appontments.dto.ts** — filename typo (missing 'i')
4. **src/appointments/appointments.controller.ts:62** — `isUserAffiliatedWithAppointment` not awaited
5. **src/appointments/appointments.service.ts:65** — `findDoctorAppointments` status filter inverted
6. **src/patients/patients.service.ts:40** — `getNextPatientId` logic: `> 1` should be `> 0`
7. **src/admin/admin.service.ts:37** — `fetchAppointments` passes wrong variable to `find`
8. **src/admin/admin.service.ts:21** — `fetchUsers` passes wrong variable to `count`

### Express
1. **src/routes/appointments.ts** — missing `GET /appointments/:id/doctor` endpoint
2. **src/validation/appointment.schemas.ts** — `queueAppointmentSchema` only validates `doctor`, missing all Periodontal/TeethAssessment fields
3. **src/validation/admin.schemas.ts** — `createInviteSchema` missing `role` field
4. **src/services/mailer.service.ts** — references `src/templates/` but directory doesn't exist
5. **No Swagger setup** despite swagger-jsdoc/swagger-ui-express in deps

---

## 4. Environment Variables

| Variable | NestJS `.env` | Express `.env` | Status |
|----------|--------------|----------------|--------|
| `MONGO_URI` | ✅ | ✅ | Same value |
| `JWT_SECRET` | ✅ | ✅ | Same value |
| `JWT_REFRESH_SECRET` | ✅ | ✅ | Same value |
| `REDISCLOUD_URL` / `REDIS_URL` | ✅ REDISCLOUD_URL | ✅ REDIS_URL | Key name differs |
| `AWS_BUCKET_NAME` | ✅ | ✅ | |
| `AWS_REGION` | ✅ | ✅ | |
| `AWS_ACCESS_KEY_ID` | ✅ | ✅ | |
| `AWS_SECRET_ACCESS_KEY` | ✅ | ✅ | |
| `PORT` | ✅ (default 3000) | ✅ (5000) | Different defaults |
| `MAILER_HOST` | ❌ | ✅ | Not in NestJS `.env` |
| `MAILER_PORT` | ❌ | ✅ | |
| `MAILER_USERNAME` | ❌ | ✅ | |
| `MAILER_PASSWORD` | ❌ | ✅ | |
| `ADMIN_EMAIL` | ✅ | ❌ | Used for seed |
| `ADMIN_PASSWORD` | ✅ | ❌ | Used for seed |
| `JWT_EXPIRY` | ✅ | ❌ | NestJS: 1d/30d |

**Note:** NestJS also validates env on startup via `config.schema.ts` (Joi). Express has no such validation.

---

## 5. Migration Checklist

### Phase 1 — Framework (ElysiaJS)
- [ ] Replace Express with ElysiaJS in package.json
- [ ] Rewrite app.ts as ElysiaJS app
- [ ] Rewrite server.ts with Socket.IO integration
- [ ] Rewrite auth middleware as ElysiaJS guard/derive
- [ ] Rewrite error handler as `.onError()`
- [ ] Rewrite role guard as `.guard()`
- [ ] Rewrite validate middleware as `.onBeforeHandle()`

### Phase 2 — Routes (54 endpoints)
- [ ] Auth (6 endpoints)
- [ ] Users (2 endpoints)
- [ ] Patients (5 endpoints)
- [ ] Appointments (14 endpoints)
- [ ] Message (2 endpoints)
- [ ] Chat (6 endpoints)
- [ ] Calls (5 endpoints)
- [ ] Admin (10 endpoints)
- [ ] Stats (1 endpoint)
- [ ] Misc (2 endpoints)
- [ ] Root health (1 endpoint)

### Phase 3 — Missing Features
- [ ] Password reset flow (2 endpoints + email template)
- [ ] Appointment cron jobs (auto-expire, auto-complete)
- [ ] Admin seed on startup
- [ ] Swagger via @elysiajs/swagger
- [ ] Health check endpoint
- [ ] WebSocket notifications for call events
- [ ] Env validation on startup
- [ ] Hub patients query schema (currently missing)

### Phase 4 — Bugfixes
- [ ] Add `role` field to createInviteSchema
- [ ] Expand queueAppointmentSchema with all fields
- [ ] Create `src/templates/` directory with .hbs files
- [ ] Add `PASSED` to APPOINTMENT_STATUS enum

---

## 6. Architecture Migration: Express → ElysiaJS

### Before (Express)
```
src/
├── app.ts                  → express(), middleware stack, router mount
├── server.ts               → http.createServer(app), Socket.IO, Redis
├── routes/*.ts             → express.Router() with handler functions
├── security/auth-middleware.ts → req.user injection
├── middlewares/
│   ├── error-handler.ts    → (err, req, res, next) => {}
│   ├── require-role.ts     → checks req.user.role
│   └── validate.ts         → Joi validation
└── services/               → business logic (unchanged)
```

### After (ElysiaJS)
```
src/
├── app.ts                  → new Elysia(), .use(plugins), .group(routes), .listen()
├── server.ts               → http.createServer → Elysia.fetch + Socket.IO
├── routes/*.ts             → export const plugin = (app: Elysia) => app.get/post/...
├── guards/
│   ├── auth.ts             → .derive() injecting user from JWT
│   ├── require-role.ts     → .guard() checking user.role
│   └── validate.ts         → .onBeforeHandle() Joi validation
├── lib/
│   └── elysia-node.ts      → adapter: http.Server → Elysia.fetch bridge
└── services/               → business logic (unchanged)
```

**Key changes:**
- No `res.json()` — handlers return values directly
- No `(req, res, next)` — handlers receive `({ body, params, query, headers, set, ... })`
- Guards replace middleware: `.derive()` for auth, `.guard()` for role checks
- `.onError()` replaces Express error handler
- `.onBeforeHandle()` replaces `validate()` middleware
- Plugins define route groups; use `.use()` to compose

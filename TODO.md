Plan to Implement Missing Features in teledentistry-express

1. Add request validation & DTO parity





Choose validation library: Use joi (already installed) to define schemas for core DTOs (auth, users, patients, appointments, admin, calls, message/chat).



Create validation middleware: Add a reusable middleware in src/middlewares/validate.ts that takes a Joi schema and validates req.body, req.query, or req.params, returning 400 with details on failure.



Mirror key DTOs: For each important Nest DTO (e.g. LoginDto, RegisterDto, CreatePatientDto, CreateAppointmentDto, AddAppointmentQueueDto, call DTOs, etc.), create corresponding Joi schemas in src/validation/*.ts using the Nest definitions in teledenistry-backend/src/**/dto as a guide.



Wire validation into routes: Update existing routers in src/routes/*.ts (auth.ts, patients.ts, appointments.ts, calls.ts, admin.ts, etc.) to call the validation middleware before controllers, keeping error shapes close to Nest (message, errors).

2. Configure Swagger / API documentation





Base swagger config: Create src/config/swagger.ts that builds an OpenAPI spec using swagger-jsdoc, scanning src/routes/*.ts and JSDoc comments.



Annotate routes: Add concise JSDoc blocks above Express route handlers to describe summary, params, and success/error response shapes, focusing on the main modules (auth/users/patients/appointments/admin/calls/chat/message/stats/misc).



Expose docs endpoint: In src/app.ts, mount swagger-ui-express at /api-docs, mirroring the Nest SwaggerModule.setup('api-docs', app, document) behavior.

3. Improve websocket parity (chat + call notifications)





Redis-backed session manager (optional but closer to Nest): Replace or extend ChatSessionManager in src/chat/chat-session-manager.ts to use ioredis for persisting basic session metadata keyed by sessionId and userId, similar to chat.session.manager.ts in Nest. Keep in-memory maps as cache, but write sessions/rooms to Redis for resilience.



Call-related notifications over sockets: Update call flows so that when a user joins or leaves a call, other participants receive SOCKET_EVENTS.NOTIFICATION events, using ChatSessionManager.emitToUser as in the Nest CallsController + ChatSessionManager.



Unread counts via websocket (optional): Add a socket event (e.g. notifications:unread) that calculates and pushes unread counts for chats/messages, mirroring ChatService.getUnreadCount in Nest, using the existing getTotalUnreadCount in chat.service.ts.

4. Align email behavior with Nest





Template support: Add a simple template loader in src/services/mailer.service.ts that can read Handlebars templates from a directory mirroring src/common/templates (or reuse Nest templates if accessible) and render with context.



Admin invite emails: Update [...]/teledentistry-express/src/routes/admin.ts to send templated invite emails (subject, body) similar to Nest’s MailerService usage instead of plain text.



Password reset flow: Implement Express routes akin to Nest’s AuthController.resetPassword and updateResetPassword, including token generation/verification using JWT_SECRET/JWT_REFRESH_SECRET equivalents and calling a mailer that sends the password reset link.

5. Health checks & basic monitoring





Health endpoint: Add a small router src/routes/health.ts that exposes /health with checks for:





MongoDB connectivity (mongoose.connection.readyState),



Redis connectivity (if Redis used for chat sessions),



A simple uptime/versions payload.



Wire into app: Mount the health router without auth in src/app.ts, similar to what @nestjs/terminus would provide.

6. Tighten security & config parity





CORS & Helmet tuning: Ensure helmet and cors options in src/app.ts match Nest’s behavior for production vs development (already close, only adjust as needed for CSP and COEP).



Config centralization: Add src/config/env.ts that validates required env vars (Mongo, JWT secrets, AWS, mailer) on startup and throws if any critical value is missing.

7. Testing & parity checks





Minimal Jest setup for Express: Add Jest config and a few high-value tests for auth, core patient/appointment flows, and a simple socket.io connection test to ensure behavior doesn’t regress.



API parity checklist: Create a markdown checklist documenting all main endpoints from Nest (by reading *.controller.ts in teledenistry-backend/src) and confirm each maps to an Express route, noting any intentional behavioral differences (e.g. error text or status code).

8. Documentation for migration





README section: Update or add README.md in teledentistry-express explaining:





How to run the Express server and sockets,



Required env vars and how they map from the Nest .env,



What’s fully equivalent vs intentionally simplified (e.g. Redis optional, tests coverage),



How to flip the frontend or deployment from Nest to Express.
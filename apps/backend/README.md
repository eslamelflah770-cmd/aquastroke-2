# AQUASTROKE Backend API

Comprehensive REST API for the AQUASTROKE swimming training management platform.

## Overview

The AQUASTROKE Backend is a Node.js/Express server that provides a complete REST API for managing swimming training programs, sessions, athletes, and performance tracking. It uses Supabase PostgreSQL as the database and includes comprehensive authentication, validation, error handling, and logging.

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Database:** Supabase (PostgreSQL)
- **Language:** TypeScript 5.x
- **Validation:** Zod
- **Authentication:** JWT (jsonwebtoken)
- **Deployment:** Vercel

## Project Structure

```
apps/backend/
├── src/
│   ├── index.ts              # Main server file with all routes
│   ├── types.ts              # TypeScript interfaces and types
│   ├── validation.ts         # Zod validation schemas
│   ├── middleware.ts         # Express middleware (auth, validation, error handling)
│   ├── logger.ts             # Logging utility
│   ├── db.ts                 # Database utilities and Supabase client
│   └── .env.local            # Environment variables (local development)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment configuration
└── .env.example              # Environment variables template
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account and project

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Update environment variables:**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   PORT=3001
   NODE_ENV=development
   ```

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot reload enabled.

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## API Documentation

### Base URL

- **Development:** `http://localhost:3001`
- **Production:** `https://aquastroke-backend.vercel.app`

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "timestamp": "2026-04-11T18:40:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-04-11T18:40:00.000Z",
  "path": "/api/endpoint"
}
```

## API Endpoints

### Health Check

```
GET /api/health
```

Check server and database connection status.

### Weekly Plans

```
GET    /api/weekly-plans              # Get all weekly plans (paginated)
GET    /api/weekly-plans/:id          # Get single weekly plan
POST   /api/weekly-plans              # Create new weekly plan (auth required)
PUT    /api/weekly-plans/:id          # Update weekly plan (auth required)
DELETE /api/weekly-plans/:id          # Delete weekly plan (auth required)
```

### Sessions

```
GET    /api/sessions                  # Get all sessions (paginated)
GET    /api/sessions/:id              # Get single session
POST   /api/sessions                  # Create new session (auth required)
PUT    /api/sessions/:id              # Update session (auth required)
DELETE /api/sessions/:id              # Delete session (auth required)
```

### Drills

```
GET    /api/sessions/:sessionId/drills  # Get drills for session
POST   /api/drills                      # Create new drill (auth required)
PUT    /api/drills/:id                  # Update drill (auth required)
DELETE /api/drills/:id                  # Delete drill (auth required)
```

### Attendance

```
GET    /api/sessions/:sessionId/attendance  # Get attendance for session
POST   /api/attendance                      # Record attendance (auth required)
PUT    /api/attendance/:id                  # Update attendance (auth required)
```

### Athletes

```
GET    /api/athletes                   # Get all athletes (paginated)
GET    /api/athletes/:id               # Get single athlete
POST   /api/athletes                   # Create new athlete (auth required)
PUT    /api/athletes/:id               # Update athlete (auth required)
```

### Trial Results

```
GET    /api/athletes/:athleteId/trial-results  # Get trial results
POST   /api/trial-results                      # Create trial result (auth required)
```

## Request Examples

### Create Weekly Plan

```bash
curl -X POST http://localhost:3001/api/weekly-plans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "season_id": "550e8400-e29b-41d4-a716-446655440000",
    "week_number": 1,
    "phase": "GPP",
    "total_volume": 15000,
    "intensity_level": 5,
    "focus_area": "Base building"
  }'
```

### Create Session

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "weekly_plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_date": "2026-04-12",
    "title": "Aerobic Base Session",
    "duration_minutes": 90,
    "total_distance": 3000
  }'
```

### Record Attendance

```bash
curl -X POST http://localhost:3001/api/attendance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "athlete_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "present"
  }'
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_TOKEN` | 401 | Authorization token is missing |
| `INVALID_TOKEN` | 401 | Authorization token is invalid or expired |
| `FORBIDDEN` | 403 | User doesn't have required permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_VALUE` | 409 | Duplicate value for unique field |
| `INVALID_REFERENCE` | 400 | Invalid reference to related resource |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Database Schema

The backend uses the following main tables:

- `academies` - Swimming academies/clubs
- `users` - User accounts
- `coaches` - Coach profiles
- `athletes` - Athlete profiles
- `parents` - Parent profiles
- `seasons` - Training seasons
- `weekly_plans` - Weekly training plans
- `sessions` - Individual training sessions
- `drills` - Training drills
- `attendance` - Session attendance records
- `trial_results` - Performance trial results
- `progress_tracking` - Athlete progress tracking
- `notifications` - System notifications
- `messages` - User messages
- `audit_logs` - System audit logs

## Middleware

### Authentication Middleware

Validates JWT tokens and extracts user information.

```typescript
app.get('/api/protected', authMiddleware, (req, res) => {
  // req.user contains authenticated user data
})
```

### Authorization Middleware

Checks user role before allowing access.

```typescript
app.post('/api/admin', requireRole('admin'), (req, res) => {
  // Only admin users can access
})
```

### Validation Middleware

Validates request body against Zod schemas.

```typescript
app.post('/api/endpoint', validateRequest(CreateSchema), (req, res) => {
  // req.body is validated and typed
})
```

### Error Handler

Catches and formats all errors consistently.

```typescript
app.use(errorHandler)
```

## Logging

The application includes comprehensive logging:

```typescript
logger.info('User logged in', { userId: '123' })
logger.warn('Rate limit exceeded', { ip: '192.168.1.1' })
logger.error('Database error', error)
logger.debug('Query executed', { duration: '45ms' })
```

## Deployment

### Deploy to Vercel

1. **Connect GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy:**
   ```bash
   vercel deploy --prod
   ```

### Environment Variables on Vercel

Set these in Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`
- `FRONTEND_URL`
- `ADMIN_URL`

## Testing

### Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2026-04-11T18:40:00.000Z",
    "environment": "development",
    "database": "connected",
    "uptime": 123.45
  }
}
```

## Performance Optimization

- **Database Indexing:** All frequently queried columns are indexed
- **Pagination:** All list endpoints support pagination
- **Caching:** Consider implementing Redis for session caching
- **Rate Limiting:** Built-in rate limiting to prevent abuse
- **Connection Pooling:** Supabase handles connection pooling

## Security

- **JWT Authentication:** Secure token-based authentication
- **Role-Based Access Control:** Different permissions for different roles
- **Input Validation:** All inputs validated with Zod
- **CORS Protection:** Configurable CORS for frontend access
- **Error Handling:** Sensitive error details not exposed to clients
- **Rate Limiting:** Prevents brute force attacks

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## Troubleshooting

### Database Connection Error

```
Error: Failed to connect to database
```

**Solution:** Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

### JWT Token Invalid

```
Error: Invalid or expired token
```

**Solution:** Ensure `JWT_SECRET` matches between token generation and verification

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:** Change `PORT` in `.env.local` or kill process using port 3001

### CORS Error

```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Solution:** Add frontend URL to `FRONTEND_URL` in `.env.local`

## Support

For issues and questions, please create an issue in the GitHub repository.

## License

Proprietary - AQUASTROKE Platform

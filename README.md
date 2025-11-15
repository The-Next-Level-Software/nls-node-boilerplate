# NextLevel Boilerplate Setup

This guide walks you through setting up a robust, production-ready Node.js backend using Express, MongoDB, and best practices for security, logging, validation, and development.

## 1. Create Project Directory

```bash
mkdir new-project && cd new-project
```

## 2. Initialize npm Project

```bash
npm init -y
```

## 3. Enable ES Modules

Edit `package.json` and add:

```json
"type": "module"
```

Or use `jq` (if installed):

```bash
jq '. + {type:"module"}' package.json > tmp && mv tmp package.json
```

> This enables native ES6 import/export syntax.

---

## 4. Install Core Dependencies

### Runtime & Database
```bash
npm install express mongoose dotenv
```

### Security & Middleware
```bash
npm install helmet cors express-rate-limit compression cookie-parser
```

### Authentication & Security Helpers
```bash
npm install bcryptjs jsonwebtoken
```

### Validation & Utilities
```bash
npm install joi
```

### Logging
```bash
npm install pino pino-pretty
```

---

## 5. Install Development Tools

```bash
npm install -D eslint prettier eslint-plugin-prettier eslint-config-prettier nodemon jest supertest
```

---

## 6. Optional (Recommended for Scalability)

### Caching & Background Jobs
```bash
npm install ioredis bullmq
```

> Use Redis for caching (via `ioredis`) and job queues (via `bullmq`).


---
# Project Structure

```
nextlevel-boilerplate/
├── src/
│   ├── config/
│   │   ├── database.js          <-- 1 MongoDB connection setup
│   │   └── index.js             <-- 2 Central config loader (env, db, etc.)
│   ├── startup/
│   │   └── init.js              <-- 3 App initialization (DB, middlewares, routes)
│   ├── app.js                   <-- 4 Express app instance + middleware pipeline
│   ├── index.js                 <-- 5 Entry point (starts server)
│   ├── routes/
│   │   └── index.js             <-- 6 Root router + route mounting
│   ├── controllers/
│   │   └── auth.controller.js   <-- 7 Request handlers (business logic)
│   ├── models/
│   │   └── user.model.js        <-- 8 Mongoose schemas & models
│   ├── services/
│   │   └── auth.service.js      <-- 9 Core logic (auth, user ops, etc.)
│   ├── middleware/
│   │   ├── errorHandler.js      <-- 10 Global error handling
│   │   ├── validate.js          <-- 11 Joi validation middleware
│   │   └── auth.js              <-- 12 JWT authentication guard
│   ├── utils/
│   │   └── response.util.js
│   │   └── jwt.util.js
│   │   └── password.util.js
│   │   └── pick.util.js
│   │   └── random.util.js
│   │   └── date.util.js
│   │   └── pagination.util.js
│   │   └── file.util.js
│   │   └── string.util.js
│   └── docs/                    <-- Optional: Swagger/OpenAPI specs
│
├── tests/                       <-- Jest + Supertest unit/integration tests
├── .env.example                 <-- Environment variables template
├── .eslintrc.js                 <-- ESLint configuration
├── .prettierrc                  <-- Code formatting rules
├── Dockerfile                   <-- Containerize the app
├── docker-compose.yml           <-- Local dev with MongoDB + Redis (optional)
└── package.json
```

---


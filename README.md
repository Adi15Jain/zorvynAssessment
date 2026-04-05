# Zorvyn Finance | Professional Analytics & RBAC Dashboard

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Prisma ORM](https://img.shields.io/badge/prisma-ORM-blue)](https://www.prisma.io/)

A high-authority, industrial-grade finance dashboard built to demonstrate backend engineering maturity, secure access control, and real-time data processing.

## 🚀 Architectural Choices & "Seniority" Mindset

This project was built with **security, reliability, and business logic** as the core priorities, rather than just simple "features."

### 1. 📂 3-Tier Enterprise Architecture

The system uses a clean separation of concerns:

- **Routes Layer**: Pure entry-points and permission validation.
- **Controllers Layer**: Request parsing, orchestration, and standardized responses.
- **Services Layer**: The "House of Business Logic," where calculations, aggregations, and direct database interactions live.

### 2. 🛡️ Role-Based Access Control (RBAC)

Instead of simple boolean flags, the system uses a robust **middleware-driven** permission matrix:

- **`VIEWER`**: Auditors who can only see trends and summaries.
- **`ANALYST`**: Data maintainers who handle day-to-day transaction records.
- **`ADMIN`**: System managers who handle user state and data recovery.
  _Why?_ Real business backends must restrict destructive actions to specific authority levels.

### 3. 🛡️ Security & Reliability Features

- **Soft Deletes**: Records are never permanently destroyed by normal users. We use a `deletedAt` timestamp for auditability and the ability for Admins to "Restore" accidental deletions.
- **Rate Limiting**: Protects authentication endpoints from brute-force attacks.
- **Data Validation (Zod)**: All inputs are strictly checked before touching the database, preventing "garbage in, garbage out" scenarios.

## 🔑 Permissions Matrix

| Capability                  | Viewer | Analyst | Admin |
| :-------------------------- | :----: | :-----: | :---: |
| View Summaries & Trends     |   ✅   |   ✅    |  ✅   |
| View Financial Records      |   ✅   |   ✅    |  ✅   |
| Create/Edit Records         |   ❌   |   ✅    |  ✅   |
| Delete Records (Soft)       |   ❌   |   ✅    |  ✅   |
| **Restore Deleted Records** |   ❌   |   ❌    |  ✅   |
| **Manage User Status**      |   ❌   |   ❌    |  ✅   |

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Rename `.env.example` to `.env` and configure your `DATABASE_URL` (PostgreSQL) and `JWT_SECRET`.

### 3. Initialize Database & Seed data

```bash
npx prisma migrate dev
npx prisma db seed
```

_Note: The seed script creates test accounts for all 3 roles with the same password: `password123`._

### 4. Start the server

```bash
npm run dev
```

## 🧪 Testing

The system includes a comprehensive integration suite testing RBAC boundaries and API reliability:

```bash
npm test
```

---

_Built for the Zorvyn Backend Intern Assessment._

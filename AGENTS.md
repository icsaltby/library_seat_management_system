# AGENTS.md

## Project

Library Seat Management System (Course Design Project)

This is a university information system analysis and design course project.

The goal is to build a complete but simple seat reservation system for a library.

The system should be realistic enough for demonstration but should avoid unnecessary complexity.

---

## Tech Stack

Frontend

- React
- Vite
- Axios
- Ant Design
- ECharts

Backend

- Python 3
- Flask
- Flask-CORS
- Flask-SQLAlchemy

Database

- SQLite

---

## Architecture

Use frontend-backend separation.

Browser
↓
React Frontend
↓ HTTP JSON API
Flask Backend
↓ SQLAlchemy
SQLite Database

Do NOT introduce:

- Redis
- Docker
- Nginx
- RabbitMQ
- Kafka
- Celery
- Microservices
- WebSocket

Polling is sufficient.

---

## Development Goal

The project must be:

- Easy to understand
- Easy to demonstrate
- Easy to maintain
- Suitable for a university course design

Prefer simplicity over enterprise architecture.

---

## Core Business Objects

User

Seat

Reservation

StudySession

CheckInRecord

LeaveRecord

Violation

OpenTimeConfig

---

## Seat State Flow

free
→ reserved
→ using
→ leaving
→ using
→ free

Exception:

reserved
→ timeout
→ free

leaving
→ timeout
→ free

---

## Business Rules

One user can have at most one active reservation.

One user can have at most one active study session.

One seat can have at most one active reservation.

One seat can have at most one active study session.

If reservation timeout occurs:

- release seat
- create violation record

If leave timeout occurs:

- release seat
- create violation record

---

## Database

Use SQLite.

Database file:

library.db

Use SQLAlchemy models.

Tables:

user

seat

reservation

study_session

checkin_record

leave_record

violation

open_time_config

---

## Backend Structure

backend/

controller/

service/

dao/

model/

utils/

app.py

Keep business logic inside service layer.

Keep database operations inside dao layer.

---

## Frontend Pages

LoginPage

RegisterPage

SeatMapPage

MyReservationPage

CurrentSeatPage

StudyReportPage

AdminDashboardPage

AdminSeatPage

AdminUserPage

---

## UI Requirements

Seat colors:

green = free

yellow = reserved

red = using

orange = leaving

gray = disabled

Use Ant Design components.

Use ECharts for reports.

---

## Authentication

Use simple JWT authentication.

Do not implement OAuth.

Do not implement complex permission systems.

Role field:

user

admin

---

## API Style

Prefix:

/api/

Examples:

POST /api/auth/register

POST /api/auth/login

GET /api/seats

POST /api/reservations

POST /api/reservations/{id}/checkin

POST /api/study-sessions/{id}/leave

POST /api/study-sessions/{id}/return

POST /api/study-sessions/{id}/release

GET /api/reports/me

GET /api/admin/statistics

---

## Coding Style

Write clear and beginner-friendly code.

Add comments to important business logic.

Avoid over-engineering.

Prefer readability over abstraction.

---

## Development Order

Step 1

Create frontend and backend project structure.

Step 2

Create SQLAlchemy models.

Step 3

Implement register and login.

Step 4

Implement seat list API.

Step 5

Implement reservation API.

Step 6

Implement check-in API.

Step 7

Implement leave and return API.

Step 8

Implement release seat API.

Step 9

Implement study report API.

Step 10

Implement admin pages.

---

## Testing

After every task:

- Ensure backend starts successfully.
- Ensure frontend starts successfully.
- Explain how to run the project.
- List changed files.
- Do not skip error handling.

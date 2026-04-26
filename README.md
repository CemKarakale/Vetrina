# Vetrina

Vetrina is a full-stack e-commerce management platform built with Angular, Spring Boot, MySQL, and a Python AI service. It brings together product browsing, carts, orders, customer management, analytics, reviews, store administration, and an AI assistant for data-aware business questions.

## Features

- Role-based authentication for `ADMIN`, `CORPORATE`, and `USER` accounts
- Product catalog with product detail pages, categories, and admin product workflows
- Cart and order management
- Customer, review, shipment, and profile management
- Corporate dashboard and analytics views with Chart.js visualizations
- Admin panels for users, stores, categories, settings, audit logs, and reports
- AI assistant powered by FastAPI and LangGraph for guided analytics and SQL-backed answers
- MySQL database bootstrap with Docker Compose

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 21, TypeScript, SCSS, RxJS, Chart.js |
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA, JWT |
| Database | MySQL 8 |
| AI Service | Python, FastAPI, LangGraph, Groq, pandas, Plotly |
| Tooling | Maven, npm, Docker Compose |

## Project Structure

```text
.
+-- frontend/      # Angular application
+-- backend/       # Spring Boot REST API
+-- ai-service/    # FastAPI AI assistant service
+-- database/      # MySQL Docker Compose and initialization SQL
+-- docs/          # Project documentation and technical report
`-- init_db.sql    # Root-level database initialization script
```

## Prerequisites

- Node.js and npm
- Java 17
- Maven, or the included Maven wrapper
- Docker and Docker Compose
- Python 3.10 or newer

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ECommerceProject
```

### 2. Start the database

```bash
cd database
docker compose up -d
```

The database runs on `localhost:3307` and creates the `ecommerce_db` schema. Default local credentials are:

```text
username: root
password: root
```

### 3. Start the backend

```bash
cd ../backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8080`.

### 4. Start the AI service

The AI assistant is optional for the core store flows, but required for `/api/ai` chat features.

```bash
cd ../ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On Windows PowerShell:

```powershell
cd ..\ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If your AI provider requires secrets, add them in `ai-service/.env`.

### 5. Start the frontend

```bash
cd ../frontend
npm install
npm run start
```

Open `http://localhost:4200`.

The Angular dev server uses `frontend/proxy.conf.json` to forward:

- `/api` to `http://localhost:8080`
- `/api/ai` to `http://localhost:8000`

## Common Commands

### Frontend

```bash
cd frontend
npm run start
npm run build
npm run test
```

### Backend

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

### Database

```bash
cd database
docker compose up -d
docker compose down
```

## Configuration

Backend configuration lives in `backend/src/main/resources/application.properties`.

Important local defaults:

```properties
spring.datasource.url=jdbc:mysql://localhost:3307/ecommerce_db
spring.datasource.username=root
spring.datasource.password=root
app.internal.secret=super-secret-internal-key-12345
```

For production or shared deployments, replace local database credentials, JWT-related secrets, Stripe keys, and internal service secrets with environment-specific secure values.

## API Documentation

The backend includes SpringDoc OpenAPI support. After starting the backend, check:

```text
http://localhost:8080/swagger-ui.html
```

Depending on the SpringDoc route mapping, the UI may also be available at:

```text
http://localhost:8080/swagger-ui/index.html
```

## Notes

- The frontend package name is already set to `vetrina`.
- The AI service exposes health checks at `http://localhost:8000/health`.
- The database container maps MySQL from container port `3306` to host port `3307`.

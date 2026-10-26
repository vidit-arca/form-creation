# Contributing to HaloFormCraft

## Getting Started

1. **Prerequisites**
   - Node.js (v18+)
   - Python 3.10+
   - Docker & Docker Compose

2. **Local Setup**
   - Copy `.env.example` to `.env`
   - Install backend dependencies: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
   - Install admin UI dependencies: `cd admin-ui && npm install`
   - Install patient UI dependencies: `cd patient-ui && npm install`

3. **Running Locally**
   Use Docker Compose to spin up all services including the Nginx gateway:
   ```bash
   docker-compose up --build
   ```

## Development Guidelines

- **Frontend:** Built with Vite and React. Ensure all UI components follow the existing Tailwind CSS design system.
- **Backend:** FastAPI with SQLAlchemy. Currently using a single `main.py` but planned to be split into routers.
- **Security:** Do not commit credentials, `.env` files, or production `.db` files to the repository.

## Submitting Pull Requests
- Ensure there are no console errors or warnings.
- Keep pull requests scoped to a single feature or fix.

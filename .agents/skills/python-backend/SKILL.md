---
name: python-backend
description: >-
  Production-grade Python and backend engineering skill. Enforces modern Python 3.10 idioms,
  FastAPI async architectures, clean service/repository boundaries, Pydantic v2 data models,
  resilient connection pooling (httpx, redis, asyncpg/SQLAlchemy), fast tooling (uv, ruff, pytest),
  structured logging, and robust API error handling. Activate when designing, writing, reviewing,
  optimizing, or debugging Python backend code, microservices, APIs, or data pipelines.
---

# Production Python & Backend Engineering Guide

This skill governs the architecture, implementation, and review of production-grade Python backend services and APIs. It emphasizes async performance, type safety, resilience, and strict layer separation.

---

## 1. Core Architecture & Layer Separation

Maintain strict unidirectional dependencies. Higher layers depend on lower layers, never the reverse:

```
┌──────────────────────────────────────────────┐
│  API Layer (FastAPI Routers, Middleware)    │  ← Request validation, HTTP status codes, auth
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│  Service Layer (Business Logic & Use Cases)  │  ← Orchestration, domain rules, transactions
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│  Data & Adapter Layer (Repos, DB, Clients)   │  ← DB queries, Redis, external HTTP/LLM calls
└──────────────────────────────────────────────┘
```

### The Invariants:
1. **Never leak ORM models across the API boundary**: Endpoints accept and return explicit Pydantic DTOs (`schemas.py`), never database models.
2. **Never execute business logic inside route handlers**: Routes only parse/validate input, delegate to services, and return DTOs.
3. **Never hardcode external client instantiation in endpoints**: Inject dependencies via FastAPI's `Depends()` or bind them to `app.state` during lifespan startup.

---

## 2. FastAPI & Async Concurrency Rules

### Lifespan Resource Management (No Legacy `@app.on_event`)
Always manage connection pools, Redis, background listeners, and shutdown draining with `@asynccontextmanager`:

```python
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx
import redis.asyncio as aioredis

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # --- Startup ---
    http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        timeout=httpx.Timeout(30.0, connect=5.0)
    )
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    
    app.state.http_client = http_client
    app.state.redis = redis_client
    
    yield  # Application serves requests
    
    # --- Shutdown & Draining ---
    await http_client.aclose()
    await redis_client.aclose()
```

### The Blocking Code Trap
* **Inside `async def`**: **NEVER** run blocking I/O (e.g. `requests.get()`, `time.sleep()`, synchronous DB drivers, heavy file I/O). Doing so blocks Python's single-threaded event loop and stalls all concurrent requests.
* **If a library is synchronous**: Use standard `def` (FastAPI automatically runs regular `def` routes in an external threadpool) or use `await asyncio.to_thread(blocking_func, *args)`.

---

## 3. Pydantic v2 Standards

* Always use Pydantic v2 syntax (`model_config = ConfigDict(...)`, `@field_validator`, `@model_validator(mode='after')`).
* Prevent prototype pollution and unexpected payload fields with `extra='forbid'`.

```python
from pydantic import BaseModel, ConfigDict, Field

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
    )

class UserCreateRequest(BaseSchema):
    email: str = Field(..., max_length=255, examples=["doctor@example.com"])
    role: str = Field(default="clinician")
    metadata: dict[str, str] = Field(default_factory=dict)
```

---

## 4. Resilience & Client I/O

When calling external APIs or microservices:
1. **Connection Pooling**: Use a shared `httpx.AsyncClient` instance stored on `app.state`. Do not create a new `httpx.AsyncClient()` inside route handlers (which exhausts local sockets and bypasses connection pooling).
2. **Explicit Timeouts**: Never make an HTTP call without an explicit timeout (`timeout=httpx.Timeout(timeout_s, connect=5.0)`).
3. **Circuit Breakers & Retries**: Wrap external calls in circuit breakers for graceful degradation. For transient network hiccups, retry only idempotently (e.g., GET requests or calls with idempotency keys) using exponential backoff with jitter.
4. **Concurrency Limiting**: Protect shared downstream services using bounded semaphores (`asyncio.Semaphore` or dynamic semaphores) to prevent cascading stampedes.

---

## 5. Tooling & Environment Best Practices

* **Package Management**: Prefer `uv` (`uv pip install`, `uv sync`, `uv lock`) for 10x-100x faster virtualenv and package resolution.
* **Formatting & Linting**: Use `ruff` (`ruff check --fix` and `ruff format`). Replace Flake8, Black, isort, and Bandit with Ruff.
* **Typing**: Use modern Python 3.11+ union syntax (`X | None` instead of `Optional[X]`, `list[str]` instead of `List[str]`). Include `from __future__ import annotations` at the top of every module.
* **Testing**:
  * Use `pytest` and `pytest-asyncio` with `asyncio_mode = "auto"`.
  * Use `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test")` for in-memory, blazing-fast API endpoint tests without spinning up real network ports.

---

## 6. Structured Observability & Error Envelopes

### Logging
* Log structured events (JSON) rather than formatted strings. Always attach contextual metadata (`request_id`, `tenant_id`, `duration_ms`):

```python
logger.info(
    "consultation.summarized",
    consultation_id=consultation_id,
    duration_ms=round(duration * 1000, 2),
    model=model_name,
)
```

### Clean Error Envelopes
Never leak Python tracebacks or raw database errors in API responses. Catch and normalize downstream errors into standard JSON envelopes:

```json
{
  "code": "GUARDRAIL_UNAVAILABLE",
  "message": "The safety guardrail is temporarily unavailable. Please retry shortly.",
  "status": 503,
  "requestId": "01a1afd4-8c16-7ca8-9fee-bdf56b81eeee"
}
```


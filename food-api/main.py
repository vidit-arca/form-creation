import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

app = FastAPI(title="Anuvaad Food Service", version="1.0.0", description="Food dataset API for the Halo application (24-Hour Dietary Recall)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def get_db():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "food-db"),
        database=os.getenv("DB_NAME", "anuvaad_food"),
        user=os.getenv("DB_USER", "food_admin"),
        password=os.getenv("DB_PASSWORD", "food_secure_password"),
        port=int(os.getenv("DB_PORT", 5432)),
        cursor_factory=RealDictCursor
    )
    try:
        yield conn
    finally:
        conn.close()


@app.on_event("startup")
def create_schema():
    """Initialize the database schema on startup (no-op if already exists)."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS food_items (
                    id               SERIAL PRIMARY KEY,
                    food_code        TEXT UNIQUE,
                    food_name        TEXT NOT NULL,
                    category         TEXT,
                    serving_size     TEXT,
                    energy_kj        NUMERIC(10, 4),
                    energy_kcal      NUMERIC(10, 4),
                    carbs_g          NUMERIC(10, 4),
                    protein_g        NUMERIC(10, 4),
                    fat_g            NUMERIC(10, 4),
                    free_sugar_g     NUMERIC(10, 4),
                    fiber_g          NUMERIC(10, 4),
                    sfa_mg           NUMERIC(10, 4),
                    mufa_mg          NUMERIC(10, 4),
                    pufa_mg          NUMERIC(10, 4),
                    cholesterol_mg   NUMERIC(10, 4),
                    calcium_mg       NUMERIC(10, 4),
                    phosphorus_mg    NUMERIC(10, 4),
                    magnesium_mg     NUMERIC(10, 4),
                    sodium_mg        NUMERIC(10, 4),
                    potassium_mg     NUMERIC(10, 4),
                    iron_mg          NUMERIC(10, 4),
                    zinc_mg          NUMERIC(10, 4),
                    copper_mg        NUMERIC(10, 4),
                    selenium_ug      NUMERIC(10, 4),
                    vita_ug          NUMERIC(10, 4),
                    vitc_mg          NUMERIC(10, 4),
                    vitd2_ug         NUMERIC(10, 4),
                    vitd3_ug         NUMERIC(10, 4),
                    vite_mg          NUMERIC(10, 4),
                    vitk1_ug         NUMERIC(10, 4),
                    vitk2_ug         NUMERIC(10, 4),
                    vitb1_mg         NUMERIC(10, 4),
                    vitb2_mg         NUMERIC(10, 4),
                    vitb3_mg         NUMERIC(10, 4),
                    vitb5_mg         NUMERIC(10, 4),
                    vitb6_mg         NUMERIC(10, 4),
                    vitb7_ug         NUMERIC(10, 4),
                    vitb9_ug         NUMERIC(10, 4),
                    folate_ug        NUMERIC(10, 4),
                    carotenoids_ug   NUMERIC(10, 4),
                    unit_serving_energy_kcal  NUMERIC(10, 4),
                    unit_serving_carb_g       NUMERIC(10, 4),
                    unit_serving_protein_g    NUMERIC(10, 4),
                    unit_serving_fat_g        NUMERIC(10, 4),
                    unit_serving_fiber_g      NUMERIC(10, 4),
                    raw_data         JSONB,
                    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_food_name_trgm
                ON food_items USING gin (food_name gin_trgm_ops);
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_food_code ON food_items (food_code);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_food_category ON food_items (category);")
        conn.commit()


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "anuvaad-food-api", "version": "1.0.0"}


@app.get("/search")
def search_food(
    q: str = Query(..., min_length=2, description="Search term (food name)"),
    limit: int = Query(15, ge=1, le=50, description="Max number of results")
):
    """
    Fuzzy search food items using PostgreSQL trigram similarity.
    Returns food name, code, serving size and core macronutrients.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT
                    id,
                    food_code,
                    food_name,
                    category,
                    serving_size,
                    energy_kcal,
                    protein_g,
                    carbs_g,
                    fat_g,
                    fiber_g,
                    unit_serving_energy_kcal,
                    unit_serving_protein_g,
                    unit_serving_carb_g,
                    unit_serving_fat_g,
                    similarity(food_name, %s) AS match_score
                FROM food_items
                WHERE food_name ILIKE %s OR food_name %% %s
                ORDER BY match_score DESC, food_name ASC
                LIMIT %s;
            """
            cur.execute(query, (q, f"%{q}%", q, limit))
            items = cur.fetchall()
            return {"query": q, "count": len(items), "matches": [dict(i) for i in items]}


@app.get("/items/{item_id}")
def get_item(item_id: int):
    """Get full nutritional details for a specific food item by ID."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM food_items WHERE id = %s", (item_id,))
            item = cur.fetchone()
            if not item:
                raise HTTPException(status_code=404, detail="Food item not found")
            return dict(item)


@app.get("/categories")
def get_categories():
    """List all unique food categories available in the dataset."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT category FROM food_items WHERE category IS NOT NULL ORDER BY category;")
            rows = cur.fetchall()
            return {"categories": [r["category"] for r in rows]}

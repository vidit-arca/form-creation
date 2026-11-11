"""
Anuvaad INDB Food Dataset Seeder
----------------------------------
Purpose  : Seeds the Anuvaad_INDB_2024.11 Excel dataset into the anuvaad_food PostgreSQL database.
Source   : Anuvaad_INDB_2024.11 (1).xlsx  (1014 rows, 82 columns per row)
Sheet    : Sheet1

Usage:
    # Step 1: Port-forward the database to localhost
    #   kubectl port-forward pod/food-db-0 5433:5432 -n haloform-prod

    # Step 2: Run this script
    python seed_food_data.py --file "Anuvaad_INDB_2024.11 (1).xlsx"

    # Optional: wipe existing data first
    python seed_food_data.py --file "Anuvaad_INDB_2024.11 (1).xlsx" --clear

Column mapping (exact match to Anuvaad INDB 2024):
    food_code         → food_code   (primary identifier e.g. ASC001)
    food_name         → food_name   (English name e.g. "Hot tea (Garam Chai)")
    primarysource     → category    (used as category e.g. asc_manual, bfp_manual)
    servings_unit     → serving_size
    energy_kcal       → energy_kcal
    protein_g         → protein_g
    carb_g            → carbs_g
    fat_g             → fat_g
    fibre_g           → fiber_g
    All 82 columns    → raw_data (JSONB) for full nutritional access via API
"""

import os
import sys
import json
import argparse
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ─── Database Config ────────────────────────────────────────────────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5433"))      # 5433 = kubectl port-forward
DB_NAME = os.getenv("DB_NAME", "anuvaad_food")
DB_USER = os.getenv("DB_USER", "food_admin")
DB_PASS = os.getenv("DB_PASSWORD", "food_secure_password")


def safe_float(val, default=None):
    """Convert a value to float safely, returning default on failure."""
    try:
        if pd.isna(val):
            return default
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_str(val, default=None):
    """Convert a value to string safely."""
    if pd.isna(val) if not isinstance(val, str) else False:
        return default
    return str(val).strip() if val else default


def create_schema(cursor):
    """Create the full schema tailored for the Anuvaad INDB 2024 dataset."""
    print("📋  Creating schema (if not exists)...")

    cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_items (
            id               SERIAL PRIMARY KEY,
            food_code        TEXT UNIQUE,              -- e.g. ASC001
            food_name        TEXT NOT NULL,             -- English food name
            category         TEXT,                      -- primarysource field (asc_manual etc.)
            serving_size     TEXT,                      -- servings_unit (tea cup, bowl, etc.)

            -- Core Macronutrients (per 100g)
            energy_kj        NUMERIC(10, 4),
            energy_kcal      NUMERIC(10, 4),
            carbs_g          NUMERIC(10, 4),
            protein_g        NUMERIC(10, 4),
            fat_g            NUMERIC(10, 4),
            free_sugar_g     NUMERIC(10, 4),
            fiber_g          NUMERIC(10, 4),

            -- Fatty Acids (mg per 100g)
            sfa_mg           NUMERIC(10, 4),
            mufa_mg          NUMERIC(10, 4),
            pufa_mg          NUMERIC(10, 4),
            cholesterol_mg   NUMERIC(10, 4),

            -- Minerals (mg per 100g unless noted)
            calcium_mg       NUMERIC(10, 4),
            phosphorus_mg    NUMERIC(10, 4),
            magnesium_mg     NUMERIC(10, 4),
            sodium_mg        NUMERIC(10, 4),
            potassium_mg     NUMERIC(10, 4),
            iron_mg          NUMERIC(10, 4),
            zinc_mg          NUMERIC(10, 4),
            copper_mg        NUMERIC(10, 4),
            selenium_ug      NUMERIC(10, 4),

            -- Vitamins
            vita_ug          NUMERIC(10, 4),            -- Vitamin A
            vitc_mg          NUMERIC(10, 4),            -- Vitamin C
            vitd2_ug         NUMERIC(10, 4),
            vitd3_ug         NUMERIC(10, 4),
            vite_mg          NUMERIC(10, 4),            -- Vitamin E
            vitk1_ug         NUMERIC(10, 4),
            vitk2_ug         NUMERIC(10, 4),
            vitb1_mg         NUMERIC(10, 4),            -- Thiamine
            vitb2_mg         NUMERIC(10, 4),            -- Riboflavin
            vitb3_mg         NUMERIC(10, 4),            -- Niacin
            vitb5_mg         NUMERIC(10, 4),
            vitb6_mg         NUMERIC(10, 4),
            vitb7_ug         NUMERIC(10, 4),            -- Biotin
            vitb9_ug         NUMERIC(10, 4),            -- Folate
            folate_ug        NUMERIC(10, 4),
            carotenoids_ug   NUMERIC(10, 4),

            -- Per-serving values (prefix: unit_serving_)
            unit_serving_energy_kcal  NUMERIC(10, 4),
            unit_serving_carb_g       NUMERIC(10, 4),
            unit_serving_protein_g    NUMERIC(10, 4),
            unit_serving_fat_g        NUMERIC(10, 4),
            unit_serving_fiber_g      NUMERIC(10, 4),

            -- All 82 original columns stored for full API access
            raw_data         JSONB,

            created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Indexes for fuzzy food name search (autocomplete)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_food_name_trgm
        ON food_items USING gin (food_name gin_trgm_ops);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_food_code ON food_items (food_code);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_food_category ON food_items (category);
    """)
    print("✅  Schema ready.\n")


def seed_database(file_path: str, clear_existing: bool = False):
    print(f"\n📂  Reading file: {file_path}")
    df = pd.read_excel(file_path, sheet_name='Sheet1')
    print(f"✅  Loaded {len(df)} rows × {len(df.columns)} columns\n")

    # Connect to DB
    print(f"🔌  Connecting to PostgreSQL → {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
    )
    cursor = conn.cursor()
    print("✅  Connected.\n")

    create_schema(cursor)
    conn.commit()

    if clear_existing:
        print("🗑️   Truncating existing food_items data...")
        cursor.execute("TRUNCATE TABLE food_items RESTART IDENTITY;")
        conn.commit()
        print("✅  Cleared.\n")

    # Build records
    records = []
    skipped = 0

    for _, row in df.iterrows():
        food_name = safe_str(row.get('food_name'))
        if not food_name:
            skipped += 1
            continue

        # Dump all 82 columns to JSONB (replace NaN with None for JSON safety)
        raw = {k: (None if pd.isna(v) else v) for k, v in row.items()}

        records.append((
            safe_str(row.get('food_code')),
            food_name,
            safe_str(row.get('primarysource')),          # used as category
            safe_str(row.get('servings_unit')),           # serving size label
            safe_float(row.get('energy_kj')),
            safe_float(row.get('energy_kcal')),
            safe_float(row.get('carb_g')),
            safe_float(row.get('protein_g')),
            safe_float(row.get('fat_g')),
            safe_float(row.get('freesugar_g')),
            safe_float(row.get('fibre_g')),
            safe_float(row.get('sfa_mg')),
            safe_float(row.get('mufa_mg')),
            safe_float(row.get('pufa_mg')),
            safe_float(row.get('cholesterol_mg')),
            safe_float(row.get('calcium_mg')),
            safe_float(row.get('phosphorus_mg')),
            safe_float(row.get('magnesium_mg')),
            safe_float(row.get('sodium_mg')),
            safe_float(row.get('potassium_mg')),
            safe_float(row.get('iron_mg')),
            safe_float(row.get('zinc_mg')),
            safe_float(row.get('copper_mg')),
            safe_float(row.get('selenium_ug')),
            safe_float(row.get('vita_ug')),
            safe_float(row.get('vitc_mg')),
            safe_float(row.get('vitd2_ug')),
            safe_float(row.get('vitd3_ug')),
            safe_float(row.get('vite_mg')),
            safe_float(row.get('vitk1_ug')),
            safe_float(row.get('vitk2_ug')),
            safe_float(row.get('vitb1_mg')),
            safe_float(row.get('vitb2_mg')),
            safe_float(row.get('vitb3_mg')),
            safe_float(row.get('vitb5_mg')),
            safe_float(row.get('vitb6_mg')),
            safe_float(row.get('vitb7_ug')),
            safe_float(row.get('vitb9_ug')),
            safe_float(row.get('folate_ug')),
            safe_float(row.get('carotenoids_ug')),
            safe_float(row.get('unit_serving_energy_kcal')),
            safe_float(row.get('unit_serving_carb_g')),
            safe_float(row.get('unit_serving_protein_g')),
            safe_float(row.get('unit_serving_fat_g')),
            safe_float(row.get('unit_serving_fibre_g')),
            json.dumps(raw, default=str),
        ))

    print(f"📦  Inserting {len(records)} records ({skipped} skipped)...")

    insert_query = """
        INSERT INTO food_items (
            food_code, food_name, category, serving_size,
            energy_kj, energy_kcal, carbs_g, protein_g, fat_g, free_sugar_g, fiber_g,
            sfa_mg, mufa_mg, pufa_mg, cholesterol_mg,
            calcium_mg, phosphorus_mg, magnesium_mg, sodium_mg, potassium_mg,
            iron_mg, zinc_mg, copper_mg, selenium_ug,
            vita_ug, vitc_mg, vitd2_ug, vitd3_ug, vite_mg, vitk1_ug, vitk2_ug,
            vitb1_mg, vitb2_mg, vitb3_mg, vitb5_mg, vitb6_mg, vitb7_ug, vitb9_ug,
            folate_ug, carotenoids_ug,
            unit_serving_energy_kcal, unit_serving_carb_g, unit_serving_protein_g,
            unit_serving_fat_g, unit_serving_fiber_g,
            raw_data
        ) VALUES %s
        ON CONFLICT (food_code) DO UPDATE SET
            food_name  = EXCLUDED.food_name,
            raw_data   = EXCLUDED.raw_data
    """

    execute_values(cursor, insert_query, records, page_size=200)
    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n🎉  Done! {len(records)} Anuvaad INDB food items successfully imported into '{DB_NAME}'.\n")
    print("  Next steps:")
    print("  1. Build the Docker image:  cd food-api && docker build -t halo-food-api:latest .")
    print("  2. Deploy to cluster:       kubectl apply -f halo_k8s/09-food-api.yaml")
    print("  3. Test search:             curl 'http://localhost:30080/api/food/search?q=roti'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Anuvaad INDB 2024 food dataset into PostgreSQL.")
    parser.add_argument("--file", required=True, help="Path to Anuvaad_INDB_2024.11 (1).xlsx")
    parser.add_argument("--clear", action="store_true", help="Truncate existing data before inserting")
    args = parser.parse_args()

    seed_database(args.file, clear_existing=args.clear)

    food_name        -> food_name        (required)
    food_name_hindi  -> food_name_hindi
    category         -> category
    serving_size     -> serving_size
    energy_kcal      -> energy_kcal      (also: calories, energy)
    protein_g        -> protein_g        (also: protein)
    carbs_g          -> carbs_g          (also: carbohydrate, carbs)
    fat_g            -> fat_g            (also: fat, total_fat)
    fiber_g          -> fiber_g          (also: fiber, dietary_fiber)
"""

import os
import sys
import json
import argparse
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ─── Database Config (from environment variables or defaults) ────────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5433"))       # 5433 when using port-forward
DB_NAME = os.getenv("DB_NAME", "anuvaad_food")
DB_USER = os.getenv("DB_USER", "food_admin")
DB_PASS = os.getenv("DB_PASSWORD", "food_secure_password")

# ─── Column name aliases (handles different CSV naming conventions) ──────────
COLUMN_ALIASES = {
    "food_name":       ["food_name", "name", "food", "item_name", "item"],
    "food_name_hindi": ["food_name_hindi", "hindi_name", "hindi", "name_hindi"],
    "category":        ["category", "food_category", "group", "food_group"],
    "serving_size":    ["serving_size", "serving", "portion", "unit"],
    "energy_kcal":     ["energy_kcal", "energy", "calories", "kcal", "energy_value"],
    "protein_g":       ["protein_g", "protein", "protein_g_per_100g"],
    "carbs_g":         ["carbs_g", "carbs", "carbohydrate", "carbohydrates", "cho"],
    "fat_g":           ["fat_g", "fat", "total_fat", "fats"],
    "fiber_g":         ["fiber_g", "fiber", "dietary_fiber", "fibre"],
}


def resolve_column(df_columns, aliases):
    """Returns the first matching column name from the dataframe, case-insensitive."""
    lower_cols = {c.lower().strip(): c for c in df_columns}
    for alias in aliases:
        if alias.lower() in lower_cols:
            return lower_cols[alias.lower()]
    return None


def get_val(row, col_name, default=None, as_float=False):
    if col_name is None:
        return default
    val = row.get(col_name)
    if pd.isna(val) if val is not None else True:
        return default
    if as_float:
        try:
            return float(val)
        except (ValueError, TypeError):
            return default
    return str(val).strip() if val is not None else default


def seed_database(csv_path: str, clear_existing: bool = False):
    print(f"\n📂  Reading CSV: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✅  Loaded {len(df)} rows, {len(df.columns)} columns")
    print(f"    Columns detected: {list(df.columns)}\n")

    # Resolve column mappings
    col_map = {field: resolve_column(df.columns, aliases) for field, aliases in COLUMN_ALIASES.items()}

    print("🔗  Column mapping resolved:")
    for field, mapped in col_map.items():
        status = f"→ '{mapped}'" if mapped else "→ ⚠️  NOT FOUND (will use default/null)"
        print(f"    {field:20s} {status}")

    if col_map["food_name"] is None:
        print("\n❌  ERROR: Could not find a 'food_name' column. Please check your CSV headers.")
        sys.exit(1)

    # Connect to DB
    print(f"\n🔌  Connecting to PostgreSQL at {DB_HOST}:{DB_PORT} / {DB_NAME}...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
    )
    cursor = conn.cursor()
    print("✅  Connected.\n")

    if clear_existing:
        print("🗑️   Clearing existing food_items table...")
        cursor.execute("TRUNCATE TABLE food_items RESTART IDENTITY;")
        conn.commit()

    # Build records
    records = []
    skipped = 0
    for _, row in df.iterrows():
        food_name = get_val(row, col_map["food_name"])
        if not food_name:
            skipped += 1
            continue
        records.append((
            food_name,
            get_val(row, col_map["food_name_hindi"]),
            get_val(row, col_map["category"], default="General"),
            get_val(row, col_map["serving_size"], default="100g"),
            get_val(row, col_map["energy_kcal"], default=0.0, as_float=True),
            get_val(row, col_map["protein_g"], default=0.0, as_float=True),
            get_val(row, col_map["carbs_g"], default=0.0, as_float=True),
            get_val(row, col_map["fat_g"], default=0.0, as_float=True),
            get_val(row, col_map["fiber_g"], default=0.0, as_float=True),
            json.dumps(row.to_dict(), default=str)  # Store all raw columns as JSONB
        ))

    print(f"📦  Preparing to insert {len(records)} records (skipped {skipped} empty rows)...")

    insert_query = """
        INSERT INTO food_items (
            food_name, food_name_hindi, category, serving_size,
            energy_kcal, protein_g, carbs_g, fat_g, fiber_g, raw_data
        ) VALUES %s
        ON CONFLICT DO NOTHING
    """

    execute_values(cursor, insert_query, records, page_size=1000)
    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n🎉  Done! {len(records)} food items successfully imported into '{DB_NAME}'.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Anuvaad food dataset from a CSV file.")
    parser.add_argument("--csv", required=True, help="Path to the Anuvaad NRET CSV file")
    parser.add_argument("--clear", action="store_true", help="Truncate existing data before inserting")
    args = parser.parse_args()

    seed_database(args.csv, clear_existing=args.clear)

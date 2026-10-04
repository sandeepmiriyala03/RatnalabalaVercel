import os
from pathlib import Path

import psycopg
from pgvector.psycopg import register_vector
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv


# ============================================================
# LOAD .env.local
# ============================================================

# embed_gnanamala.py is inside /api
# .env.local is in the project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent

ENV_FILE = PROJECT_ROOT / ".env.local"

load_dotenv(ENV_FILE)


# ============================================================
# CONFIGURATION
# ============================================================

DATABASE_URL = os.getenv("NEON_DATABASE_URL", "").strip()

MODEL_NAME = "BAAI/bge-m3"

BATCH_SIZE = 32


# ============================================================
# VALIDATE CONFIGURATION
# ============================================================

if not DATABASE_URL:
    raise RuntimeError(
        f"NEON_DATABASE_URL was not found in:\n{ENV_FILE}"
    )


# ============================================================
# START
# ============================================================

print()
print("=" * 55)
print("Ratnalabala Gnanamala Embedding Generator")
print("=" * 55)
print()

print(f"Environment file: {ENV_FILE}")
print(f"Embedding model: {MODEL_NAME}")
print()


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("Loading embedding model...")

model = SentenceTransformer(MODEL_NAME)

print("Embedding model loaded successfully.")
print()


# ============================================================
# BUILD EMBEDDING TEXT
# ============================================================

def build_embedding_text(row):

    parts = [
        row["mala"],
        row["title"],
        row["content"],
        row["source"],
        row["details"],
    ]

    return "\n".join(
        str(value).strip()
        for value in parts
        if value
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("Connecting to Neon PostgreSQL...")

    with psycopg.connect(
        DATABASE_URL,
        row_factory=psycopg.rows.dict_row
    ) as conn:

        register_vector(conn)

        print("Connected to Neon successfully.")
        print()

        with conn.cursor() as cursor:

            # ------------------------------------------------
            # Get records that don't have embeddings
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    mala,
                    title,
                    content,
                    source,
                    details
                FROM gnanamala
                WHERE embedding IS NULL
                ORDER BY id;
                """
            )

            rows = cursor.fetchall()

            total = len(rows)

            print(
                f"Records requiring embeddings: {total}"
            )
            print()

            if total == 0:

                print(
                    "All records already have embeddings."
                )

                return

            # ------------------------------------------------
            # Generate embeddings in batches
            # ------------------------------------------------

            for start in range(
                0,
                total,
                BATCH_SIZE
            ):

                batch = rows[
                    start:start + BATCH_SIZE
                ]

                texts = [
                    build_embedding_text(row)
                    for row in batch
                ]

                end = min(
                    start + BATCH_SIZE,
                    total
                )

                print(
                    f"Generating embeddings "
                    f"{start + 1}-{end} of {total}..."
                )

                embeddings = model.encode(
                    texts,
                    batch_size=BATCH_SIZE,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )

                # ------------------------------------------------
                # Save embeddings directly to Neon
                # ------------------------------------------------

                for row, embedding in zip(
                    batch,
                    embeddings
                ):

                    cursor.execute(
                        """
                        UPDATE gnanamala
                        SET
                            embedding = %s,
                            embedding_model = %s,
                            updated_at = NOW()
                        WHERE id = %s;
                        """,
                        (
                            embedding.tolist(),
                            MODEL_NAME,
                            row["id"],
                        )
                    )

                # Commit each batch
                conn.commit()

                print(
                    f"Saved {end}/{total}"
                )

                print()

    print("=" * 55)
    print("Embedding generation completed successfully.")
    print("=" * 55)
    print()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
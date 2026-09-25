import os
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer


# ==========================================
# 1. Define file paths
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "anime_data.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "ml",
    "model"
)


# Create model folder if it doesn't exist
os.makedirs(MODEL_DIR, exist_ok=True)


# ==========================================
# 2. Load Anime Dataset
# ==========================================

print("Loading anime dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded successfully!")
print(f"Total anime: {len(df)}")


# ==========================================
# 3. Check required columns
# ==========================================

required_columns = [
    "id",
    "title",
    "genres",
    "overview",
    "image"
]

for column in required_columns:
    if column not in df.columns:
        raise ValueError(
            f"Missing required column: {column}"
        )

print("Required columns found:")
print(df.columns.tolist())


# ==========================================
# 4. Data Cleaning
# ==========================================

print("\nCleaning anime dataset...")

# Handle missing values
df["genres"] = df["genres"].fillna("")
df["overview"] = df["overview"].fillna("")
df["title"] = df["title"].fillna("")
df["image"] = df["image"].fillna("")

# Remove duplicate anime IDs
before_duplicates = len(df)

df = df.drop_duplicates(
    subset=["id"],
    keep="first"
)

after_duplicates = len(df)

print(
    f"Duplicate records removed: "
    f"{before_duplicates - after_duplicates}"
)

# Clean extra spaces from text columns
df["title"] = df["title"].astype(str).str.strip()
df["genres"] = df["genres"].astype(str).str.strip()
df["overview"] = df["overview"].astype(str).str.strip()

print(f"Records after cleaning: {len(df)}")


# ==========================================
# 5. Feature Engineering
# ==========================================

print("\nCreating anime features...")

# Normalize text to lowercase
df["genres"] = df["genres"].str.lower()
df["overview"] = df["overview"].str.lower()

# Create a combined feature from genres and overview
df["combined_features"] = (
    df["genres"] + " " + df["overview"]
)

# Remove unnecessary extra spaces
df["combined_features"] = (
    df["combined_features"]
    .str.replace(r"\s+", " ", regex=True)
    .str.strip()
)

print("Feature engineering completed!")
print("Features used:")
print("✓ Genres")
print("✓ Overview")
print("✓ Combined anime features")


# ==========================================
# 6. TF-IDF Vectorization
# ==========================================

print("Training TF-IDF model...")

tfidf = TfidfVectorizer(
    stop_words="english",
    max_features=10000
)

tfidf_matrix = tfidf.fit_transform(
    df["combined_features"]
)


# ==========================================
# 7. Save TF-IDF Vectorizer
# ==========================================

vectorizer_path = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer.pkl"
)

joblib.dump(
    tfidf,
    vectorizer_path
)


# ==========================================
# 8. Save Anime Feature Vectors
# ==========================================

vectors_path = os.path.join(
    MODEL_DIR,
    "anime_vectors.pkl"
)

joblib.dump(
    tfidf_matrix,
    vectors_path
)


# ==========================================
# 9. Save Anime Dataset
# ==========================================

anime_data_path = os.path.join(
    MODEL_DIR,
    "anime_data.pkl"
)

# Save only useful columns
anime_data = df[
    [
        "id",
        "title",
        "genres",
        "overview",
        "image"
    ]
]

joblib.dump(
    anime_data,
    anime_data_path
)


# ==========================================
# 10. Training completed
# ==========================================

print("\n========================================")
print("      ML MODEL TRAINING COMPLETE")
print("========================================")

print(f"Anime records: {len(df)}")
print(f"Feature vectors: {tfidf_matrix.shape}")

print("\nModel files created:")

print("✓ tfidf_vectorizer.pkl")
print("✓ anime_vectors.pkl")
print("✓ anime_data.pkl")

print("\nModel location:")
print(MODEL_DIR)

print("\nYour Anime Recommendation ML model is ready!")
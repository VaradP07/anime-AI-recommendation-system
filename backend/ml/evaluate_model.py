import os
import sys
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "..",
    "data",
    "anime_data.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

VECTORIZER_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer.pkl"
)

VECTORS_PATH = os.path.join(
    MODEL_DIR,
    "anime_vectors.pkl"
)


# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

print("\n========================================")
print("     ANIME HUB AI - ML EVALUATION")
print("========================================\n")

print("Loading dataset...")

anime_data = pd.read_csv(DATA_PATH)

print(f"Dataset size: {len(anime_data)} anime")


# ---------------------------------------------------------
# LOAD TRAINED MODEL
# ---------------------------------------------------------

print("\nLoading trained TF-IDF model...")

tfidf_vectorizer = joblib.load(VECTORIZER_PATH)
anime_vectors = joblib.load(VECTORS_PATH)

print("TF-IDF model loaded successfully.")

print(f"Number of TF-IDF features: {anime_vectors.shape[1]}")


# ---------------------------------------------------------
# PREPARE DATA
# ---------------------------------------------------------

anime_data["genres"] = anime_data["genres"].fillna("").astype(str)
anime_data["overview"] = anime_data["overview"].fillna("").astype(str)

anime_data["combined_text"] = (
    anime_data["genres"]
    + " "
    + anime_data["genres"]
    + " "
    + anime_data["overview"]
)


# ---------------------------------------------------------
# EVALUATION FUNCTION
# ---------------------------------------------------------

def evaluate_anime(anime_index, k=10):

    query_vector = anime_vectors[anime_index]

    similarity_scores = cosine_similarity(
        query_vector,
        anime_vectors
    ).flatten()

    # Remove the anime itself
    similarity_scores[anime_index] = -1

    top_indices = similarity_scores.argsort()[::-1][:k]

    source_genres = set(
        genre.strip().lower()
        for genre in anime_data.iloc[anime_index]["genres"].split(",")
        if genre.strip()
    )

    relevant_count = 0

    for index in top_indices:

        recommended_genres = set(
            genre.strip().lower()
            for genre in anime_data.iloc[index]["genres"].split(",")
            if genre.strip()
        )

        # Genre overlap
        if source_genres.intersection(recommended_genres):
            relevant_count += 1

    precision = relevant_count / k

    return precision, top_indices


# ---------------------------------------------------------
# RUN EVALUATION
# ---------------------------------------------------------

print("\nEvaluating recommendation quality...")

K_VALUES = [5, 10]

precision_results = {
    5: [],
    10: []
}

# Evaluate every anime
for index in range(len(anime_data)):

    for k in K_VALUES:

        precision, _ = evaluate_anime(
            index,
            k
        )

        precision_results[k].append(
            precision
        )


# ---------------------------------------------------------
# CALCULATE PRECISION
# ---------------------------------------------------------

precision_at_5 = np.mean(
    precision_results[5]
)

precision_at_10 = np.mean(
    precision_results[10]
)


# ---------------------------------------------------------
# COVERAGE
# ---------------------------------------------------------

print("\nCalculating recommendation coverage...")

recommended_anime_indices = set()

for index in range(len(anime_data)):

    _, top_indices = evaluate_anime(
        index,
        10
    )

    for recommendation_index in top_indices:

        recommended_anime_indices.add(
            int(recommendation_index)
        )


coverage = (
    len(recommended_anime_indices)
    / len(anime_data)
) * 100


# ---------------------------------------------------------
# AVERAGE SIMILARITY
# ---------------------------------------------------------

print("Calculating average similarity...")

similarity_values = []

for index in range(len(anime_data)):

    similarity_scores = cosine_similarity(
        anime_vectors[index],
        anime_vectors
    ).flatten()

    similarity_scores[index] = -1

    top_indices = similarity_scores.argsort()[::-1][:10]

    top_scores = similarity_scores[top_indices]

    similarity_values.extend(
        top_scores
    )


average_similarity = np.mean(
    similarity_values
)


# ---------------------------------------------------------
# DISPLAY RESULTS
# ---------------------------------------------------------

print("\n========================================")
print("          EVALUATION RESULTS")
print("========================================")

print(
    f"\nDataset Size          : {len(anime_data)} anime"
)

print(
    f"TF-IDF Features      : {anime_vectors.shape[1]}"
)

print(
    f"Recommendation Type   : Content-Based Filtering"
)

print(
    f"Similarity Method     : Cosine Similarity"
)

print(
    f"Recommendations       : Top 10"
)

print(
    f"\nPrecision@5           : {precision_at_5 * 100:.2f}%"
)

print(
    f"Precision@10          : {precision_at_10 * 100:.2f}%"
)

print(
    f"Recommendation Coverage: {coverage:.2f}%"
)

print(
    f"Average Top-10 Similarity: "
    f"{average_similarity * 100:.2f}%"
)

print("\n========================================")
print("       EVALUATION COMPLETE")
print("========================================\n")
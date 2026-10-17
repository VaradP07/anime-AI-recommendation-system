
import os
import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


# ==========================================
# 1. Model paths
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.path.join(BASE_DIR, "ml", "model")


# ==========================================
# 2. Load trained ML files
# ==========================================

print("Loading trained ML model...")

tfidf_vectorizer = joblib.load(
    os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
)

anime_vectors = joblib.load(
    os.path.join(MODEL_DIR, "anime_vectors.pkl")
)

anime_data = joblib.load(
    os.path.join(MODEL_DIR, "anime_data.pkl")
)

# Normalize titles for reliable matching.
anime_data["title"] = anime_data["title"].fillna("").astype(str)

print("ML model loaded successfully!")
print(f"Total anime: {len(anime_data)}")


# ==========================================
# 3. Helper functions
# ==========================================

def _clean_text(value):
    """Convert optional input into safe, trimmed text."""
    if value is None:
        return ""
    return str(value).strip()


def _build_recommendation(anime_index, similarity_score):
    """Return one recommendation using the existing API structure."""
    anime = anime_data.iloc[anime_index]

    return {
        "id": int(anime["id"]),
        "title": str(anime["title"]),
        "genres": str(anime.get("genres", "") or ""),
        "image": str(anime.get("image", "") or ""),
        "similarity": round(float(similarity_score), 4),
    }


def _get_similar_indices(query_vector, number_of_recommendations,
                         excluded_indices=None):
    """Rank dataset anime by cosine similarity to the query."""
    if number_of_recommendations <= 0:
        return []

    excluded_indices = set(excluded_indices or [])

    similarity_scores = cosine_similarity(
        query_vector,
        anime_vectors
    ).flatten()

    ranked_indices = similarity_scores.argsort()[::-1]
    recommendations = []

    MIN_SIMILARITY = 0.30

    for index in ranked_indices:
        if index in excluded_indices:
            continue

        score = float(similarity_scores[index])

        if score < MIN_SIMILARITY:
            break

        recommendations.append(
            _build_recommendation(index, score)
        )

        if len(recommendations) >= number_of_recommendations:
            break

    return recommendations


# ==========================================
# 4. Recommendations by existing anime title
# ==========================================

def get_recommendations(anime_title, number_of_recommendations=10):
    """Recommend anime similar to a title in the trained dataset."""
    anime_title = _clean_text(anime_title)

    if not anime_title:
        return []

    matches = anime_data[
        anime_data["title"].str.casefold() == anime_title.casefold()
    ]

    if matches.empty:
        return []

    anime_index = int(matches.index[0])

    query_vector = anime_vectors[anime_index]

    return _get_similar_indices(
        query_vector,
        number_of_recommendations,
        excluded_indices={anime_index},
    )


# ==========================================
# 5. Recommendations from external anime text
# ==========================================

def get_recommendations_from_text(
    anime_title=None,
    genres="",
    overview="",
    number_of_recommendations=10,
):
    """
    Recommend dataset anime using external anime metadata.

    The title is optional. Genres and overview are used to create
    the TF-IDF query. If the title matches a dataset entry, that
    entry is excluded from the results.
    """
    anime_title = _clean_text(anime_title)
    genres = _clean_text(genres)
    overview = _clean_text(overview)

    # Build query text from meaningful metadata.
    text_parts = []

    if genres:
        text_parts.append(genres)

    if overview:
        text_parts.append(overview)

    combined_text = " ".join(text_parts).strip()

    if not combined_text or number_of_recommendations <= 0:
        return []

    # Transform text using the same fitted vectorizer as training.
    query_vector = tfidf_vectorizer.transform([combined_text])

    # Exclude the source anime when its title exists in our dataset.
    excluded_indices = set()

    if anime_title:
        matches = anime_data[
            anime_data["title"].str.casefold() == anime_title.casefold()
        ]

        if not matches.empty:
            excluded_indices.add(int(matches.index[0]))

    # Empty vectors have no useful similarity signal.
    if query_vector.nnz == 0:
        return []

    return _get_similar_indices(
        query_vector,
        number_of_recommendations,
        excluded_indices=excluded_indices,
    )


# ==========================================
# 6. Test the model
# ==========================================

if __name__ == "__main__":
    print("\n========================================")
    print("TEST 1: Recommendations by anime title")
    print("========================================")

    results = get_recommendations("Death Note", 10)

    if not results:
        print("No recommendations found for Death Note.")
    else:
        for i, anime in enumerate(results, start=1):
            print(
                f"{i}. {anime['title']} "
                f"(Similarity: {anime['similarity']})"
            )

    print("\n========================================")
    print("TEST 2: Recommendations from text")
    print("========================================")

    text_results = get_recommendations_from_text(
        anime_title="Example Mystery Anime",
        genres="Mystery, Psychological, Thriller",
        overview=(
            "A student discovers a mysterious notebook "
            "that can cause the death of anyone whose name is written in it."
        ),
        number_of_recommendations=5,
    )

    if not text_results:
        print("No text-based recommendations found.")
    else:
        for i, anime in enumerate(text_results, start=1):
            print(
                f"{i}. {anime['title']} "
                f"(Similarity: {anime['similarity']})"
            )

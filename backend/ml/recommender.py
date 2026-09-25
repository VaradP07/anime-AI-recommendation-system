import os
import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


# ==========================================
# 1. Model paths
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.path.join(
    BASE_DIR,
    "ml",
    "model"
)


# ==========================================
# 2. Load trained ML files
# ==========================================

print("Loading trained ML model...")

tfidf_vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "tfidf_vectorizer.pkl"
    )
)

anime_vectors = joblib.load(
    os.path.join(
        MODEL_DIR,
        "anime_vectors.pkl"
    )
)

anime_data = joblib.load(
    os.path.join(
        MODEL_DIR,
        "anime_data.pkl"
    )
)

print("ML model loaded successfully!")
print(f"Total anime: {len(anime_data)}")


# ==========================================
# 3. Recommendation Function
# ==========================================

def get_recommendations(anime_title, number_of_recommendations=10):

    # Find anime
    matches = anime_data[
        anime_data["title"].str.lower()
        == anime_title.lower()
    ]

    if matches.empty:
        return []

    # Get index of selected anime
    anime_index = matches.index[0]

    # Get vector of selected anime
    anime_vector = anime_vectors[anime_index]

    # Calculate cosine similarity
    similarity_scores = cosine_similarity(
        anime_vector,
        anime_vectors
    ).flatten()

    # Sort by similarity
    similar_indices = similarity_scores.argsort()[::-1]

    recommendations = []

    for index in similar_indices:

        # Skip the selected anime itself
        if index == anime_index:
            continue

        recommendations.append({
            "id": int(anime_data.iloc[index]["id"]),
            "title": anime_data.iloc[index]["title"],
            "genres": anime_data.iloc[index]["genres"],
            "image": anime_data.iloc[index]["image"],
            "similarity": round(
                float(similarity_scores[index]),
                4
            )
        })

        if len(recommendations) >= number_of_recommendations:
            break

    return recommendations


# ==========================================
# 4. Test the model
# ==========================================

if __name__ == "__main__":

    anime_name = "Death Note"

    print("\n========================================")
    print(f"Recommendations for: {anime_name}")
    print("========================================")

    results = get_recommendations(
        anime_name,
        10
    )

    if not results:

        print("Anime not found in dataset.")

    else:

        for i, anime in enumerate(results, start=1):

            print(
                f"{i}. {anime['title']} "
                f"(Similarity: {anime['similarity']})"
            )
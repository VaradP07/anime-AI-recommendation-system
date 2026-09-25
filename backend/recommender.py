import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Step 1: Read anime data
df = pd.read_csv("data/anime_data.csv")


# Step 2: Handle missing values
df["genres"] = df["genres"].fillna("")
df["overview"] = df["overview"].fillna("")


# Step 3: Combine information for AI recommendation
df["features"] = (
    df["genres"] + " " +
    df["overview"]
)


# Step 4: Convert anime information into numbers
vectorizer = TfidfVectorizer(
    stop_words="english"
)

tfidf_matrix = vectorizer.fit_transform(
    df["features"]
)


# Step 5: Calculate similarity
similarity_matrix = cosine_similarity(
    tfidf_matrix
)


def recommend_anime(title, number_of_recommendations=5):

    # Find anime ignoring uppercase/lowercase
    matches = df[
        df["title"].str.lower() == title.lower()
    ]

    # If anime is not found
    if matches.empty:
        return {
            "error": f"Anime '{title}' not found"
        }

    # Get selected anime index
    anime_index = matches.index[0]


    # Get similarity scores
    similarity_scores = list(
        enumerate(
            similarity_matrix[anime_index]
        )
    )


    # Sort recommendations
    similarity_scores = sorted(
        similarity_scores,
        key=lambda x: x[1],
        reverse=True
    )


    # Remove selected anime
    similarity_scores = similarity_scores[
        1:number_of_recommendations + 1
    ]


    recommendations = []


    # Create recommendation results
    for index, score in similarity_scores:

        anime = df.iloc[index]

        recommendations.append({
            "id": int(anime["id"]),
            "title": anime["title"],
            "genres": anime["genres"],
            "overview": anime["overview"],
            "image": anime["image"],
            "similarity_score": round(
                float(score),
                3
            )
        })


    return recommendations
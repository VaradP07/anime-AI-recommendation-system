from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml.recommender import get_recommendations


app = FastAPI()


# ==========================================
# CORS - Allow React frontend
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Home API
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Anime Recommendation API is running"
    }


# ==========================================
# Common English Title → Dataset Title
# ==========================================

TITLE_ALIASES = {
    "attack on titan": "Shingeki no Kyojin",
    "aot": "Shingeki no Kyojin",

    "my hero academia": "Boku no Hero Academia",
    "mha": "Boku no Hero Academia",

    "demon slayer": "Kimetsu no Yaiba",
    "demon slayer kimetsu no yaiba": "Kimetsu no Yaiba",

    "your name": "Kimi no Na wa.",
    "weathering with you": "Tenki no Ko",

    "jujutsu kaisen": "Jujutsu Kaisen",

    "death note": "Death Note",

    "naruto": "Naruto",

    "one piece": "One Piece",
}


# ==========================================
# ML Recommendation API
# ==========================================

@app.get("/recommend/{title}")
def recommend(title: str):

    # Remove extra spaces
    clean_title = title.strip()

    # Convert to lowercase for matching
    lookup_title = clean_title.lower()

    # Check whether user entered a common English title
    dataset_title = TITLE_ALIASES.get(
        lookup_title,
        clean_title
    )

    print("User searched:", clean_title)
    print("Dataset title used:", dataset_title)

    # Get recommendations from ML model
    recommendations = get_recommendations(
        dataset_title,
        10
    )

    return {
        "input_anime": clean_title,
        "matched_dataset_title": dataset_title,
        "recommendations": recommendations
    }

import os
import re

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from groq import Groq

from ml.recommender import (
    get_recommendations,
    get_recommendations_from_text,
)


# --------------------------------------------------
# 1. ENVIRONMENT CONFIGURATION
# --------------------------------------------------

load_dotenv()

print("ENV file loaded:", os.path.isfile(".env"))
print(
    "TMDB token loaded:",
    bool(os.getenv("TMDB_API_READ_ACCESS_TOKEN")),
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

TMDB_API_READ_ACCESS_TOKEN = os.getenv(
    "TMDB_API_READ_ACCESS_TOKEN"
)
TMDB_BASE_URL = "https://api.themoviedb.org/3"

groq_client = (
    Groq(api_key=GROQ_API_KEY)
    if GROQ_API_KEY
    else None
)


# --------------------------------------------------
# 2. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="Anime Hub AI API",
    description="Anime recommendations, AI chat, and TMDB proxy.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# 3. REQUEST MODELS
# --------------------------------------------------

class AnimeTextRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=3,
        max_length=2000,
    )


class ChatMessage(BaseModel):
    role: str
    content: str = Field(
        ...,
        min_length=1,
        max_length=4000,
    )


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=8,
    )


# --------------------------------------------------
# 4. HOME / HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Anime Hub AI API is running!",
        "status": "success",
        "docs": "/docs",
    }


# --------------------------------------------------
# 5. TMDB PROXY
# --------------------------------------------------

TMDB_ALLOWED_PATHS = re.compile(
    r"^(discover/(movie|tv)|"
    r"search/(movie|tv|multi)|"
    r"trending/(movie|tv|all)/(day|week)|"
    r"(movie|tv)/\d+|"
    r"genre/(movie|tv)/list)$"
)


@app.get("/tmdb/{tmdb_path:path}")
async def tmdb_proxy(
    tmdb_path: str,
    request: Request,
):
    """
    Forwards approved TMDB API requests through this backend.
    The TMDB access token stays on the server.
    """

    if not TMDB_API_READ_ACCESS_TOKEN:
        raise HTTPException(
            status_code=500,
            detail=(
                "TMDB access token is not configured. "
                "Check the backend .env file."
            ),
        )

    if not TMDB_ALLOWED_PATHS.fullmatch(tmdb_path):
        raise HTTPException(
            status_code=404,
            detail="This TMDB endpoint is not allowed.",
        )

    params = {
        key: value
        for key, value in request.query_params.multi_items()
        if key.lower() != "api_key"
    }

    headers = {
        "Authorization": (
            f"Bearer {TMDB_API_READ_ACCESS_TOKEN}"
        ),
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=15.0
        ) as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/{tmdb_path}",
                params=params,
                headers=headers,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=(
                    "TMDB rejected the request. "
                    "Check the endpoint and access token."
                ),
            )

        return response.json()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="TMDB request timed out.",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="The backend could not connect to TMDB.",
        )


# --------------------------------------------------
# 6. ANIME TITLE ALIASES
# --------------------------------------------------

TITLE_ALIASES = {
    "naruto": "Naruto",
    "naruto shippuden": "Naruto: Shippuden",
    "attack on titan": "Attack on Titan",
    "demon slayer": "Demon Slayer: Kimetsu no Yaiba",
    "death note": "Death Note",
    "one piece": "One Piece",
    "jujutsu kaisen": "Jujutsu Kaisen",
    "my hero academia": "My Hero Academia",
    "fullmetal alchemist brotherhood":
        "Fullmetal Alchemist: Brotherhood",
}


# --------------------------------------------------
# 7. RECOMMEND ANIME BY TITLE
# --------------------------------------------------

@app.get("/recommend/{title}")
def recommend_anime(title: str):
    try:
        cleaned_title = title.strip()
        dataset_title = TITLE_ALIASES.get(
            cleaned_title.lower(),
            cleaned_title,
        )

        recommendations = get_recommendations(
            dataset_title,
            10,
        )

        return {
            "title": dataset_title,
            "recommendations": recommendations,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not generate recommendations. "
                f"Details: {str(exc)}"
            ),
        )


# --------------------------------------------------
# 8. RECOMMEND ANIME FROM A DESCRIPTION
# --------------------------------------------------

@app.post("/recommend-from-text")
def recommend_from_text(request: AnimeTextRequest):
    try:
        recommendations = get_recommendations_from_text(
            request.description
        )

        return {
            "description": request.description,
            "recommendations": recommendations,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not generate recommendations "
                f"from the description: {str(exc)}"
            ),
        )


# --------------------------------------------------
# 9. GROQ-POWERED ANIME CHATBOT
# --------------------------------------------------

@app.post("/chat")
def anime_chat(request: ChatRequest):
    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail=(
                "Groq API key is missing. "
                "Configure GROQ_API_KEY in backend/.env."
            ),
        )

    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Anime Hub AI, a friendly anime "
                    "assistant. Help users discover anime, "
                    "compare anime, understand storylines, "
                    "and find recommendations. Be accurate, "
                    "helpful, and easy to understand. "
                    "Do not invent facts when uncertain."
                ),
            }
        ]

        for item in request.history:
            if item.role not in ("user", "assistant"):
                continue

            messages.append(
                {
                    "role": item.role,
                    "content": item.content,
                }
            )

        messages.append(
            {
                "role": "user",
                "content": request.message,
            }
        )

        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )

        reply = (
            completion.choices[0].message.content or ""
        ).strip()

        return {
            "reply": reply,
            "recommendations": [],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI assistant could not generate "
                f"a response: {str(exc)}"
            ),
        )

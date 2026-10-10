import os

from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.recommender import (
    get_recommendations,
    get_recommendations_from_text,
)

# ==========================================
# Environment and Groq Configuration
# ==========================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ==========================================
# FastAPI Application
# ==========================================

app = FastAPI(title="Anime Hub AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Home API
# ==========================================

@app.get("/")
def home():
    return {"message": "Anime Recommendation API is running"}


# ==========================================
# Common English Title -> Dataset Title
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
    clean_title = title.strip()
    lookup_title = clean_title.lower()
    dataset_title = TITLE_ALIASES.get(lookup_title, clean_title)

    print("User searched:", clean_title)
    print("Dataset title used:", dataset_title)

    recommendations = get_recommendations(dataset_title, 10)

    return {
        "input_anime": clean_title,
        "matched_dataset_title": dataset_title,
        "recommendations": recommendations,
    }


# ==========================================
# External Anime Content Request
# ==========================================

class AnimeTextRequest(BaseModel):
    title: str
    genres: str = ""
    overview: str = ""


@app.post("/recommend-from-text")
def recommend_from_text(request: AnimeTextRequest):
    print("External anime:", request.title)

    recommendations = get_recommendations_from_text(
        anime_title=request.title,
        genres=request.genres,
        overview=request.overview,
        number_of_recommendations=10,
    )

    return {
        "input_anime": request.title,
        "recommendations": recommendations,
    }


# ==========================================
# Chatbot Request Model
# ==========================================

class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = Field(default_factory=list)


# ==========================================
# Groq-Only AI Chatbot API
# ==========================================

@app.post("/chat")
def chat(request: ChatRequest):
    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail="Groq API key is missing. Check backend/.env.",
        )

    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message must be 2000 characters or fewer.",
        )

    system_prompt = """
You are Anime Hub AI, a friendly and intelligent anime assistant.

PERSONALITY:
- Be friendly, helpful, and enthusiastic about anime.
- Use simple, natural English.
- Use emojis occasionally, but do not overuse them.

RESPONSE STYLE:
- Keep answers concise and easy to read on mobile screens.
- Use short paragraphs and clear headings when useful.
- Prefer numbered lists or bullet points over Markdown tables.
- Avoid unnecessarily long introductions and repeated information.
- Use bold text to highlight important anime titles and details.
- Format answers cleanly for a small chat window.

ANIME RECOMMENDATIONS:
- Recommend anime relevant to the user's request.
- For each recommendation, include the title, genre, a short reason,
  and episode count when known.
- For beginner recommendations, prioritize accessible stories
  and explain why each anime is suitable.
- Distinguish movies from TV series.
- Do not invent episode counts, ratings, or factual details.
- If uncertain, say so instead of guessing.
- Usually suggest 3–5 anime unless the user asks for more.
- Ask about the user's preferred genre only when it would help.

PROJECT RULES:
- You are the conversational Groq-powered assistant.
- Do not claim to have queried the local ML recommendation model
  or Firebase unless the application actually did so.
- The dedicated recommendation section uses the separate
  TF-IDF and cosine similarity recommendation system.
- Do not pretend that generated suggestions are ML model results.

ACCURACY RULES:
- Use the correct, commonly recognized anime title.
- Never invent or guess anime titles, episode counts, genres,
  ratings, or runtime.
- Distinguish TV series from movies.
- If the user requests TV series only, do not include movies.
- If you are uncertain about a factual detail, omit it or
  clearly state that you are uncertain.
- Keep recommendations concise and easy to read.
- Before responding, check that the answer follows all
  user constraints and does not contradict itself.

Always answer the user's actual question first.
"""

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        }
    ]

    # Include recent conversation history.
    for item in request.history[-8:]:
        role = item.get("role")
        content = item.get("content", "")

        if (
            role in ("user", "assistant")
            and isinstance(content, str)
            and content.strip()
            and len(content) <= 2000
        ):
            messages.append({
                "role": role,
                "content": content,
            })

    # Append the current message after previous conversation history.
    messages.append({
        "role": "user",
        "content": message,
    })

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_completion_tokens=700,
        )

        answer = response.choices[0].message.content

        return {
            "reply": answer or "Sorry, I couldn't generate a response."
        }

    except Exception as error:
        print("Groq chatbot error:", error)

        raise HTTPException(
            status_code=502,
            detail=(
                "The Groq assistant could not respond. "
                "Check your API key, model availability, and usage limits."
            ),
        )


<a id="readme-top"></a>

<!-- PROJECT HEADER -->

<div align="center">

  <img src="public/logo.png" alt="Anime Hub Logo" width="90" height="90">

  <h1>Anime AI Recommendation System</h1>

  <p>
    An AI-powered anime recommendation system that helps users discover anime based on their interests and preferences.
  </p>

  <p>
    <a href="https://github.com/VaradP07/anime-AI-recommendation-system">
      View Repository
    </a>
    ·
    <a href="#getting-started">
      Getting Started
    </a>
    ·
    <a href="#features">
      Features
    </a>
  </p>

</div>

---

## 📌 About The Project

**Anime AI Recommendation System** is a web-based application designed to help users discover anime according to their interests.

The project combines a modern React frontend with a Python FastAPI backend and a content-based machine learning recommendation system.

The recommendation engine analyzes anime information such as titles, genres, descriptions, and other available features. It uses **TF-IDF (Term Frequency-Inverse Document Frequency)** to convert anime text information into numerical vectors and **Cosine Similarity** to calculate how similar different anime are.

The project also integrates external services such as the **TMDB API** for anime/movie information and **Firebase** for user-related functionality and data storage.

### 🎯 Main Objective

The main objective of this project is to provide users with personalized anime recommendations instead of requiring them to manually search through a large collection of anime.

---

## ✨ Features

### 🎬 Anime Discovery

- Browse anime through an attractive and interactive interface.
- View popular and trending anime.
- Explore anime details.
- View anime posters and related information.

### 🔎 Anime Search

- Search for anime using the search functionality.
- Fetch anime information through the TMDB API.
- Display relevant anime information dynamically.

### 🤖 AI-Based Recommendation

The project uses a **Content-Based Recommendation System**.

The recommendation process uses:

1. Data Cleaning
2. Text Feature Processing
3. TF-IDF Vectorization
4. Cosine Similarity
5. Similarity-based Anime Recommendation

When a user selects an anime, the system compares its features with other anime and recommends similar titles.

### ❤️ Save Anime

Users can save anime they are interested in.

Firebase is used to store user-related information and saved anime data.

### 👤 User Features

- User profile
- Saved anime
- User preferences
- Firebase integration

### 🎨 Modern UI

The frontend provides:

- Responsive design
- Interactive components
- Anime cards
- Search interface
- Hero section
- Animations
- Modern navigation
- Tailwind CSS styling
- GSAP animations

---

## 🧠 Recommendation System

The recommendation system follows a **Content-Based Filtering** approach.

### Step 1 — Anime Dataset

The system uses an anime dataset containing information about anime titles and their characteristics.

Example features may include:

- Anime title
- Genre
- Description
- Type
- Rating
- Other available metadata

### Step 2 — Data Processing

The anime data is cleaned and prepared before being used by the recommendation algorithm.

### Step 3 — TF-IDF

TF-IDF converts textual anime information into numerical vectors.

TF-IDF helps determine how important a word is within an anime description or feature set.

### Step 4 — Cosine Similarity

Cosine Similarity compares the TF-IDF vectors of anime.

The similarity score is used to identify anime that have similar characteristics.

### Step 5 — Recommendation

When a user selects an anime, the system finds anime with high similarity scores and returns them as recommendations.

### Recommendation Flow

```text
Anime Dataset
      ↓
Data Cleaning
      ↓
Feature Preparation
      ↓
TF-IDF Vectorization
      ↓
Anime Feature Vectors
      ↓
Cosine Similarity
      ↓
Similarity Scores
      ↓
Top Similar Anime
      ↓
Recommendations
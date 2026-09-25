import React, { useEffect, useState } from "react";
import { getDemographicRecommendations } from "../recommendationModel";
import {
  getUserPrefs,
  updateMovieClickCount,
  getTrendingMovies,
} from "../firebase";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const ML_API_BASE_URL = "http://127.0.0.1:8000";

const RecommendedForYou = ({ user }) => {
  // ==========================================
  // Existing Demographic Recommendations
  // ==========================================

  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [demographicName, setDemographicName] = useState("");

  // ==========================================
  // AI / ML Recommendations
  // ==========================================

  const [mlRecommendations, setMlRecommendations] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);

  // ==========================================
  // Existing Recommendation System
  // ==========================================

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        const prefs = await getUserPrefs();

        if (prefs?.country) {
          setDemographicName(prefs.country);
        } else if (prefs?.state) {
          setDemographicName(prefs.state);
        }

        let recommendedIds = await getDemographicRecommendations({
          uid: user.uid,
          prefs,
        });

        // Ensure at least 3 movie IDs
        if (recommendedIds.length < 3) {
          const trending = await getTrendingMovies();

          const trendingIds = trending
            .map((t) => t.movie.id.toString())
            .filter((id) => !recommendedIds.includes(id));

          recommendedIds = [
            ...recommendedIds,
            ...trendingIds,
          ].slice(0, 10);
        }

        // Remove invalid TMDB movie ID
        recommendedIds = recommendedIds.filter(
          (movieId) => String(movieId) !== "154526"
        );

        console.log("RECOMMENDED IDS:", recommendedIds);

        if (recommendedIds.length > 0) {
          const moviePromises = recommendedIds.map(
            async (movieId) => {
              try {
                const res = await fetch(
                  `${API_BASE_URL}/movie/${movieId}`,
                  API_OPTIONS
                );

                if (!res.ok) return null;

                const data = await res.json();

                // Only keep anime
                if (
                  data.genres &&
                  data.genres.some((g) => g.id === 16)
                ) {
                  return data;
                }

                return null;
              } catch {
                return null;
              }
            }
          );

          const fullMovies = await Promise.all(moviePromises);

          const filteredMovies = fullMovies.filter(Boolean);

          setRecommendedMovies(filteredMovies);
        }
      } catch (error) {
        console.error(
          "Error loading recommendations:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  // ==========================================
  // AI / ML RECOMMENDATION SYSTEM
  // ==========================================

  useEffect(() => {
    const fetchMLRecommendations = async () => {
      if (!user) return;

      setMlLoading(true);

      try {
        // Temporary test anime
        const animeTitle = "Death Note";

        console.log(
          "Calling ML API for:",
          animeTitle
        );

        const response = await fetch(
          `${ML_API_BASE_URL}/recommend/${encodeURIComponent(
            animeTitle
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "ML API request failed"
          );
        }

        const data = await response.json();

        console.log(
          "ML RECOMMENDATIONS:",
          data
        );

        setMlRecommendations(
          data.recommendations || []
        );
      } catch (error) {
        console.error(
          "ML recommendation error:",
          error
        );

        setMlRecommendations([]);
      } finally {
        setMlLoading(false);
      }
    };

    fetchMLRecommendations();
  }, [user]);

  // ==========================================
  // OPEN AI RECOMMENDATION
  // ==========================================

  const handleAIAnimeClick = async (anime) => {
    try {
      console.log(
        "Finding TMDB movie for:",
        anime.title
      );

      const response = await fetch(
        `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
          anime.title
        )}&include_adult=false`,
        API_OPTIONS
      );

      if (!response.ok) {
        throw new Error(
          "Failed to search TMDB"
        );
      }

      const data = await response.json();

      // Find an animation result
      const animeResult = data.results?.find(
        (movie) =>
          movie.genre_ids &&
          movie.genre_ids.includes(16)
      );

      if (animeResult) {
        console.log(
          "TMDB anime found:",
          animeResult
        );

        // Open the correct Anime Hub details page
        window.open(
          `/anime/${animeResult.id}`,
          "_blank"
        );
      } else {
        console.log(
          "No matching anime found on TMDB"
        );

        alert(
          `Could not find "${anime.title}" on TMDB.`
        );
      }
    } catch (error) {
      console.error(
        "Error opening AI recommendation:",
        error
      );

      alert(
        "Could not open this anime. Please try again."
      );
    }
  };

  // ==========================================
  // Don't show if user is not logged in
  // ==========================================

  if (!user) {
    return null;
  }

  return (
    <>
      {/* ===================================== */}
      {/* EXISTING DEMOGRAPHIC RECOMMENDATIONS */}
      {/* ===================================== */}

      <section className="recommended-for-you mb-12 relative animate-fade-in text-white">

        <div className="flex items-center justify-between mb-6 block w-full border-b border-white/10 pb-2 flex-wrap gap-4">

          <div className="flex items-center gap-3">

            <h2 className="section-title text-[#ffb5a7] font-bold text-2xl uppercase tracking-widest shrink-0">
              Recommended For You
            </h2>

            <span className="bg-[#ffb5a7]/20 text-[#ffb5a7] text-xs font-bold px-2 py-1 rounded-sm tracking-widest uppercase mt-1 hidden md:block border border-[#ffb5a7]/30">
              Demographic Match Model Active
            </span>

          </div>

          {demographicName && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full scale-90 md:scale-100 origin-right">

              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>

              <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter text-gray-400">
                Region:{" "}
                <span className="text-[#ffb5a7]">
                  {demographicName} Match
                </span>
              </span>

            </div>
          )}

        </div>

        {isLoading ? (

          <div className="flex gap-4 overflow-x-auto pb-4 pt-2">

            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-[180px] h-[270px] bg-white/5 rounded-md shrink-0 animate-pulse border border-white/5"
              ></div>
            ))}

          </div>

        ) : recommendedMovies.length > 0 ? (

          <div className="relative overflow-hidden w-full group py-2">

            <ul className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">

              {recommendedMovies.map((movieItem) => (

                <li
                  key={movieItem.id}
                  className="relative shrink-0 snap-start w-[140px] md:w-[180px] group/item transition-transform hover:-translate-y-2"
                >

                  <a
                    href={`/anime/${movieItem.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-md relative shadow-lg"
                    onClick={() =>
                      updateMovieClickCount(movieItem)
                    }
                  >

                    <img
                      src={
                        movieItem.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movieItem.poster_path}`
                          : "/no-movie.png"
                      }
                      alt={
                        movieItem.title ||
                        movieItem.name
                      }
                      className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover/item:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-end p-2">

                      <p className="text-white font-semibold text-xs truncate w-full">
                        {movieItem.title ||
                          movieItem.name}
                      </p>

                    </div>

                    <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xl">
                      MATCH
                    </div>

                  </a>

                </li>

              ))}

            </ul>

          </div>

        ) : (

          <div className="bg-white/5 rounded-xl p-8 border border-white/5 text-center">

            <p className="text-gray-400 text-sm">
              Our Demographic Match Model
              is ready. Browse more anime to
              get personalized recommendations!
            </p>

          </div>

        )}

      </section>

      {/* ===================================== */}
      {/* AI / ML RECOMMENDATIONS */}
      {/* ===================================== */}

      <section className="recommended-for-you mb-12 relative animate-fade-in text-white">

        {/* AI Header */}

        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-2">

          <h2 className="text-[#ffb5a7] font-bold text-2xl uppercase tracking-widest">
            AI Recommendations
          </h2>

          <span className="bg-pink-500/20 text-pink-400 text-xs font-bold px-2 py-1 rounded border border-pink-500/30">
            TF-IDF + COSINE SIMILARITY
          </span>

        </div>

        {/* Description */}

        <p className="text-gray-400 text-sm mb-5">
          Recommendations generated using our
          machine learning model based on anime
          content similarity.
        </p>

        {/* Loading */}

        {mlLoading ? (

          <div className="flex gap-4 overflow-x-auto pb-4">

            {[...Array(5)].map((_, index) => (

              <div
                key={index}
                className="w-[180px] h-[270px] bg-white/5 rounded-md shrink-0 animate-pulse border border-white/5"
              ></div>

            ))}

          </div>

        ) : mlRecommendations.length > 0 ? (

          <div className="relative overflow-hidden w-full">

            <ul className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">

              {mlRecommendations.map((anime) => (

                <li
                  key={anime.id}
                  className="relative shrink-0 w-[140px] md:w-[180px] group transition-transform hover:-translate-y-2"
                >

                  <button
                    type="button"
                    onClick={() =>
                      handleAIAnimeClick(anime)
                    }
                    className="block w-full text-left overflow-hidden rounded-md relative shadow-lg cursor-pointer"
                  >

                    {/* Anime Image */}

                    <img
                      src={
                        anime.image ||
                        "/no-movie.png"
                      }
                      alt={anime.title}
                      className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Anime Title */}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">

                      <p className="text-white font-semibold text-xs truncate w-full">
                        {anime.title}
                      </p>

                    </div>

                    {/* Similarity */}

                    <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xl">

                      {(anime.similarity * 100).toFixed(1)}
                      %

                    </div>

                  </button>

                </li>

              ))}

            </ul>

          </div>

        ) : (

          <div className="bg-white/5 rounded-xl p-8 border border-white/5 text-center">

            <p className="text-gray-400 text-sm">
              No AI recommendations available.
            </p>

          </div>

        )}

      </section>
    </>
  );
};

export default RecommendedForYou;
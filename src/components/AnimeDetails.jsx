import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Spinner from "./Spinner";
import SaveMovieButton from "./SaveAnimeButton";
import { getSavedMovies } from "../firebase";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedMovieIds, setSavedMovieIds] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/movie/${id}?append_to_response=videos,credits`,
          API_OPTIONS,
        );
        if (!response.ok) throw new Error("Failed to fetch movie details");
        const data = await response.json();
        if (!data.genres || !data.genres.some((g) => g.id === 16)) {
          throw new Error("This media is not available.");
        }
        setMovie(data);
        // Get AI recommendations from FastAPI
        setRecommendationLoading(true);

        try {
          const recommendationResponse = await fetch(
            `http://127.0.0.1:8000/recommend/${encodeURIComponent(data.title)}`
          );

          if (!recommendationResponse.ok) {
            throw new Error("Failed to get AI recommendations");
          }

          const recommendationData = await recommendationResponse.json();

          console.log("AI Recommendations:", recommendationData);

          setRecommendations(
            recommendationData.recommendations || []
          );
        } catch (err) {
          console.error("Recommendation error:", err);
        } finally {
          setRecommendationLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load movie details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedIds = async () => {
      try {
        const ids = await getSavedMovies();
        setSavedMovieIds(ids);
      } catch (err) {
        console.error("Failed to fetch saved anime", err);
      }
    };

    fetchMovieDetails();
    fetchSavedIds();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  if (error)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        {error}
      </div>
    );

  const genres = movie.genres?.map((g) => g.name).join(", ");
  const director = movie.credits?.crew?.find((c) => c.job === "Director")?.name;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/anime"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Hub
        </Link>

        <div className="flex flex-col md:flex-row gap-12 mt-4">
          <div className="w-full md:w-1/3 shrink-0 relative">
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                  : "/no-movie.png"
              }
              alt={movie.title}
              className="rounded-3xl shadow-2xl w-full border border-white/10"
            />
            <SaveMovieButton movie={movie} savedMovieIds={savedMovieIds} />
          </div>

          <div className="flex-1">
            <h1 className="special-font font-zentry text-5xl mb-4 bg-gradient-to-r from-blue-100 to-violet-500 bg-clip-text text-transparent">
              {movie.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-blue-50/60 mb-8 font-semibold uppercase tracking-widest">
              <span>{movie.release_date?.split("-")[0]}</span>
              <span>•</span>
              <span>{genres}</span>
              <span>•</span>
              <span>{movie.runtime} mins</span>
              {movie.vote_average && (
                <>
                  <span>•</span>
                  <span className="text-yellow-400">
                    ★ {movie.vote_average.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-3 text-blue-100 uppercase tracking-widest text-[12px]">
                  Overview
                </h2>
                <p className="text-lg leading-relaxed text-blue-50/80">
                  {movie.overview}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-8">
                {director && (
                  <section>
                    <h2 className="text-xl font-bold mb-1 text-blue-100 uppercase tracking-widest text-[12px]">
                      Director
                    </h2>
                    <p className="text-blue-50/60 font-semibold">{director}</p>
                  </section>
                )}
                {movie.credits?.cast && (
                  <section>
                    <h2 className="text-xl font-bold mb-1 text-blue-100 uppercase tracking-widest text-[12px]">
                      Main Cast
                    </h2>
                    <p className="text-blue-50/60 font-semibold">
                      {movie.credits.cast
                        .slice(0, 3)
                        .map((c) => c.name)
                        .join(", ")}
                    </p>
                  </section>
                )}
              </div>

              {movie.videos?.results?.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-6 text-blue-100 uppercase tracking-widest text-[12px]">
                    Trailer
                  </h2>
                  <div className="aspect-video w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${movie.videos.results.find((v) => v.type === "Trailer")?.key || movie.videos.results[0].key}`}
                      title={`${movie.title} Trailer`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </section>
              )}
              {/* AI Recommendations */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6 text-pink-400">
                  🤖 AI Recommendations
                </h2>

                {recommendationLoading ? (
                  <p className="text-gray-400">
                    AI is finding similar anime...
                  </p>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((anime) => (
                      <Link
                        key={anime.id}
                        to={`/anime/${anime.id}`}
                        className="bg-zinc-900 rounded-2xl overflow-hidden hover:scale-105 transition duration-300 border border-white/10"
                      >
                        <img
                          src={anime.image}
                          alt={anime.title}
                          className="w-full h-64 object-cover"
                        />

                        <div className="p-4">
                          <h3 className="text-lg font-bold">
                            {anime.title}
                          </h3>

                          <p className="text-gray-400 text-sm mt-2">
                            {anime.genres}
                          </p>

                          <p className="text-yellow-400 mt-3 font-semibold">
                            ⭐ Match:{" "}
                            {Math.round(anime.similarity * 100)}%
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">
                    No AI recommendations available.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;

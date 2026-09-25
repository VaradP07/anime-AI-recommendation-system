import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Sidebar from "./components/Sidebar.jsx";
import Search from "./components/Search.jsx";
import Filter from "./components/Filter.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/AnimeCard.jsx";
import MoodDetector from "./components/MoodDetector.jsx";
import { useDebounce } from "react-use";
import {
  getTrendingMovies,
  updateMovieClickCount,
  getUserPrefs,
  updateUserPrefs,
  getSavedMovies,
} from "./firebase.js";
import SaveMovieButton from "./components/SaveAnimeButton.jsx";
import RecommendedForYou from "./components/RecommendedForYou.jsx";
import "./animeApp.css";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const SmallMovieCard = ({ movie }) => {
  return (
    <li>
      <a
        href={`/anime/${movie.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-transparent group cursor-pointer w-full"
        onClick={() => updateMovieClickCount(movie)}
      >
        <img
          src={
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
              : "/no-movie.png"
          }
          alt={movie.title}
          className="w-[60px] h-[80px] object-cover rounded-md shadow-lg group-hover:opacity-80 transition-opacity shrink-0"
        />
        <div className="small-movie-info flex flex-col justify-center flex-1 overflow-hidden">
          <h4 className="title-clamp text-white font-semibold text-[15px] truncate mb-2 group-hover:text-pink-400 transition-colors w-full">
            {movie.title || movie.name}
          </h4>
          <div className="small-movie-meta flex items-center gap-2 text-[12px] text-gray-400 shrink-0">
            <span className="cc-tag bg-[#ccfed2] text-[#2b7139] px-1 font-bold rounded-sm flex items-center gap-1">
              CC <span className="text-black font-black">10</span>
            </span>
            <span className="mic-tag bg-[#9683ff] text-white px-1 font-bold rounded-sm flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="10"
                height="10"
              >
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>{" "}
              5
            </span>
            <span className="dot w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>TV</span>
          </div>
        </div>
      </a>
    </li>
  );
};

const AnimeApp = ({ user, setUser }) => {
  const mainContentRef = useRef(null);
  const [activeView, setActiveView] = useState("discover"); // "discover" or "profile"
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [selectedMood, setSelectedMood] = useState("");
  const [isMoodOpen, setIsMoodOpen] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    genres: [],
    type: "all",
    status: "all",
    rating: "all",
    score: "0",
    season: "all",
    language: "all",
    sort: "popularity.desc",
  });

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);

  const [savedMovieIds, setSavedMovieIds] = useState([]);
  const [savedMoviesData, setSavedMoviesData] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const [topAiring, setTopAiring] = useState([]);
  const [mostPopular, setMostPopular] = useState([]);
  const [mostFavourite, setMostFavourite] = useState([]);
  const [latestCompleted, setLatestCompleted] = useState([]);

  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    age: "",
    phone: "",
    profilePic: "",
    state: "",
    country: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: "", message: "" });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data && data.region && data.country_name) {
        setProfileData((prev) => ({
          ...prev,
          state: prev.state || data.region,
          country: prev.country || data.country_name,
        }));
      }
    } catch (error) {
      console.error("Error fetching location", error);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchMovies = async (query = "") => {
    console.log("Selected Mood:", selectedMood);
    setIsLoading(true);
    setErrorMessage("");

    try {
      const moodGenres = {
        happy: "35",
        sad: "18",
        angry: "28",
        relaxed: "10751",
        excited: "12",
        motivated: "12",
        romantic: "10749",
        scared: "27",
      };

      const moodSort = {
        happy: "popularity.desc",
        sad: "vote_average.desc",
        angry: "popularity.desc",
        relaxed: "vote_average.desc",
        excited: "popularity.desc",
        motivated: "vote_average.desc",
        romantic: "popularity.desc",
        scared: "popularity.desc",
      };

      let endpoint = "";

      if (query) {
        endpoint = `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false`;
      } else {
        const genreParams =
          filters.genres.length > 0 ? filters.genres.join(",") : "16";
        const langParam =
          filters.language !== "all"
            ? `&with_original_language=${filters.language}`
            : "";
        const scoreParam =
          filters.score !== "0" ? `&vote_average.gte=${filters.score}` : "";
        const currentSort =
          selectedMood && moodSort[selectedMood]
            ? moodSort[selectedMood]
            : filters.sort;

        const sortParam = `&sort_by=${currentSort}`;

        // Build genres based on selected mood
        let genreList = ["16"]; // Animation

        // If a mood is selected, add its genres
        if (selectedMood && moodGenres[selectedMood]) {
          genreList.push(
            ...moodGenres[selectedMood].split(",")
          );
        } else {
          // Default: show animation
          genreList.push("16");
        }

        // Add genres selected from filters
        if (filters.genres.length > 0) {
          genreList.push(...filters.genres);
        }

        // Remove duplicate genres
        genreList = [...new Set(genreList)];

        // Convert array to string
        const withGenres = genreList.join(",");

        console.log("Selected Mood:", selectedMood);
        console.log("Genre List:", genreList);
        console.log("With Genres:", withGenres);

        let mediaTypeParam = "";
        if (filters.type === "movie") mediaTypeParam = "&with_release_type=3";
        // Note: TMDB doesn't have a direct "anime series" filter in discover,
        // we use with_genres=16 and can filter for TV series if needed but discover/movie is for movies.
        // For TV series, we should use discover/tv. Let's stick to movie discover for now
        // as currently configured but adding with_genres=16 is the key for anime (animation).

        endpoint = `${API_BASE_URL}/discover/movie?include_adult=false&with_genres=${withGenres}${langParam}${scoreParam}${sortParam}${mediaTypeParam}`;

        console.log("TMDB Endpoint:", endpoint);

        if (filters.rating !== "all") {
          endpoint += `&certification_country=US&certification=${filters.rating}`;
        }
      }

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch anime");
      }

      const data = await response.json();

      console.log("TMDB RESULTS:", data.results);
      console.log("NUMBER OF RESULTS:", data.results?.length);

      let finalResults = data.results || [];
      // Strictly filter to ensure only animations (genre 16) are shown
      finalResults = finalResults.filter(
        (movie) => movie.genre_ids && movie.genre_ids.includes(16),
      );

      if (finalResults.length === 0 && query) {
        setErrorMessage("No anime found matching your search.");
        setMovieList([]);
        return;
      }

      setMovieList(finalResults);
    } catch (error) {
      console.error(`Error fetching anime: ${error}`);
      setErrorMessage("Error fetching anime. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      const filtered = movies.filter(
        (m) => m.movie && m.movie.genre_ids && m.movie.genre_ids.includes(16),
      );
      setTrendingMovies(filtered);
    } catch (error) {
      console.error(`Error fetching trending anime: ${error}`);
    }
  };

  const loadProfilePrefs = async () => {
    try {
      const prefs = await getUserPrefs();
      if (prefs) {
        setProfileData((prev) => ({
          ...prev,
          age: prefs.age || "",
          phone: prefs.phone || "",
          profilePic: prefs.profilePic || "",
          state: prefs.state || "",
          country: prefs.country || "",
        }));

        // If location is missing, detect it
        if (!prefs.state || !prefs.country) {
          fetchLocation();
        }
      } else {
        fetchLocation();
      }
    } catch {
      console.error("Error loading profile prefs");
    }
  };

  const fetchMultiCategories = async () => {
    try {
      const [topAiringRes, popularRes, topRatedMovieRes, popularTVRes] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/discover/tv?with_genres=16&sort_by=popularity.desc&first_air_date.gte=2023-01-01`,
            API_OPTIONS,
          ),
          fetch(
            `${API_BASE_URL}/discover/movie?with_genres=16&sort_by=popularity.desc`,
            API_OPTIONS,
          ),
          fetch(
            `${API_BASE_URL}/discover/movie?with_genres=16&sort_by=vote_average.desc&vote_count.gte=500`,
            API_OPTIONS,
          ),
          fetch(
            `${API_BASE_URL}/discover/tv?with_genres=16&sort_by=popularity.desc`,
            API_OPTIONS,
          ),
        ]);

      if (topAiringRes.ok)
        setTopAiring((await topAiringRes.json()).results.slice(0, 5));
      if (popularRes.ok)
        setMostPopular((await popularRes.json()).results.slice(0, 5));
      if (topRatedMovieRes.ok)
        setMostFavourite((await topRatedMovieRes.json()).results.slice(0, 5));
      if (popularTVRes.ok)
        setLatestCompleted((await popularTVRes.json()).results.slice(0, 5));
    } catch (error) {
      console.error("Error fetching multi categories", error);
    }
  };

  useEffect(() => {
    console.log("Mood changed:", selectedMood);
    console.log("Active View:", activeView);

    if (activeView === "discover") {
      fetchMovies(debouncedSearchTerm);
    }
  }, [
    debouncedSearchTerm,
    activeView,
    filters,
    selectedMood,
  ]);

  const loadSavedMovieIds = async () => {
    try {
      const ids = await getSavedMovies();

      const validIds = ids.filter(
        (movieId) => String(movieId) !== "154526"
      );

      setSavedMovieIds(validIds);
    } catch (error) {
      console.error("Error loading saved movie IDs", error);
    }
  };

  const loadSavedMoviesData = async () => {
    setIsLoadingSaved(true);
    try {
      const ids = await getSavedMovies();

      console.log("ALL SAVED IDS:", ids);

      // Remove invalid TMDB movie ID
      const validIds = ids.filter(
        (movieId) => String(movieId) !== "154526"
      );

      setSavedMovieIds(validIds);

      const moviePromises = validIds.map(async (movieId) => {
        try {
          console.log("FETCHING MOVIE ID:", movieId);

          const res = await fetch(
            `${API_BASE_URL}/movie/${movieId}`,
            API_OPTIONS
          );
          if (!res.ok) {
            console.log(`Invalid movie ID: ${movieId}`);
            return null;
          }
          return await res.json();
        } catch {
          return null;
        }
      });


      const movies = await Promise.all(moviePromises);
      setSavedMoviesData(movies.filter(Boolean));
    } catch (error) {
      console.error("Error loading saved anime", error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (movieList.length === 0 || debouncedSearchTerm) return;

    // Auto-advance spotlight every 5 seconds
    const interval = setInterval(() => {
      setCurrentSpotlightIndex(
        (prev) => (prev + 1) % Math.min(5, movieList.length),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [movieList, debouncedSearchTerm]);

  const handleSpotlightNext = () => {
    setCurrentSpotlightIndex(
      (prev) => (prev + 1) % Math.min(5, movieList.length),
    );
  };

  const handleSpotlightPrev = () => {
    setCurrentSpotlightIndex(
      (prev) =>
        (prev - 1 + Math.min(5, movieList.length)) %
        Math.min(5, movieList.length),
    );
  };

  useEffect(() => {
    loadTrendingMovies();
    loadProfilePrefs();
    fetchMultiCategories();

    // Entrance animation
    gsap.fromTo(
      mainContentRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power4.out", delay: 0.2 },
    );
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus({ type: "", message: "" });

    try {
      await updateUserPrefs({
        age: profileData.age,
        phone: profileData.phone,
        profilePic: profileData.profilePic,
        state: profileData.state,
        country: profileData.country,
      });
      setSaveStatus({
        type: "success",
        message: "Profile updated successfully!",
      });
    } catch (error) {
      setSaveStatus({
        type: "error",
        message: "Failed to save changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus({ type: "", message: "" }), 3000);
    }
  };

  const isAnyFilterApplied =
    filters.genres.length > 0 ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.rating !== "all" ||
    filters.score !== "0" ||
    filters.season !== "all" ||
    filters.language !== "all";

  return (
    <div
      className="anime-hub-container"
      style={{ "--sidebar-width": isSidebarCollapsed ? "80px" : "256px" }}
    >
      <Sidebar
        user={user}
        setUser={setUser}
        activeView={activeView}
        setActiveView={setActiveView}
        profilePic={profileData.profilePic}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main
        className="main-content min-w-0 transition-all duration-300"
        ref={mainContentRef}
      >
        <div className="pattern" />

        {/* Floating background characters/elements */}
        <div className="floating-anime-bg">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="floating-element"
              style={{
                width: `${Math.random() * 300 + 100}px`,
                height: `${Math.random() * 300 + 100}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background:
                  i % 2 === 0
                    ? "rgba(93, 63, 211, 0.2)"
                    : "rgba(59, 130, 246, 0.2)",
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="wrapper">
          {activeView === "discover" ? (
            <>
              {/* Top Search & Filter Bar */}
              <div className="top-search-bar mb-12">
                <div className="flex flex-col gap-8">

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Search
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        aiRecommendations={aiRecommendations}
                        setAiRecommendations={setAiRecommendations}
                        onToggleFilter={() => {
                          setIsFilterOpen(!isFilterOpen);

                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        isFilterOpen={isFilterOpen}
                      />
                    </div>

                    {/* Mood Based Button */}
                    <button
                      type="button"
                      onClick={() => setIsMoodOpen(true)}
                      className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#1d1c22] border border-white/10 text-white font-semibold hover:bg-pink-500 hover:border-pink-400 hover:text-black transition-all duration-300 shrink-0"
                    >
                      <span className="text-xl">🎭</span>
                      <span className="hidden sm:inline">Mood Based</span>
                    </button>
                  </div>
                  
                  {isFilterOpen && (
                  <div className="mt-4">
                    <Filter
                      filters={filters}
                      setFilters={setFilters}
                      onApply={() => fetchMovies(searchTerm)}
                      onReset={() => {
                        setFilters({
                          genres: [],
                          type: "all",
                          status: "all",
                          rating: "all",
                          score: "0",
                          season: "all",
                          language: "all",
                          sort: "popularity.desc",
                        });
                        setIsFilterOpen(false);
                      }}
                      onFamousClick={(name) => {
                        setSearchTerm(name);
                        setIsFilterOpen(false);
                      }}
                    />
                  </div>
                )}

                  {selectedMood && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h2 className="text-2xl font-bold text-pink-400">
                          ✨ Anime Recommendations for your {selectedMood} mood
                        </h2>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMood("");
                            setMovieList([]);
                            setErrorMessage("");
                          }}
                          className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/30 text-red-400 font-semibold hover:bg-red-500 hover:text-white transition-all"
                        >
                          ✕ Remove Mood Filter
                        </button>
                      </div>

                      <p className="text-gray-400 mt-2">
                        Showing anime recommendations based on your current mood.
                      </p>
                    </div>
                  )}

                  {selectedMood && movieList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
                      {movieList.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          savedMovieIds={savedMovieIds}
                          onSaveToggle={loadSavedMovieIds}
                          onCardClick={updateMovieClickCount}
                        />
                      ))}
                    </div>
                  )}

                  {aiRecommendations.length > 0 && (
                    <section className="mt-10 mb-12">
                      <h2 className="text-3xl font-bold text-white mb-6">
                        🤖 AI Recommendations
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {aiRecommendations.map((anime, index) => (
                          <div
                            key={anime.id || index}
                            className="bg-[#1d1c22] border border-white/10 rounded-2xl overflow-hidden text-white transition-transform hover:scale-105 hover:border-pink-400"
                          >
                            {/* Anime Poster */}
                            <img
                              src={anime.image}
                              alt={anime.title}
                              className="w-full h-72 object-cover"
                            />

                            <div className="p-4">
                              {/* Anime Title */}
                              <h3 className="text-lg font-bold">
                                {anime.title}
                              </h3>

                              {/* Genres */}
                              <p className="text-sm text-gray-400 mt-2">
                                {anime.genres}
                              </p>

                              {/* AI Match Score */}
                              <div className="mt-4 text-yellow-400 font-semibold">
                                ⭐ Match: {Math.round(
                                  (anime.similarity || 0) * 100
                                )}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="hidden lg:flex items-center gap-3 md:ml-auto">
                    <a
                      href="https://discord.com"
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 bg-[#5865F2] text-white rounded-full flex items-center justify-center hover:scale-110 transition shrink-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                      </svg>
                    </a>
                    <a
                      href="https://t.me"
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 bg-[#0088cc] text-white rounded-full flex items-center justify-center hover:scale-110 transition shrink-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.25-5.61 3.68-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.41-1.43-.87.03-.24.36-.48.98-.74 3.84-1.66 6.4-2.76 7.68-3.3 3.65-1.54 4.41-1.8 4.9-1.81.11 0 .35.03.48.14.11.09.14.22.14.34-.01.07-.01.19-.03.38z" />
                      </svg>
                    </a>
                    <a
                      href="https://reddit.com"
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 bg-[#FF4500] text-white rounded-full flex items-center justify-center hover:scale-110 transition shrink-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.561-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                      </svg>
                    </a>
                  </div>
                </div>

                
              </div>

              {/* Spotlight / Hero */}
              {!debouncedSearchTerm && movieList.length > 0 && (
                <section className="spotlight-hero shrink-0 relative w-full rounded-2xl overflow-hidden mb-12 h-[300px] md:h-[450px]">
                  <div className="spotlight-bg absolute inset-0 transition-opacity duration-500">
                    <img
                      key={movieList[currentSpotlightIndex].id}
                      src={
                        movieList[currentSpotlightIndex].backdrop_path
                          ? `https://image.tmdb.org/t/p/original${movieList[currentSpotlightIndex].backdrop_path}`
                          : "/hero-bg.png"
                      }
                      alt={movieList[currentSpotlightIndex].title}
                      className="w-full h-full object-cover animate-fade-in"
                    />
                    <div className="spotlight-overlay absolute inset-0 bg-gradient-to-r from-[#17161b] via-[#17161b]/90 to-transparent"></div>
                    <div className="spotlight-overlay-bottom absolute inset-0 bg-gradient-to-t from-[#121115] via-transparent to-transparent"></div>
                  </div>
                  <div
                    className="spotlight-content relative z-10 p-6 md:p-12 md:max-w-2xl flex flex-col justify-center h-full animate-slide-up"
                    key={`content-${movieList[currentSpotlightIndex].id}`}
                  >
                    <span className="spotlight-tag text-pink-400 font-semibold mb-2 text-sm md:text-base">
                      #{currentSpotlightIndex + 1} Spotlight
                    </span>
                    <h1 className="spotlight-title text-3xl md:text-5xl font-bold text-white mb-4 line-clamp-2 leading-tight">
                      {movieList[currentSpotlightIndex].title ||
                        movieList[currentSpotlightIndex].name}
                    </h1>
                    <div className="spotlight-meta flex items-center gap-4 text-xs md:text-sm text-gray-300 font-medium mb-4">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-play-circle"></i> TV
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-clock"></i> 24m
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-calendar"></i>{" "}
                        {movieList[currentSpotlightIndex].release_date ||
                          "Unknown"}
                      </span>
                      <span className="quality-tag bg-white text-black px-1.5 py-0.5 rounded font-bold text-[10px]">
                        HD
                      </span>
                    </div>
                    <p className="spotlight-desc text-sm md:text-base text-gray-400 line-clamp-3 mb-6">
                      {movieList[currentSpotlightIndex].overview}
                    </p>
                    <div className="spotlight-actions flex items-center gap-4">
                      <a
                        href={`/anime/${movieList[currentSpotlightIndex].id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="watch-now-btn bg-pink-400 hover:bg-pink-500 text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 transition cursor-pointer"
                        onClick={() =>
                          updateMovieClickCount(
                            movieList[currentSpotlightIndex],
                          )
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Watch Now
                      </a>
                      <a
                        href={`/anime/${movieList[currentSpotlightIndex].id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="detail-btn bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition"
                      >
                        Detail{" "}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-4 h-4"
                        >
                          <path
                            d="M9 5l7 7-7 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Manual Controls */}
                  <div className="absolute right-6 bottom-6 z-20 flex flex-col md:flex-row items-center gap-2">
                    <button
                      onClick={handleSpotlightPrev}
                      className="w-10 h-10 bg-black/50 hover:bg-white hover:text-black hover:scale-110 text-white backdrop-blur-md rounded flex items-center justify-center transition border border-white/10"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <path
                          d="M15 19l-7-7 7-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleSpotlightNext}
                      className="w-10 h-10 bg-black/50 hover:bg-white hover:text-black hover:scale-110 text-white backdrop-blur-md rounded flex items-center justify-center transition border border-white/10"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <path
                          d="M9 5l7 7-7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </section>
              )}

              {/* Demographic Recommendations */}
              {!debouncedSearchTerm && user && (
                <RecommendedForYou user={user} />
              )}

              {trendingMovies.length > 0 && !debouncedSearchTerm && (
                <section className="trending mb-8 relative">
                  <h2 className="section-title text-pink-400 font-bold text-2xl mb-6">
                    Trending
                  </h2>
                  <div className="trending-carousel-wrapper relative overflow-hidden">
                    <ul className="trending-carousel flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                      {trendingMovies.map((movieStat, index) => {
                        const movieItem = movieStat.movie;
                        return (
                          <li
                            key={movieStat.$id || movieItem?.id || index}
                            className="relative shrink-0 snap-start w-1/4 md:w-1/6 lg:w-1/8 trending-card group"
                          >
                            <a
                              href={`/anime/${movieItem.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-md relative"
                              onClick={() => updateMovieClickCount(movieItem)}
                            >
                              <img
                                src={
                                  movieItem.poster_path
                                    ? `https://image.tmdb.org/t/p/w500${movieItem.poster_path}`
                                    : "/no-movie.png"
                                }
                                alt={movieItem.title}
                                className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-60"
                              />
                              <div className="trending-number-box absolute bottom-0 left-0 right-0 flex items-end p-2 pb-0 pt-8 bg-gradient-to-t from-black via-black/50 to-transparent">
                                <span className="trending-number text-5xl md:text-7xl font-bold text-white [text-shadow:_0_2px_4px_rgb(0_0_0_/_80%)] truncate w-1/4 self-end -mb-2 -ml-2">
                                  {index + 1}
                                </span>
                                <span className="trending-title-vertical text-white font-semibold text-xs md:text-sm truncate w-3/4 self-center ml-2">
                                  {movieItem.title || movieItem.name}
                                </span>
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              )}

              {/* Share Banner Simulator */}
              {!debouncedSearchTerm && (
                <div className="share-banner flex flex-wrap lg:flex-nowrap items-center gap-4 bg-[#1d1c22] rounded-xl p-4 text-white mb-12">
                  <img
                    src="https://hianime.to/images/share-icon.gif"
                    alt="Share"
                    className="h-16 w-16 md:h-20 md:w-20 rounded-full"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="share-text-block flex flex-col text-pink-400 mr-8">
                    <span className="share-title font-bold text-lg md:text-xl">
                      Share ANiME HuB
                    </span>
                    <span className="share-sub text-white/70 text-sm">
                      to your friends
                    </span>
                  </div>
                  <div className="share-count hidden md:flex flex-col mr-8 shrink-0">
                    <span className="font-bold text-2xl lg:text-3xl text-white">
                      520k
                    </span>
                    <small className="text-gray-400 text-xs text-center -mt-1">
                      Shares
                    </small>
                  </div>
                  <div className="share-buttons flex items-center gap-2 md:gap-3 flex-wrap">
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent("Check out this awesome Anime Hub!")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="share-btn text-white bg-[#0088cc] rounded-full px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.25-5.61 3.68-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.41-1.43-.87.03-.24.36-.48.98-.74 3.84-1.66 6.4-2.76 7.68-3.3 3.65-1.54 4.41-1.8 4.9-1.81.11 0 .35.03.48.14.11.09.14.22.14.34-.01.07-.01.19-.03.38z" />
                      </svg>
                      Telegram
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent("Check out this awesome Anime Hub!")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="share-btn text-white bg-black border border-white/20 rounded-full px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="share-btn text-white bg-[#1877f2] rounded-full px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent("Check out this awesome Anime Hub! " + window.location.origin)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="share-btn text-white bg-[#25D366] rounded-full px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Comments Placeholder */}
              {!debouncedSearchTerm && (
                <section className="comments-preview-section flex gap-8 mb-16 h-auto min-h-[250px]">
                  <div className="comments-hero-img hidden lg:block w-72 shrink-0 self-end -mb-4">
                    <img
                      src="/comments.png"
                      alt="Character"
                      className="w-full mb-5 h-auto object-contain drop-shadow-[-10px_10px_15px_rgba(0,0,0,0.5)]"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="comments-container flex-1 bg-[#1d1c22] rounded-xl p-6 lg:p-8 border border-white/5">
                    <div className="comments-tabs flex items-center gap-6 border-b border-white/10 pb-4">
                      <button className="active text-pink-400 font-bold border border-pink-400/50 rounded-full py-1.5 px-4 text-sm bg-pink-400/10">
                        Newest Comments
                      </button>
                      {/* <button className="text-white hover:text-pink-400 font-bold text-sm transition">Top Comments</button> */}
                    </div>
                    <div className="comments-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                      {/* Hardcoded 4 dummy comments */}
                      {[
                        {
                          id: 1,
                          title: "Attack on Titan",
                          tag: "AOT",
                          user: "Shiganshina",
                        },
                        {
                          id: 2,
                          title: "Naruto Shippuden",
                          tag: "NSP",
                          user: "Konoha",
                        },
                        {
                          id: 3,
                          title: "One Piece",
                          tag: "OP",
                          user: "East Blue",
                        },
                        {
                          id: 4,
                          title: "Death Note",
                          tag: "DN",
                          user: "Tokyo",
                        },
                      ].map((c) => (
                        <div
                          key={c.id}
                          className="comment-card bg-[#28262f] p-4 lg:p-5 rounded-xl text-sm shadow-lg flex flex-col justify-between hover:bg-[#2f2c38] transition border border-white/5 h-full"
                        >
                          <div>
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-10 h-10 shrink-0 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-red-500 border-2 border-pink-400">
                                <i className="fas fa-ghost"></i>
                              </div>
                              <div className="flex flex-col">
                                <h4 className="font-bold text-white leading-tight">
                                  {c.title}
                                </h4>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {c.user} -{" "}
                                  <span className="text-gray-500">2h ago</span>
                                </p>
                              </div>
                            </div>
                            <p className="text-[#c1c1c1] text-[13px] mb-4 line-clamp-3 leading-relaxed">
                              {c.title} is an epic anime where humanity fights
                              for survival and uncovers deep truths about their
                              world...
                            </p>
                          </div>
                          <div className="text-pink-400 text-xs font-bold flex items-center gap-2">
                            <i className="fas fa-film"></i> {c.tag}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Multi-Category Grid */}
              {!debouncedSearchTerm && (
                <section className="multi-category-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                  <div className="category-col">
                    <h3 className="category-title text-pink-400 font-bold text-xl mb-6 truncate">
                      Top Airing
                    </h3>
                    <ul className="category-list flex flex-col gap-4">
                      {topAiring.map((movie) => (
                        <SmallMovieCard key={movie.id} movie={movie} />
                      ))}
                    </ul>
                  </div>
                  <div className="category-col">
                    <h3 className="category-title text-[#b5a6ff] font-bold text-xl mb-6 truncate">
                      Most Popular
                    </h3>
                    <ul className="category-list flex flex-col gap-4">
                      {mostPopular.map((movie) => (
                        <SmallMovieCard key={movie.id} movie={movie} />
                      ))}
                    </ul>
                  </div>
                  <div className="category-col">
                    <h3 className="category-title text-pink-400 font-bold text-xl mb-6 truncate">
                      Most Favourite
                    </h3>
                    <ul className="category-list flex flex-col gap-4">
                      {mostFavourite.map((movie) => (
                        <SmallMovieCard key={movie.id} movie={movie} />
                      ))}
                    </ul>
                  </div>
                  <div className="category-col">
                    <h3 className="category-title text-[#b5a6ff] font-bold text-xl mb-6 truncate">
                      Latest Completed
                    </h3>
                    <ul className="category-list flex flex-col gap-4">
                      {latestCompleted.map((movie) => (
                        <SmallMovieCard key={movie.id} movie={movie} />
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              <section className="all-movies mt-20">
                <h2 className="section-title text-pink-400 font-bold text-2xl mb-6 uppercase tracking-tighter">
                  {debouncedSearchTerm
                    ? `Search results for "${debouncedSearchTerm}"`
                    : isAnyFilterApplied
                      ? "Filter results"
                      : "Discover More"}
                </h2>

                {isLoading ? (
                  <Spinner />
                ) : errorMessage ? (
                  <p className="text-red-400 font-bold bg-red-400/10 p-4 rounded-xl inline-block border border-red-400/20">
                    {errorMessage}
                  </p>
                ) : (
                  <ul>
                    <div className="text-white text-2xl mb-4">
                      Number of movies: {movieList.length}
                    </div>

                    {/* Anime Results */}

                    <div className="mt-8">
                      {isLoading ? (
                        <p className="text-white text-center">
                          Loading anime...
                        </p>
                      ) : movieList.length === 0 ? (
                        <p className="text-white text-center">
                          No anime found.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {movieList.map((movie) => (
                            <MovieCard
                              key={movie.id}
                              movie={movie}
                              savedMovieIds={savedMovieIds}
                              onSaveToggle={loadSavedMovieIds}
                              onCardClick={updateMovieClickCount}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ul>
                )}
              </section>
            </>
          ) : activeView === "saved" ? (
            <section className="saved-movies-section">
              <header>
                <h1 className="special-font font-zentry capitalize">
                  Your <span className="text-gradient">Saved</span> Anime
                </h1>
                <p className="text-blue-50/40 mt-4 max-w-lg">
                  A collection of the masterpieces you want to keep close.
                </p>
              </header>

              <div className="mt-12 all-movies">
                {isLoadingSaved ? (
                  <Spinner />
                ) : savedMoviesData.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                    <p className="text-xl text-blue-50/60 font-semibold mb-2">
                      No saved anime yet
                    </p>
                    <p className="text-sm text-blue-50/40">
                      Discover more movies and click the heart icon to save them
                      here!
                    </p>
                  </div>
                ) : (
                  <ul>
                    {savedMoviesData.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        savedMovieIds={savedMovieIds}
                        onSaveToggle={loadSavedMoviesData}
                        onCardClick={updateMovieClickCount}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : (
            <section className="profile-section">
              <header>
                <h1 className="special-font font-zentry capitalize">
                  Manage Your <span className="text-gradient">Profile</span>
                </h1>
                <p className="text-blue-50/40 mt-4 max-w-lg">
                  Customize your identity in the Anime Sanctuary. These details
                  help us tune your experience.
                </p>
              </header>

              <div className="mt-12 max-w-2xl">
                <form onSubmit={handleProfileUpdate} className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="size-32 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white text-5xl overflow-hidden shadow-2xl border-4 border-white/5">
                          {profileData.profilePic ? (
                            <img
                              src={profileData.profilePic}
                              alt="Profile"
                              className="size-full object-cover"
                            />
                          ) : user?.name ? (
                            user.name[0].toUpperCase()
                          ) : (
                            "U"
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                          <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                            Change
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-blue-50/40 uppercase tracking-widest">
                        Base64 Upload
                      </p>
                    </div>

                    <div className="flex-1 w-full space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="input-field">
                          <label>Full Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={profileData.name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="input-field">
                          <label>Email ID</label>
                          <input
                            type="email"
                            placeholder="name@example.com"
                            value={profileData.email}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="input-field">
                          <label>Age</label>
                          <input
                            type="number"
                            placeholder="How old are you?"
                            value={profileData.age}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                age: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="input-field">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={profileData.phone}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="input-field">
                          <label>State</label>
                          <input
                            type="text"
                            placeholder="e.g. California"
                            value={profileData.state}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                state: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="input-field">
                          <label>Country</label>
                          <input
                            type="text"
                            placeholder="e.g. USA"
                            value={profileData.country}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                country: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {isDetectingLocation && (
                        <p className="text-[10px] text-violet-400 font-bold uppercase tracking-tighter animate-pulse">
                          Detecting your location...
                        </p>
                      )}

                      <div className="flex flex-col gap-4">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="hero-btn !w-full md:!w-fit !bg-blue-100 !text-black !px-12 !py-4 hover:!scale-105 active:!scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>

                        {saveStatus.message && (
                          <p
                            className={`text-sm font-bold animate-in fade-in slide-in-from-left-2 ${saveStatus.type === "success" ? "text-green-400" : "text-red-400"}`}
                          >
                            {saveStatus.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Mood Popup */}
      {isMoodOpen && (
        <MoodDetector
          onMoodSelect={(mood) => {
            console.log("Selected Mood:", mood);
            setSelectedMood(mood);
          }}
          onClose={() => {
            console.log("Closing mood popup");
            setIsMoodOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AnimeApp;

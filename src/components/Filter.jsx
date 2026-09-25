import React from "react";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10751, name: "Slice of Life" },
  { id: 10402, name: "Music" },
];

const FAMOUS_ANIME = [
  "Jujutsu Kaisen",
  "Demon Slayer",
  "Naruto",
  "One Piece",
  "Attack on Titan",
  "Death Note",
  "My Hero Academia",
  "Blue Lock",
  "Chainsaw Man",
  "Spy x Family",
  "Solo Leveling"
];

const Filter = ({ filters, setFilters, onApply, onReset, onFamousClick }) => {
  const handleGenreToggle = (genreId) => {
    setFilters((prev) => {
      const isSelected = prev.genres.includes(genreId);
      if (isSelected) {
        return { ...prev, genres: prev.genres.filter((id) => id !== genreId) };
      } else {
        return { ...prev, genres: [...prev.genres, genreId] };
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="filter-panel bg-[#1d1c22] border border-white/10 rounded-2xl p-6 mb-8 animate-fade-in">
      <div className="filter-header mb-6">
        <h3 className="text-xl font-bold text-white">Filter</h3>
      </div>

      <div className="filter-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Type */}
        <div className="filter-group">
          <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Type</label>
          <select 
            name="type" 
            value={filters.type} 
            onChange={handleChange}
            className="w-full bg-[#121115] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:border-pink-400/50 outline-none"
          >
            <option value="all">All</option>
            <option value="movie">Anime</option>
            <option value="tv">Anime Series</option>
          </select>
        </div>

        {/* Status */}
        <div className="filter-group">
          <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleChange}
            className="w-full bg-[#121115] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:border-pink-400/50 outline-none"
          >
            <option value="all">All</option>
            <option value="airing">Currently Airing</option>
            <option value="finished">Finished</option>
          </select>
        </div>

        {/* Rating */}
        <div className="filter-group">
          <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Rated</label>
          <select 
            name="rating" 
            value={filters.rating} 
            onChange={handleChange}
            className="w-full bg-[#121115] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:border-pink-400/50 outline-none"
          >
            <option value="all">All</option>
            <option value="G">G</option>
            <option value="PG">PG</option>
            <option value="PG-13">PG-13</option>
            <option value="R">R</option>
          </select>
        </div>

        {/* Score */}
        <div className="filter-group">
          <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Min Score</label>
          <select 
            name="score" 
            value={filters.score} 
            onChange={handleChange}
            className="w-full bg-[#121115] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:border-pink-400/50 outline-none"
          >
            <option value="0">All</option>
            <option value="7">7+</option>
            <option value="8">8+</option>
            <option value="9">9+</option>
          </select>
        </div>

        {/* Language */}
        <div className="filter-group">
          <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Language</label>
          <select 
            name="language" 
            value={filters.language} 
            onChange={handleChange}
            className="w-full bg-[#121115] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:border-pink-400/50 outline-none"
          >
            <option value="all">All</option>
            <option value="ja">Japanese</option>
            <option value="en">English</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        {/* Sort */}
        <div className="filter-group">
          <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Sort By</label>
          <select 
            name="sort" 
            value={filters.sort} 
            onChange={handleChange}
            className="w-full bg-[#121115] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:border-pink-400/50 outline-none"
          >
            <option value="popularity.desc">Popularity</option>
            <option value="vote_average.desc">Rating</option>
            <option value="primary_release_date.desc">Release Date</option>
          </select>
        </div>
      </div>

      <div className="genres-section mb-8">
        <label className="block text-gray-400 text-xs font-bold uppercase mb-4">Genres</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreToggle(genre.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filters.genres.includes(genre.id)
                  ? "bg-pink-400 text-black border-pink-400"
                  : "bg-white/5 text-gray-300 border-white/10 hover:border-white/20"
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      <div className="famous-anime-section mb-10">
        <label className="block text-gray-400 text-xs font-bold uppercase mb-4">Famous Anime</label>
        <div className="flex flex-wrap gap-3">
          {FAMOUS_ANIME.map((anime) => (
            <button
              key={anime}
              onClick={() => onFamousClick(anime)}
              className="px-4 py-2 rounded-xl bg-[#121115] border border-white/5 text-gray-400 text-xs font-medium hover:bg-pink-400/10 hover:border-pink-400/40 hover:text-pink-400 transition-all flex items-center gap-2"
            >
              <i className="fas fa-fire-alt text-orange-500"></i>
              {anime}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-actions flex items-center gap-4 border-t border-white/5 pt-8">
        <button 
          onClick={onApply}
          className="bg-pink-400 hover:bg-pink-500 text-black px-10 py-3 rounded-full font-bold transition shadow-lg shadow-pink-400/20 active:scale-95"
        >
          Filter
        </button>
        <button 
          onClick={onReset}
          className="text-gray-400 hover:text-white text-sm font-semibold transition px-6"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};

export default Filter;

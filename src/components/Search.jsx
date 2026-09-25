const Search = ({
  searchTerm,
  setSearchTerm,
  aiRecommendations,
  setAiRecommendations,
  onToggleFilter,
  isFilterOpen,
}) => {

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/recommend/${encodeURIComponent(searchTerm)}`
        );

        const data = await response.json();

        console.log("AI Recommendations:", data.recommendations);

        setAiRecommendations(data.recommendations);

      } catch (error) {
        console.error("Error connecting to AI backend:", error);
        alert("Could not connect to the AI recommendation backend.");
      }
    }
  };

  return (
    <div className="search flex items-center gap-4 w-full max-w-4xl">
      <div className="flex-1">
        <img src="search.svg" alt="search" />

        <input
          type="text"
          placeholder="Search through thousands of anime"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        onClick={onToggleFilter}
        className={`filter-btn p-3 rounded-xl transition-all border flex items-center justify-center gap-2 ${
          isFilterOpen
            ? "bg-pink-400 text-black border-pink-400"
            : "bg-[#1d1c22]/50 text-white border-white/10 hover:border-white/20"
        }`}
        title="Toggle Filters"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      </button>
    </div>
  );
};

export default Search;
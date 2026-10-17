
import SaveMovieButton from "./SaveAnimeButton";

const MovieCard = ({
  movie,
  savedMovieIds,
  onSaveToggle,
  onCardClick,
}) => {
  const {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
  } = movie;

  const rating =
    typeof vote_average === "number" && vote_average > 0
      ? vote_average.toFixed(1)
      : "N/A";

  const year = release_date
    ? release_date.split("-")[0]
    : "N/A";

  return (
    <div className="movie-card group relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#121019] transition-colors duration-200 hover:border-pink-500/40">
      <a
        href={`/anime/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View details for ${title}`}
        onClick={() => {
          if (onCardClick) onCardClick(movie);
        }}
        className="block min-w-0"
      >
        <div className="relative overflow-hidden bg-[#211b2b]">
          <img
            src={
              poster_path
                ? `https://image.tmdb.org/t/p/w500${poster_path}`
                : "/no-movie.png"
            }
            alt={title || "Anime poster"}
            loading="lazy"
            className="block aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute bottom-2 left-2 rounded-md border border-white/15 bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {year}
          </div>

          <div className="absolute right-2 top-2 rounded-md border border-white/15 bg-black/70 px-2 py-1 text-xs font-bold text-yellow-300 backdrop-blur-sm">
            ★ {rating}
          </div>
        </div>

        <div className="min-w-0 space-y-2 p-3">
          <h3
            title={title}
            className="line-clamp-2 min-h-[2.6em] break-words text-sm font-semibold leading-[1.3] text-white transition-colors group-hover:text-pink-400 sm:text-base"
          >
            {title || "Untitled anime"}
          </h3>

          <div className="flex min-w-0 items-center gap-2 overflow-hidden text-[11px] font-medium text-gray-400 sm:text-xs">
            <span className="shrink-0 uppercase">
              {original_language || "N/A"}
            </span>

            <span className="h-1 w-1 shrink-0 rounded-full bg-pink-400/70" />

            <span className="shrink-0">Movie</span>
          </div>
        </div>
      </a>

      <div className="absolute right-2 top-12 z-20">
        <SaveMovieButton
          movie={movie}
          savedMovieIds={savedMovieIds}
          onSaveToggle={onSaveToggle}
        />
      </div>
    </div>
  );
};

export default MovieCard;

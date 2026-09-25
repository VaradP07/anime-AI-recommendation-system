import { Link } from "react-router-dom";
import SaveMovieButton from "./SaveAnimeButton";

const MovieCard = ({ movie, savedMovieIds, onSaveToggle, onCardClick }) => {
  const {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
  } = movie;

  return (
    <div className="relative group rounded-2xl">
      <a
        href={`/anime/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="movie-card block transition-all hover:scale-105 active:scale-95"
        onClick={() => {
          if (onCardClick) onCardClick(movie);
        }}
      >
        <img
          src={
            poster_path
              ? `https://image.tmdb.org/t/p/w500/${poster_path}`
              : "/no-movie.png"
          }
          alt={title}
        />

        <div className="mt-4">
          <h3>{title}</h3>

          <div className="content">
            <div className="rating">
              <img src="star.svg" alt="Star Icon" />
              <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
            </div>

            <span>•</span>
            <p className="lang">{original_language}</p>

            <span>•</span>
            <p className="year">
              {release_date ? release_date.split("-")[0] : "N/A"}
            </p>
          </div>
        </div>
      </a>
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

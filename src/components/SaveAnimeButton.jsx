
import { useState, useEffect } from "react";
import {
  saveMovieToWatchlist,
  removeMovieFromWatchlist,
} from "../firebase";
import { TiHeartFullOutline, TiHeartOutline } from "react-icons/ti";

const SaveMovieButton = ({
  movie,
  savedMovieIds = [],
  onSaveToggle,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const movieId = movie?.id == null ? "" : String(movie.id);

  const isSaved = savedMovieIds.some(
    (id) => String(id) === movieId
  );

  const toggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaving || !movieId) return;

    setIsSaving(true);

    try {
      if (isSaved) {
        const removed = await removeMovieFromWatchlist(movieId);

        if (removed === false) {
          console.warn("Anime was not found in the saved list.");
        }
      } else {
        await saveMovieToWatchlist(movie);
      }

      // Ask the parent component to reload the saved anime list.
      if (typeof onSaveToggle === "function") {
        await onSaveToggle();
      }
    } catch (error) {
      console.error("Failed to update saved anime:", error);
      alert(error.message || "Could not update your saved anime.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={isSaving}
      aria-label={isSaved ? "Remove from saved anime" : "Save anime"}
      title={isSaved ? "Remove from Saved Anime" : "Save Anime"}
      className="absolute top-4 right-4 z-20 rounded-full border border-white/10 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/80 active:scale-95 disabled:cursor-wait disabled:opacity-50"
    >
      {isSaved ? (
        <TiHeartFullOutline className="text-xl text-red-500" />
      ) : (
        <TiHeartOutline className="text-xl text-white hover:text-red-400" />
      )}
    </button>
  );
};

export default SaveMovieButton;

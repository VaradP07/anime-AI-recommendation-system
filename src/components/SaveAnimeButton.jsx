import { useState, useEffect } from "react";
import { saveMovieToWatchlist, removeMovieFromWatchlist } from "../firebase";
import { TiHeartFullOutline, TiHeartOutline } from "react-icons/ti";

const SaveMovieButton = ({ movie, savedMovieIds, onSaveToggle }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(savedMovieIds?.includes(movie.id) || false);
  }, [movie.id, savedMovieIds]);

  const toggleSave = async (e) => {
    e.preventDefault(); // Prevent navigating to the movie link
    e.stopPropagation();

    if (isSaving) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        await removeMovieFromWatchlist(movie.id);
        setIsSaved(false);
      } else {
        await saveMovieToWatchlist(movie);
        setIsSaved(true);
      }
      if (onSaveToggle) {
        onSaveToggle(); // Callback to refresh global savedMovies list
      }
    } catch (error) {
      console.error("Failed to toggle save", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={toggleSave}
      disabled={isSaving}
      className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 hover:scale-110 active:scale-95 transition-all z-20 group disabled:opacity-50"
    >
      {isSaved ? (
        <TiHeartFullOutline className="text-xl text-red-500 drop-shadow-lg" />
      ) : (
        <TiHeartOutline className="text-xl text-white group-hover:text-red-400 drop-shadow-lg" />
      )}
    </button>
  );
};
export default SaveMovieButton;

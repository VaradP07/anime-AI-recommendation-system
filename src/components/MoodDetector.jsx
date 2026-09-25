import { useState } from "react";

const moods = [
  { name: "Happy", emoji: "😊" },
  { name: "Sad", emoji: "😢" },
  { name: "Angry", emoji: "😡" },
  { name: "Relaxed", emoji: "😌" },
  { name: "Excited", emoji: "🤩" },
  { name: "Motivated", emoji: "💪" },
  { name: "Romantic", emoji: "❤️" },
  { name: "Scared", emoji: "😨" },
];

const MoodDetector = ({ onMoodSelect, onClose }) => {
  const [selectedMood, setSelectedMood] = useState(null);

  const handleMoodClick = (mood) => {
  const moodValue = mood.name.toLowerCase();

  setSelectedMood(mood.name);

  if (onMoodSelect) {
    console.log("Selected mood:", moodValue);
    onMoodSelect(moodValue);
  }

  // Close only the popup
  if (onClose) {
    onClose(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Dark background */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Mood Window */}
      <section className="relative z-10 w-full max-w-2xl">
        <div className="bg-[#1d1c22] border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-pink-400">
                🎭 How are you feeling today?
              </h2>

              <p className="text-gray-400 mt-2">
                Select your mood and discover anime that matches your feelings.
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="ml-4 w-10 h-10 shrink-0 rounded-full bg-white/10 text-white text-xl flex items-center justify-center hover:bg-pink-400 hover:text-black transition"
            >
              ✕
            </button>
          </div>

          {/* Mood Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.name}
                type="button"
                onClick={() => handleMoodClick(mood)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 border ${
                  selectedMood === mood.name
                    ? "bg-pink-500 border-pink-300 scale-105 shadow-lg"
                    : "bg-[#28262f] border-white/10 hover:bg-pink-500/20 hover:border-pink-400 hover:scale-105"
                }`}
              >
                <span className="text-3xl">
                  {mood.emoji}
                </span>

                <span className="text-sm font-semibold text-white">
                  {mood.name}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Mood */}
          {selectedMood && (
            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Your current mood:{" "}
                <span className="text-pink-400 font-bold">
                  {selectedMood}
                </span>
              </p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default MoodDetector;
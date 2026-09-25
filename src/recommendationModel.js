import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Calculates a simple similarity score between two users based on demographic data.
 * @param {Object} prefsA - Preferences/Demographics of User A
 * @param {Object} prefsB - Preferences/Demographics of User B
 * @returns {number} Similarity score (higher is more similar)
 */
const calculateDemographicSimilarity = (prefsA, prefsB) => {
  let score = 0;
  if (!prefsA || !prefsB) return score;

  // Exact match on Country gives high weight
  if (
    prefsA.country &&
    prefsB.country &&
    prefsA.country.toLowerCase() === prefsB.country.toLowerCase()
  ) {
    score += 3;
  }

  // Exact match on State gives additional weight
  if (
    prefsA.state &&
    prefsB.state &&
    prefsA.state.toLowerCase() === prefsB.state.toLowerCase()
  ) {
    score += 2;
  }

  // Age grouping (within 5 years difference)
  if (prefsA.age && prefsB.age) {
    const ageA = parseInt(prefsA.age, 10);
    const ageB = parseInt(prefsB.age, 10);
    if (!isNaN(ageA) && !isNaN(ageB)) {
      const diff = Math.abs(ageA - ageB);
      if (diff <= 2) score += 3;
      else if (diff <= 5) score += 2;
      else if (diff <= 10) score += 1;
    }
  }

  return score;
};

/**
 * Generates movie recommendations for a user based on demographic similarity with other users.
 * @param {Object} currentUserDetails - { uid, prefs }
 * @returns {Promise<Array<string>>} Array of recommended movie IDs
 */
export const getDemographicRecommendations = async (currentUserDetails) => {
  if (
    !currentUserDetails ||
    !currentUserDetails.uid ||
    !currentUserDetails.prefs
  ) {
    return [];
  }

  try {
    // 1. Fetch all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const otherUsers = [];

    // Also collect current user's saved anime to exclude them
    let currentUserSavedIds = new Set();
    const currentUserSavedSnapshot = await getDocs(
      collection(db, "users", currentUserDetails.uid, "saved_movies"),
    );
    currentUserSavedSnapshot.forEach((docSnap) => {
      currentUserSavedIds.add(docSnap.data().movieId.toString());
    });

    // 2. Compute similarity matrix
    for (const docSnap of usersSnapshot.docs) {
      if (docSnap.id === currentUserDetails.uid) continue;

      const userData = docSnap.data();
      const similarity = calculateDemographicSimilarity(
        currentUserDetails.prefs,
        userData.prefs,
      );

      // Only consider users with some similarity
      if (similarity > 0) {
        otherUsers.push({
          uid: docSnap.id,
          similarity,
        });
      }
    }

    // Sort by most similar descending
    otherUsers.sort((a, b) => b.similarity - a.similarity);

    // Top K similar users (e.g. top 5)
    const topUsers = otherUsers.slice(0, 5);

    // 3. Aggregate saved anime from top similar users
    const recommendedMovieScores = {}; // movieId -> score

    for (const topUser of topUsers) {
      const savedSnapshot = await getDocs(
        collection(db, "users", topUser.uid, "saved_movies"),
      );
      savedSnapshot.forEach((docSnap) => {
        const movieId = docSnap.data().movieId.toString();
        // If the current user hasn't saved it already
        if (!currentUserSavedIds.has(movieId)) {
          // Weight the movie by the user's similarity score
          recommendedMovieScores[movieId] =
            (recommendedMovieScores[movieId] || 0) + topUser.similarity;
        }
      });
    }

    // 4. Sort recommended movies by accrued score
    const sortedRecommendations = Object.entries(recommendedMovieScores)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    // Return the Top 10 recommendations
    return sortedRecommendations.slice(0, 10);
  } catch (error) {
    console.error("Error generating demographic recommendations:", error);
    return [];
  }
};


import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --------------------------------------------------
// FIREBASE CONFIGURATION
// --------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export const db = getFirestore(app);

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------

export const signUp = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      prefs: {
        name,
        email,
        profilePic: "",
        age: "",
        phone: "",
        state: "",
        country: "",
      },
    });

    return user;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        prefs: {
          name: user.displayName || "",
          email: user.email || "",
          profilePic: user.photoURL || "",
          age: "",
          phone: "",
          state: "",
          country: "",
        },
      });
    }
  } catch (error) {
    console.error("Error saving Google user profile:", error);
  }

  return user;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        console.error("Auth state error:", error);
        unsubscribe();
        resolve(null);
      }
    );
  });
};

// --------------------------------------------------
// USER PROFILE AND PREFERENCES
// --------------------------------------------------

export const updateUserPrefs = async (prefs) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No user logged in");
    }

    const userRef = doc(db, "users", user.uid);

    await setDoc(userRef, { prefs }, { merge: true });

    return true;
  } catch (error) {
    console.error("Update preferences error:", error);
    throw error;
  }
};

export const getUserPrefs = async () => {
  try {
    const user = auth.currentUser;

    if (!user) return {};

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      return snapshot.data().prefs || {};
    }

    return {};
  } catch (error) {
    console.error("Get preferences error:", error);
    throw error;
  }
};

// --------------------------------------------------
// MOVIE CLICK TRACKING
// --------------------------------------------------

export const updateMovieClickCount = async (movie) => {
  try {
    if (!movie?.id) {
      throw new Error("Movie ID is required");
    }

    const movieRef = doc(db, "movie_clicks", String(movie.id));
    const snapshot = await getDoc(movieRef);

    if (snapshot.exists()) {
      await updateDoc(movieRef, {
        movie,
        count: (snapshot.data().count || 0) + 1,
      });
    } else {
      await setDoc(movieRef, {
        movie,
        count: 1,
      });
    }
  } catch (error) {
    console.error("Error updating movie click count:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const moviesQuery = query(
      collection(db, "movie_clicks"),
      orderBy("count", "desc"),
      limit(10)
    );

    const snapshot = await getDocs(moviesQuery);

    return snapshot.docs.map((documentSnapshot) => ({
      ...documentSnapshot.data(),
      id: documentSnapshot.id,
    }));
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};

// --------------------------------------------------
// SAVED ANIME / WATCHLIST
// Firestore path:
// users/{uid}/saved_movies/{movieId}
// --------------------------------------------------

export const saveMovieToWatchlist = async (movie) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please log in before saving anime.");
    }

    if (!movie?.id) {
      throw new Error("Cannot save anime without an ID.");
    }

    const movieId = String(movie.id);

    const savedMovieRef = doc(
      db,
      "users",
      user.uid,
      "saved_movies",
      movieId
    );

    await setDoc(
      savedMovieRef,
      {
        movieId,
        movie: {
          ...movie,
          id: movie.id,
        },
        savedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error saving anime:", error);
    throw error;
  }
};

export const removeMovieFromWatchlist = async (movieId) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please log in before removing saved anime.");
    }

    if (movieId === undefined || movieId === null) {
      throw new Error("Cannot remove anime without an ID.");
    }

    const savedMovieRef = doc(
      db,
      "users",
      user.uid,
      "saved_movies",
      String(movieId)
    );

    await deleteDoc(savedMovieRef);

    return true;
  } catch (error) {
    console.error("Error removing saved anime:", error);
    throw error;
  }
};

/**
 * Returns saved records, not just IDs.
 *
 * New record:
 * {
 *   movieId: "123",
 *   movie: { id: 123, title: "...", poster_path: "..." },
 *   savedAt: "..."
 * }
 *
 * Older records containing only movieId remain supported.
 */
export const getSavedMovies = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const savedMoviesCollection = collection(
      db,
      "users",
      user.uid,
      "saved_movies"
    );

    const savedMoviesQuery = query(
      savedMoviesCollection,
      orderBy("savedAt", "desc")
    );

    const snapshot = await getDocs(savedMoviesQuery);

    return snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data();

      return {
        ...data,
        movieId: data.movieId ?? documentSnapshot.id,
        movie: data.movie ?? null,
      };
    });
  } catch (error) {
    console.error("Error fetching saved anime:", error);
    throw error;
  }
};
export const resetPassword = async (email) => {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error("Please enter your email address.");
  }

  return sendPasswordResetEmail(auth, normalizedEmail);
};
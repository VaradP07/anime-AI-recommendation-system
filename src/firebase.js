
import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
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
  increment,
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
      email.trim(),
      password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      prefs: {
        name: name || "",
        email: user.email || email,
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
      email.trim(),
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

// Optional auth listener for components that subscribe to auth changes.
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// --------------------------------------------------
// FORGOT PASSWORD
// --------------------------------------------------

export const resetPassword = async (email) => {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error("Please enter your email address.");
  }

  return sendPasswordResetEmail(auth, normalizedEmail);
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

    await setDoc(
      doc(db, "users", user.uid),
      { prefs },
      { merge: true }
    );

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

    const snapshot = await getDoc(doc(db, "users", user.uid));

    return snapshot.exists() ? snapshot.data().prefs || {} : {};
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
    if (movie?.id == null) {
      throw new Error("Movie ID is required");
    }

    const movieRef = doc(db, "movie_clicks", String(movie.id));
    const snapshot = await getDoc(movieRef);

    if (snapshot.exists()) {
      await updateDoc(movieRef, {
        movie,
        count: increment(1),
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

    return snapshot.docs.map((item) => ({
      ...item.data(),
      id: item.data().movie?.id ?? item.id,
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

    if (movie?.id == null) {
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
        movie: { ...movie },
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

    if (movieId == null) {
      throw new Error("Cannot remove anime without an ID.");
    }

    const savedMovieRef = doc(
      db,
      "users",
      user.uid,
      "saved_movies",
      String(movieId)
    );

    // Check whether the record exists before deleting.
    const snapshot = await getDoc(savedMovieRef);

    if (!snapshot.exists()) {
      console.warn("Saved anime record not found:", movieId);
      return false;
    }

    await deleteDoc(savedMovieRef);

    return true;
  } catch (error) {
    console.error("Error removing saved anime:", error);
    throw error;
  }
};

export const getSavedMovies = async () => {
  try {
    const user = auth.currentUser;

    if (!user) return [];

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

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        ...data,
        movieId: data.movieId ?? item.id,
        movie: data.movie ?? null,
      };
    });
  } catch (error) {
    console.error("Error fetching saved anime:", error);
    throw error;
  }
};

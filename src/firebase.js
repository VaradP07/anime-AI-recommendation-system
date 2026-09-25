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
  where,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";

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

const COLLECTION_ID = "searches";

export const signUp = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Save user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      prefs: {
        name: name,
        email: email,
        profilePic: "",
        age: "",
        phone: "",
        state: "",
        country: "",
      },
    });

    return user;
  } catch (error) {
    console.error("Signup error", error);
    throw error;
  }
};

export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  try {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        prefs: {
          name: user.displayName,
          email: user.email,
          profilePic: user.photoURL,
          age: "",
          phone: "",
          state: "",
          country: "",
        },
      });
    }
  } catch (err) {
    console.error("Error saving Google user profile", err);
  }

  return user;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error", error);
  }
};

export const updateUserPrefs = async (prefs) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { prefs }, { merge: true });
    return true;
  } catch (error) {
    console.error("Update prefs error", error);
    throw error;
  }
};

export const getUserPrefs = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return {};
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists() && docSnap.data().prefs) {
      return docSnap.data().prefs;
    }
    return {};
  } catch (error) {
    console.error("Get prefs error", error);
    return {};
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        resolve(null);
      },
    );
  });
};

export const updateMovieClickCount = async (movie) => {
  try {
    const docRef = doc(db, "movie_clicks", movie.id.toString());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        count: docSnap.data().count + 1,
      });
    } else {
      await setDoc(docRef, {
        movie: movie,
        count: 1,
      });
    }
  } catch (error) {
    console.error("Error updating movie click count:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const q = query(
      collection(db, "movie_clicks"),
      orderBy("count", "desc"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((documentSnap) => {
      const data = documentSnap.data();

      return {
        ...data,
        id: documentSnap.id,
      };
    });

  } catch (error) {
    console.error("Error fetching trending movies:", error);

    // IMPORTANT: Return empty array instead of undefined
    return [];
  }
};

export const saveMovieToWatchlist = async (movie) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const savedMovieRef = doc(
      db,
      "users",
      user.uid,
      "saved_movies",
      movie.id.toString(),
    );
    await setDoc(savedMovieRef, {
      movieId: movie.id,
      savedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error saving movie", error);
    throw error;
  }
};

export const removeMovieFromWatchlist = async (movieId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const savedMovieRef = doc(
      db,
      "users",
      user.uid,
      "saved_movies",
      movieId.toString(),
    );
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(savedMovieRef);
    return true;
  } catch (error) {
    console.error("Error removing movie", error);
    throw error;
  }
};

export const getSavedMovies = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const savedMoviesCol = collection(db, "users", user.uid, "saved_movies");
    const q = query(savedMoviesCol, orderBy("savedAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => docSnap.data().movieId);
  } catch (error) {
    console.error("Error fetching saved anime", error);
    return [];
  }
};

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import About from "./components/About";
import Hero from "./components/Hero";
import NavBar from "./components/Navbar";
import Features from "./components/Features";
import Story from "./components/Story";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import AnimeApp from "./animeApp";
import Auth from "./components/Auth";
import MovieDetails from "./components/AnimeDetails";
import { getCurrentUser } from "./firebase";

const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) return null; // Or a loading spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const LandingPage = () => (
    <>
      <NavBar user={user} setUser={setUser} />
      <Hero />
      <About />
      <Features />
      <Story />
      <Contact />
      <Footer />
    </>
  );

  return (
    <Router>
      <main className="relative min-h-screen w-screen overflow-x-hidden">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/anime" replace /> : <LandingPage />}
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/anime" replace />
              ) : (
                <Auth setUser={setUser} />
              )
            }
          />
          <Route path="/dashboard" element={<Navigate to="/anime" replace />} />
          <Route
            path="/anime"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <AnimeApp user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anime/:id"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <MovieDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={user ? "/anime" : "/"} replace />}
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

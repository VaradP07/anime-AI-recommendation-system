import { useState } from "react";
import { login, signUp, getCurrentUser, signInWithGoogle } from "../firebase";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { TiLocationArrow } from "react-icons/ti";

const Auth = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signUp(email, password, name);
      }

      const currentUser = await getCurrentUser();
      if (setUser) setUser(currentUser);

      navigate("/anime");
    } catch (err) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      const currentUser = await getCurrentUser();
      if (setUser) setUser(currentUser);
      navigate("/anime");
    } catch (err) {
      setError(
        err.message || "An error occurred during Google authentication.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#010101] text-white">
      {/* Left Side: Branding & Visuals */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-center items-center px-12 overflow-hidden bg-gradient-to-br from-violet-900/40 via-black to-blue-900/40 border-r border-white/10">
        <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-violet-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-blue-600/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10 text-center">
          <h1 className="special-font font-zentry text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.8] mb-6">
            {isLogin ? "Welcome\nBack" : "Join the\nFandom"}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-blue-50/60 font-circular-web max-w-md mx-auto">
            {isLogin
              ? "Continue your journey through the Anime Sanctuary and unlock new series."
              : "Create your account to join the Fandom and start your cinematic adventure."}
          </p>
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-24 bg-[#010101]">
        {/* Mobile Heading */}
        <div className="md:hidden text-center mb-10 w-full">
          <h2 className="special-font font-zentry text-5xl uppercase leading-[0.8] mb-4">
            {isLogin ? "Welcome Back" : "Join the Fandom"}
          </h2>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
              {isLogin ? "Sign in to account" : "Create new account"}
            </h2>
            <p className="text-sm text-blue-50/60">
              Please enter your details below
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-blue-50/80 mb-2 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="relative block w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-blue-50 placeholder:text-blue-50/30 focus:z-10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm transition-all shadow-inner"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-blue-50/80 mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-blue-50 placeholder:text-blue-50/30 focus:z-10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm transition-all shadow-inner"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-50/80 mb-2 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-blue-50 placeholder:text-blue-50/30 focus:z-10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                {error}
              </div>
            )}

            <div>
              <Button
                id="auth-submit"
                title={
                  loading
                    ? "Processing..."
                    : isLogin
                      ? "Login Now"
                      : "Create Account"
                }
                leftIcon={<TiLocationArrow />}
                containerClass="bg-yellow-300 w-full flex justify-center py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-yellow-400 transition-all rounded-2xl"
              />
            </div>
          </form>

          <div className="mt-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 text-sm font-bold uppercase tracking-widest text-white border border-white/20 hover:bg-white/10 transition-all rounded-2xl"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-blue-50/60">
              {isLogin ? "New here? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-blue-50 hover:text-violet-400 transition-colors underline underline-offset-4"
              >
                {isLogin ? "Sign Up for free" : "Log in to your account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

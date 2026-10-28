
import { useState } from "react";
import {
  login,
  signUp,
  getCurrentUser,
  signInWithGoogle,
  resetPassword,
} from "../firebase";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, X, LockKeyhole, Mail } from "lucide-react";
import Button from "./Button";
import { TiLocationArrow } from "react-icons/ti";

const Auth = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  // --------------------------------------------------
  // LOGIN / SIGNUP
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }

      const currentUser = await getCurrentUser();

      if (setUser) {
        setUser(currentUser);
      }

      navigate("/anime");
    } catch (err) {
      console.error("Authentication error:", err);

      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in.");
      } else if (err.code === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // OPEN / CLOSE FORGOT PASSWORD MODAL
  // --------------------------------------------------

  const openForgotModal = () => {
    setResetEmail(email);
    setResetError("");
    setResetMessage("");
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    if (resetLoading) return;

    setShowForgotModal(false);
    setResetError("");
    setResetMessage("");
  };

  // --------------------------------------------------
  // SEND PASSWORD RESET EMAIL
  // --------------------------------------------------

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setResetError("");
    setResetMessage("");

    const normalizedEmail = resetEmail.trim();

    if (!normalizedEmail) {
      setResetError("Please enter your registered email address.");
      return;
    }

    setResetLoading(true);

    try {
      await resetPassword(normalizedEmail);

      setResetMessage(
        "If an account is registered with this email, a password reset email will be sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setResetError("Too many attempts. Please try again later.");
      } else {
        setResetError(
          "Unable to send the reset email. Please try again."
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  // --------------------------------------------------
  // GOOGLE SIGN-IN
  // --------------------------------------------------

  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await signInWithGoogle();

      const currentUser = await getCurrentUser();

      if (setUser) {
        setUser(currentUser);
      }

      navigate("/anime");
    } catch (err) {
      console.error("Google sign-in error:", err);

      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "block w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-blue-50 placeholder:text-blue-50/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm transition-all shadow-inner";

  const labelClass =
    "block text-sm font-medium text-blue-50/80 mb-2 ml-1";

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#010101] text-white">
      {/* LEFT-SIDE BRANDING */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-center items-center px-12 overflow-hidden bg-gradient-to-br from-violet-900/40 via-black to-blue-900/40 border-r border-white/10">
        <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-violet-600/20 rounded-full blur-[120px]" />

        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-blue-600/20 rounded-full blur-[120px]" />

        <div className="relative z-10 text-center">
          <h1 className="special-font font-zentry text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.8] mb-6">
            {isLogin ? (
              <>
                Welcome
                <br />
                Back
              </>
            ) : (
              <>
                Join the
                <br />
                Fandom
              </>
            )}
          </h1>

          <p className="mt-8 text-lg md:text-xl text-blue-50/60 font-circular-web max-w-md mx-auto">
            {isLogin
              ? "Continue your journey through the Anime Sanctuary and unlock new series."
              : "Create your account to join the Fandom and start your cinematic adventure."}
          </p>
        </div>
      </div>

      {/* LOGIN / SIGNUP FORM */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-24 bg-[#010101]">
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
                  <label className={labelClass}>Full Name</label>

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className={inputClass}
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Email Address</label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setMessage("");
                  }}
                  autoComplete="email"
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <label className={labelClass}>Password</label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      isLogin ? "current-password" : "new-password"
                    }
                    className={`${inputClass} pr-12`}
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-blue-50/60 hover:text-violet-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                {/* FORGOT PASSWORD LINK */}
                {isLogin && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={openForgotModal}
                      disabled={loading}
                      className="text-sm text-violet-300 hover:text-violet-200 transition-colors disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="text-sm text-green-300 bg-green-400/10 p-4 rounded-xl border border-green-400/20"
              >
                {message}
              </div>
            )}

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
          </form>

          {/* GOOGLE SIGN-IN */}
          <div className="mt-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 text-sm font-bold uppercase tracking-widest text-white border border-white/20 hover:bg-white/10 transition-all rounded-2xl disabled:opacity-50"
              type="button"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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

          {/* LOGIN / SIGNUP SWITCH */}
          <div className="text-center mt-8">
            <p className="text-sm text-blue-50/60">
              {isLogin ? "New here? " : "Already have an account? "}

              <button
                type="button"
                onClick={() => {
                  setIsLogin((previous) => !previous);
                  setError("");
                  setMessage("");
                  setShowPassword(false);
                }}
                className="font-semibold text-blue-50 hover:text-violet-400 transition-colors underline underline-offset-4"
              >
                {isLogin
                  ? "Sign Up for free"
                  : "Log in to your account"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !resetLoading) {
              closeForgotModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/10 bg-[#0b0a12] p-7 sm:p-9 shadow-2xl shadow-violet-950/30"
          >
            <button
              type="button"
              onClick={closeForgotModal}
              disabled={resetLoading}
              aria-label="Close password reset dialog"
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X size={21} />
            </button>

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
              <LockKeyhole size={27} />
            </div>

            <h2
              id="forgot-password-title"
              className="mb-2 text-2xl font-extrabold tracking-tight text-white"
            >
              Forgot Password?
            </h2>

            <p className="mb-7 text-sm leading-6 text-white/50">
              Enter your registered email address. We'll send you a
              secure link to create a new password. You don't need to
              remember your current password.
            </p>

            <form
              onSubmit={handleForgotPassword}
              className="space-y-5"
            >
              <div>
                <label className={labelClass}>Email Address</label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                  />

                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetError("");
                      setResetMessage("");
                    }}
                    autoComplete="email"
                    placeholder="name@example.com"
                    className={`${inputClass} pl-12`}
                  />
                </div>
              </div>

              {resetError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
                >
                  {resetError}
                </div>
              )}

              {resetMessage && (
                <div
                  role="status"
                  className="rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm leading-6 text-green-300"
                >
                  {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-2xl bg-[#eaff61] px-4 py-4 text-sm font-extrabold tracking-widest text-black transition-colors hover:bg-[#d9f34d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetLoading ? "SENDING EMAIL..." : "SEND RESET LINK"}
              </button>

              <button
                type="button"
                onClick={closeForgotModal}
                disabled={resetLoading}
                className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-4 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;

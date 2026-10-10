import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  LoaderCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = "http://127.0.0.1:8000/chat";

const AnimeChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey, anime fan! 👋 Welcome to Anime Hub AI. I can help you discover anime, explore new favourites, and answer your anime questions. What would you like to know?",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading, isOpen]);

  // Send a message to the Groq-powered FastAPI endpoint.
  const sendMessage = async (text = input) => {
    const message = text.trim();

    if (!message || isLoading) return;

    const previousMessages = messages.map((item) => ({
      role: item.role,
      content: item.content,
    }));

    const updatedMessages = [
      ...previousMessages,
      {
        role: "user",
        content: message,
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message,
          history: previousMessages.slice(-8),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "The AI assistant could not respond."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.reply || "Sorry, I couldn't generate a reply.",
        },
      ]);
    } catch (error) {
      console.error("Anime chatbot error:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error.message ||
            "Unable to connect to Anime Hub AI. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const suggestions = [
    "Recommend action anime",
    "Anime like Naruto",
    "Best beginner anime",
  ];

  return (
    <>
      <style>{`
        @keyframes chat-pop-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[float_4s_ease-in-out_infinite\\] { animation: none !important; }
        }
      `}</style>
      <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Anime Hub AI Assistant"
          className="group fixed bottom-5 right-5 z-[1000] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 text-white shadow-[0_10px_40px_rgba(124,58,237,0.55)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_14px_50px_rgba(217,70,239,0.5)] motion-safe:animate-[float_4s_ease-in-out_infinite] ring-1 ring-white/25"
        >
          <MessageCircle size={27} className="relative z-10 transition-transform duration-300 group-hover:rotate-[-8deg]" />
          <span className="absolute right-0 top-0 z-20 h-4 w-4 rounded-full border-[3px] border-[#100e17] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <section className="fixed bottom-5 right-5 z-[1000] flex h-[min(660px,calc(100dvh-40px))] w-[min(440px,calc(100vw-28px))] origin-bottom-right animate-[chat-pop-in_240ms_cubic-bezier(0.16,1,0.3,1)] flex-col overflow-hidden rounded-[26px] border border-purple-300/20 bg-[#100b1b] text-white shadow-[0_24px_90px_rgba(0,0,0,0.65),0_0_38px_rgba(139,92,246,0.24)] ring-1 ring-white/5">
          {/* Header */}
          <header className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#281044] via-[#42165f] to-[#7b245f] p-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-pink-400/[0.08]" />
            <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-pink-400/20 blur-3xl" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-fuchsia-400/35 to-indigo-400/20 shadow-lg shadow-black/20">
                <Bot size={24} className="text-pink-100 drop-shadow-[0_0_8px_rgba(244,114,182,0.7)]" />
              </div>
              <div>
                <h2 className="bg-gradient-to-r from-white via-pink-100 to-purple-200 bg-clip-text font-bold tracking-wide text-transparent">Anime Hub AI</h2>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] tracking-wide text-white/65">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  GROQ AI <span className="text-white/30">•</span> Anime companion
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
              className="relative z-10 rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/75 backdrop-blur-md transition duration-200 hover:rotate-90 hover:border-white/25 hover:bg-white/15 hover:text-white"
            >
              <X size={21} />
            </button>
          </header>

          {/* Conversation Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.13),transparent_55%)] p-4 [scrollbar-color:rgba(168,85,247,0.45)_transparent] [scrollbar-width:thin]">
            {messages.map((item, index) => (
              <div
                key={`${index}-${item.role}`}
                className={`flex items-start gap-2 ${
                  item.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Message Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border backdrop-blur-xl ${
                    item.role === "user"
                      ? "border-pink-300/25 bg-gradient-to-br from-pink-500/80 to-purple-600/80 shadow-lg shadow-pink-950/20"
                      : "border-white/15 bg-white/[0.08] text-pink-200 shadow-lg shadow-purple-950/20"
                  }`}
                >
                  {item.role === "user" ? (
                    <User size={16} />
                  ) : (
                    <Bot size={17} />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`min-w-0 max-w-[92%] overflow-hidden rounded-2xl border px-3.5 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-xl transition-colors ${
                    item.role === "user"
                      ? "rounded-tr-md border-fuchsia-300/20 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-purple-950/30"
                      : item.isError
                      ? "rounded-tl-md border-red-400/20 bg-red-950/40 text-red-200 shadow-red-950/10"
                      : "rounded-tl-md border-violet-300/15 bg-[#1d1729] text-gray-100 shadow-black/20"
                  }`}
                >
                  {item.role === "user" || item.isError ? (
                    <p className="whitespace-pre-wrap break-words">
                      {item.content}
                    </p>
                  ) : (
                    <div className="chat-markdown break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="mb-2 mt-3 text-lg font-bold text-white first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="mb-2 mt-3 text-base font-bold text-white first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="mb-1 mt-3 text-sm font-bold text-pink-300 first:mt-0">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="my-2 leading-6 first:mt-0 last:mb-0">
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-pink-300">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="text-purple-200">{children}</em>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-2 list-disc space-y-1 pl-5 marker:text-pink-400">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-2 list-decimal space-y-1 pl-5 marker:font-bold marker:text-pink-300">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="pl-1 leading-6">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="my-3 border-l-2 border-pink-400 pl-3 text-gray-300">
                              {children}
                            </blockquote>
                          ),
                          hr: () => <hr className="my-3 border-white/10" />,
                          table: ({ children }) => (
                            <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-white/10">
                              <table className="w-full min-w-[280px] border-collapse text-left text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-purple-500/20 text-pink-200">
                              {children}
                            </thead>
                          ),
                          th: ({ children }) => (
                            <th className="border-b border-white/10 px-2 py-2 font-bold">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border-b border-white/5 px-2 py-2 align-top text-gray-300">
                              {children}
                            </td>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-300 underline underline-offset-2 hover:text-pink-300"
                            >
                              {children}
                            </a>
                          ),
                          code: ({ children }) => (
                            <code className="rounded bg-black/30 px-1 py-0.5 text-pink-200">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs text-gray-300 backdrop-blur-xl">
                <LoaderCircle
                  size={17}
                  className="animate-spin text-pink-400"
                />
                Anime Hub AI is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Messages */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 border-t border-white/[0.07] bg-[#130e20] px-3.5 py-3">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="rounded-full border border-violet-300/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-3 py-2 text-[11px] text-purple-100 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-fuchsia-300/50 hover:from-violet-500/25 hover:to-fuchsia-500/25 hover:text-white disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Message Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-white/10 bg-[#171020] p-3.5"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about anime..."
              maxLength={2000}
              disabled={isLoading}
              aria-label="Message Anime Hub AI"
              className="min-w-0 flex-1 rounded-2xl border border-violet-300/15 bg-[#0d0915] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/15"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-pink-500/90 to-purple-600/90 text-white shadow-lg shadow-purple-950/30 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      </>
    </>
  );
};

export default AnimeChatbot;


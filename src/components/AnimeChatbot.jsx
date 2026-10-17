
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

export default function AnimeChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey, anime fan! 👋 Welcome to Anime Hub AI. Ask me about anime recommendations, characters, genres, or your next favourite show!",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, isOpen]);

  async function sendMessage(text = input) {
    const message = text.trim();

    if (!message || isLoading) return;

    const previousMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((current) => [
      ...current,
      { role: "user", content: message },
    ]);

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
          typeof data.detail === "string"
            ? data.detail
            : "The AI assistant could not respond."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn't generate a reply.",
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
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  const suggestions = [
    "Recommend action anime",
    "Anime like Naruto",
    "Best beginner anime",
  ];

  return createPortal(
    <>
      <style>{`
        .anime-chat-launcher {
          position: fixed !important;
          right: max(16px, env(safe-area-inset-right, 0px)) !important;
          bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important;
          top: auto !important;
          left: auto !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 64px !important;
          height: 64px !important;
          min-width: 64px !important;
          min-height: 64px !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          touch-action: manipulation;
          border: 2px solid white;
          border-radius: 50%;
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          color: white;
          box-shadow: 0 0 28px rgba(168, 85, 247, 0.75);
          cursor: pointer;
        }

        .anime-chat-window {
          position: fixed !important;
          right: max(12px, env(safe-area-inset-right, 0px)) !important;
          bottom: max(12px, env(safe-area-inset-bottom, 0px)) !important;
          top: auto !important;
          left: auto !important;
          z-index: 2147483647 !important;
          display: flex !important;
          flex-direction: column !important;
          width: min(440px, calc(100vw - 24px)) !important;
          height: min(660px, calc(100dvh - 24px)) !important;
          max-width: calc(100vw - 24px) !important;
          max-height: calc(100dvh - 24px) !important;
          overflow: hidden;
          border: 1px solid rgba(216, 180, 254, 0.25);
          border-radius: 24px;
          background: #100b1b;
          color: white;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.65);
          animation: anime-chat-appear 180ms ease-out;
        }

        @keyframes anime-chat-appear {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .anime-chat-messages {
          flex: 1 1 0%;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .anime-chat-markdown p {
          margin: 6px 0;
          overflow-wrap: anywhere;
        }

        .anime-chat-markdown ul {
          margin: 8px 0;
          padding-left: 20px;
          list-style: disc;
        }

        .anime-chat-markdown ol {
          margin: 8px 0;
          padding-left: 20px;
          list-style: decimal;
        }

        .anime-chat-markdown a {
          color: #d8b4fe;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .anime-chat-launcher {
            right: max(14px, env(safe-area-inset-right, 0px)) !important;
            bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important;
            width: 58px !important;
            height: 58px !important;
            min-width: 58px !important;
            min-height: 58px !important;
          }

          .anime-chat-window {
            right: max(8px, env(safe-area-inset-right, 0px)) !important;
            bottom: max(8px, env(safe-area-inset-bottom, 0px)) !important;
            width: calc(100vw - 16px) !important;
            height: calc(100dvh - 16px) !important;
            max-width: calc(100vw - 16px) !important;
            max-height: calc(100dvh - 16px) !important;
            border-radius: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .anime-chat-window {
            animation: none;
          }
        }
      `}</style>

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Anime Hub AI Assistant"
          className="anime-chat-launcher"
        >
          <MessageCircle size={27} />
          <span
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#34d399",
              border: "2px solid #100b1b",
            }}
          />
        </button>
      )}

      {isOpen && (
        <section
          className="anime-chat-window"
          role="dialog"
          aria-label="Anime Hub AI Assistant"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-purple-950 via-purple-900 to-fuchsia-900 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <Bot size={25} className="text-pink-200" />
              </div>

              <div>
                <h2 className="font-bold text-white">Anime Hub AI</h2>
                <p className="mt-1 text-xs text-purple-200">
                  ● Groq AI · Anime companion
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
              className="rounded-xl bg-white/10 p-2 hover:bg-white/20"
            >
              <X size={22} />
            </button>
          </header>

          <div className="anime-chat-messages space-y-4 bg-gradient-to-b from-purple-950/30 to-transparent p-4">
            {messages.map((item, index) => (
              <div
                key={`${index}-${item.role}`}
                className={`flex items-start gap-2 ${
                  item.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    item.role === "user"
                      ? "bg-fuchsia-600"
                      : "border border-white/10 bg-white/10 text-pink-200"
                  }`}
                >
                  {item.role === "user" ? (
                    <User size={17} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>

                <div
                  className={`min-w-0 max-w-[85%] break-words rounded-2xl border px-3 py-3 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "rounded-tr-sm border-purple-400/30 bg-purple-600"
                      : item.isError
                        ? "rounded-tl-sm border-red-400/30 bg-red-950/60 text-red-200"
                        : "rounded-tl-sm border-white/10 bg-[#21182f] text-gray-100"
                  }`}
                >
                  {item.role === "user" || item.isError ? (
                    <p className="whitespace-pre-wrap">{item.content}</p>
                  ) : (
                    <div className="anime-chat-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <LoaderCircle size={18} className="animate-spin" />
                Anime Hub AI is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex shrink-0 flex-wrap gap-2 border-t border-white/10 bg-[#130e20] p-3">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 hover:bg-purple-500/25 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-[#171020] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about anime..."
              maxLength={2000}
              disabled={isLoading}
              aria-label="Message Anime Hub AI"
              className="min-w-0 flex-1 rounded-xl border border-purple-400/20 bg-[#0d0915] px-3 py-3 text-base text-white outline-none placeholder:text-gray-500 focus:border-purple-400"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white disabled:opacity-40"
            >
              <Send size={19} />
            </button>
          </form>
        </section>
      )}
    </>,
    document.body
  );
}

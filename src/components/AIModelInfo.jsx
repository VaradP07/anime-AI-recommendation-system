import React from "react";

const AIModelInfo = () => {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f]">
        
        {/* Header */}
        <div className="border-b border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-xl">
              🤖
            </div>

            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                How Anime Hub AI Works
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Content-based machine learning recommendation system
              </p>
            </div>
          </div>
        </div>

        {/* Model Information */}
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Dataset
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              1,000
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Anime records
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Algorithm
            </p>
            <p className="mt-2 text-lg font-bold text-white">
              Content-Based
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Recommendation
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Vectorization
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              TF-IDF
            </p>
            <p className="mt-1 text-xs text-gray-400">
              374 generated features
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Similarity
            </p>
            <p className="mt-2 text-lg font-bold text-white">
              Cosine Similarity
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Top 10 recommendations
            </p>
          </div>
        </div>

        {/* AI Pipeline */}
        <div className="border-t border-white/10 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white">
            Recommendation Pipeline
          </h3>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              ["01", "Anime Data", "Genres + Overview"],
              ["02", "Text Processing", "Prepare content"],
              ["03", "TF-IDF", "Create feature vectors"],
              ["04", "Cosine Similarity", "Compare anime"],
              ["05", "Top 10", "Generate recommendations"],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span className="text-xs font-bold text-pink-400">
                  {number}
                </span>

                <h4 className="mt-2 text-sm font-bold text-white">
                  {title}
                </h4>

                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation */}
        <div className="border-t border-white/10 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white">
            Model Evaluation
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
            The recommendation system was evaluated on the 1,000-anime
            dataset. The evaluation uses genre overlap as a relevance
            indicator and reports recommendation coverage and average
            similarity.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-gray-500">Precision@5*</p>
              <p className="mt-2 text-2xl font-black text-pink-400">
                99.98%
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-gray-500">Coverage</p>
              <p className="mt-2 text-2xl font-black text-pink-400">
                98.70%
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-gray-500">
                Average Top-10 Similarity
              </p>
              <p className="mt-2 text-2xl font-black text-pink-400">
                69.20%
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
            * Precision values use genre overlap as the relevance proxy and
            should not be interpreted as overall model accuracy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AIModelInfo;
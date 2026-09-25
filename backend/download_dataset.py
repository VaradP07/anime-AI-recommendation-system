import pandas as pd


# Read the large downloaded dataset
df = pd.read_csv("data/original_anime_dataset.csv")

print("Original dataset:", len(df), "anime")


# Remove rows with missing important information
df = df.dropna(subset=["id", "title", "genres", "image"])


# Convert popularity/rank columns to numbers
df["num_list_users"] = pd.to_numeric(
    df["num_list_users"],
    errors="coerce"
)

df["mean"] = pd.to_numeric(
    df["mean"],
    errors="coerce"
)


# Fill missing popularity with 0
df["num_list_users"] = df["num_list_users"].fillna(0)


# Select the 1000 most popular anime
df = df.sort_values(
    by="num_list_users",
    ascending=False
).head(1000)


# Create overview using available dataset information
df["overview"] = (
    "Genres: " + df["genres"].fillna("") +
    ". Studio: " + df["studios"].fillna("") +
    ". Rating: " + df["mean"].fillna(0).astype(str)
)


# Keep only the columns required by your recommender
anime_data = df[
    [
        "id",
        "title",
        "genres",
        "overview",
        "image"
    ]
].copy()


# Save the final 1000-anime dataset
anime_data.to_csv(
    "data/anime_data.csv",
    index=False
)


print("\nSuccess! Created anime_data.csv")
print("Total anime:", len(anime_data))

print("\nFirst 5 anime:")
print(anime_data.head())
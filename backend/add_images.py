import pandas as pd
import requests
import time


# Read CSV
df = pd.read_csv("data/anime_data.csv")

# Make sure image column exists
if "image" not in df.columns:
    df["image"] = ""

# Force image column to store text
df["image"] = df["image"].astype("object")


def get_anime_image(title):

    url = "https://api.jikan.moe/v4/anime"

    # Try 3 times
    for attempt in range(3):

        try:
            print(f"  Attempt {attempt + 1}/3...")

            response = requests.get(
                url,
                params={
                    "q": title,
                    "limit": 1
                },
                timeout=30
            )

            if response.status_code == 200:

                data = response.json()

                if "data" in data and len(data["data"]) > 0:

                    image_url = data["data"][0]["images"]["jpg"]["image_url"]

                    print("  Image found!")

                    return image_url

                print("  No anime found")
                return ""

            else:
                print(f"  API error: {response.status_code}")

        except Exception as e:
            print(f"  Request error: {e}")

        # Wait before trying again
        time.sleep(5)

    return ""


# Find images
for index, anime in df.iterrows():

    title = anime["title"]

    # Skip anime that already has an image
    if pd.notna(anime["image"]) and str(anime["image"]).strip() != "":
        print(f"Skipping {title} - image already exists")
        continue

    print(f"\nFinding image for: {title}")

    image_url = get_anime_image(title)

    df.at[index, "image"] = image_url

    # Important: wait between anime requests
    time.sleep(3)


# Save CSV
df.to_csv("data/anime_data.csv", index=False)

print("\nDone! Images added successfully.")
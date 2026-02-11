import requests
import os
from datetime import datetime, timedelta

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

recommendation_cache = {}
CACHE_TTL = timedelta(hours=24)


def fetch_youtube_video(query):

    cache_key = query

    if cache_key in recommendation_cache:
        cached = recommendation_cache[cache_key]
        if datetime.utcnow() - cached["timestamp"] < CACHE_TTL:
            return cached["data"]

    search_url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 1,
        "videoDuration": "medium",
        "key": YOUTUBE_API_KEY
    }

    try:
        response = requests.get(search_url, params=params, timeout=3)
        data = response.json()

        if "items" in data and len(data["items"]) > 0:
            video = data["items"][0]
            video_id = video["id"]["videoId"]

            result = {
                "title": video["snippet"]["title"],
                "type": "video",
                "url": f"https://www.youtube.com/watch?v={video_id}"
            }

            recommendation_cache[cache_key] = {
                "timestamp": datetime.utcnow(),
                "data": result
            }

            return result

    except Exception as e:
        print("YouTube API error:", e)

    return None

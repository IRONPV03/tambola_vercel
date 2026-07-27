import os
import redis
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("UPSTASH_REDIS_URL")

if not redis_url:
    raise RuntimeError(
        "UPSTASH_REDIS_URL environment variable is not set."
    )

redis_client = redis.from_url(
    redis_url,
    decode_responses=True
)
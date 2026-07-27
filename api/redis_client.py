import os
import redis
from dotenv import load_dotenv

load_dotenv()

redis_client = redis.from_url(
    os.getenv("UPSTASH_REDIS_URL"),
    decode_responses=True
)
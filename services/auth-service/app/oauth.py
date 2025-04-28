from authlib.integrations.starlette_client import OAuth
import os
from dotenv import load_dotenv

# Load environment variables from .env file
if os.path.exists('.env'):
    load_dotenv('.env')
else:
    print("No .env file found. Make sure to set environment variables manually.")

print("Client ID:", os.getenv("GOOGLE_CLIENT_ID"))
print("Client Secret:", os.getenv("GOOGLE_CLIENT_SECRET"))
print("Base URL:", os.getenv("BASE_URL"))

# Initialize OAuth
# load_dotenv()

oauth = OAuth()
oauth.settings = {"BASE_URL": os.getenv("BASE_URL")}

oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)


async def get_google_user(token):
    return await oauth.google.userinfo(token=token)

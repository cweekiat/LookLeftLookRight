from fastapi import FastAPI, Depends, Request
from app.oauth import oauth, get_google_user

from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your-random-secret")

@app.get("/login/google")
async def login_via_google(request: Request):
    redirect_uri = f"{oauth.settings['BASE_URL']}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = await get_google_user(token)
    return {"email": user_info['email'], "name": user_info['name']}



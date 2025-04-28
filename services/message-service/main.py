from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS so frontend can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only. Restrict in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/message")
def get_message():
    return {"message": "Hello from FastAPI microservice!"}

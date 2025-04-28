# portfolio-service/app/main.py

from fastapi import FastAPI
from app.routes import portfolio_routes, transaction_routes, market_routes  
from app.database import engine
from app.models import Base

app = FastAPI()

# Include routers
app.include_router(portfolio_routes.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(transaction_routes.router, prefix="/portfolio", tags=["Transactions"])
app.include_router(market_routes.router, prefix="/market", tags=["Market Events"])  

Base.metadata.create_all(bind=engine)

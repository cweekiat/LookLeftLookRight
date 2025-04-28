from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Load from environment variables or default values for development
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/portfolio_db")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

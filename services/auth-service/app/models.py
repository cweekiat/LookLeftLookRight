class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # nullable for OAuth users
    provider = Column(String, default="local")        # 'google', 'local', etc.
    sub_id = Column(String, nullable=True)            # Google's user id (optional)

from pydantic import BaseModel

class PortfolioUpdateRequest(BaseModel):
    name: str

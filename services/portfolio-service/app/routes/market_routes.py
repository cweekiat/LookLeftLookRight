from fastapi import APIRouter, Query
from datetime import datetime

router = APIRouter()

# Sample static market events
MARKET_EVENTS = [
    {"date": "2020-03-12", "headline": "Global markets crash due to COVID-19 pandemic fears."},
    {"date": "2020-11-09", "headline": "Pfizer announces COVID-19 vaccine efficacy, markets rally."},
    {"date": "2021-01-06", "headline": "Capitol riots in US shake investor confidence briefly."},
    {"date": "2021-11-10", "headline": "US inflation hits 30-year high, concerns over Fed rate hikes."},
    {"date": "2022-02-24", "headline": "Russia invades Ukraine, markets drop sharply."},
    {"date": "2022-06-15", "headline": "Federal Reserve hikes rates by 75bps, largest since 1994."},
    {"date": "2023-03-10", "headline": "Silicon Valley Bank collapse triggers tech sector selloff."},
    {"date": "2023-10-12", "headline": "US bond yields surge, fears of economic slowdown increase."},
    {"date": "2024-01-25", "headline": "Tech stocks rally on strong AI growth projections."},
    {"date": "2024-08-15", "headline": "Oil prices spike due to Middle East tensions."},
    {"date": "2025-03-05", "headline": "Global markets stabilize on easing inflation fears."}
]

@router.get("/events")
def get_market_events(start_date: str = Query("2020-01-01"), end_date: str = Query(datetime.utcnow().strftime("%Y-%m-%d"))):
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")

    filtered_events = [event for event in MARKET_EVENTS if start_dt <= datetime.strptime(event["date"], "%Y-%m-%d") <= end_dt]

    return {"events": filtered_events}

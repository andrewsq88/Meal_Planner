import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recipe_scrapers import scrape_me

app = FastAPI(title="Recipe Scraper Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    title: str = ""
    description: str = ""
    ingredients: list[str] = []
    image: str = ""
    total_time: int = 0
    servings: str = ""


def _safe(fn, default=None):
    try:
        result = fn()
        return result if result is not None else default
    except Exception:
        return default


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_recipe(body: ScrapeRequest):
    url = body.url.strip()
    if not url or not url.startswith("http"):
        raise HTTPException(status_code=400, detail="A valid http(s) URL is required")

    try:
        scraper = scrape_me(url, wild_mode=True)
    except Exception as exc:
        # recipe-scrapers raises various exceptions for unsupported / unreachable sites;
        # return 422 so the edge function knows to skip this path gracefully.
        raise HTTPException(status_code=422, detail=f"Could not scrape recipe: {exc}")

    title = _safe(scraper.title, "")
    description = _safe(scraper.description, "")
    raw_ingredients = _safe(scraper.ingredients, [])
    image = _safe(scraper.image, "")
    total_time_raw = _safe(scraper.total_time, 0)
    servings_raw = _safe(scraper.yields, "")

    # Guard against None coming back from _safe despite the default
    ingredients = [str(i) for i in (raw_ingredients or [])[:24]]
    total_time = int(total_time_raw) if total_time_raw else 0

    return ScrapeResponse(
        title=str(title or "")[:200],
        description=str(description or "")[:400],
        ingredients=ingredients,
        image=str(image or ""),
        total_time=total_time,
        servings=str(servings_raw or ""),
    )

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recipe_scrapers import scrape_me, WebsiteNotImplementedError, NoSchemaFoundInWildMode

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
    supported: bool = True


def _safe(fn, default=""):
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
    except (WebsiteNotImplementedError, NoSchemaFoundInWildMode) as exc:
        raise HTTPException(status_code=422, detail=f"Site not supported: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {exc}")

    title = _safe(scraper.title)
    description = _safe(scraper.description)
    ingredients = _safe(scraper.ingredients, default=[])
    image = _safe(scraper.image)
    total_time_raw = _safe(scraper.total_time, default=0)
    servings_raw = _safe(scraper.yields, default="")

    return ScrapeResponse(
        title=str(title)[:200],
        description=str(description)[:400] if description else "",
        ingredients=[str(i) for i in ingredients[:24]],
        image=str(image) if image else "",
        total_time=int(total_time_raw) if total_time_raw else 0,
        servings=str(servings_raw) if servings_raw else "",
    )

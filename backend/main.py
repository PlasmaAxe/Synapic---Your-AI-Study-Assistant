import json
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH)

DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173"]
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="StudyForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Flashcard(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class NotesInput(BaseModel):
    text: str = Field(min_length=1)


class FlashcardsResponse(BaseModel):
    flashcards: List[Flashcard]


def get_client() -> Groq:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in backend/.env")
    return Groq(api_key=GROQ_API_KEY)


def strip_code_fences(text: str) -> str:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        if len(parts) >= 2:
            cleaned = parts[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]

    return cleaned.strip()


@app.get("/")
async def root():
    return {"message": "StudyForge API is running"}


@app.post("/generate-flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(payload: NotesInput):
    notes = payload.text.strip()
    if not notes:
        raise HTTPException(status_code=400, detail="Notes cannot be empty.")

    prompt = (
        "Turn these study notes into concise flashcards.\n"
        "Return valid JSON only - no markdown, no backticks, no explanation.\n"
        'Use exactly this format: [{"question": "...", "answer": "..."}]\n\n'
        f"Notes:\n{notes}"
    )

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.choices[0].message.content or ""
        cleaned_text = strip_code_fences(raw_text)
        data = json.loads(cleaned_text)
        flashcards = [Flashcard.model_validate(item) for item in data]
        return FlashcardsResponse(flashcards=flashcards)
    except HTTPException:
        raise
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="The AI did not return valid JSON flashcards.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

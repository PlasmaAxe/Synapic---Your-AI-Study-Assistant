import json
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

ENV_PATH = Path(__file__).with_name(".env") #this loads the .env file from the backend directory, not the root of the project (to get api keys and whatnot)
load_dotenv(dotenv_path=ENV_PATH)

DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="Synapic API") #this creates the backend server using FastAPI, which will handle requests from the frontend and interact with the Groq API to generate flashcards based on user input.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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


def get_client() -> Groq: #ensures key to run the app
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY environment variable")
    return Groq(api_key=GROQ_API_KEY)


def strip_code_fences(text: str) -> str: #cleans up the response/AI output to look presentable and so python can read it
    cleaned = text.strip()

    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        if len(parts) >= 2:
            cleaned = parts[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]

    return cleaned.strip()


def extract_notes(payload: NotesInput | str) -> str:
    if isinstance(payload, str):
        notes = payload.strip()
    else:
        notes = payload.text.strip()

    if not notes:
        raise HTTPException(status_code=400, detail="Notes cannot be empty.")

    return notes


@app.get("/")
async def root():
    return {"message": "Synapic API is running"}


@app.post("/generate-flashcards", response_model=FlashcardsResponse) #generates flashcards
async def generate_flashcards(payload: NotesInput | str):
    notes = extract_notes(payload)

    prompt = ( #prompts the AI to create flashcards based on the user's notes.
        "Turn these study notes into concise flashcards.\n"
        "Return valid JSON only - no markdown, no backticks, no explanation.\n"
        'Use exactly this format: [{"question": "...", "answer": "..."}]\n\n'
        f"Notes:\n{notes}"
    )

    try:
        client = get_client()
        response = client.chat.completions.create( #sends the prompt
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.choices[0].message.content or ""
        cleaned_text = strip_code_fences(raw_text)
        data = json.loads(cleaned_text) #convert to python
        flashcards = [Flashcard.model_validate(item) for item in data] #validates its correct
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


# ── New models ──────────────────────────────────────────────
class QuizOption(BaseModel):
    label: str #A B C D
    text: str

class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    correct: str #A B C D
    explanation: str

class QuizResponse(BaseModel):
    quiz: List[QuizQuestion]

class SummaryResponse(BaseModel):
    title: str
    overview: str
    key_points: List[str]
    conclusion: str

# ── Quiz endpoint ────────────────────────────────────────────
@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(payload: NotesInput | str):
    notes = extract_notes(payload)

    prompt = (
        "Turn these study notes into a multiple choice quiz.\n"
        "Return valid JSON only — no markdown, no backticks, no explanation.\n"
        "Use exactly this format:\n"
        '[{"question": "...", "options": [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, {"label": "C", "text": "..."}, {"label": "D", "text": "..."}], "correct": "A", "explanation": "..."}]\n\n'
        f"Notes:\n{notes}"
    )

    try:
        client = get_client() 
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.choices[0].message.content or ""
        cleaned = strip_code_fences(raw_text)
        data = json.loads(cleaned)
        questions = [QuizQuestion.model_validate(q) for q in data]

        return QuizResponse(quiz=questions) #it got the quiz from groqs api, now we return it to the frontend for the user to see
    except HTTPException:
        raise
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="The AI did not return valid JSON quiz data.",
        ) from exc
    except Exception as exc: #hanldes any potentialerrors
        print(f"ERROR: {exc}")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# ── Summary endpoint ────────────────────────────────────────────
@app.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(payload: NotesInput | str):
    notes = extract_notes(payload)

    prompt = ( #double check the prompt for summary - Shyam
        "Summarise these study notes.\n"
        "Return valid JSON only — no markdown, no backticks, no explanation.\n"
        "Use exactly this format:\n"
        '{"title": "...", "overview": "5-10 sentence overview", "key_points": ["point 1", "point 2", "point 3"], "conclusion": "..."}\n\n'
        f"Notes:\n{notes}"
    )

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.choices[0].message.content or ""
        cleaned = strip_code_fences(raw_text)
        data = json.loads(cleaned)

        return SummaryResponse.model_validate(data)
    except HTTPException:
        raise
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="The AI did not return valid JSON summary data.",
        ) from exc
    except Exception as exc:
        print(f"ERROR: {exc}")
        raise HTTPException(status_code=502, detail=str(exc)) from exc




#Run the server:                (using Uvicorn, which is an ASGI server for Python. It will serve the FastAPI app and allow it to handle incoming requests from the frontend.)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

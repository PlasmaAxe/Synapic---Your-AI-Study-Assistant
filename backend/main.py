import json
import os
import re      # NEW: paragraph / sentence splitting
import time    # NEW: rate-limit delay between Groq calls
from pathlib import Path
from typing import Any, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH)

DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ── Sizing constants ─────────────────────────────────────────────────────────
# Each chunk sent to Groq must stay under this size.
# 10,000 chars ≈ 2,500 tokens, which leaves plenty of room for the system
# prompt plus a full JSON response inside Groq's context window.
CHUNK_SIZE = 10_000

# Hard ceiling on total raw user input BEFORE we even start chunking.
# 120,000 chars ≈ 90 dense A4 pages — more than enough for a whole semester.
MAX_INPUT_CHARS = 120_000

# How many results to keep after merging chunks from all sections.
# Raise these later if students tell you they want more.
MAX_FLASHCARDS = 200
MAX_QUIZ_QUESTIONS = 100

# Pause between consecutive Groq calls to respect the rate limit.
# If you start seeing 429 errors on the free tier, raise this to 1.0.
CHUNK_DELAY = 0.5  # seconds

app = FastAPI(title="Synapic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ──────────────────────────────────────────────────────────

class Flashcard(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class NotesInput(BaseModel):
    text: str = Field(min_length=1)


class FlashcardsResponse(BaseModel):
    flashcards: List[Flashcard]


class QuizOption(BaseModel):
    label: str   # A B C D
    text: str


class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    correct: str   # A B C D
    explanation: str


class QuizResponse(BaseModel):
    quiz: List[QuizQuestion]


class SummaryResponse(BaseModel):
    title: str
    overview: str
    key_points: List[str]
    conclusion: str


# ── Core Groq helpers ────────────────────────────────────────────────────────

def check_text_length(text: str) -> dict | None:
    """Return an error dict if text is over the absolute limit, else None."""
    if len(text) > MAX_INPUT_CHARS:
        return {
            "error": "text_too_long",
            "message": (
                f"Your text is {len(text):,} characters. "
                f"Please keep it under {MAX_INPUT_CHARS:,} characters."
            ),
            "character_count": len(text),
            "max_characters": MAX_INPUT_CHARS,
        }
    return None


def get_client() -> Groq:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing GROQ_API_KEY environment variable",
        )
    return Groq(api_key=GROQ_API_KEY)


def create_chat_completion(prompt: str) -> Any:
    try:
        client = get_client()
        return client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
    except HTTPException:
        raise
    except Exception as exc:
        error_str = str(exc)
        if "429" in error_str or "rate_limit" in error_str.lower():
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit",
                    "message": (
                        "The AI service is temporarily rate-limited. "
                        "Please wait 60 seconds and try again."
                    ),
                },
            ) from exc
        raise HTTPException(
            status_code=500,
            detail={"error": "ai_error", "message": error_str},
        ) from exc


def strip_code_fences(text: str) -> str:
    """Remove markdown code fences so we can safely JSON-parse the output."""
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

    length_error = check_text_length(notes)
    if length_error:
        raise HTTPException(status_code=400, detail=length_error)

    return notes


# ── Chunking helpers ─────────────────────────────────────────────────────────

def chunk_text(text: str, max_chars: int = CHUNK_SIZE) -> list[str]:
    """
    Split *text* into a list of strings each no longer than *max_chars*.

    Why does the order of splitting matter?
    - Paragraph breaks are the most natural place to split — the LLM gets a
      complete train of thought in each chunk.
    - Sentence breaks are next best — at least each sentence is complete.
    - Hard cuts (last resort) only happen if a single sentence is enormous,
      e.g. a student pasted a wall of text with no punctuation at all.

    Never cuts a word in half, so the LLM never sees a broken token.
    """
    # Normalise Windows line endings, then split on blank lines (paragraphs)
    normalised = text.replace('\r\n', '\n')
    paragraphs = re.split(r'\n{2,}', normalised)

    # If the whole text is one giant paragraph, fall back to single-newline splits
    if len(paragraphs) == 1:
        paragraphs = normalised.split('\n')

    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    chunks: list[str] = []
    current: str = ""

    for para in paragraphs:
        if len(para) > max_chars:
            # ── Paragraph too big → split on sentence boundaries ─────────────
            # The lookbehind (?<=[.!?]) keeps the punctuation attached to the
            # left sentence rather than orphaning it on the next line.
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sent in sentences:
                if len(current) + len(sent) + 1 > max_chars:
                    if current:
                        chunks.append(current.strip())
                    if len(sent) > max_chars:
                        # ── Single sentence still too big → hard cut ─────────
                        for start in range(0, len(sent), max_chars):
                            chunks.append(sent[start: start + max_chars])
                        current = ""
                    else:
                        current = sent
                else:
                    current = (current + " " + sent).strip() if current else sent
        else:
            # ── Paragraph fits — try appending to the running chunk ───────────
            candidate = (current + "\n\n" + para).strip() if current else para
            if len(candidate) > max_chars:
                if current:
                    chunks.append(current.strip())
                current = para
            else:
                current = candidate

    if current:
        chunks.append(current.strip())

    # Always return at least one element so callers don't need to handle empty lists
    return chunks or [text]


def deduplicate_flashcards(
    cards: list[Flashcard],
    max_cards: int = MAX_FLASHCARDS,
) -> list[Flashcard]:
    """
    Drop near-duplicate cards and cap the total at max_cards.

    'Near-duplicate' means the first 60 characters of the question are identical
    after lowercasing. This catches things like the same question generated
    from two overlapping chunks without being so aggressive that it removes
    legitimately similar-but-distinct questions.
    """
    seen: set[str] = set()
    result: list[Flashcard] = []
    for card in cards:
        key = card.question.lower().strip()[:60]
        if key not in seen:
            seen.add(key)
            result.append(card)
        if len(result) >= max_cards:
            break
    return result


def deduplicate_quiz(
    questions: list[QuizQuestion],
    max_q: int = MAX_QUIZ_QUESTIONS,
) -> list[QuizQuestion]:
    """Same dedup logic as deduplicate_flashcards but for QuizQuestion objects."""
    seen: set[str] = set()
    result: list[QuizQuestion] = []
    for q in questions:
        key = q.question.lower().strip()[:60]
        if key not in seen:
            seen.add(key)
            result.append(q)
        if len(result) >= max_q:
            break
    return result


def _summarise_text(text: str) -> SummaryResponse:
    """
    Ask Groq for one structured SummaryResponse from *text*.
    Called both for short inputs (single pass) and for the final merge step
    when the input was chunked (two-pass).
    """
    prompt = (
        "Summarise these study notes.\n"
        "Return valid JSON only — no markdown, no backticks, no explanation.\n"
        "Use exactly this format:\n"
        '{"title": "...", "overview": "5-10 sentence overview", '
        '"key_points": ["point 1", "point 2", "point 3"], "conclusion": "..."}\n\n'
        f"Notes:\n{text}"
    )
    try:
        response = create_chat_completion(prompt)
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
        print(f"ERROR in _summarise_text: {exc}")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Synapic API is running"}


@app.post("/generate-flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(payload: NotesInput | str):
    notes = extract_notes(payload)

    # chunk_text returns [notes] unchanged when notes is short, so this loop
    # handles both the simple 1-chunk case and the multi-chunk case identically.
    chunks = chunk_text(notes)

    all_cards: list[Flashcard] = []

    for i, chunk in enumerate(chunks):
        if i > 0:
            # Small delay between calls to respect Groq's rate limit.
            # The Groq SDK will raise a 429 if we go too fast, and our
            # create_chat_completion() will convert that into an HTTPException.
            time.sleep(CHUNK_DELAY)

        prompt = (
            "Turn these study notes into concise flashcards.\n"
            "Return valid JSON only - no markdown, no backticks, no explanation.\n"
            'Use exactly this format: [{"question": "...", "answer": "..."}]\n\n'
            f"Notes:\n{chunk}"
        )

        try:
            response = create_chat_completion(prompt)
            raw_text = response.choices[0].message.content or ""
            cleaned_text = strip_code_fences(raw_text)
            data = json.loads(cleaned_text)
            cards = [Flashcard.model_validate(item) for item in data]
            all_cards.extend(cards)
        except HTTPException:
            raise  # 429 / auth errors must propagate immediately
        except json.JSONDecodeError:
            # One bad chunk should not kill everything.
            # Log it and carry on — the other chunks may succeed.
            print(f"WARNING: flashcard chunk {i + 1}/{len(chunks)} returned invalid JSON — skipping.")
            continue
        except Exception as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not all_cards:
        raise HTTPException(
            status_code=502,
            detail="The AI did not return valid JSON flashcards.",
        )

    final_cards = deduplicate_flashcards(all_cards)
    return FlashcardsResponse(flashcards=final_cards)


@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(payload: NotesInput | str):
    notes = extract_notes(payload)
    chunks = chunk_text(notes)

    all_questions: list[QuizQuestion] = []

    for i, chunk in enumerate(chunks):
        if i > 0:
            time.sleep(CHUNK_DELAY)

        prompt = (
            "Turn these study notes into a multiple choice quiz.\n"
            "Return valid JSON only — no markdown, no backticks, no explanation.\n"
            "Use exactly this format:\n"
            '[{"question": "...", "options": [{"label": "A", "text": "..."}, '
            '{"label": "B", "text": "..."}, {"label": "C", "text": "..."}, '
            '{"label": "D", "text": "..."}], "correct": "A", "explanation": "..."}]\n\n'
            f"Notes:\n{chunk}"
        )

        try:
            response = create_chat_completion(prompt)
            raw_text = response.choices[0].message.content or ""
            cleaned = strip_code_fences(raw_text)
            data = json.loads(cleaned)
            questions = [QuizQuestion.model_validate(q) for q in data]
            all_questions.extend(questions)
        except HTTPException:
            raise
        except json.JSONDecodeError:
            print(f"WARNING: quiz chunk {i + 1}/{len(chunks)} returned invalid JSON — skipping.")
            continue
        except Exception as exc:
            print(f"ERROR: {exc}")
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not all_questions:
        raise HTTPException(
            status_code=502,
            detail="The AI did not return valid JSON quiz data.",
        )

    final_questions = deduplicate_quiz(all_questions)
    return QuizResponse(quiz=final_questions)


@app.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(payload: NotesInput | str):
    notes = extract_notes(payload)
    chunks = chunk_text(notes)

    # ── Short input: single Groq call, done ──────────────────────────────────
    if len(chunks) == 1:
        return _summarise_text(chunks[0])

    # ── Long input: TWO-PASS summarisation ───────────────────────────────────
    #
    # Why two passes instead of just sending all chunks?
    #
    # We can't merge structured JSON summaries from multiple chunks easily —
    # each chunk would give its OWN title, overview, key_points, conclusion,
    # and simply concatenating them would produce a mess.
    #
    # Instead:
    #   Pass 1 — ask Groq for a short PLAIN-TEXT summary of each chunk
    #            (~3-5 sentences, ≈ 400 chars per chunk).
    #            For 12 chunks that's ≈ 4,800 chars total — well under CHUNK_SIZE.
    #
    #   Pass 2 — feed all the plain-text mini-summaries into _summarise_text()
    #            which produces the final structured SummaryResponse in one call.
    #            Groq sees a compact representation of the WHOLE document.

    chunk_summaries: list[str] = []

    for i, chunk in enumerate(chunks):
        if i > 0:
            time.sleep(CHUNK_DELAY)

        prompt = (
            "Write a brief summary (3-5 sentences) of these study notes.\n"
            "Return plain text only — no JSON, no markdown, no bullet points.\n\n"
            f"Notes:\n{chunk}"
        )

        try:
            response = create_chat_completion(prompt)
            summary_text = (response.choices[0].message.content or "").strip()
            if summary_text:
                chunk_summaries.append(summary_text)
        except HTTPException:
            raise
        except Exception as exc:
            # A failed chunk is recoverable — we'll just have slightly less context.
            print(f"WARNING: summary chunk {i + 1}/{len(chunks)} failed: {exc}")
            continue

    if not chunk_summaries:
        raise HTTPException(
            status_code=502,
            detail="Failed to summarise any section of the notes.",
        )

    # Join chunk summaries with a visual separator so Groq understands the
    # document has multiple sections rather than one continuous text.
    combined = "\n\n---\n\n".join(chunk_summaries)

    # Pass 2: produce the final structured summary from the combined mini-summaries
    return _summarise_text(combined)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
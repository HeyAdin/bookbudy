import re
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models.book import ReadingStatus


def normalize_and_validate_isbn(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    cleaned = re.sub(r"[\s\-]", "", v).upper()
    if not cleaned:
        return None

    if len(cleaned) == 10:
        # Validate ISBN-10
        if not re.match(r"^\d{9}[\dX]$", cleaned):
            raise ValueError("ISBN-10 must contain 9 digits followed by a digit or 'X'.")
        total = 0
        for i in range(9):
            total += int(cleaned[i]) * (10 - i)
        last_val = 10 if cleaned[9] == "X" else int(cleaned[9])
        total += last_val
        if total % 11 != 0:
            raise ValueError("Invalid ISBN-10 check digit.")
        return cleaned

    elif len(cleaned) == 13:
        # Validate ISBN-13
        if not re.match(r"^\d{13}$", cleaned):
            raise ValueError("ISBN-13 must contain exactly 13 digits.")
        total = 0
        for i in range(12):
            factor = 1 if i % 2 == 0 else 3
            total += int(cleaned[i]) * factor
        remainder = total % 10
        expected_check = (10 - remainder) % 10
        if int(cleaned[12]) != expected_check:
            raise ValueError(
                f"Invalid ISBN-13 check digit. Expected {expected_check}, got {cleaned[12]}."
            )
        return cleaned

    else:
        raise ValueError(f"ISBN must be either 10 or 13 characters long (got {len(cleaned)}).")


# --- Notes Schemas ---
class BookNoteCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Content of the note or review")
    rating: Optional[int] = Field(
        None, ge=1, le=5, description="Personal rating from 1 to 5 (for completed books)"
    )


class BookNoteUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)


class BookNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    book_id: UUID
    content: str
    rating: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# --- Reading Progress Schemas ---
class ReadingProgressCreate(BaseModel):
    pages_read: int = Field(..., ge=0, description="Pages read up to this point")
    progress_percent: Optional[float] = Field(
        None, ge=0.0, le=100.0, description="Optional manual progress percentage override"
    )


class ReadingProgressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    book_id: UUID
    pages_read: int
    progress_percent: float
    recorded_at: datetime


# --- Book Schemas ---
class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Book title")
    author: str = Field(..., min_length=1, max_length=255, description="Author name")
    genre: str = Field(..., min_length=1, max_length=100, description="Book genre or category")
    isbn: Optional[str] = Field(None, description="Optional ISBN-10 or ISBN-13")
    summary: Optional[str] = Field(None, description="Optional book description or synopsis")
    total_pages: Optional[int] = Field(
        None, gt=0, description="Total pages count (positive integer)"
    )

    @field_validator("isbn", mode="before")
    @classmethod
    def check_isbn(cls, v):
        return normalize_and_validate_isbn(v)


class BookCreate(BookBase):
    status: ReadingStatus = Field(
        default=ReadingStatus.WISHLIST,
        description="Reading status: READING, COMPLETED, or WISHLIST",
    )
    current_page: int = Field(default=0, ge=0, description="Current page number")

    @model_validator(mode="after")
    def validate_pages_and_status(self):
        if self.total_pages is not None and self.current_page > self.total_pages:
            raise ValueError(
                f"current_page ({self.current_page}) cannot exceed total_pages ({self.total_pages})."
            )
        return self


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    genre: Optional[str] = Field(None, min_length=1, max_length=100)
    isbn: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[ReadingStatus] = None
    total_pages: Optional[int] = Field(None, gt=0)
    current_page: Optional[int] = Field(None, ge=0)
    progress_percent: Optional[float] = Field(None, ge=0.0, le=100.0)

    @field_validator("isbn", mode="before")
    @classmethod
    def check_isbn(cls, v):
        if v is None:
            return None
        return normalize_and_validate_isbn(v)


class BookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID] = None
    title: str
    author: str
    genre: str
    isbn: Optional[str] = None
    summary: Optional[str] = None
    status: ReadingStatus
    progress_percent: float
    total_pages: Optional[int] = None
    current_page: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    notes_count: int = 0
    latest_rating: Optional[int] = None


class BookDetail(BookRead):
    notes: List[BookNoteRead] = []
    progress_updates: List[ReadingProgressRead] = []

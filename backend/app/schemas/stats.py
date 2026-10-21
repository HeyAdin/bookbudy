from typing import Dict, List
from pydantic import BaseModel, Field


class GenreStat(BaseModel):
    genre: str
    count: int
    percentage: float


class ReadingStats(BaseModel):
    total_books: int = Field(..., description="Total books in personal library")
    currently_reading: int = Field(..., description="Number of books currently being read")
    completed: int = Field(..., description="Number of completed books")
    wishlist: int = Field(..., description="Number of wishlist books")
    completion_percentage: float = Field(
        ..., description="Overall completion percentage across all books"
    )
    books_by_genre: Dict[str, int] = Field(
        default_factory=dict, description="Count of books grouped by genre"
    )
    genre_breakdown: List[GenreStat] = Field(
        default_factory=list, description="Detailed breakdown of genres with percentages"
    )
    total_pages_read: int = Field(
        default=0, description="Sum of current pages read across all books"
    )
    total_pages_library: int = Field(
        default=0, description="Sum of total pages across books where known"
    )

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, select, case

from app.db.session import get_db
from app.models.book import Book, ReadingStatus
from app.schemas.stats import ReadingStats, GenreStat

router = APIRouter(prefix="/api/stats", tags=["Statistics"])


@router.get("", response_model=ReadingStats)
def get_reading_stats(db: Session = Depends(get_db)):
    """
    Retrieve aggregated reading statistics across the library.
    """
    # 1. Total counts by status using SQL aggregation
    counts_stmt = select(
        func.count(Book.id).label("total_books"),
        func.count(
            case((Book.status == ReadingStatus.READING, Book.id))
        ).label("currently_reading"),
        func.count(
            case((Book.status == ReadingStatus.COMPLETED, Book.id))
        ).label("completed"),
        func.count(
            case((Book.status == ReadingStatus.WISHLIST, Book.id))
        ).label("wishlist"),
        func.coalesce(func.sum(Book.current_page), 0).label("total_pages_read"),
        func.coalesce(func.sum(Book.total_pages), 0).label("total_pages_library"),
    )

    counts_result = db.execute(counts_stmt).one()
    total_books = counts_result.total_books or 0
    currently_reading = counts_result.currently_reading or 0
    completed = counts_result.completed or 0
    wishlist = counts_result.wishlist or 0
    total_pages_read = int(counts_result.total_pages_read or 0)
    total_pages_library = int(counts_result.total_pages_library or 0)

    completion_percentage = (
        round((completed / total_books) * 100.0, 2) if total_books > 0 else 0.0
    )

    # 2. Books grouped by genre using SQL aggregation
    genre_stmt = (
        select(Book.genre, func.count(Book.id).label("count"))
        .group_by(Book.genre)
        .order_by(func.count(Book.id).desc())
    )
    genre_rows = db.execute(genre_stmt).all()

    books_by_genre = {row.genre: row.count for row in genre_rows}
    genre_breakdown = [
        GenreStat(
            genre=row.genre,
            count=row.count,
            percentage=round((row.count / total_books) * 100.0, 2) if total_books > 0 else 0.0,
        )
        for row in genre_rows
    ]

    return ReadingStats(
        total_books=total_books,
        currently_reading=currently_reading,
        completed=completed,
        wishlist=wishlist,
        completion_percentage=completion_percentage,
        books_by_genre=books_by_genre,
        genre_breakdown=genre_breakdown,
        total_pages_read=total_pages_read,
        total_pages_library=total_pages_library,
    )

from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.db.session import get_db
from app.models.book import Book, ReadingStatus
from app.models.book_note import BookNote
from app.models.reading_progress import ReadingProgress
from app.schemas.book import (
    BookCreate,
    BookUpdate,
    BookRead,
    BookDetail,
    BookNoteCreate,
    BookNoteRead,
    ReadingProgressCreate,
    ReadingProgressRead,
)

router = APIRouter(prefix="/api/books", tags=["Books"])


def _calculate_book_read(book: Book) -> BookRead:
    notes_count = len(book.notes) if book.notes is not None else 0
    latest_rating = None
    if book.notes:
        for n in book.notes:
            if n.rating is not None:
                latest_rating = n.rating
                break

    return BookRead(
        id=book.id,
        user_id=book.user_id,
        title=book.title,
        author=book.author,
        genre=book.genre,
        isbn=book.isbn,
        summary=book.summary,
        status=book.status,
        progress_percent=book.progress_percent,
        total_pages=book.total_pages,
        current_page=book.current_page,
        started_at=book.started_at,
        completed_at=book.completed_at,
        created_at=book.created_at,
        updated_at=book.updated_at,
        notes_count=notes_count,
        latest_rating=latest_rating,
    )


@router.get("", response_model=List[BookRead])
def list_books(
    status_filter: Optional[ReadingStatus] = Query(None, alias="status"),
    genre: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List all books with optional status, genre, and search filters.
    """
    query = select(Book).order_by(desc(Book.created_at))

    if status_filter:
        query = query.where(Book.status == status_filter)
    if genre:
        query = query.where(func.lower(Book.genre) == genre.strip().lower())
    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.where(
            func.lower(Book.title).like(search_pattern)
            | func.lower(Book.author).like(search_pattern)
        )

    books = db.scalars(query).all()
    return [_calculate_book_read(b) for b in books]


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    """
    Create a new book with automated progress and status calculation.
    """
    now = datetime.now(timezone.utc)
    current_page = book_in.current_page
    total_pages = book_in.total_pages
    current_status = book_in.status
    started_at = None
    completed_at = None

    if current_status == ReadingStatus.COMPLETED:
        progress_percent = 100.0
        completed_at = now
        if total_pages is not None and current_page == 0:
            current_page = total_pages
    elif total_pages is not None and total_pages > 0:
        progress_percent = round((current_page / total_pages) * 100.0, 2)
        if current_status == ReadingStatus.READING and started_at is None:
            started_at = now
    else:
        progress_percent = 0.0
        if current_status == ReadingStatus.READING:
            started_at = now

    new_book = Book(
        title=book_in.title,
        author=book_in.author,
        genre=book_in.genre,
        isbn=book_in.isbn,
        summary=book_in.summary,
        status=current_status,
        progress_percent=progress_percent,
        total_pages=total_pages,
        current_page=current_page,
        started_at=started_at,
        completed_at=completed_at,
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return _calculate_book_read(new_book)


@router.get("/{book_id}", response_model=BookDetail)
def get_book(book_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve single book details including notes and progress history.
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )

    notes = [BookNoteRead.model_validate(n) for n in book.notes]
    progress = [ReadingProgressRead.model_validate(p) for p in book.progress_updates]
    base_read = _calculate_book_read(book)

    return BookDetail(
        **base_read.model_dump(),
        notes=notes,
        progress_updates=progress,
    )


@router.patch("/{book_id}", response_model=BookRead)
def update_book(book_id: UUID, book_in: BookUpdate, db: Session = Depends(get_db)):
    """
    Update book metadata, status, page counts, or progress.
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )

    now = datetime.now(timezone.utc)
    update_data = book_in.model_dump(exclude_unset=True)

    # Determine projected total_pages and current_page
    projected_total = update_data.get("total_pages", book.total_pages)
    projected_current = update_data.get("current_page", book.current_page)

    if projected_total is not None and projected_current is not None:
        if projected_current > projected_total:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"current_page ({projected_current}) cannot exceed total_pages ({projected_total}).",
            )

    # Apply scalar fields
    for field, value in update_data.items():
        if field not in ("status", "current_page", "total_pages", "progress_percent"):
            setattr(book, field, value)

    if "total_pages" in update_data:
        book.total_pages = projected_total
    if "current_page" in update_data:
        book.current_page = projected_current

    # Handle status & progress adjustments
    if "status" in update_data:
        new_status = update_data["status"]
        book.status = new_status
        if new_status == ReadingStatus.COMPLETED:
            book.progress_percent = 100.0
            if not book.completed_at:
                book.completed_at = now
            if book.total_pages is not None:
                book.current_page = book.total_pages
        elif new_status == ReadingStatus.READING:
            if not book.started_at:
                book.started_at = now
            book.completed_at = None
        elif new_status == ReadingStatus.WISHLIST:
            book.completed_at = None

    # Recalculate progress percent if pages were updated without explicit status completion
    if "current_page" in update_data or "total_pages" in update_data:
        if book.status != ReadingStatus.COMPLETED and book.total_pages and book.total_pages > 0:
            book.progress_percent = round((book.current_page / book.total_pages) * 100.0, 2)
            if book.current_page >= book.total_pages:
                book.status = ReadingStatus.COMPLETED
                book.completed_at = now

    if "progress_percent" in update_data and update_data["progress_percent"] is not None:
        book.progress_percent = update_data["progress_percent"]
        if book.progress_percent >= 100.0 and book.status != ReadingStatus.COMPLETED:
            book.status = ReadingStatus.COMPLETED
            book.completed_at = now

    db.commit()
    db.refresh(book)
    return _calculate_book_read(book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a book and its associated notes and progress entries.
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )
    db.delete(book)
    db.commit()
    return None


@router.post(
    "/{book_id}/progress",
    response_model=ReadingProgressRead,
    status_code=status.HTTP_201_CREATED,
)
def record_progress(
    book_id: UUID,
    progress_in: ReadingProgressCreate,
    db: Session = Depends(get_db),
):
    """
    Record reading progress log entry and synchronize with book status.
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )

    now = datetime.now(timezone.utc)
    pages = progress_in.pages_read

    if book.total_pages is not None and pages > book.total_pages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"pages_read ({pages}) cannot exceed total_pages ({book.total_pages}).",
        )

    if progress_in.progress_percent is not None:
        calc_percent = progress_in.progress_percent
    elif book.total_pages is not None and book.total_pages > 0:
        calc_percent = round((pages / book.total_pages) * 100.0, 2)
    else:
        calc_percent = 100.0 if pages > 0 and book.status == ReadingStatus.COMPLETED else 0.0

    # Sync Book status & pages
    book.current_page = pages
    book.progress_percent = calc_percent

    if calc_percent >= 100.0 or (book.total_pages and pages >= book.total_pages):
        book.status = ReadingStatus.COMPLETED
        if not book.completed_at:
            book.completed_at = now
    elif book.status == ReadingStatus.WISHLIST and pages > 0:
        book.status = ReadingStatus.READING
        if not book.started_at:
            book.started_at = now

    progress_entry = ReadingProgress(
        book_id=book.id,
        pages_read=pages,
        progress_percent=calc_percent,
        recorded_at=now,
    )

    db.add(progress_entry)
    db.commit()
    db.refresh(progress_entry)
    return progress_entry


@router.get("/{book_id}/progress", response_model=List[ReadingProgressRead])
def get_reading_history(book_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve reading history logs for a book.
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )

    query = (
        select(ReadingProgress)
        .where(ReadingProgress.book_id == book_id)
        .order_by(desc(ReadingProgress.recorded_at))
    )
    return db.scalars(query).all()


@router.post(
    "/{book_id}/notes",
    response_model=BookNoteRead,
    status_code=status.HTTP_201_CREATED,
)
def create_book_note(
    book_id: UUID,
    note_in: BookNoteCreate,
    db: Session = Depends(get_db),
):
    """
    Add personal notes and optional rating (ratings allowed only for completed books).
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )

    if note_in.rating is not None and book.status != ReadingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ratings can only be added to completed books. Mark this book as COMPLETED first.",
        )

    note = BookNote(
        book_id=book.id,
        content=note_in.content,
        rating=note_in.rating,
    )

    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{book_id}/notes", response_model=List[BookNoteRead])
def list_book_notes(book_id: UUID, db: Session = Depends(get_db)):
    """
    List all personal notes and reviews for a book.
    """
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found.",
        )

    query = (
        select(BookNote)
        .where(BookNote.book_id == book_id)
        .order_by(desc(BookNote.created_at))
    )
    return db.scalars(query).all()

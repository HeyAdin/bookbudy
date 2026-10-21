import enum
import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.types import Uuid
from app.db.base import Base


class ReadingStatus(str, enum.Enum):
    READING = "READING"
    COMPLETED = "COMPLETED"
    WISHLIST = "WISHLIST"


class Book(Base):
    __tablename__ = "books"
    __table_args__ = (
        CheckConstraint("current_page >= 0", name="check_positive_current_page"),
        CheckConstraint(
            "progress_percent >= 0 AND progress_percent <= 100",
            name="check_progress_percent_range",
        ),
        CheckConstraint(
            "total_pages IS NULL OR total_pages > 0",
            name="check_positive_total_pages",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    author: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    genre: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    isbn: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        index=True,
    )
    summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[ReadingStatus] = mapped_column(
        SAEnum(ReadingStatus, name="reading_status_enum", native_enum=False),
        nullable=False,
        default=ReadingStatus.WISHLIST,
        index=True,
    )
    progress_percent: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    total_pages: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    current_page: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="books",
    )
    progress_updates: Mapped[List["ReadingProgress"]] = relationship(
        "ReadingProgress",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="ReadingProgress.recorded_at.desc()",
    )
    notes: Mapped[List["BookNote"]] = relationship(
        "BookNote",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="BookNote.created_at.desc()",
    )

    @validates("current_page")
    def validate_current_page(self, key, value):
        if value is not None and value < 0:
            raise ValueError("current_page cannot be negative.")
        if self.total_pages is not None and value is not None and value > self.total_pages:
            raise ValueError(f"current_page ({value}) cannot exceed total_pages ({self.total_pages}).")
        return value

    @validates("total_pages")
    def validate_total_pages(self, key, value):
        if value is not None and value <= 0:
            raise ValueError("total_pages must be a positive integer.")
        if value is not None and self.current_page is not None and self.current_page > value:
            raise ValueError(f"current_page ({self.current_page}) cannot exceed total_pages ({value}).")
        return value

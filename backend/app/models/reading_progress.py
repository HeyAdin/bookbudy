import uuid
from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.db.base import Base


class ReadingProgress(Base):
    __tablename__ = "reading_progress"
    __table_args__ = (
        CheckConstraint("pages_read >= 0", name="check_positive_pages_read"),
        CheckConstraint(
            "progress_percent >= 0 AND progress_percent <= 100",
            name="check_progress_history_percent_range",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pages_read: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    progress_percent: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationship
    book: Mapped["Book"] = relationship(
        "Book",
        back_populates="progress_updates",
    )

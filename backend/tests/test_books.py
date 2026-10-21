import pytest
from app.models.book import ReadingStatus


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert data["service"] == "book-buddy-api"


def test_create_book_success(client):
    payload = {
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Science Fiction",
        "isbn": "978-0441172719",  # Valid ISBN-13
        "summary": "Epic sci-fi classic set on Arrakis.",
        "status": "WISHLIST",
        "total_pages": 688,
        "current_page": 0,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Dune"
    assert data["author"] == "Frank Herbert"
    assert data["isbn"] == "9780441172719"  # normalized
    assert data["progress_percent"] == 0.0
    assert data["status"] == "WISHLIST"


def test_create_book_invalid_isbn(client):
    payload = {
        "title": "Test Book",
        "author": "Test Author",
        "genre": "Fiction",
        "isbn": "1234567890",  # Invalid check digit for ISBN-10
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 422


def test_create_book_current_page_exceeds_total(client):
    payload = {
        "title": "Short Book",
        "author": "Author",
        "genre": "Fiction",
        "total_pages": 100,
        "current_page": 150,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 422


def test_create_book_completed_status(client):
    payload = {
        "title": "Finished Book",
        "author": "Author",
        "genre": "Non-Fiction",
        "status": "COMPLETED",
        "total_pages": 200,
        "current_page": 0,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["progress_percent"] == 100.0
    assert data["current_page"] == 200
    assert data["completed_at"] is not None


def test_update_book_progress_and_auto_complete(client):
    # 1. Create a reading book
    create_resp = client.post(
        "/api/books",
        json={
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "genre": "Fantasy",
            "status": "READING",
            "total_pages": 300,
            "current_page": 50,
        },
    )
    assert create_resp.status_code == 201
    book_id = create_resp.json()["id"]
    assert create_resp.json()["progress_percent"] == round(50 / 300 * 100, 2)

    # 2. Update progress using progress endpoint
    prog_resp = client.post(
        f"/api/books/{book_id}/progress",
        json={"pages_read": 300},
    )
    assert prog_resp.status_code == 201
    assert prog_resp.json()["progress_percent"] == 100.0

    # 3. Verify book is now completed
    book_resp = client.get(f"/api/books/{book_id}")
    assert book_resp.status_code == 200
    book_data = book_resp.json()
    assert book_data["status"] == "COMPLETED"
    assert book_data["current_page"] == 300
    assert book_data["progress_percent"] == 100.0
    assert book_data["completed_at"] is not None


def test_notes_and_rating_completed_restriction(client):
    # Create reading book (not completed)
    create_resp = client.post(
        "/api/books",
        json={
            "title": "Atomic Habits",
            "author": "James Clear",
            "genre": "Self-Help",
            "status": "READING",
            "total_pages": 320,
            "current_page": 100,
        },
    )
    book_id = create_resp.json()["id"]

    # Adding a note without rating should succeed
    note_resp = client.post(
        f"/api/books/{book_id}/notes",
        json={"content": "Great chapter on cue, craving, response, and reward."},
    )
    assert note_resp.status_code == 201
    assert note_resp.json()["rating"] is None

    # Adding a note WITH rating on uncompleted book should be rejected (400 Bad Request)
    rating_resp = client.post(
        f"/api/books/{book_id}/notes",
        json={"content": "5 stars!", "rating": 5},
    )
    assert rating_resp.status_code == 400
    assert "Ratings can only be added to completed books" in rating_resp.json()["detail"]

    # Now complete the book
    client.patch(f"/api/books/{book_id}", json={"status": "COMPLETED"})

    # Now rating should succeed
    rating_resp2 = client.post(
        f"/api/books/{book_id}/notes",
        json={"content": "Finished reading. Masterpiece!", "rating": 5},
    )
    assert rating_resp2.status_code == 201
    assert rating_resp2.json()["rating"] == 5

    # Check that note is in the book's details
    book_detail = client.get(f"/api/books/{book_id}").json()
    assert len(book_detail["notes"]) == 2
    assert book_detail["latest_rating"] == 5


def test_delete_book(client):
    create_resp = client.post(
        "/api/books",
        json={
            "title": "Temporary Book",
            "author": "Author",
            "genre": "Fiction",
        },
    )
    book_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/books/{book_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/books/{book_id}")
    assert get_resp.status_code == 404

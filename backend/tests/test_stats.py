def test_reading_statistics(client):
    # Add multiple books with varied statuses and genres
    books = [
        {
            "title": "Book 1",
            "author": "Author A",
            "genre": "Fiction",
            "status": "COMPLETED",
            "total_pages": 200,
            "current_page": 200,
        },
        {
            "title": "Book 2",
            "author": "Author B",
            "genre": "Fiction",
            "status": "READING",
            "total_pages": 400,
            "current_page": 100,
        },
        {
            "title": "Book 3",
            "author": "Author C",
            "genre": "Science",
            "status": "WISHLIST",
            "total_pages": 300,
            "current_page": 0,
        },
        {
            "title": "Book 4",
            "author": "Author D",
            "genre": "History",
            "status": "COMPLETED",
            "total_pages": 500,
            "current_page": 500,
        },
    ]

    for b in books:
        res = client.post("/api/books", json=b)
        assert res.status_code == 201

    stats_resp = client.get("/api/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()

    assert stats["total_books"] == 4
    assert stats["currently_reading"] == 1
    assert stats["completed"] == 2
    assert stats["wishlist"] == 1
    assert stats["completion_percentage"] == 50.0  # 2 out of 4 completed
    assert stats["books_by_genre"]["Fiction"] == 2
    assert stats["books_by_genre"]["Science"] == 1
    assert stats["books_by_genre"]["History"] == 1
    assert stats["total_pages_read"] == 200 + 100 + 0 + 500
    assert stats["total_pages_library"] == 200 + 400 + 300 + 500

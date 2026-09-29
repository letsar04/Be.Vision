# Vector Memory Module

Qdrant adapter boundary.

Responsibilities:

- collection lifecycle
- vector upsert/delete
- filtered search
- tenant isolation
- model/version metadata

Business records remain in PostgreSQL.

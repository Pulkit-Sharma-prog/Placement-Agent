# Database migrations

This project uses [Alembic](https://alembic.sqlalchemy.org/) for schema migrations.

## First-time bootstrap (existing database)

If you already have a `placements.db` created via `create_tables()`, stamp it as
up-to-date before running any migrations so Alembic won't try to recreate the
existing tables:

```bash
cd backend
alembic stamp head
```

## Creating a new migration after changing models

```bash
cd backend
alembic revision --autogenerate -m "short description"
# Review the generated file in alembic/versions/ before applying
alembic upgrade head
```

## Applying pending migrations (production / fresh checkout)

```bash
cd backend
alembic upgrade head
```

## Rolling back

```bash
alembic downgrade -1       # one step back
alembic downgrade <rev>    # specific revision
```

> SQLite ALTER TABLE support is limited, so `env.py` enables `render_as_batch=True`
> which lets Alembic rebuild tables safely when columns change.

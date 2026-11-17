CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20)  NOT NULL DEFAULT 'participant'
                  CHECK (role IN ('participant', 'manager')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20)  NOT NULL DEFAULT 'kg',
    points_per_unit INTEGER NOT NULL CHECK (points_per_unit > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE recycling_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    material_id INTEGER NOT NULL REFERENCES materials(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    validated_by INTEGER      REFERENCES users(id),
    validated_at  TIMESTAMPTZ,
    CONSTRAINT chk_validation_consistency CHECK (
        (status = 'pending'  AND validated_by IS NULL AND validated_at IS NULL)
     OR (status <> 'pending' AND validated_by IS NOT NULL AND validated_at IS NOT NULL)
    )
);

CREATE INDEX idx_entries_user   ON recycling_entries(user_id);
CREATE INDEX idx_entries_status ON recycling_entries(status);

CREATE TABLE point_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    entry_id INTEGER NOT NULL UNIQUE REFERENCES recycling_entries(id),
    points INTEGER NOT NULL CHECK (points > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_point_logs_user ON point_logs(user_id);
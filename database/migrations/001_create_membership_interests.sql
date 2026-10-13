CREATE TABLE IF NOT EXISTS membership_interests (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    telephone VARCHAR(32),
    programme VARCHAR(120) NOT NULL,
    academic_year SMALLINT NOT NULL CHECK (academic_year BETWEEN 1 AND 5),
    interests TEXT[] NOT NULL DEFAULT '{}',
    goal VARCHAR(1000) NOT NULL,
    working_time VARCHAR(16) CHECK (working_time IS NULL OR working_time IN ('Morning', 'Afternoon', 'Evening')),
    message VARCHAR(2000),
    consent BOOLEAN NOT NULL CHECK (consent = TRUE),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

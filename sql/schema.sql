-- sql/schema.sql

-- Table to store poll choices
CREATE TABLE IF NOT EXISTS poll_choices (
    id SERIAL PRIMARY KEY,
    choice_text TEXT NOT NULL
);

-- Table to store votes
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    choice_id INTEGER REFERENCES poll_choices(id),
    fingerprint TEXT UNIQUE NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for news items
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for roadmap phases
CREATE TABLE IF NOT EXISTS roadmap_phases (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to cache token info
CREATE TABLE IF NOT EXISTS token_cache (
    id INTEGER PRIMARY KEY,
    price TEXT,
    market_cap TEXT,
    total_supply TEXT,
    holders INTEGER,
    trades INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

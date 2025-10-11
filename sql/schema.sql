CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  text text NOT NULL,
  votes integer DEFAULT 0
);

CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id uuid REFERENCES poll_options(id),
  fingerprint_hash text NOT NULL UNIQUE,
  ip_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX votes_ip_hash_idx ON votes (ip_hash);
CREATE INDEX votes_created_at_idx ON votes (created_at);

CREATE TABLE news (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE roadmap_phases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_name text NOT NULL,
  milestones text,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false
);

CREATE TABLE token_cache (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE admin_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
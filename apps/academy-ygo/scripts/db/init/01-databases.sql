-- Runs once, when the local Postgres volume is created (docker-compose.yml).

-- A local copy of YGOProJudge's database. YGOProJudge's own `db:migrate` and `cards:sync` fill it.
CREATE DATABASE ygojudge OWNER academy;

-- Duel Academy only reads YGOProJudge: this login can SELECT and nothing else.
CREATE ROLE academy_reader LOGIN PASSWORD 'academy_reader';

\connect ygojudge
CREATE EXTENSION IF NOT EXISTS vector;
GRANT CONNECT ON DATABASE ygojudge TO academy_reader;
GRANT USAGE ON SCHEMA public TO academy_reader;
-- Tables YGOProJudge's migrations create later (as `academy`) are readable too.
ALTER DEFAULT PRIVILEGES FOR ROLE academy IN SCHEMA public GRANT SELECT ON TABLES TO academy_reader;

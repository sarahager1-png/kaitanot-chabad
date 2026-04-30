-- Migration 004: add doc_label to trip_files
ALTER TABLE trip_files ADD COLUMN IF NOT EXISTS doc_label text;

-- הוספת טלפון וסליקה לכל קייטנה
ALTER TABLE camps
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS cardcom_terminal    text,
  ADD COLUMN IF NOT EXISTS cardcom_api_name    text,
  ADD COLUMN IF NOT EXISTS cardcom_api_password text;

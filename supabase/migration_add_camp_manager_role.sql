-- הוספת תפקיד "מנהל קייטנה" לטבלת הפרופילים
-- הרץ ב-Supabase SQL Editor

-- 1. הסרת ה-constraint הקיים ועדכונו
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'));

-- 2. עדכון RLS על טבלת camps — מנהל קייטנה יכול לראות את הקייטנה שלו
-- (הפוליסי הקיים בדרך כלל מסתמך על auth.uid() ו-camp_users)

-- לוודא שמנהל קייטנה מוסף ל-camp_users כשהוא משויך
-- (זה נעשה בממשק האדמין בדיוק כמו שליח)

-- 3. תיעוד: הרשאות לפי תפקיד
-- שליח         — צפייה בלבד, קייטנה אחת (camp_users)
-- מנהל קייטנה  — עריכה מלאה, קייטנה אחת (camp_users)
-- מנהל רשת     — עריכה מלאה, כל הקייטנות
-- אדמין מערכת  — גישה מלאה למערכת

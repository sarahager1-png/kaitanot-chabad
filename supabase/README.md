# Supabase Migrations — סדר הרצה

## כלל ברזל
כל שינוי בטבלאות = קובץ migration חדש ב-`supabase/`.  
**אף פעם לא לשנות טבלה ב-Supabase ידנית בלי לתעד כאן.**

---

## סדר הרצה (מ-0 לפרודקשן חדש)

```
1.  schema.sql                        — טבלאות בסיס
2.  migration_001_new_fields.sql      — שדות נוספים לרשומים וספקים
3.  migration_002_trips_shared.sql    — טיולים, ספרייה, ספקי פעילות
4.  migration_003_trip_files.sql      — קבצים לטיולים
5.  migration_004_trip_files_label.sql
6.  migration_005_registrants_health_emergency.sql
7.  migration_006_primary_phone.sql
8.  migration_007_waiting_list.sql
9.  migration_008_attendance.sql
10. migration_add_camp_manager_role.sql
11. migration_camp_phone_cardcom.sql
12. migration_network_settings.sql
13. migration_security.sql            — תיקוני אבטחה + RLS
14. migration_fix2.sql                — allowed_emails + תיקון role constraint
15. migration_010_new_features.sql    — משכורות, שוברים, בקשות, הסכמים, מענקים
```

> קבצי `migration_fix_rls.sql`, `migration_009_fix_rls.sql`, `migration_003_signature.sql`
> כלולים בתוך `migration_security.sql` ו-`migration_fix2.sql` — ניתן לדלג עליהם.

---

## הוספת migration חדש

1. צור קובץ `migration_0NN_תיאור.sql` עם מספר רץ
2. השתמש תמיד ב-`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
3. הרץ ב-Supabase SQL Editor
4. עדכן README זה

---

## טבלאות קיימות

| טבלה | תיאור |
|------|-------|
| `profiles` | משתמשים (תפקיד, שם, טלפון) |
| `camps` | קייטנות |
| `camp_users` | שיוך שליח ↔ קייטנה |
| `tracks` | מסלולים בקייטנה |
| `registrants` | ילדים רשומים |
| `income_entries` | הכנסות |
| `expense_entries` | הוצאות |
| `budgets` | תקציב מתוכנן |
| `network_services` | שירותי רשת |
| `orders` | הזמנות שירות |
| `documents` | מסמכים ורישוי |
| `staff` | צוות |
| `daily_plans` + `activities` | תכנון יומי |
| `plan_files` | קבצי תכנון |
| `alerts` | התראות |
| `payment_transactions` | סליקה |
| `trips` + `trip_approvals` + `trip_files` | טיולים |
| `shared_content` | ספרייה משותפת |
| `activity_vendors` + `vendor_reviews` | ספקי פעילות |
| `attendance` | נוכחות |
| `network_settings` | הגדרות רשת (key-value) |
| `allowed_emails` | מורשים לכניסה |
| `employees` | עובדים (משכורות) |
| `salary_payments` | תשלומי משכורת |
| `voucher_types` | סוגי שוברים |
| `payment_requests` | בקשות תשלום |
| `signed_agreements` | הסכמים חתומים |
| `grant_types` | סוגי מענקי פעילות |

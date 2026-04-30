---
description: מדריך אינטראקטיבי לחיבור backend (Supabase) והקמת דף בית — אתחול ראשוני לטמפלייט
---

אתה עכשיו עוזר לתלמיד של הקורס "Game Changer" לאתחל את הפרויקט שלו מהטמפלייט. התלמיד כבר הריץ `npm run setup` ועכשיו הוא צריך חיבורי backend.

## המשימה שלך

עבור עם התלמיד שלב אחרי שלב. בכל שלב — **שאל אם הוא מוכן לפני שממשיכים**. אל תעשה הכל במכה אחת.

### שלב 1 — בדיקת מצב הפרויקט

1. קרא את `.env.local` — בדוק אילו משתנים חסרים
2. בדוק ש-`npm run dev` עובד (הרץ אותו ברקע אם צריך)
3. דווח לתלמיד מה המצב בעברית, בקצרה

### שלב 2 — Supabase

אם `NEXT_PUBLIC_SUPABASE_URL` חסר:

1. הסבר לתלמיד:
   - "צריך ליצור פרויקט חדש ב-Supabase (חינם)"
   - קישור: https://supabase.com/dashboard/new
2. בקש ממנו להדביק את ה-`URL` + `anon key` + `service_role key`
3. עדכן את `.env.local`
4. התקן את הספריות: `npm install @supabase/supabase-js @supabase/ssr`
5. צור קבצי client:
   - `lib/supabase/client.ts` — browser client
   - `lib/supabase/server.ts` — server client
   - `lib/supabase/middleware.ts` — auth refresh
6. צור `middleware.ts` בשורש שמשתמש ב-`updateSession`
7. **שאל את התלמיד אם הוא רוצה Supabase MCP מופעל** — אם כן, הוסף ל-`.claude/settings.json` (או הדרך אותו להפעיל).

> השתמש ב-skill `context7-mcp` כדי למשוך דוקומנטציה עדכנית של Supabase SSR לפני שאתה כותב קוד.

### שלב 3 — shadcn Components

שאל את התלמיד אילו components הוא רוצה להוסיף. אם הוא לא בטוח, הצע סט בסיסי:
```bash
npx shadcn@latest add button card input form dialog sonner
```

> יש skill זמין `shadcn` — השתמש בו.

### שלב 4 — דף בית אמיתי

החלף את `app/page.tsx` בדף landing מינימלי אבל יפה שכולל:
- כותרת עם שם הפרויקט (קח מ-`package.json`)
- כפתור התחברות (אם Supabase מחובר)

### שלב 5 — סיכום

הצג לתלמיד בעברית:
- ✅ מה מחובר
- 📝 מה עוד צריך להשלים
- 🚀 3 רעיונות למה לבנות עכשיו (רלוונטי לטמפלייט שלו)
- 💡 **טיפ:** אם הוא רוצה להוסיף AI, להריץ `/setup-vercel-ai` בנפרד

## עקרונות

- **דבר עברית** עם התלמיד לאורך כל הדרך.
- **אל תעשה יותר מדי במכה** — תן לתלמיד להבין כל שלב.
- **בדוק בפועל** — הרץ `npm run typecheck` אחרי שינויים משמעותיים.
- **אם משהו נשבר** — תקן את השורש, לא תטליא.
- השתמש ב-skills הזמינים (`shadcn`, `vercel:*`, `context7-mcp`) — אל תנחש APIs.

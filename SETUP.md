# מדריך הגדרת המערכת

## קובץ .env.local

```
NEXT_PUBLIC_SUPABASE_URL=https://jrutyagaovjpcvvujago.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WhatsApp
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...

# Cardcom
CARDCOM_TERMINAL=...
CARDCOM_API_NAME=...
CARDCOM_API_PASSWORD=...
```

---

## הגדרת Cardcom (סליקת אשראי)

### שלב 1 — פתיחת חשבון
1. היכנסי לאתר: https://cardcom.solutions
2. לחצי "פתח חשבון"
3. מלאי פרטי העסק (שם, ח.פ., חשבון בנק)
4. תוך 1-2 ימי עסקים תקבלי:
   - **Terminal Number** ← זה `CARDCOM_TERMINAL`
   - **API Name** ← זה `CARDCOM_API_NAME`
   - **API Password** ← זה `CARDCOM_API_PASSWORD`

### שלב 2 — הגדרת Webhook
בממשק Cardcom → הגדרות → Webhook URL:
```
https://your-domain.com/api/payments/webhook
```

---

## הגדרת WhatsApp Business

### שלב 1 — יצירת אפליקציה ב-Meta
1. היכנסי ל: https://developers.facebook.com
2. לחצי **My Apps** → **Create App**
3. בחרי סוג: **Business**
4. הוסיפי מוצר: **WhatsApp**

### שלב 2 — קבלת מפתחות
בדף WhatsApp → Getting Started:
- **Phone Number ID** ← זה `WHATSAPP_PHONE_ID`
- **Temporary access token** ← זה `WHATSAPP_TOKEN` (לבדיקות בלבד)
- לייצור: צרי **Permanent token** דרך System User

### שלב 3 — הוספת מספר טלפון ישראלי
1. בדף WhatsApp → **Phone Numbers** → **Add Phone Number**
2. הכניסי מספר נייד ישראלי של העסק (לא מספר שכבר מחובר לוואטסאפ רגיל!)
3. אמתי את המספר בקוד SMS
4. ה-**Phone Number ID** של המספר החדש ← שמי ב-`WHATSAPP_PHONE_ID`

### חשוב!
- מספר שמחובר לוואטסאפ רגיל **לא ניתן לשימוש** — צריך מספר נפרד
- לבדיקות: Meta נותנת מספר טסט חינמי (Test number) בלי צורך במספר אמיתי
- לייצור: עד 1,000 הודעות/יום בחינם

---

## הרצה מקומית

```bash
npm install
npm run dev
```

פתחי דפדפן ב: http://localhost:3000

## פריסה ב-Vercel

```bash
npx vercel
```

הוסיפי את כל משתני הסביבה ב-Vercel → Settings → Environment Variables

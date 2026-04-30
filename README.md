<div dir="rtl">

# 🎮 Game Changer — Next.js Template

טמפלייט production-ready לבניית אפליקציות AI-first עם **Next.js 16 + shadcn/ui + Supabase + Vercel AI Gateway**.
נבנה במיוחד לתלמידי הקורס **Game Changer** — עם Claude Code מחובר, skills, MCPs, והכל מוכן ל-Vibe Coding.

---

## 🚀 התחלה מהירה (דקה אחת)

```bash
git clone https://github.com/RanNahmany/game-changer-app-template.git my-app
cd my-app
npm run setup
```

הסקריפט עושה הכל בשבילך:
- 🧹 מנקה את היסטוריית ה-git של הטמפלייט
- 🆕 מאתחל git repo חדש על שמך
- 📦 מתקין dependencies
- 🔐 יוצר `.env.local` מתוך `.env.example`
- ✅ יוצר commit ראשון

---

## 🧑‍💻 השלב הבא — פתיחה ב-Claude Code

```bash
claude
```

ובתוך Claude Code:

```
/start-from-template
```

הפקודה `/start-from-template` תעביר אותך תהליך אינטראקטיבי (בעברית) שמחבר:
1. **Supabase** — DB + Auth + Storage
2. **shadcn components** — ה-UI שאתה צריך
3. **דף בית ראשוני** — משהו יפה להתחיל איתו

### 🤖 רוצה להוסיף AI? הרץ בנפרד:

```
/setup-vercel-ai
```

הפקודה מחברת **Vercel AI Gateway** — גישה מאוחדת ל-Claude, GPT, Gemini וכל המודלים, עם **5$ קרדיט חינם כל חודש**.
כולל התקנת `ai` + `@ai-sdk/gateway`, יצירת route צ'אט, ואופציונלית UI צ'אט עם shadcn.

---

## 📦 מה יש בטמפלייט?

### Stack
- ⚡ **Next.js 16** (App Router + Turbopack)
- 🎨 **Tailwind CSS 4** + **shadcn/ui** + **Base UI**
- 🌙 **next-themes** — dark mode מוכן
- 📊 **Recharts** — גרפים
- 🔔 **Sonner** — toasts
- 📅 **date-fns** + **react-day-picker**
- 🎠 **Embla Carousel**, **Vaul** (drawers), **CMDK** (command palette)

### Claude Code Integration
- 📚 **Skills** מותקנים: `shadcn`, ועוד (ראה `.agents/skills/`)
- 🔌 **MCP-ready** — מוכן ל-Supabase MCP ו-Context7
- ⚙️ **Slash commands** — `/start-from-template` לאתחול, `/setup-vercel-ai` לחיבור AI

### איכות קוד
- 🔍 **TypeScript** strict mode
- 🧹 **ESLint** + **Prettier** + **prettier-plugin-tailwindcss**
- ✨ `npm run format` ו-`npm run typecheck` מוכנים

---

## 🛠️ Scripts זמינים

| Script | מה זה עושה |
|--------|------------|
| `npm run setup` | אתחול ראשוני של הפרויקט (רצים פעם אחת) |
| `npm run dev` | שרת פיתוח עם Turbopack |
| `npm run build` | build לפרודקשן |
| `npm run start` | הרצת הפרודקשן build מקומית |
| `npm run lint` | בדיקת ESLint |
| `npm run format` | עיצוב קוד עם Prettier |
| `npm run typecheck` | בדיקת TypeScript בלי build |

---

## 🎨 הוספת shadcn components

```bash
npx shadcn@latest add button card input form dialog
```

ה-components ייכנסו ל-`components/ui/` והשימוש בהם:

```tsx
import { Button } from "@/components/ui/button";
```

או פשוט תבקש מ-Claude Code: _"תוסיף לי כפתור ו-card"_ — ה-skill של shadcn יעשה את זה.

---

## 🔐 Environment Variables

הקובץ `.env.local` נוצר אוטומטית בהרצת `npm run setup`. המשתנים:

```env
NEXT_PUBLIC_SUPABASE_URL=         # https://supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_GATEWAY_API_KEY=               # https://vercel.com/ai-gateway — 5$ חינם כל חודש!

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ אל תעלה את `.env.local` ל-git!** (זה כבר ב-`.gitignore`)

---

## 📂 מבנה הפרויקט

```
.
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # components שלך
│   └── ui/                 # shadcn components (ייווצר אחרי הוספה)
├── hooks/                  # React hooks
├── lib/                    # utilities (cn, וכו')
├── public/                 # קבצים סטטיים
├── scripts/
│   └── setup.mjs           # סקריפט האתחול
├── .claude/
│   └── commands/
│       ├── start-from-template.md   # /start-from-template — אתחול Supabase + UI
│       └── setup-vercel-ai.md       # /setup-vercel-ai — חיבור Vercel AI Gateway
├── .agents/skills/         # Claude Code skills
└── .env.example            # תבנית ל-environment variables
```

---

## 🆘 בעיות נפוצות

<details>
<summary><b>Node version שגוי</b></summary>

הטמפלייט דורש **Node 20+** (מומלץ 24 LTS). בדוק עם:
```bash
node --version
```
אם צריך, התקן nvm והרץ `nvm install 24`.
</details>

<details>
<summary><b>npm run setup נכשל על git commit</b></summary>

כנראה לא מוגדר לך `user.email` / `user.name` ב-git. הגדר:
```bash
git config --global user.name "השם שלך"
git config --global user.email "email@example.com"
```
ואז הרץ שוב את הסקריפט או סתם הרץ `git commit` ידנית.
</details>

<details>
<summary><b>Claude Code לא מותקן</b></summary>

```bash
npm install -g @anthropic-ai/claude-code
```
ואז `claude` בתיקיית הפרויקט.
</details>

---

## 📚 מקורות

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com/docs)
- [Vercel AI SDK](https://ai-sdk.dev)
- [Claude Code](https://docs.claude.com/en/docs/claude-code)

---

<div align="center">

**Built with 💜 for Game Changer students**

`Vibe Coding = Happy Coding 🎮`

</div>

</div>

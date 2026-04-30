#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, rmSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const c = {
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  b: (s) => `\x1b[34m${s}\x1b[0m`,
  m: (s) => `\x1b[35m${s}\x1b[0m`,
  c: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const runQuiet = (cmd) => execSync(cmd, { stdio: "pipe" }).toString().trim();

const step = (n, total, title) =>
  console.log(`\n${c.c(`[${n}/${total}]`)} ${c.bold(title)}`);

console.log(`
${c.m("╔════════════════════════════════════════════╗")}
${c.m("║")}   ${c.bold("🎮 Game Changer — Template Setup")}        ${c.m("║")}
${c.m("║")}   ${c.dim("מכין לך פרויקט חדש לגמרי...")}             ${c.m("║")}
${c.m("╚════════════════════════════════════════════╝")}
`);

const TOTAL = 5;

// 1. Purge old git history, init fresh
step(1, TOTAL, "מאפס היסטוריית git (מנקה את ההיסטוריה של הטמפלייט)");
if (existsSync(".git")) {
  rmSync(".git", { recursive: true, force: true });
  console.log(c.dim("  ✓ .git הישן הוסר"));
}
run("git init -q -b main");
console.log(c.g("  ✓ git repo חדש אותחל"));

// 2. Project name → package.json
step(2, TOTAL, "מגדיר שם לפרויקט");
const rl = readline.createInterface({ input, output });
const defaultName = process.cwd().split("/").pop() || "my-app";
const raw = (await rl.question(`  שם הפרויקט ${c.dim(`(ברירת מחדל: ${defaultName})`)}: `)).trim();
rl.close();
const projectName = (raw || defaultName).toLowerCase().replace(/[^a-z0-9-]/g, "-");
const pkgPath = "package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = projectName;
pkg.version = "0.1.0";
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(c.g(`  ✓ שם הפרויקט: ${projectName}`));

// 3. Install deps
step(3, TOTAL, "מתקין dependencies (זה יכול לקחת דקה או שתיים)");
if (!existsSync("node_modules")) {
  run("npm install");
} else {
  console.log(c.dim("  ✓ node_modules כבר קיים — מדלג"));
}

// 4. .env.local from example
step(4, TOTAL, "מכין קובץ environment");
if (existsSync(".env.example") && !existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  console.log(c.g("  ✓ נוצר .env.local (תמלא את המשתנים בהמשך)"));
} else if (existsSync(".env.local")) {
  console.log(c.dim("  ✓ .env.local כבר קיים — מדלג"));
}

// 5. First commit
step(5, TOTAL, "יוצר commit ראשון");
try {
  run("git add -A", { stdio: "pipe" });
  run(`git commit -q -m "chore: initial commit from game-changer template"`, { stdio: "pipe" });
  console.log(c.g("  ✓ commit ראשון נוצר"));
} catch {
  console.log(c.y("  ! לא הצלחתי ליצור commit — אולי git לא מוגדר עדיין (git config user.email/user.name)"));
}

// Done
console.log(`
${c.g("━".repeat(50))}
${c.bold("✅  הכל מוכן! הפרויקט שלך מוכן לעבודה")}
${c.g("━".repeat(50))}

${c.bold("🚀 השלבים הבאים:")}

  ${c.c("1.")} הרץ את שרת הפיתוח:
     ${c.y("npm run dev")}

  ${c.c("2.")} פתח את הפרויקט ב-Claude Code:
     ${c.y("claude")}

  ${c.c("3.")} בתוך Claude Code, הרץ את הפקודה:
     ${c.y("/start-from-template")}
     ${c.dim("(מדריך מלא לחיבור Supabase + Vercel AI + backend)")}

  ${c.c("4.")} מלא את המשתנים בקובץ:
     ${c.y(".env.local")}

${c.m("💡 טיפ:")} קרא את ${c.bold("README.md")} למידע מפורט על מה יש בטמפלייט.

${c.dim("בהצלחה 🎮 Game Changer Time")}
`);

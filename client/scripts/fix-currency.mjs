// Poore frontend mein "Rs {..}" ki jagah formatMoney(..) laga deta hai aur zaroori import jor deta hai.
//
// client folder ke andar se chalayen:
//   node scripts/fix-currency.mjs           -> sirf dikhata hai, KUCH NAHI BADALTA
//   node scripts/fix-currency.mjs --write   -> pehle poore src ka backup, phir badlav

import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("src");
const WRITE = process.argv.includes("--write");

if (!fs.existsSync(SRC)) {
  console.error('Folder "src" nahi mila. Yeh script client folder ke andar se chalayen.');
  process.exit(1);
}

const SKIP = [
  path.join(SRC, "utils", "currency.js"),
  path.join(SRC, "context", "CurrencyContext.jsx"),
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(jsx|js)$/.test(entry.name) ? [full] : [];
  });

// Tarteeb zaroori hai: pehle toLocaleString wale, phir saade
const RULES = [
  // JSX:       Rs {x.toLocaleString()}   ->  {formatMoney(x)}
  { re: /Rs \{([^{}]+?)\??\.toLocaleString\(\)\}/g, to: "{formatMoney($1)}" },
  // Template:  Rs ${x.toLocaleString()}  ->  ${formatMoney(x)}
  { re: /Rs \$\{([^{}]+?)\??\.toLocaleString\(\)\}/g, to: "${formatMoney($1)}" },
  // JSX:       Rs {x}                    ->  {formatMoney(x)}
  { re: /Rs \{([^{}]+)\}/g, to: "{formatMoney($1)}" },
  // Template:  Rs ${x}                   ->  ${formatMoney(x)}
  { re: /Rs \$\{([^{}]+)\}/g, to: "${formatMoney($1)}" },
];

const ensureImport = (src, file) => {
  if (/import\s*\{[^}]*\bformatMoney\b[^}]*\}\s*from/.test(src)) return src;

  let rel = path
    .relative(path.dirname(file), path.join(SRC, "utils", "currency"))
    .split(path.sep)
    .join("/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  const line = `import { formatMoney } from "${rel}";`;

  const imports = [...src.matchAll(/^import[^;]*?from\s*["'][^"']+["'];?[ \t\r]*$/gm)];
  if (imports.length === 0) return `${line}\n${src}`;

  const last = imports[imports.length - 1];
  const end = last.index + last[0].length;
  return `${src.slice(0, end)}\n${line}${src.slice(end)}`;
};

const files = walk(SRC).filter((f) => !SKIP.includes(f));
const results = [];

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let updated = original;
  const samples = [];
  let count = 0;

  for (const { re, to } of RULES) {
    updated = updated.replace(re, (match, ...args) => {
      count += 1;
      if (samples.length < 2) samples.push(match);
      return to.replace("$1", args[0]);
    });
  }

  if (count > 0) updated = ensureImport(updated, file);
  results.push({ file, original, updated, count, samples });
}

const changed = results.filter((r) => r.count > 0);

console.log(`\n${WRITE ? "BADLAV KIYE JA RAHE HAIN" : "DRY RUN (kuch nahi badla)"}\n`);
for (const r of changed) {
  console.log(`${path.relative(SRC, r.file)}: ${r.count} jagah`);
  for (const s of r.samples) console.log(`    ${s}`);
}
console.log(`\nKul ${changed.length} files, ${changed.reduce((n, r) => n + r.count, 0)} jagah.`);

if (WRITE && changed.length > 0) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.resolve(`src_backup_before_currency_${stamp}`);
  fs.cpSync(SRC, backup, { recursive: true });
  console.log(`\nBackup bana: ${backup}`);

  for (const r of changed) fs.writeFileSync(r.file, r.updated, "utf8");
  console.log("Files likh di gayin.");
}

// Jo "Rs" ab bhi bacha hai (jo script nahi pakad saka), un ki list haath se theek karne ke liye
const leftovers = [];
for (const r of results) {
  r.updated.split(/\r?\n/).forEach((line, i) => {
    if (/\bRs\b/.test(line)) leftovers.push(`${path.relative(SRC, r.file)}:${i + 1}: ${line.trim()}`);
  });
}
console.log(`\nAb bhi "Rs" wali lines (${leftovers.length}), inhein haath se dekhna hai:`);
leftovers.forEach((l) => console.log(`  ${l}`));

if (!WRITE) console.log("\nTheek lage to dobara chalayen:  node scripts/fix-currency.mjs --write\n");
else console.log("\nAb `npm run build` chala kar dekhein ke koi error to nahi.\n");
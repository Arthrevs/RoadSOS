/**
 * Merge i18n JSON files: take all keys from origin/main as the base,
 * then add any NEW keys from our branch on top.
 * Writes clean, sorted JSON back to disk.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const I18N_DIR = path.resolve('src/i18n');

const jsonFiles = fs.readdirSync(I18N_DIR).filter(f => f.endsWith('.json'));

let fixed = 0;

for (const file of jsonFiles) {
  const filePath = path.join(I18N_DIR, file);
  const relPath = `frontend/src/i18n/${file}`;

  // Get the version from origin/main
  let mainContent;
  try {
    mainContent = execSync(`git show origin/main:${relPath}`, { encoding: 'utf-8' });
  } catch {
    console.log(`  SKIP ${file} — not in origin/main`);
    continue;
  }

  // Parse main version
  let mainJson;
  try {
    mainJson = JSON.parse(mainContent);
  } catch (e) {
    console.log(`  ERROR parsing main version of ${file}: ${e.message}`);
    continue;
  }

  // Read our current working copy (may have bad merge artifacts)
  const ourContent = fs.readFileSync(filePath, 'utf-8');

  // Strip any leftover conflict markers before parsing
  const cleaned = ourContent
    .replace(/^<<<<<<< .*$/gm, '')
    .replace(/^=======\r?\n?/gm, ',\n')
    .replace(/^>>>>>>> .*$/gm, '');

  let ourJson;
  try {
    ourJson = JSON.parse(cleaned);
  } catch {
    // If it still can't parse, try a more aggressive cleanup
    try {
      // Remove the lone comma lines and re-attempt
      const aggressive = ourContent
        .replace(/^<<<<<<< .*\r?\n?/gm, '')
        .replace(/^=======\r?\n?/gm, '')
        .replace(/^>>>>>>> .*\r?\n?/gm, '')
        .replace(/,(\s*,)/g, ',')       // double commas
        .replace(/,(\s*\})/g, '$1');     // trailing comma before }
      ourJson = JSON.parse(aggressive);
    } catch (e2) {
      console.log(`  ERROR parsing our version of ${file}: ${e2.message}`);
      continue;
    }
  }

  // Merge: start with main, overlay our new keys
  const merged = { ...mainJson };
  for (const [key, value] of Object.entries(ourJson)) {
    if (!(key in merged)) {
      merged[key] = value;  // new key from our branch
    }
    // If key exists in main, keep main's version (it's the latest)
  }

  // Write clean JSON
  const output = JSON.stringify(merged, null, 2) + '\n';
  fs.writeFileSync(filePath, output, 'utf-8');
  fixed++;
  console.log(`  ✓ ${file} — ${Object.keys(merged).length} keys`);
}

console.log(`\nFixed ${fixed} i18n files.`);

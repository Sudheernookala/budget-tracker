// Builds the app and copies it to the repository root.
//
// Why: if GitHub Pages is set to "Deploy from a branch", GitHub publishes the files in the
// repo root as they are. Keeping the built app there means the live site shows the Angular
// app whichever way Pages is configured.
//
// Run from angular-app/:  npm run publish:root   — then commit the changed root files.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const appDir = resolve(import.meta.dirname, '..');
const rootDir = resolve(appDir, '..');
const distDir = join(appDir, 'dist/budget-app/browser');
const listFile = join(rootDir, '.pages-files'); // what the last publish put in the root

execSync('npx ng build --base-href /budget-tracker/', { cwd: appDir, stdio: 'inherit' });
cpSync(join(distDir, 'index.html'), join(distDir, '404.html'));
writeFileSync(join(distDir, '.nojekyll'), ''); // stop GitHub's Jekyll from touching the files

// Remove only what the previous publish added, never anything else in the repo.
if (existsSync(listFile)) {
  for (const name of readFileSync(listFile, 'utf8').split('\n').filter(Boolean)) {
    rmSync(join(rootDir, name), { recursive: true, force: true });
  }
}

const published = readdirSync(distDir);
for (const name of published) cpSync(join(distDir, name), join(rootDir, name), { recursive: true });
writeFileSync(listFile, published.sort().join('\n') + '\n');
console.log(`Published ${published.length} entries to the repo root.`);

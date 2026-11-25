// Dapur Kilat: the hand-in program (Node 22, standard library only). The game is
// the plain static files under game/ (index.html plus its ES modules, no library,
// no network request), and the screenshots are the four JPEGs under screenshots/.
// This program copies both folders from beside itself into /output and writes
// /output/dossier.json, the summary the judge reads, using the vendored make.fun
// library. It runs twice in the grader and must write the same bytes both times,
// so it does nothing time-dependent and nothing that reads the clock.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing, nothing to hand in');
}
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((name) => !name.startsWith('.')).length === 0) {
  throw new Error('screenshots/ is empty, the judge needs the game in pictures');
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse (more than 4 screenshots
// or one over 256 KiB; more than 993 files in game/ or 48 MiB of game files in
// all, or a path under game/ over 1000 bytes). game/ shares /output's own
// 1000-entry cap with screenshots/ and dossier.json, so the counts above leave room.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Dapur Kilat handed in: game/ and screenshots/ copied to ${out}, dossier.json written.`);
// Determinism note: nothing above reads the time, the network or the environment,
// so a second run writes byte-identical output.

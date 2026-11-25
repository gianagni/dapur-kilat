# dapur-kilat
[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/gianagni/dapur-kilat/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/gianagni/dapur-kilat/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Dapur Kilat is a fast Indonesian street-food kitchen game: orders arrive on the board with a draining patience bar, and you chop, wok, grill and plate four warung dishes (Nasi Goreng, Mie Ayam, Sate Ayam, Gado-Gado) before the customers walk away. Serve fast to build a combo, survive three three-minute shifts as the orders pile up, and keep the wok from burning. All art is drawn in code, all sounds are a tiny WebAudio synth, and the whole game is plain static files with no network requests.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Click ingredient bins (or keys 1-8) to pick things up, click a station to chop, cook or grill, click the plating station to assemble, then click a finished plate and its ticket to serve. Space does the obvious action, R restarts, P pauses, M mutes.

Screenshots in `screenshots/` are real renders of the game in a browser, staged with `?shot=kitchen|assembly|rush|serve` (see `shots.json`).

<sub>Entered on [make.fun](https://make.fun/?ref=pdjgt9c9&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

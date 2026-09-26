# Moneta showcase

A 50-second promo video for [Moneta](https://github.com/flyri0/moneta), in two cuts:

- `video/out/moneta-16x9.mp4`: 1920×1080, 60 fps
- `video/out/moneta-9x16.mp4`: 1080×1920, 60 fps

It is built with [Remotion](https://www.remotion.dev) from real captures of the app's demo
budget: Playwright drives the app and saves a screenshot at every step, plus the position of
what the cursor aims at, and Remotion animates them (cursor, camera, captions, transitions)
over a 120 bpm soundtrack.

## Layout

```
app.patch          tweaks to the Moneta app for clean captures (see below)
capture/           Playwright scripts that drive the app and save the captures
  capture.mjs      every shot of the video → video/public/captures/ (+ meta.json with boxes)
  readme.mjs       the README screenshots → .github/screenshots/ of the Moneta checkout
  contact.mjs      contact sheet of captures, for reviewing
  sheet.mjs        contact sheet of rendered stills, for reviewing
  serve.mjs        serves the app's ./build while capturing
video/             the Remotion project
  src/Root.tsx     the two compositions (Showcase16x9, Showcase9x16)
  src/scenes/      Intro, Stage (the app story), Privacy, Outro; scripts.ts holds the timeline
  src/components/  device frame, captures player, cursor and taps, type
  src/Soundtrack.tsx  music choice, mix levels and every sound effect
  public/          captures, music, sound effects, Inter font
  tools/           stills.mjs (render frames to check), levels.mjs (audio peaks), sfx.mjs
                   (synthesizes key/pop/chime/blip/riser), tempo.mjs and phase.mjs (music BPM)
```

## Render

```sh
cd video
npm install
npx remotion studio                  # preview and scrub
npx remotion render src/index.ts Showcase16x9 out/moneta-16x9.mp4 --crf=18 --audio-bitrate=320k
npx remotion render src/index.ts Showcase9x16 out/moneta-9x16.mp4 --crf=18 --audio-bitrate=320k
```

Each cut takes about 10 minutes on 6 cores. To pick another track, pass
`--props='{"track":"finalStep","offset":0}'` (see `TRACKS` in `src/Soundtrack.tsx`: all of
them are 120 bpm, so the cuts stay on the beat).

## Recapture the app

The captures in `video/public/captures/` come from Moneta at commit `56da45f` with
`app.patch` applied. The patch hides the demo banner and the loading bar, hides scrollbars and
toasts, and gives the demo's current month round plans with room left (and one overspent
envelope) so the budget shows colour.

```sh
git clone git@github.com:flyri0/moneta.git && cd moneta
git checkout 56da45f && git apply ../moneta-showcase/app.patch
cp -r ../moneta-showcase/capture ../moneta-showcase/video .   # the scripts expect ../video
pnpm install && pnpm build
node capture/capture.mjs                  # or: desktop | accents | responsive | phone
```

The timeline in `video/src/scenes/scripts.ts` aims the cursor and camera with the boxes in
`meta.json`, so it follows the new captures as long as the same steps exist.

## Credits

- Music: "Advertime" (and the alternatives in `video/public/music/`) by Kevin MacLeod,
  [FreePD](https://freepd.com), CC0 / public domain, via the
  [SoundSafari CC0 corpus](https://github.com/SoundSafari/CC0-1.0-Music).
- Sound effects: `whoosh`, `whip`, `mouse-click`, `switch`, `page-turn` and `shutter-modern` from
  [@remotion/sfx](https://www.remotion.dev/docs/sfx/) (CC0, from freesound.org). `key`, `pop`,
  `chime`, `blip` and `riser` are synthesized by `video/tools/sfx.mjs`.
- Font: [Inter](https://rsms.me/inter/), SIL Open Font License.
- Remotion is free for individuals and companies of up to three people; larger companies need a
  [company license](https://www.remotion.pro).

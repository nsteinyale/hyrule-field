# Hyrule Field (fan-made 3D walk-through)

A first-person walk around a Hyrule Field–style valley, built with React, Vite, three.js, and @react-three/fiber. It is set up the same way as [yale_som_virtual](https://github.com/zlisto/yale_som_virtual) (the Evans Hall walk-through), with a big outdoor heightfield instead of one building floor.

You can visit Hyrule Castle (moat, drawbridge, Castle Town plaza, keep), Lon Lon Ranch (barn, silo, cows, and a horse galloping laps), Kakariko Village under Death Mountain (windmill, well, chickens), Lake Hylia (long bridge out to an island), Kokiri Forest and the Great Deku Tree, Zora's River, and the red-rock Gerudo canyon. A fairy follows you around, and there are 55 rupees hidden across the map. The minimap shows the ones you haven't found yet, and your progress is saved in the browser.

Fan-made for fun. Not affiliated with Nintendo. Everything is drawn in code: there are no game assets, music, or images.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5174 and click **Click to start**.

**Keyboard + mouse**

| Key | Action |
| --- | --- |
| W A S D / arrows | walk |
| Mouse | look |
| Shift | run |
| Space | jump |
| C | crouch |
| M | toggle map |
| Esc | pause |

**Phone / tablet:** tap **Tap to start**. The left-thumb joystick walks (push it all the way to run), and dragging anywhere else looks around.

## How it's built

- `src/places.js`: where everything is (meters, +x east, -z north), including the castle, ranch, village, lake, forest, river, and roads.
- `src/terrain.js`: the heightfield (rolling hills, flattened building sites, river channel, lake bowl, moat, ring of cliffs, Death Mountain) and the ground colors. `heightAt()` uses the same triangles as the rendered mesh, so you always stand exactly on the ground you see.
- `src/layout.js`: buildings, towers, fences, bridges, signs, trees, rocks, and rupees, plus collision (`collide`), floor height (`floorAt`, which also covers bridges and wading), and place names (`locate`).
- `src/Terrain.jsx`, `Sky.jsx`, `Nature.jsx`: the low-poly ground and water; the sky dome, sun, clouds, and Death Mountain's smoke ring; trees, mesas, the Deku Tree, and grass and flowers that wrap around you as you walk.
- `src/Castle.jsx`, `Ranch.jsx`, `Village.jsx`, `Structures.jsx`: the buildings and animals.
- `src/Rupees.jsx`, `rupeeStore.js`, `sound.js`: the rupee hunt and its little synth chimes.
- `src/Player.jsx`, `TouchControls.jsx`, `Minimap.jsx`, `Fairy.jsx`: walking, phone controls, the map, and your fairy.

`.github/workflows/pages.yml` deploys to GitHub Pages on every push to `main`.

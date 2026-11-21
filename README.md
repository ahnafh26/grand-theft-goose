# Grand Theft Goose: Waterloo Edition

An open-world browser game set on the real streets of Waterloo, Ontario: the University of Waterloo, Wilfrid Laurier
University, University Ave and King St down to Uptown Waterloo. Walk, drive and get chased through a 3D Waterloo built
from real map data, with real storefronts, campus buildings and plenty of geese.

🚧 **Work in progress.** Screenshots, a gameplay video and a playable link are coming soon.

## Run locally

```bash
npm ci
node tools/dev-server.mjs
```

Then open the URL it prints. Best in a recent Chrome or Edge (WebGPU); other browsers fall back to WebGL2.

## Credits

Built with three.js on the open-source Slop city engine (MIT); see [CREDITS.md](CREDITS.md) and [LICENSE](LICENSE).
Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL).

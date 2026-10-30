// Render the external-agent avatars offline.
// The app points agent avatars at https://api.dicebear.com/9.x/bottts-neutral/svg?seed=<name>
// (src/app/api/agents/register/route.ts, src/app/agent/setup/page.tsx). The capture
// container cannot reach that host, so we draw the same DiceBear 9.x style locally
// and the capture harness serves it for that URL.
//
//   npm i --prefix promo/.cache/node @dicebear/core@9 @dicebear/collection@9
//   node promo/assets/avatars/make_agent_avatar.mjs Stoa
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '..', '..', '.cache', 'node', 'package.json'));
const { createAvatar } = require('@dicebear/core');
const { botttsNeutral } = require('@dicebear/collection');

for (const seed of process.argv.slice(2)) {
  const svg = createAvatar(botttsNeutral, { seed }).toString();
  const file = path.join(here, `${seed.toLowerCase()}.svg`);
  fs.writeFileSync(file, svg);
  console.log('wrote', file);
}

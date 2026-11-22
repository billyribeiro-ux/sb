import type { Adapter } from '@sveltejs/kit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite-plus';
import fs from 'node:fs';
import path from 'node:path';

const staticExport: Adapter = {
  name: 'sergio-static-export',
  async adapt(builder) {
    const output = 'dist';
    for (const route of builder.routes) {
      if (route.prerender !== true) {
        throw new Error(`Route "${route.id}" must be prerendered for this static export.`);
      }
    }
    // Write standard dist directory
    builder.rimraf(output);
    builder.writeClient(output);
    builder.writePrerendered(output);

    // Also write Vercel Build Output API v3 structure for seamless Vercel deployment
    const vercelOut = '.vercel/output';
    const vercelStatic = path.join(vercelOut, 'static');
    builder.rimraf(vercelOut);
    builder.writeClient(vercelStatic);
    builder.writePrerendered(vercelStatic);
    fs.mkdirSync(vercelOut, { recursive: true });
    fs.writeFileSync(
      path.join(vercelOut, 'config.json'),
      JSON.stringify({ version: 3 }, null, 2)
    );
  },
};

export default defineConfig({
  plugins: [sveltekit({ adapter: staticExport })],
});

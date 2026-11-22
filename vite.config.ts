import type { Adapter } from '@sveltejs/kit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite-plus';

const staticExport: Adapter = {
  name: 'sergio-static-export',
  async adapt(builder) {
    const output = 'dist';
    for (const route of builder.routes) {
      if (route.prerender !== true) {
        throw new Error(`Route "${route.id}" must be prerendered for this static export.`);
      }
    }
    builder.rimraf(output);
    builder.writeClient(output);
    builder.writePrerendered(output);
  },
};

export default defineConfig({
  plugins: [sveltekit({ adapter: staticExport })],
});

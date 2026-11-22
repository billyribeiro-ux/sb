# Sergio Bellotti

A SvelteKit artist website with a performance-led homepage and dedicated biography, music, education, and contact pages. The site uses Sergio's own graded photography, self-hosted type, and links to his published performances and booking channels.

## Development

Use Node 26.13.1 LTS and pnpm 12.18.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
pnpm test:e2e
```

`pnpm dev` runs Vite+. `pnpm check` runs the Svelte compiler diagnostics with native TypeScript 7.0.2 via `svelte-check --tsgo`. The TypeScript 6.0.3 package provides the JavaScript compiler API required by SvelteKit sync. The build produces prerendered route HTML and assets in `dist/`. If a machine lacks Playwright’s browser binaries, run `pnpm exec playwright install chromium` once.

## Image sources and motion

The [image source index](image-sources.csv) maps shipped WebPs to native artist originals and lists their responsive crops. In the project workspace, the full working archive is documented in `media/README.md`. Only the selected site assets are part of the deployment.

GSAP ScrollTrigger drives a full-screen dissolve between the layered portrait and a moving performance sequence. The scroll updates the text masks, light intensity and playback together. The foreground plates align with their full-photo counterparts. A separate WebGL highlight tracks the pointer and reacts when the visitor strikes the cymbal. Supported browsers use a native shutter between route changes. Reduced motion keeps the static composition and content available. The interactive WebGL cymbal uses a procedural bronze mesh, an SVG fallback, and a synthesized strike triggered by the visitor.

The homepage’s *Happy People 7/4* and Music page’s *Mr. D* use edited clips from Sergio’s press-kit footage with synchronized original audio. The clips start muted when visible and offer sound, playback, and quality controls. The three 3840 × 2160 editions are upscaled from Sergio’s native 1280 × 720 studio masters, and the HD files stay available for smaller displays or limited connections. The Education page’s ghost-note exercise is an opt-in audible practice demonstration. The full performance embed loads on request, and the photo lightbox supports keyboard navigation.

## Official references

- [SvelteKit view transitions](https://svelte.dev/blog/view-transitions) and [navigation lifecycle](https://svelte.dev/docs/kit/$app-navigation)
- [Svelte 5 runes](https://svelte.dev/docs/svelte/what-are-runes) and [TypeScript in components](https://svelte.dev/docs/svelte/typescript)
- [SvelteKit 3.4.0 release](https://github.com/sveltejs/kit/releases/tag/%40sveltejs%2Fkit%403.4.0), [routing](https://svelte.dev/docs/kit/routing), [Kit Vite configuration](https://svelte.dev/docs/kit/@sveltejs-kit-vite), and [adapter API](https://svelte.dev/docs/kit/writing-adapters)
- [TypeScript 7 release](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [SvelteKit compiler API note](https://github.com/sveltejs/kit/pull/17539), and [svelte-check CLI](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md)
- [Vite+ guide](https://www.viteplus.dev/guide/) and [Vite+ 1.7.0 release](https://github.com/voidzero-dev/vite-plus/releases/tag/v1.7.0)
- [Phosphor Svelte icons](https://github.com/haruaki07/phosphor-svelte)
- [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia/) and [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) and [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Playwright Test](https://playwright.dev/docs/test-configuration)

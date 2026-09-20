// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://jrmfong.github.io',
	trailingSlash: 'always',
	integrations: [
		mdx(),
		sitemap({
			// Only HTML pages belong in the sitemap. The Markdown, llms.txt and
			// RSS endpoints are for crawlers that already found the HTML page.
			filter: (page) => !/\.(md|txt|xml)$/.test(new URL(page).pathname),
		}),
	],
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
			wrap: true,
		},
	},
});

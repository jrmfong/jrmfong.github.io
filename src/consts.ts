// Global site metadata. Edit these values and everything else follows.

export const SITE_TITLE = 'Jeremy Fong';
export const SITE_DESCRIPTION =
	'Notes on infrastructure, automation, and the tooling I build along the way.';

/** Canonical origin. Must match `site` in astro.config.mjs. */
export const SITE_URL = 'https://jrmfong.github.io';

export const AUTHOR = {
	name: 'Jeremy Fong',
	/** Shown on the about page and in structured data. */
	bio: 'I work on infrastructure and automation. This is where I write the things down.',
	github: 'https://github.com/jrmfong',
	/** Optional — leave as an empty string to hide the link. */
	linkedin: '',
	email: '',
};

export const NAV_LINKS = [
	{ href: '/', label: 'Home' },
	{ href: '/blog/', label: 'Writing' },
	{ href: '/about/', label: 'About' },
];

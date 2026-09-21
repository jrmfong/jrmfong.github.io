// Global site metadata. Edit these values and everything else follows.

export const SITE_TITLE = 'Jeremy Fong';
export const SITE_DESCRIPTION =
	'Notes on endpoint management, identity, security and automation — from a teacher turned infrastructure engineer.';

/** Canonical origin. Must match `site` in astro.config.mjs. */
export const SITE_URL = 'https://jrmfong.github.io';

export const AUTHOR = {
	name: 'Jeremy Fong',
	/** Shown on the home page and in structured data. */
	bio: 'Taught Biology and Computer Science in Hong Kong, now the infrastructure guy in Britain — endpoint management, identity, security, and automation in Bash and Python.',
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

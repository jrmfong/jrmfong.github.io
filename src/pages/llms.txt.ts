import type { APIRoute } from 'astro';
import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';
import { getPosts } from '../lib/posts';

/**
 * /llms.txt — an index of the site in the llmstxt.org format.
 *
 * Gives a language model a single cheap fetch that lists every post with a
 * one-line summary and a link to its raw Markdown, instead of making it crawl
 * and strip the HTML.
 */
export const GET: APIRoute = async () => {
	const posts = await getPosts();

	const lines = [
		`# ${SITE_TITLE}`,
		'',
		`> ${SITE_DESCRIPTION}`,
		'',
		`Written by ${AUTHOR.name}. Every post below is also available as raw Markdown by`,
		'appending `.md` to its URL. The full text of the whole site is at',
		`${SITE_URL}/llms-full.txt.`,
		'',
		'## Posts',
		'',
		...posts.map(
			(post) =>
				`- [${post.data.title}](${SITE_URL}/blog/${post.id}.md): ${post.data.description}` +
				` (published ${post.data.pubDate.toISOString().slice(0, 10)})`,
		),
		'',
		'## Pages',
		'',
		`- [About](${SITE_URL}/about/): Who ${AUTHOR.name} is and what this site covers.`,
		`- [Writing index](${SITE_URL}/blog/): Every post, newest first.`,
		`- [RSS feed](${SITE_URL}/rss.xml): Subscribe to new posts.`,
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};

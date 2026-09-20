import type { APIRoute } from 'astro';
import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';
import { getPosts } from '../lib/posts';

/** /llms-full.txt — every post's full Markdown text in one document. */
export const GET: APIRoute = async () => {
	const posts = await getPosts();

	const header = [
		`# ${SITE_TITLE}`,
		'',
		`> ${SITE_DESCRIPTION}`,
		'',
		`All posts by ${AUTHOR.name}, full text, newest first.`,
		`Generated ${new Date().toISOString().slice(0, 10)} from ${SITE_URL}.`,
		'',
	].join('\n');

	const body = posts
		.map((post) =>
			[
				'---',
				'',
				`# ${post.data.title}`,
				'',
				`Source: ${SITE_URL}/blog/${post.id}/`,
				`Published: ${post.data.pubDate.toISOString().slice(0, 10)}`,
				post.data.tags.length ? `Tags: ${post.data.tags.join(', ')}` : null,
				'',
				post.body ?? '',
				'',
			]
				.filter((line) => line !== null)
				.join('\n'),
		)
		.join('\n');

	return new Response(`${header}\n${body}`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};

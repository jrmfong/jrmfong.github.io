import type { APIRoute } from 'astro';
import { SITE_URL } from '../../consts';
import { getPosts } from '../../lib/posts';

/**
 * Serves each post as raw Markdown at /blog/<slug>.md.
 *
 * Crawlers and LLM agents get the source text with no markup to strip, and
 * humans get a copy-pasteable version of the page.
 */
export async function getStaticPaths() {
	const posts = await getPosts();
	return posts.map((post) => ({ params: { slug: post.id }, props: post }));
}

export const GET: APIRoute = ({ props }) => {
	const { data, body, id } = props as Awaited<ReturnType<typeof getPosts>>[number];

	const frontMatter = [
		`# ${data.title}`,
		'',
		`> ${data.description}`,
		'',
		`Published: ${data.pubDate.toISOString().slice(0, 10)}`,
		data.updatedDate ? `Updated: ${data.updatedDate.toISOString().slice(0, 10)}` : null,
		data.tags.length ? `Tags: ${data.tags.join(', ')}` : null,
		`Source: ${SITE_URL}/blog/${id}/`,
		'',
		'---',
		'',
		'',
	]
		.filter((line) => line !== null)
		.join('\n');

	return new Response(frontMatter + (body ?? ''), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};

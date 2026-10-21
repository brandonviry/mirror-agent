import { source } from '@/lib/source';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/metadata';

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();

  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## Pages de Documentation',
    '',
    ...pages.map(
      (page) =>
        `- [${page.data.title}](${SITE_URL}${page.url}): ${page.data.description ?? ''}`
    ),
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

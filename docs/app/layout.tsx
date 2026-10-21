import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import {
  createMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: {
    template: '%s | Mirror Agent Docs',
    default: 'Mirror Agent — Documentation Technique & Architecture IA',
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'fr-FR',
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': `${SITE_URL}/#software`,
      name: 'Mirror Agent',
      description: SITE_DESCRIPTION,
      codeRepository: 'https://github.com/brandonviry/mirror-agent',
      programmingLanguage: ['Python', 'TypeScript'],
      runtimePlatform: 'LangGraph',
      author: {
        '@type': 'Person',
        name: 'Brandon Viry',
        url: 'https://github.com/brandonviry',
      },
    },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://mirror-agent-docs.vercel.app');

export const SITE_NAME = 'Mirror Agent Documentation';

export const SITE_DESCRIPTION =
  "Documentation technique et architecture en français de Mirror Agent : compagnon IA d'introspection socratique basé sur LangGraph, Mem0, ChromaDB, Obsidian et Gemini 2.0 Flash Thinking.";

export const DEFAULT_KEYWORDS = [
  'Mirror Agent',
  'LangGraph',
  'LangChain',
  'Mem0',
  'Mem0Memory',
  'ChromaDB',
  'Obsidian RAG',
  'Introspection IA',
  'Agent Socratique',
  'Zero-Runtime QA',
  'Gemini 2.0 Flash Thinking',
  'Ollama',
  'CohereRerank',
  'Documentation Française',
];

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    authors: [
      {
        name: 'Brandon Viry',
        url: 'https://github.com/brandonviry/mirror-agent',
      },
    ],
    creator: 'Brandon Viry',
    publisher: 'Mirror Agent',
    keywords: DEFAULT_KEYWORDS,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: SITE_URL,
      title: override.title ?? SITE_NAME,
      description: override.description ?? SITE_DESCRIPTION,
      siteName: SITE_NAME,
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? SITE_NAME,
      description: override.description ?? SITE_DESCRIPTION,
      ...override.twitter,
    },
  };
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mirror Agent — Documentation Technique & Architecture IA';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          color: '#fafafa',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: 22,
            color: '#a1a1aa',
            border: '1px solid #27272a',
            borderRadius: '9999px',
            padding: '8px 20px',
            alignSelf: 'flex-start',
          }}
        >
          LangGraph • Mem0 • ChromaDB • Obsidian • Zero-Runtime QA
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: '#ffffff',
            }}
          >
            Mirror Agent
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#d4d4d8',
              maxWidth: '960px',
              lineHeight: 1.4,
            }}
          >
            Compagnon IA d&apos;introspection socratique, mémoire persistante à long terme et RAG personnel sur Obsidian.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #27272a',
            paddingTop: '24px',
            fontSize: 22,
            color: '#71717a',
          }}
        >
          <span>Documentation Technique & Feuille de Route (FR)</span>
          <span>github.com/brandonviry/mirror-agent</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

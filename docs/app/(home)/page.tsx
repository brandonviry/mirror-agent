import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center items-center text-center px-6 py-16">
      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium mb-6 text-fd-muted-foreground">
        LangGraph • Mem0 • ChromaDB • Obsidian • Zero-Runtime QA
      </span>
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Mirror Agent — Documentation
      </h1>
      <p className="text-fd-muted-foreground max-w-2xl mb-8 text-base sm:text-lg">
        Votre compagnon IA pour l&apos;introspection socratique, la mémoire persistante à long terme (Mem0 Cloud &amp; Local) et l&apos;exploration de vos notes personnelles Obsidian.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
        <Link
          href="/docs"
          className="inline-flex items-center justify-center rounded-md bg-fd-primary px-6 py-2.5 text-sm font-semibold text-fd-primary-foreground shadow-sm transition-colors hover:opacity-90"
        >
          Consulter la Documentation
        </Link>
        <Link
          href="/docs/roadmap"
          className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-accent"
        >
          Feuille de Route (P0 → P3)
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full text-left">
        <Link
          href="/docs/architecture/vue-ensemble"
          className="rounded-lg border p-5 transition-colors hover:bg-fd-accent/50"
        >
          <h2 className="font-semibold mb-1">Architecture LangGraph</h2>
          <p className="text-sm text-fd-muted-foreground">
            Découvrez le flux conditionnel RetrievalGraph, IndexGraph et le nœud de raisonnement Gemini Thinking.
          </p>
        </Link>
        <Link
          href="/docs/memoire-et-rag/mem0-client"
          className="rounded-lg border p-5 transition-colors hover:bg-fd-accent/50"
        >
          <h2 className="font-semibold mb-1">Mémoire Mem0 (Cloud &amp; Local)</h2>
          <p className="text-sm text-fd-muted-foreground">
            Comparez MemoryClient (SaaS) et Memory.from_config (100 % local avec ChromaDB et Ollama).
          </p>
        </Link>
        <Link
          href="/docs/zero-runtime-qa"
          className="rounded-lg border p-5 transition-colors hover:bg-fd-accent/50"
        >
          <h2 className="font-semibold mb-1">Zero-Runtime QA</h2>
          <p className="text-sm text-fd-muted-foreground">
            Comment fiabiliser et vérifier le code généré par l&apos;IA par analyse théorique des types sans exécution.
          </p>
        </Link>
      </div>
    </main>
  );
}

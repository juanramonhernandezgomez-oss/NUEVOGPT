export default function Manual() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manual técnico</h1>
        <p className="text-muted-foreground mt-2">Esta versión migró la app para eliminar Base44 y usar almacenamiento local + Yahoo Finance free tier.</p>
      </div>
      <section className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Cambios principales</h2>
        <ul className="list-disc pl-6 text-sm text-foreground space-y-2">
          <li>Base44 fue reemplazado por un cliente local con persistencia en <code>localStorage</code>.</li>
          <li>Los datos de mercado se cargan desde un cliente gratuito de Yahoo Finance.</li>
          <li>Las analíticas antes resueltas por InvokeLLM ahora se calculan localmente a partir del histórico de precios.</li>
          <li>Watchlist e historial se guardan localmente y siguen integrados con React Query.</li>
        </ul>
      </section>
    </div>
  );
}

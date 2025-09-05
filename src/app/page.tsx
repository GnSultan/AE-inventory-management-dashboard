export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card max-w-md">
        <h1 className="text-2xl font-bold mb-4">Tailwind + Glassmorphism Test</h1>
        <p className="text-muted-foreground mb-6">If you see glassmorphism styling, Tailwind is working perfectly!</p>
        <a href="/dashboard" className="btn-primary inline-block">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Layers3,
  BookOpen,
  Database,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
const lessons = [
  {
    icon: ShieldCheck,
    title: 'From login to tenant isolation',
    text: 'Follow an opaque session through membership checks, roles, and a tenant-scoped SQL query.',
    file: 'docs/upskilling/security/tenant-isolation.md',
    level: 'FOUNDATIONS',
  },
  {
    icon: Database,
    title: 'The last item on the shelf',
    text: 'Run concurrent checkouts. Discover why checking stock before a separate write can oversell.',
    file: 'docs/upskilling/databases/transactions-and-concurrency.md',
    level: 'MID-LEVEL',
  },
  {
    icon: Workflow,
    title: 'A timeout is not a failed payment',
    text: 'Simulate a charge with a lost response, then trace the retry, durable idempotency, and recovery.',
    file: 'docs/upskilling/distributed-systems/durable-jobs.md',
    level: 'MID-LEVEL',
  },
  {
    icon: BookOpen,
    title: 'Evidence before completion',
    text: 'Use the actual build loop, acceptance criteria, repository instructions, and verification records.',
    file: 'docs/upskilling/agentic-engineering/manager-loop.md',
    level: 'ENGINEERING PRACTICE',
  },
];
export default function Academy() {
  return (
    <main className="academy-page">
      <Link href="/" className="text-link">
        <ArrowLeft size={17} />
        Back to workspace
      </Link>
      <div className="academy-hero">
        <span className="brand-mark">
          <Layers3 size={28} />
        </span>
        <p className="eyebrow">FORGE ENGINEERING ACADEMY</p>
        <h1>
          Understand the system.
          <br />
          Then make it better.
        </h1>
        <p>
          Follow real requests, investigate real failures, and practice the decisions behind
          production software.
        </p>
      </div>
      <div className="academy-grid">
        {lessons.map((lesson) => (
          <article className="panel lesson-card" key={lesson.file}>
            <lesson.icon size={26} />
            <p className="eyebrow">{lesson.level}</p>
            <h2>{lesson.title}</h2>
            <p>{lesson.text}</p>
            <code>{lesson.file}</code>
            <ArrowUpRight size={17} />
          </article>
        ))}
      </div>
      <section className="panel academy-start">
        <h2>Start with a working application.</h2>
        <p>
          Open the repository and follow <code>docs/upskilling/learning-path.md</code>. The first
          four lessons above use the implemented commerce slice. The wider curriculum remains
          tracked in the roadmap.
        </p>
        <pre>
          npm run dev{'\n'}npm test{'\n'}npm run test:e2e
        </pre>
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-mauve-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-light text-mauve-900 mb-4">
          Access Denied
        </h1>
        <p className="text-lg text-mauve-600 mb-8">
          You don&apos;t have permission to access this page
        </p>
        <Link
          href="/"
          className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition"
        >
          Go Back Home
        </Link>
      </div>
    </main>
  );
}

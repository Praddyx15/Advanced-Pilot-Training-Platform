/**
 * 404 Not Found page
 */

import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <a className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Return to Home
        </a>
      </Link>
    </div>
  );
}

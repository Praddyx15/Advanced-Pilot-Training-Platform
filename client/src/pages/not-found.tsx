import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/">
              Go to Homepage
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="mailto:support@aviation-training.example.com">
              Report Issue
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
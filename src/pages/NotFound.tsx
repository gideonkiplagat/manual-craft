import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <Button asChild>
        <Link to="/dashboard">Go Back to Dashboard</Link>
      </Button>
    </div>
  );
}

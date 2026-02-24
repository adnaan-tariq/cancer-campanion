import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <SearchX className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/">
          <Button className="rounded-xl gap-2 px-8 h-12 shadow-lg shadow-primary/20">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;

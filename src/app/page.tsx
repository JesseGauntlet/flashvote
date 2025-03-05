import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">HotDogHot</h1>
        <p className="text-xl text-muted-foreground mb-8">
          A flexible, real-time voting and sentiment-tracking platform
        </p>
        
        <div className="p-6 bg-white shadow-lg rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Welcome to HotDogHot</h2>
          <p className="text-gray-600 mb-6">
            HotDogHot allows you to create dedicated pages to capture quick, aggregated user votes.
            Perfect for quality tracking, event sentiment, political debates, sports events, and more.
          </p>
          
          <div className="flex gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard/events">
                <Button size="lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" variant="default">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-medium mb-3">Simple Setup</h3>
            <p className="text-gray-600">
              Create a new voting page in under 5 minutes with customizable options.
            </p>
          </div>
          
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-medium mb-3">Real-Time Results</h3>
            <p className="text-gray-600">
              See immediate feedback with color-coded indicators and concise dashboards.
            </p>
          </div>
          
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-medium mb-3">Location-Based</h3>
            <p className="text-gray-600">
              Filter results by location to get targeted insights from specific regions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.error("Global app error:", error);
  return (
    <html lang="en">
      <body className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <h1 className="text-2xl font-bold mb-3">Something went wrong 😔</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          We’re working to fix this. Please refresh the page or try again later.
        </p>
        <button
          onClick={() => reset()}
          className="bg-black text-white px-4 py-2 rounded-md"
        >
          Reload
        </button>
      </body>
    </html>
  );
}

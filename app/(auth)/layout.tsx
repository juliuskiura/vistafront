import Navbar from "@/components/navbar/navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background p-4">
      <Navbar />
      <div className="flex-1 min-h-0 items-center justify-center pt-16">
        {children}
      </div>
    </main>
  );
}

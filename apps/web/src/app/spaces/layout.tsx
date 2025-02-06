export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-screen-md p-4">{children}</div>
  );
}

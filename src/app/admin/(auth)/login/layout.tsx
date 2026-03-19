// Login page uses its own full-screen layout, no sidebar
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0c" }}>
      {children}
    </div>
  );
}

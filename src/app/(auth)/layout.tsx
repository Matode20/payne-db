export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background:
          "linear-gradient(180deg, #0c4a6e 0%, #0369a1 20%, #38bdf8 45%, #7dd3fc 62%, #bae6fd 75%, #fef9c3 88%, #fde68a 100%)",
      }}
    >
      {children}
    </div>
  );
}

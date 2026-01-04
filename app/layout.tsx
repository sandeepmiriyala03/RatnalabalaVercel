// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";

export const metadata = {
  title: "Ratnalabala",
  description: "Telugu Poems Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="te">
      <body>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}

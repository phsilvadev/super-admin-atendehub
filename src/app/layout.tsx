import type { ReactNode } from "react";
import "../styles.css";
export const metadata = {
  title: { default: "AtendeHub · Superadmin", template: "%s · AtendeHub" },
  description: "Administração da plataforma AtendeHub",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

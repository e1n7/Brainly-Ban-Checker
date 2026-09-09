import "./globals.css";

export const metadata = {
  title: "Brainly Ban Checker",
  description: "Scan Brainly content for potentially flagged words.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";
import "goey-toast/styles.css";

export const metadata = {
  title: "Content Checker",
  description:
    "An independent tool that compares draft text with selected reference word lists. Results are informational and do not predict moderation decisions.",
  applicationName: "Content Checker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

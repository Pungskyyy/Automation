import "./globals.css";

export const metadata = {
    title: "ADB Dashboard",
    description: "ADB Multi-Device Terminal",
};

export default function RootLayout({ children }) {
return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

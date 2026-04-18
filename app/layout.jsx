"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DeviceProvider } from "./contexts/DeviceContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    setIsLoggedIn(!!loggedInUser);
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <title>OPA Automation - Multi-Device Control</title>
        <meta name="description" content="Automation tool for social media" />
      </head>
      <body className="bg-gray-900">
        <DeviceProvider>
          {children}
        </DeviceProvider>
      </body>
    </html>
  );
}
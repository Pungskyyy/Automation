"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 min-h-screen p-6 flex flex-col">
      {/* Logo/Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">OPA Automation</h1>
        <p className="text-sm text-gray-400 mt-1">Multi-Device Control</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6">
        {/* Device Section */}
        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Device
          </h3>
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📱</span>
              <span>Scan Devices</span>
            </Link>

            <Link
              href="/connect-ip"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/connect-ip"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >            
            </Link>
          </div>
        </div>

        {/* Instagram Section */}
        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Instagram
          </h3>
          <div className="space-y-1">
            <Link
              href="/instagram-post"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/instagram-post"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📷</span>
              <span>Instagram Post</span>
            </Link>

            <Link
              href="/instagram-reels"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/instagram-reels"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">🎬</span>
              <span>Instagram Reels</span>
            </Link>

            <Link
              href="/ig-report"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/ig-report"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">🚨</span>
              <span>Report Account</span>
            </Link>
          </div>
        </div>

        {/* TikTok Section */}
        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            TikTok
          </h3>
          <div className="space-y-1">
            <Link
              href="/tiktok"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/tiktok"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">🎵</span>
              <span>TikTok Video</span>
            </Link>

            {/* ⬇️ TAMBAHKAN INI - TIKTOK POST */}
            <Link
              href="/tiktok-post"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/tiktok-post"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📸</span>
              <span>TikTok Post</span>
            </Link>

            <Link
              href="/tiktok-report"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                pathname === "/tiktok-report"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">🚨</span>
              <span>Report Account</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-700 mt-auto">
        <p className="text-xs text-gray-500 text-center">
          v1.0.0 | OPA Automation
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

const DriveIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.28 3L1 12.25 6.72 22h10.56L23 12.25 17.72 3zm5.22 15.5L7 10.5h10l-4.5 8zM7.75 9l2.5-4.5h3.5L16.25 9z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function DriveConnectPanel() {
  const { data: session, status } = useSession();
  const [disconnecting, setDisconnecting] = useState(false);

  const isLoading = status === "loading";
  const isConnected = !!session;

  async function handleDisconnect() {
    setDisconnecting(true);
    await signOut({ redirect: false });
    setDisconnecting(false);
  }

  async function handleConnect() {
    await signIn("google", { redirect: true });
  }

  async function handleSwitch() {
    await signOut({ redirect: false });
    await signIn("google", { redirect: true });
  }

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        isConnected
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + text */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isConnected
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <DriveIcon />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">
                Google Drive
              </p>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Connected
                </span>
              )}
            </div>

            {isLoading ? (
              <p className="text-xs text-gray-400 mt-0.5">Checking connection…</p>
            ) : isConnected ? (
              <div className="mt-0.5 space-y-0.5">
                <p className="text-xs text-gray-600">
                  Signed in as{" "}
                  <span className="font-medium text-gray-800">
                    {session.user?.email}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Exported files will be saved to your Drive root
                  {process.env.NEXT_PUBLIC_DRIVE_FOLDER_NAME
                    ? ` › ${process.env.NEXT_PUBLIC_DRIVE_FOLDER_NAME}`
                    : ""}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Connect to save classified test cases directly to your Drive
              </p>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          ) : isConnected ? (
            <>
              <button
                onClick={handleSwitch}
                className="text-xs text-indigo-600 font-medium px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Switch account
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm whitespace-nowrap"
            >
              <GoogleIcon />
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Permissions note when not connected */}
      {!isConnected && !isLoading && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
          <svg
            className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-xs text-gray-400 leading-relaxed">
            We only request{" "}
            <span className="font-medium text-gray-500">drive.file</span>{" "}
            access — this lets us create new files but never read or modify
            existing ones in your Drive.
          </p>
        </div>
      )}
    </div>
  );
}

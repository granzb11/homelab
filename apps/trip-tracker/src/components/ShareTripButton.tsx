"use client";

import { useState } from "react";

export default function ShareTripButton({ tripId }: { tripId: string }) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function generateShareLink() {
    if (shareLink) {
      copyToClipboard(shareLink);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: "POST",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("API error:", response.status, text);
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      const link = `${window.location.origin}/trips/share/${data.shareToken}`;
      setShareLink(link);
      copyToClipboard(link);
    } catch (error) {
      console.error("Failed to generate share link:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => {
          setShowModal(true);
          if (!shareLink) {
            generateShareLink();
          }
        }}
        disabled={isLoading}
        className="text-sm px-3 py-1.5 border border-ink-faint hover:bg-ink-faint transition-colors disabled:opacity-50"
      >
        {isLoading ? "Generating..." : "Share"}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-ink mb-4">Share this trip</h3>

            {shareLink ? (
              <div className="space-y-4">
                <p className="text-sm text-ink-muted">
                  Share this link to let others view your trip:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 px-3 py-2 border border-ink-faint text-sm font-mono bg-panel"
                  />
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className="px-4 py-2 bg-moss text-white text-sm font-medium hover:bg-moss transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-ink-muted">
                  Anyone with this link can view the trip details without signing in.
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Generating share link...</p>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-ink-faint hover:bg-ink-faint transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

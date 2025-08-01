"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Share, Twitter } from "lucide-react"

interface TwitterShareProps {
  text?: string
  url?: string
  hashtags?: string[]
  via?: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  showIcon?: boolean
  children?: React.ReactNode
}

export function TwitterShare({
  text = "🚀 Just discovered PeerShare - secure P2P file sharing & HD video calls with no servers! Share files instantly with end-to-end encryption. No registration required! 🔒✨",
  url = "https://peershare.avikmukherjee.me",
  hashtags = ["PeerShare", "P2P", "FileSharing", "Privacy", "WebRTC", "SecureSharing"],
  via = "avikmukherjee",
  className = "",
  variant = "default",
  size = "default",
  showIcon = true,
  children,
}: TwitterShareProps) {
  const shareOnTwitter = () => {
    const twitterUrl = new URL("https://twitter.com/intent/tweet")

    // Add parameters to the URL
    twitterUrl.searchParams.set("text", text)
    twitterUrl.searchParams.set("url", url)

    if (hashtags.length > 0) {
      twitterUrl.searchParams.set("hashtags", hashtags.join(","))
    }

    if (via) {
      twitterUrl.searchParams.set("via", via)
    }

    // Open Twitter in a new window
    const width = 550
    const height = 420
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    window.open(
      twitterUrl.toString(),
      "twitter-share",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )
  }

  return (
    <Button
      onClick={shareOnTwitter}
      variant={variant}
      size={size}
      className={`${className} ${variant === "default"
          ? "bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white"
          : ""
        }`}
    >
      {showIcon && <Twitter className="h-4 w-4 mr-2" />}
      {children || "Share on Twitter"}
    </Button>
  )
}

// Specialized component for sharing the app
export function SharePeerShare({ className = "" }: { className?: string }) {
  return (
    <TwitterShare
      text="🚀 Check out PeerShare - the most secure way to share files and make video calls! No servers, no tracking, just pure P2P magic! 🔒✨"
      hashtags={["PeerShare", "Privacy", "P2P", "SecureSharing", "NoServers"]}
      className={className}
      variant="outline"
    >
      <Share className="h-4 w-4 mr-2" />
      Share PeerShare
    </TwitterShare>
  )
}

// Component for sharing a successful connection
export function ShareSuccess({ className = "" }: { className?: string }) {
  return (
    <TwitterShare
      text="🎉 Just had an amazing file sharing experience with PeerShare! Secure, fast, and completely private. No servers involved! Try it yourself:"
      hashtags={["PeerShare", "FileSharing", "Success", "Privacy"]}
      className={className}
      variant="ghost"
      size="sm"
    >
      <Twitter className="h-3 w-3 mr-2" />
      Share Experience
    </TwitterShare>
  )
}

export default TwitterShare

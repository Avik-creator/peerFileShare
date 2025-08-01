"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, MessageCircle, Upload, Video, ArrowRight, Shield, Zap, Globe } from "lucide-react"
import Link from "next/link"
import { SharePeerShare } from "@/components/social/TwitterShare"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">PeerShare</span>
          </div>
          <Link href="/chat">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Share files and chat
          <br />
          <span className="text-blue-600">directly in your browser</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Connect with anyone using a simple code. No registration, no downloads, completely secure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link href="/chat">
            <Button size="lg" className="text-lg px-8 py-3">
              Try it now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <SharePeerShare className="border-gray-300 hover:bg-gray-50" />
        </div>

        {/* Key Features Badge */}
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <Shield className="h-3 w-3" />
            End-to-End Encrypted
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            <Zap className="h-3 w-3" />
            No File Size Limits
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            <Globe className="h-3 w-3" />
            Works Everywhere
          </span>
        </div>
      </section>

      {/* Simple Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-0 shadow-none">
            <CardContent className="pt-6">
              <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-time Chat</h3>
              <p className="text-gray-600 text-sm">Instant messaging with end-to-end encryption</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-none">
            <CardContent className="pt-6">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">File Sharing</h3>
              <p className="text-gray-600 text-sm">Share files of any size directly peer-to-peer</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-none">
            <CardContent className="pt-6">
              <Video className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Video Calls</h3>
              <p className="text-gray-600 text-sm">High-quality video calls with screen sharing</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">&copy; 2024 PeerShare. Secure peer-to-peer communication.</p>
              <p className="text-gray-500 text-xs mt-1">Built with ❤️ by <a href="https://avikmukherjee.me" className="hover:text-blue-600">Avik Mukherjee</a></p>
            </div>
            <div className="flex items-center gap-3">
              <SharePeerShare className="border-gray-300 hover:bg-white text-sm" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

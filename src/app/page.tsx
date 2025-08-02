"use client"

import { Users, MessageCircle, Upload, Video, ArrowRight, Shield, Zap, Globe } from "lucide-react"
import Link from "next/link"
import { SharePeerShare } from "@/components/social/TwitterShare"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-light text-gray-900">PeerShare</span>
          </div>
          <Link href="/chat">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-light text-gray-900 mb-6">
          Share files and chat
          <br />
          <span className="text-gray-900">directly in your browser</span>
        </h1>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Connect with anyone using a simple code. No registration, no downloads, completely secure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/chat">
            <button className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-lg">
              Try it now
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </button>
          </Link>
          <SharePeerShare className="border-gray-300 hover:bg-gray-50" />
        </div>

        {/* Key Features Badge */}
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            <Shield className="h-3 w-3" />
            End-to-End Encrypted
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            <Zap className="h-3 w-3" />
            No File Size Limits
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            <Globe className="h-3 w-3" />
            Works Everywhere
          </span>
        </div>
      </section>

      {/* Simple Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-900 mx-auto mb-4" />
            <h3 className="text-lg font-light mb-2">Real-time Chat</h3>
            <p className="text-gray-600 text-sm">Instant messaging with end-to-end encryption</p>
          </div>
          <div className="text-center">
            <Upload className="h-12 w-12 text-gray-900 mx-auto mb-4" />
            <h3 className="text-lg font-light mb-2">File Sharing</h3>
            <p className="text-gray-600 text-sm">Share files of any size directly peer-to-peer</p>
          </div>
          <div className="text-center">
            <Video className="h-12 w-12 text-gray-900 mx-auto mb-4" />
            <h3 className="text-lg font-light mb-2">Video Calls</h3>
            <p className="text-gray-600 text-sm">High-quality video calls with screen sharing</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} PeerShare. Secure peer-to-peer communication.</p>
              <p className="text-gray-500 text-xs mt-1">Built with ❤️ by <a href="https://avikmukherjee.me" className="hover:text-gray-900">Avik Mukherjee</a></p>
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

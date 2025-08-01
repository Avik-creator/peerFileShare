"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Users, Send, Upload, Copy, Check, Wifi, Video, VideoOff, Mic, MicOff, PhoneOff, ArrowLeft, Phone, Share } from "lucide-react"
import Link from "next/link"
import { ShareSuccess } from "@/components/social/TwitterShare"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  type: "text" | "file" | "call"
  fileName?: string
  fileSize?: number
}

interface UserInfo {
  peerId: string
  userName: string
}

export default function ChatApp() {
  const [userName, setUserName] = useState("")
  const [isNameSet, setIsNameSet] = useState(false)
  const [myPeerId, setMyPeerId] = useState("")
  const [targetPeerId, setTargetPeerId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [copiedPeerId, setCopiedPeerId] = useState(false)
  const [remoteUserName, setRemoteUserName] = useState("")
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)

  // Video call states
  const [isInCall, setIsInCall] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [incomingCallFrom, setIncomingCallFrom] = useState<UserInfo>({ peerId: "", userName: "" })

  const peerRef = useRef<import('peerjs').Peer | null>(null)
  const connectionRef = useRef<import('peerjs').DataConnection | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callRef = useRef<import('peerjs').MediaConnection | null>(null)

  const handleNetworkError = useCallback(() => {
    setIsReconnecting(true)
    toast.error("Network Error", {
      description: "Connection lost due to network issues. Attempting to reconnect...",
    })
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (peerRef.current && !peerRef.current.destroyed) {
        try {
          peerRef.current.reconnect()
        } catch (error) {
          console.error("Reconnection failed:", error)
        }
      }
      setIsReconnecting(false)
    }, 3000)
  }, [])

  const handleServerError = useCallback(() => {
    toast.error("Server Error", {
      description: "PeerJS server is experiencing issues. Please try again in a moment.",
    })
  }, [])

  const handleDisconnection = useCallback(() => {
    if (reconnectAttempts < 3 && !isReconnecting) {
      setIsReconnecting(true)
      setReconnectAttempts(prev => prev + 1)
      
      toast.info("Reconnecting...", {
        description: `Attempting to reconnect (${reconnectAttempts + 1}/3)...`,
      })
      
      setTimeout(() => {
        if (peerRef.current && !peerRef.current.destroyed) {
          try {
            peerRef.current.reconnect()
            setIsReconnecting(false)
          } catch (error) {
            console.error("Reconnection failed:", error)
            setIsReconnecting(false)
            
            if (reconnectAttempts >= 2) {
              toast.error("Connection Failed", {
                description: "Unable to reconnect. Please refresh the page.",
              })
            }
          }
        }
      }, 2000 * reconnectAttempts) // Exponential backoff
    }
  }, [reconnectAttempts, isReconnecting])

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.close()
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    setIsInCall(false)
    setIsIncomingCall(false)

    const callMessage: Message = {
      id: Date.now().toString(),
      sender: userName,
      content: "Ended the video call",
      timestamp: new Date(),
      type: "call",
    }
    setMessages((prev) => [...prev, callMessage])
  }, [userName])

  const handleIncomingData = useCallback((data: unknown) => {
    const typedData = data as {
      type: string;
      senderName?: string;
      content?: string;
      fileName?: string;
      fileSize?: number;
      fileData?: ArrayBuffer;
      userName?: string;
    };

    if (!typedData || typeof typedData !== 'object' || !typedData.type) {
      return;
    }
    if (typedData.type === "message") {
      const newMsg: Message = {
        id: Date.now().toString(),
        sender: typedData.senderName || "Unknown",
        content: typedData.content || "",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, newMsg])
    } else if (typedData.type === "file") {
      const newMsg: Message = {
        id: Date.now().toString(),
        sender: typedData.senderName || "Unknown",
        content: `Sent a file: ${typedData.fileName}`,
        timestamp: new Date(),
        type: "file",
        fileName: typedData.fileName,
        fileSize: typedData.fileSize,
      }
      setMessages((prev) => [...prev, newMsg])

      if (typedData.fileData && typedData.fileName) {
        const blob = new Blob([typedData.fileData])
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = typedData.fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("File Received", {
          description: `${typedData.fileName} has been downloaded automatically.`,
          action: {
            label: "Share Experience",
            onClick: () => {
              // Twitter share will be handled by the ShareSuccess component
            }
          }
        })
      }
    } else if (typedData.type === "user-info") {
      setRemoteUserName(typedData.userName || "")
      // Update incoming call info if there's an active incoming call
      if (isIncomingCall) {
        setIncomingCallFrom(prev => ({ ...prev, userName: typedData.userName || "Unknown User" }))
      }
    }
  }, [isIncomingCall])

  useEffect(() => {
    const initializePeer = async () => {
      const { default: Peer } = await import("peerjs")

      const peer = new Peer({
        debug: 2,
        config: {
          'iceServers': [
            // Google's public STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // Cloudflare's public STUN server
            { urls: 'stun:stun.cloudflare.com:3478' },
            // Add TURN servers for better reliability (you'll need to get your own)
            // { 
            //   urls: 'turn:your-turn-server.com:3478',
            //   username: 'your-username',
            //   credential: 'your-password'
            // }
          ]
        },
        // Use a more reliable PeerJS server or host your own
        host: 'peerjs-server.herokuapp.com', // This is more stable than the default
        port: 443,
        path: '/',
        secure: true,
      })

      peer.on("open", (id) => {
        setMyPeerId(id)
        console.log("My peer ID is: " + id)
      })

      peer.on("connection", (conn) => {
        console.log("Incoming connection from:", conn.peer)

        conn.on("open", () => {
          connectionRef.current = conn
          setIsConnected(true)
          setConnectionStatus("connected")

          conn.send({
            type: "user-info",
            userName: userName,
          })

          toast.success("Connected!", {
            description: "You are now connected and can start sharing files and chatting.",
          })
        })

        conn.on("data", handleIncomingData)

        conn.on("close", () => {
          setIsConnected(false)
          setConnectionStatus("disconnected")
          setRemoteUserName("")
          endCall()
          toast.error("Disconnected", {
            description: "The connection has been closed.",
          })
        })
      })

      // Handle incoming calls
      peer.on("call", (call) => {
        // Store the call reference
        callRef.current = call

        // Set incoming call with peer ID initially, will be updated when we get user info
        setIncomingCallFrom({
          peerId: call.peer,
          userName: remoteUserName || "Unknown User"
        })
        setIsIncomingCall(true)
      })

      peer.on("error", (err) => {
        console.error("Peer error:", err)
        
        // Handle different types of errors
        if (err.type === 'network') {
          handleNetworkError()
        } else if (err.type === 'server-error') {
          handleServerError()
        } else if (err.type === 'disconnected') {
          handleDisconnection()
        } else {
          toast.error("Connection Error", {
            description: `Connection failed: ${err.message || 'Unknown error'}. Please try again.`,
          })
        }
        
        setConnectionStatus("disconnected")
      })
      
      peer.on("disconnected", () => {
        console.log("Peer disconnected, attempting to reconnect...")
        handleDisconnection()
      })

      peerRef.current = peer
    }

    if (isNameSet && userName) {
      initializePeer()
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isNameSet, userName, endCall, handleIncomingData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])



  const connectToPeer = () => {
    if (!targetPeerId.trim()) {
      toast.error("Invalid Code", {
        description: "Please enter a valid connection code.",
      })
      return
    }

    setConnectionStatus("connecting")

    const conn = peerRef.current?.connect(targetPeerId)
    if (!conn) return

    conn.on("open", () => {
      connectionRef.current = conn
      setIsConnected(true)
      setConnectionStatus("connected")

      conn.send({
        type: "user-info",
        userName: userName,
      })

      toast.success("Connected!", {
        description: "You are now connected and can start sharing files and chatting.",
      })
    })

    conn.on("data", handleIncomingData)

    conn.on("close", () => {
      setIsConnected(false)
      setConnectionStatus("disconnected")
      setRemoteUserName("")
      endCall()
      toast.error("Disconnected", {
        description: "The connection has been closed.",
      })
    })

    conn.on("error", (err: Error) => {
      console.error("Connection error:", err)
      setConnectionStatus("disconnected")
      toast.error("Connection Failed", {
        description: "Could not connect to the specified code. Please check and try again.",
      })
    })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !connectionRef.current) return

    const message: Message = {
      id: Date.now().toString(),
      sender: userName,
      content: newMessage,
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev) => [...prev, message])

    connectionRef.current.send({
      type: "message",
      content: newMessage,
      senderName: userName,
    })

    setNewMessage("")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !connectionRef.current) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const fileData = e.target?.result

      if (connectionRef.current) {
        connectionRef.current.send({
          type: "file",
          fileName: file.name,
          fileSize: file.size,
          fileData: fileData,
          senderName: userName,
        })
      }

      const message: Message = {
        id: Date.now().toString(),
        sender: userName,
        content: `Sent a file: ${file.name}`,
        timestamp: new Date(),
        type: "file",
        fileName: file.name,
        fileSize: file.size,
      }

      setMessages((prev) => [...prev, message])

      toast.success("File Sent", {
        description: `${file.name} has been sent successfully.`,
        action: {
          label: "Share Success",
          onClick: () => {
            // Twitter share will be handled by the ShareSuccess component
          }
        }
      })
    }

    reader.readAsArrayBuffer(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      if (peerRef.current && connectionRef.current) {
        const call = peerRef.current.call(connectionRef.current.peer, stream)
        callRef.current = call

        call.on("stream", (remoteStream: MediaStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
        })

        call.on("close", () => {
          console.log("Call closed by remote peer")
          endCall()
        })

        call.on("error", (err) => {
          console.error("Call error:", err)
          toast.error("Call Error", {
            description: "Video call encountered an error and was disconnected.",
          })
          endCall()
        })

        setIsInCall(true)

        const callMessage: Message = {
          id: Date.now().toString(),
          sender: userName,
          content: "Started a video call",
          timestamp: new Date(),
          type: "call",
        }
        setMessages((prev) => [...prev, callMessage])
      }
    } catch (error) {
      console.error("Error starting video call:", error)
      toast.error("Call Failed", {
        description: "Could not access camera/microphone. Please check permissions.",
      })
    }
  }

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      if (callRef.current) {
        callRef.current.answer(stream)

        callRef.current.on("stream", (remoteStream: MediaStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
        })

        callRef.current.on("close", () => {
          console.log("Incoming call closed")
          endCall()
        })

        callRef.current.on("error", (err) => {
          console.error("Incoming call error:", err)
          toast.error("Call Error", {
            description: "Video call encountered an error and was disconnected.",
          })
          endCall()
        })
      }

      setIsInCall(true)
      setIsIncomingCall(false)

      const callMessage: Message = {
        id: Date.now().toString(),
        sender: userName,
        content: "Joined the video call",
        timestamp: new Date(),
        type: "call",
      }
      setMessages((prev) => [...prev, callMessage])
    } catch (error) {
      console.error("Error answering call:", error)
      toast.error("Call Failed", {
        description: "Could not access camera/microphone. Please check permissions.",
      })
    }
  }

  const rejectCall = () => {
    setIsIncomingCall(false)
    if (callRef.current) {
      callRef.current.close()
    }
  }



  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  const copyPeerId = () => {
    navigator.clipboard.writeText(myPeerId)
    setCopiedPeerId(true)
    setTimeout(() => setCopiedPeerId(false), 2000)
    toast.success("Copied!", {
      description: "Your connection code has been copied to clipboard.",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-white/50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <Users className="h-6 w-6 text-blue-600" />
                PeerShare
              </CardTitle>
              <CardDescription className="text-gray-600">Enter your name to start sharing files and chatting securely</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && userName.trim() && setIsNameSet(true)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              onClick={() => setIsNameSet(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
              disabled={!userName.trim()}
            >
              Continue to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PeerShare
            </h1>
            <p className="text-gray-600">Welcome back, <span className="font-medium text-gray-800">{userName}</span>!</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-gray-300 hover:bg-white/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Incoming Call Modal */}
        {isIncomingCall && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Incoming Video Call</CardTitle>
                  <CardDescription className="text-lg font-medium text-gray-700 mt-2">
                    {incomingCallFrom.userName || "Unknown User"} is calling you
                  </CardDescription>
                  {incomingCallFrom.userName && (
                    <p className="text-sm text-gray-500 mt-1">ID: {incomingCallFrom.peerId.slice(0, 8)}...</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex gap-4 justify-center pb-6">
                <Button
                  onClick={answerCall}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium"
                  size="lg"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Answer
                </Button>
                <Button
                  onClick={rejectCall}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-medium"
                  size="lg"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Decline
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {!isConnected ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl text-gray-800">Your Connection Code</CardTitle>
                <CardDescription className="text-gray-600">Share this code with others to receive connection requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myPeerId ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={myPeerId} readOnly className="font-mono text-sm bg-gray-50 border-gray-300" />
                      <Button variant="outline" size="icon" onClick={copyPeerId} className="shrink-0">
                        {copiedPeerId ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">This code is unique to your session and changes each time you reload the page.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-3 text-sm text-gray-600">Generating your unique code...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl text-gray-800">Connect to Someone</CardTitle>
                <CardDescription className="text-gray-600">Enter their connection code to start sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Paste connection code here"
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && connectToPeer()}
                  className="font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  onClick={connectToPeer}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
                  disabled={connectionStatus === "connecting" || !targetPeerId.trim()}
                >
                  {connectionStatus === "connecting" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    "Connect & Start Sharing"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className={`border-green-200 bg-green-50/80 backdrop-blur-sm ${isReconnecting ? 'border-yellow-200 bg-yellow-50/80' : ''}`}>
              <Wifi className={`h-4 w-4 ${isReconnecting ? 'text-yellow-600' : 'text-green-600'}`} />
              <AlertDescription className={isReconnecting ? 'text-yellow-800' : 'text-green-800'}>
                {isReconnecting ? (
                  <span>Reconnecting to <span className="font-medium">{remoteUserName || "Unknown User"}</span>...</span>
                ) : (
                  <span>Connected with <span className="font-medium">{remoteUserName || "Unknown User"}</span></span>
                )}
                <Badge variant="secondary" className={`ml-2 ${isReconnecting ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                  <Wifi className="h-3 w-3 mr-1" />
                  {isReconnecting ? 'Reconnecting...' : 'Online'}
                </Badge>
              </AlertDescription>
            </Alert>

            {/* Video Call Section */}
            {isInCall && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Video className="h-5 w-5 text-blue-600" />
                    Video Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="relative group">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 bg-gray-900 rounded-xl object-cover shadow-lg"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {remoteUserName || "Remote User"}
                      </div>
                    </div>
                    <div className="relative group">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 bg-gray-900 rounded-xl object-cover shadow-lg"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        You ({userName})
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button
                      variant={isAudioEnabled ? "default" : "destructive"}
                      size="icon"
                      onClick={toggleAudio}
                      className="w-12 h-12 rounded-full"
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant={isVideoEnabled ? "default" : "destructive"}
                      size="icon"
                      onClick={toggleVideo}
                      className="w-12 h-12 rounded-full"
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={endCall}
                      className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Send className="h-5 w-5 text-blue-600" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-96 w-full border rounded-xl p-4 bg-gray-50/50">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No messages yet. Send a message to start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === userName ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${message.sender === userName
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : "bg-white text-gray-900 border border-gray-200"
                                }`}
                            >
                              <div className={`text-xs mb-1 ${message.sender === userName ? 'text-blue-100' : 'text-gray-500'}`}>
                                {message.sender} • {formatTime(message.timestamp)}
                              </div>
                              <div className="text-sm leading-relaxed">
                                {message.content}
                                {message.type === "file" && message.fileSize && (
                                  <div className={`text-xs mt-2 ${message.sender === userName ? 'text-blue-100' : 'text-gray-500'}`}>
                                    📎 {formatFileSize(message.fileSize)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      onClick={sendMessage}
                      size="icon"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shrink-0"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium py-2.5"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Share File
                  </Button>

                  <Button
                    onClick={startVideoCall}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-2.5"
                    disabled={isInCall}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {isInCall ? "In Call" : "Start Video Call"}
                  </Button>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Connection Info</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Your ID:</span>
                        <span className="font-mono text-xs">{myPeerId.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Connected to:</span>
                        <span className="font-medium">{remoteUserName || "Unknown"}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2 text-gray-800">✨ Features:</p>
                    <ul className="space-y-1.5 text-xs">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Instant file sharing
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        HD video calling
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Real-time chat
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        End-to-end encrypted
                      </li>
                    </ul>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Share PeerShare</h4>
                    <ShareSuccess className="w-full justify-center" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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
import { Users, Send, Upload, Copy, Check, Wifi, Video, VideoOff, Mic, MicOff, PhoneOff, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  type: "text" | "file" | "call"
  fileName?: string
  fileSize?: number
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

  // Video call states
  const [isInCall, setIsInCall] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [incomingCallFrom, setIncomingCallFrom] = useState("")
  const [hasLocalStream, setHasLocalStream] = useState(false)
  const [hasRemoteStream, setHasRemoteStream] = useState(false)

  const peerRef = useRef<import('peerjs').Peer | null>(null)
  const connectionRef = useRef<import('peerjs').DataConnection | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callRef = useRef<import('peerjs').MediaConnection | null>(null)

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
    setHasLocalStream(false)
    setHasRemoteStream(false)

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
        })
      }
    } else if (typedData.type === "user-info") {
      setRemoteUserName(typedData.userName || "")
    } else if (typedData.type === "incoming-call") {
      setIncomingCallFrom(typedData.userName || "Unknown User")
    }
  }, [])

  useEffect(() => {
    const initializePeer = async () => {
      const { default: Peer } = await import("peerjs")

      const peer = new Peer({
        debug: 2,
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
        setIsIncomingCall(true)
        setIncomingCallFrom(call.peer)

        // Store the call reference
        callRef.current = call

        // Set up call event handlers
        call.on("stream", (remoteStream: MediaStream) => {
          console.log("Remote stream received in incoming call")
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
            setHasRemoteStream(true)
          }
        })

        call.on("close", () => {
          endCall()
        })
      })

      peer.on("error", (err) => {
        console.error("Peer error:", err)
        toast.error("Connection Error", {
          description: "Failed to establish connection. Please try again.",
        })
        setConnectionStatus("disconnected")
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
      }, [isNameSet, userName, handleIncomingData, endCall])

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

      connectionRef.current?.send({
        type: "file",
        fileName: file.name,
        fileSize: file.size,
        fileData: fileData,
        senderName: userName,
      })

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
        setHasLocalStream(true)
        console.log("Local stream set in startVideoCall")
      }

      if (peerRef.current && connectionRef.current) {
        const call = peerRef.current.call(connectionRef.current.peer, stream)
        callRef.current = call

        call.on("stream", (remoteStream: MediaStream) => {
          console.log("Remote stream received in startVideoCall")
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
            setHasRemoteStream(true)
          }
        })

        call.on("close", () => {
          endCall()
        })

        // Send user info to the callee
        connectionRef.current.send({
          type: "incoming-call",
          userName: userName,
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
        setHasLocalStream(true)
        console.log("Local stream set in answerCall")
      }

      if (callRef.current) {
        callRef.current.answer(stream)

        callRef.current.on("stream", (remoteStream: MediaStream) => {
          console.log("Remote stream received in answerCall")
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
            setHasRemoteStream(true)
          }
        })

        callRef.current.on("close", () => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              PeerShare
            </CardTitle>
            <CardDescription>Enter your name to start sharing files and chatting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && userName.trim() && setIsNameSet(true)}
            />
            <Button onClick={() => setIsNameSet(true)} className="w-full" disabled={!userName.trim()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PeerShare</h1>
            <p className="text-gray-600">Welcome, {userName}!</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Incoming Call Modal */}
        {isIncomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader className="text-center">
                <CardTitle>Incoming Video Call</CardTitle>
                <CardDescription>{incomingCallFrom} is calling you</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4 justify-center">
                <Button onClick={answerCall} className="bg-green-600 hover:bg-green-700">
                  <Video className="h-4 w-4 mr-2" />
                  Answer
                </Button>
                <Button onClick={rejectCall} variant="destructive">
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {!isConnected ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Connection Code</CardTitle>
                <CardDescription>Share this code with others to receive connection requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myPeerId ? (
                  <div className="flex items-center gap-2">
                    <Input value={myPeerId} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyPeerId}>
                      {copiedPeerId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Generating your code...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connect to Someone</CardTitle>
                <CardDescription>Enter their connection code to start sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter connection code"
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && connectToPeer()}
                />
                <Button
                  onClick={connectToPeer}
                  className="w-full"
                  disabled={connectionStatus === "connecting" || !targetPeerId.trim()}
                >
                  {connectionStatus === "connecting" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertDescription>
                Connected with {remoteUserName || "Unknown User"}
                <Badge variant="secondary" className="ml-2">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </AlertDescription>
            </Alert>

            {/* Video Call Section */}
            {isInCall && (
              <Card>
                <CardHeader>
                  <CardTitle>Video Call</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                      />
                      {!hasRemoteStream && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                          <div className="text-white text-center">
                            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Waiting for remote video...</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {remoteUserName || "Remote User"}
                      </div>
                    </div>
                    <div className="relative">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                      />
                      {!hasLocalStream && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                          <div className="text-white text-center">
                            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Your camera</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        You
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant={isAudioEnabled ? "default" : "destructive"} size="icon" onClick={toggleAudio}>
                      {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button variant={isVideoEnabled ? "default" : "destructive"} size="icon" onClick={toggleVideo}>
                      {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={endCall}>
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-96 w-full border rounded-md p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === userName ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === userName ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {message.sender} • {formatTime(message.timestamp)}
                            </div>
                            <div className="text-sm">
                              {message.content}
                              {message.type === "file" && message.fileSize && (
                                <div className="text-xs mt-1 opacity-75">{formatFileSize(message.fileSize)}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                  <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Share File
                  </Button>

                  <Button
                    onClick={startVideoCall}
                    className="w-full bg-transparent"
                    variant="outline"
                    disabled={isInCall}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {isInCall ? "In Call" : "Start Video Call"}
                  </Button>

                  <Separator />

                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Features:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Instant file sharing</li>
                      <li>• HD video calling</li>
                      <li>• Real-time chat</li>
                      <li>• End-to-end encrypted</li>
                    </ul>
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

"use client"
import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff } from "lucide-react"
import { toast } from "sonner"

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

  // Screen sharing states
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [remoteIsScreenSharing, setRemoteIsScreenSharing] = useState(false)

  const peerRef = useRef<import("peerjs").Peer | null>(null)
  const connectionRef = useRef<import("peerjs").DataConnection | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const callRef = useRef<import("peerjs").MediaConnection | null>(null)

  // Helper function to safely set video stream
  const setVideoStream = useCallback((videoElement: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoElement) return false
    try {
      videoElement.srcObject = stream
      if (stream) {
        const playPromise = videoElement.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing video:", error)
          })
        }
      }
      return true
    } catch (error) {
      console.error("Error setting video stream:", error)
      return false
    }
  }, [])

  // Enhanced remote stream handler
  const handleRemoteStream = useCallback(
    (remoteStream: MediaStream) => {
      console.log("Remote stream received:", remoteStream)
      console.log("Remote stream tracks:", remoteStream.getTracks())

      const videoTracks = remoteStream.getVideoTracks()
      const audioTracks = remoteStream.getAudioTracks()
      console.log("Video tracks:", videoTracks.length)
      console.log("Audio tracks:", audioTracks.length)

      // Check if this is a screen share stream
      const isScreenShare = videoTracks.some(
        (track) =>
          track.label.includes("screen") ||
          track.label.includes("Screen") ||
          track.getSettings().displaySurface === "monitor",
      )

      setRemoteIsScreenSharing(isScreenShare)

      if (videoTracks.length === 0) {
        console.warn("No video tracks in remote stream")
        toast.warning("No Video", {
          description: "The remote user has no video enabled.",
          className: "bg-yellow-500 text-white",
        })
      }

      setTimeout(() => {
        if (remoteVideoRef.current) {
          const success = setVideoStream(remoteVideoRef.current, remoteStream)
          if (success) {
            setHasRemoteStream(true)
            console.log("Remote stream successfully set")
            if (isScreenShare) {
              toast.info("Screen Share", {
                description: "Remote user is sharing their screen.",
                className: "bg-blue-500 text-white",
              })
            }
          } else {
            console.error("Failed to set remote stream")
          }
        } else {
          console.error("Remote video ref is null")
        }
      }, 100)
    },
    [setVideoStream],
  )

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.close()
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }
    setVideoStream(localVideoRef.current, null)
    setVideoStream(remoteVideoRef.current, null)
    setIsInCall(false)
    setIsIncomingCall(false)
    setHasLocalStream(false)
    setHasRemoteStream(false)
    setIsScreenSharing(false)
    setRemoteIsScreenSharing(false)

    const callMessage: Message = {
      id: Date.now().toString(),
      sender: userName,
      content: "Ended the video call",
      timestamp: new Date(),
      type: "call",
    }
    setMessages((prev) => [...prev, callMessage])
  }, [userName, setVideoStream])

  const handleIncomingData = useCallback((data: unknown) => {
    const typedData = data as {
      type: string
      senderName?: string
      content?: string
      fileName?: string
      fileSize?: number
      fileData?: ArrayBuffer
      userName?: string
      isScreenSharing?: boolean
    }

    if (!typedData || typeof typedData !== "object" || !typedData.type) {
      return
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
          className: "bg-green-500 text-white",
        })
      }
    } else if (typedData.type === "user-info") {
      setRemoteUserName(typedData.userName || "")
    } else if (typedData.type === "incoming-call") {
      setIncomingCallFrom(typedData.userName || "Unknown User")
    } else if (typedData.type === "screen-share-status") {
      setRemoteIsScreenSharing(typedData.isScreenSharing || false)
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
            className: "bg-green-500 text-white",
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
            className: "bg-red-500 text-white",
          })
        })
      })

      peer.on("call", (call) => {
        setIsIncomingCall(true)
        setIncomingCallFrom(call.peer)
        callRef.current = call
        call.on("stream", handleRemoteStream)
        call.on("close", () => {
          endCall()
        })
      })

      peer.on("error", (err) => {
        console.error("Peer error:", err)
        toast.error("Connection Error", {
          description: "Failed to establish connection. Please try again.",
          className: "bg-red-500 text-white",
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
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isNameSet, userName, handleIncomingData, endCall, handleRemoteStream])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const connectToPeer = () => {
    if (!targetPeerId.trim()) {
      toast.error("Invalid Code", {
        description: "Please enter a valid connection code.",
        className: "bg-red-500 text-white",
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
        className: "bg-green-500 text-white",
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
        className: "bg-red-500 text-white",
      })
    })

    conn.on("error", (err: Error) => {
      console.error("Connection error:", err)
      setConnectionStatus("disconnected")
      toast.error("Connection Failed", {
        description: "Could not connect to the specified code. Please check and try again.",
        className: "bg-red-500 text-white",
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
        className: "bg-green-500 text-white",
      })
    }
    reader.readAsArrayBuffer(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const replaceVideoTrack = async (newStream: MediaStream) => {
    if (!callRef.current) return

    const videoTrack = newStream.getVideoTracks()[0]
    if (!videoTrack) return

    try {
      const sender = callRef.current.peerConnection?.getSenders().find((s) => s.track && s.track.kind === "video")

      if (sender) {
        await sender.replaceTrack(videoTrack)
        console.log("Video track replaced successfully")
      }
    } catch (error) {
      console.error("Error replacing video track:", error)
    }
  }

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      screenStreamRef.current = screenStream

      // Combine screen video with existing audio from camera
      const audioTrack = localStreamRef.current?.getAudioTracks()[0]
      const combinedStream = new MediaStream()

      // Add screen video track
      screenStream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track)
        // Handle when user stops sharing from browser controls
        track.onended = () => {
          stopScreenShare()
        }
      })

      // Add audio track from camera if available
      if (audioTrack) {
        combinedStream.addTrack(audioTrack)
      }

      // Update local video display
      setTimeout(() => {
        if (localVideoRef.current) {
          setVideoStream(localVideoRef.current, combinedStream)
        }
      }, 100)

      // Replace video track in the call
      await replaceVideoTrack(combinedStream)

      setIsScreenSharing(true)

      // Notify remote user about screen sharing
      if (connectionRef.current) {
        connectionRef.current.send({
          type: "screen-share-status",
          isScreenSharing: true,
        })
      }

      toast.success("Screen Sharing", {
        description: "You are now sharing your screen.",
        className: "bg-blue-500 text-white",
      })

      const shareMessage: Message = {
        id: Date.now().toString(),
        sender: userName,
        content: "Started screen sharing",
        timestamp: new Date(),
        type: "call",
      }
      setMessages((prev) => [...prev, shareMessage])
    } catch (error) {
      console.error("Error starting screen share:", error)
      toast.error("Screen Share Failed", {
        description: "Could not start screen sharing. Please try again.",
        className: "bg-red-500 text-white",
      })
    }
  }

  const stopScreenShare = async () => {
    try {
      // Stop screen sharing stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
      }

      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })

      localStreamRef.current = cameraStream

      // Update local video display
      setTimeout(() => {
        if (localVideoRef.current) {
          setVideoStream(localVideoRef.current, cameraStream)
        }
      }, 100)

      // Replace video track back to camera
      await replaceVideoTrack(cameraStream)

      setIsScreenSharing(false)

      // Notify remote user
      if (connectionRef.current) {
        connectionRef.current.send({
          type: "screen-share-status",
          isScreenSharing: false,
        })
      }

      toast.info("Camera", {
        description: "Switched back to camera.",
        className: "bg-gray-500 text-white",
      })

      const shareMessage: Message = {
        id: Date.now().toString(),
        sender: userName,
        content: "Stopped screen sharing",
        timestamp: new Date(),
        type: "call",
      }
      setMessages((prev) => [...prev, shareMessage])
    } catch (error) {
      console.error("Error stopping screen share:", error)
      toast.error("Error", {
        description: "Could not switch back to camera.",
        className: "bg-red-500 text-white",
      })
    }
  }

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })

      localStreamRef.current = stream
      console.log("Local stream obtained:", stream)

      setTimeout(() => {
        if (localVideoRef.current) {
          const success = setVideoStream(localVideoRef.current, stream)
          if (success) {
            setHasLocalStream(true)
            console.log("Local stream successfully set")
          }
        }
      }, 100)

      if (peerRef.current && connectionRef.current) {
        const call = peerRef.current.call(connectionRef.current.peer, stream)
        callRef.current = call
        call.on("stream", handleRemoteStream)
        call.on("close", () => {
          endCall()
        })

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
        className: "bg-red-500 text-white",
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
      console.log("Local stream obtained for answer:", stream)

      setTimeout(() => {
        if (localVideoRef.current) {
          const success = setVideoStream(localVideoRef.current, stream)
          if (success) {
            setHasLocalStream(true)
            console.log("Local stream successfully set in answer")
          }
        }
      }, 100)

      if (callRef.current) {
        callRef.current.answer(stream)
        callRef.current.on("stream", handleRemoteStream)
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-light text-gray-900">PeerShare</h1>
            <p className="text-gray-600 text-sm">Enter your name to start sharing files and chatting</p>
          </div>

          <div className="space-y-4">
            <input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && userName.trim() && setIsNameSet(true)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={() => setIsNameSet(true)}
              disabled={!userName.trim()}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-2">PeerShare</h1>
          <p className="text-gray-600 text-sm">Welcome, {userName}</p>
        </div>

        {/* Incoming Call Modal */}
        {isIncomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-sm w-full mx-4">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-light text-gray-900">Incoming Video Call</h2>
                <p className="text-gray-600 text-sm">{remoteUserName} is calling you</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={answerCall}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Answer
                  </button>
                  <button
                    onClick={rejectCall}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-lg font-light text-gray-900">Your Connection Code</h2>
              <p className="text-gray-600 text-sm">Share this code with others to receive connection requests</p>
              {myPeerId ? (
                <div className="flex items-center gap-3">
                  <input
                    value={myPeerId}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={copyPeerId}
                    className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copiedPeerId ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Generating your code...</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-light text-gray-900">Connect to Someone</h2>
              <p className="text-gray-600 text-sm">Enter their connection code to start sharing</p>
              <div className="space-y-3">
                <input
                  placeholder="Enter connection code"
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && connectToPeer()}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-500"
                />
                <button
                  onClick={connectToPeer}
                  disabled={connectionStatus === "connecting" || !targetPeerId.trim()}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {connectionStatus === "connecting" ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Connected with {remoteUserName || "Unknown User"}
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Online</span>
              </p>
            </div>

            {/* Video Call Section */}
            {isInCall && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-light text-gray-900">Video Call</h2>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {isScreenSharing && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">You&aposre sharing</span>
                    )}
                    {remoteIsScreenSharing && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Remote sharing</span>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
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
                          <p className="text-sm">Waiting for remote video...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {remoteUserName || "Remote User"}
                      {remoteIsScreenSharing && " (Screen)"}
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
                          <p className="text-sm">Your camera</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      You {isScreenSharing && "(Screen)"}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-lg border transition-colors ${isAudioEnabled ? "border-gray-300 hover:bg-gray-50" : "border-red-300 bg-red-50 text-red-700"
                      }`}
                  >
                    {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-lg border transition-colors ${isVideoEnabled ? "border-gray-300 hover:bg-gray-50" : "border-red-300 bg-red-50 text-red-700"
                      }`}
                  >
                    {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`p-3 rounded-lg border transition-colors ${isScreenSharing ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={endCall}
                    className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-light text-gray-900">Chat</h2>
                <div className="border border-gray-200 rounded-lg h-96 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === userName ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === userName ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
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
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex gap-3">
                        <input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-light text-gray-900">Actions</h2>
                <div className="space-y-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Share File
                  </button>
                  <button
                    onClick={startVideoCall}
                    disabled={isInCall}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                  >
                    {isInCall ? "In Call" : "Start Video Call"}
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Features:</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li>• Instant file sharing</li>
                    <li>• HD video calling</li>
                    <li>• Screen sharing</li>
                    <li>• Real-time chat</li>
                    <li>• End-to-end encrypted</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

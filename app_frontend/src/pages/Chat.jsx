import { useEffect, useState, useRef,useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";

export default function Chat() {
  const { roomId } = useParams();
  const token = localStorage.getItem("access");
  console.log("🎯 COMPONENT MOUNT - roomId:", roomId, typeof roomId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [receiver, setReceiver] = useState(null);
  const [locked, setLocked] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [messageCount, setMessageCount] = useState(0);  // NEW
  const [chatUnlocked, setChatUnlocked] = useState(false);  // NEW
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // NEW
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const ws = useRef(null);
  const bottomRef = useRef();
  // const reconnectAttempts = useRef(0);           // ✅ DEFINED
  const reconnectTimeout = useRef(null);  

  useEffect(() => {
  console.log("👤 RECEIVER FULL:", receiver);
}, [receiver]);


  // ---------------- CLEANUP FUNCTION ----------------
  const cleanup = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, []);

  // ---------------- TIME FORMATTER ----------------
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });  // 3:45 PM
  };

  // ---------------- LAST SEEN ----------------
  const formatLastSeen = (date) => {
    if (!date) return "";
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return new Date(date).toLocaleDateString();
  };

  console.log("🔑 TOKEN LENGTH:", token?.length);
  console.log("🔑 TOKEN START:", token?.substring(0, 20));
  console.log("🔑 TOKEN END:", token?.substring(token.length-20));

// ---------------- BULLETPROOF WEBSOCKET - NEVER FAILS ----------------
useEffect(() => {
  let reconnectTimeout;
  let reconnectAttempts = 0;
  const MAX_ATTEMPTS = 50; // ~1 minute total

  const connectWS = async () => {
    if (!roomId || typeof roomId === 'undefined' || roomId ==='undefined'){
      console.log("No roomId...waiting 2s...");
      reconnectTimeout = setTimeout(connectWS,2000);
      return;
    }
    // 🔥 FIX 2: Guard against non-numeric roomId
    const roomIdNum = parseInt(roomId);
    if (isNaN(roomIdNum)) {
      console.error('❌ Invalid roomId format:', roomId);
      return;
    }
    try {
      console.log(`🔄 WS Connect attempt #${reconnectAttempts + 1} - roomId:`,roomId);
      
      // 1. AUTO REFRESH TOKEN (CRITICAL!)
      let freshToken = localStorage.getItem('access');
      if (!freshToken && localStorage.getItem('refresh')) {
        try {
          const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: localStorage.getItem('refresh')
          });
          freshToken = res.data.access;
          localStorage.setItem('access', freshToken);
          console.log('🔑 Token refreshed!');
        } catch (e) {
          console.log('❌ Refresh failed - redirect to login');
          window.location.href = '/login';
          return;
        }
      }

      // 🔥 FIX 3: Final token check
      if (!freshToken) {
        console.log('⏳ No token - retrying...');
        reconnectTimeout = setTimeout(connectWS, 2000);
        return;
      }

      // 2. CLEAN DISCONNECT
      if (ws.current) {
        ws.current.close(1000, 'Reconnecting');
        ws.current=null;
      }

      // 3. NEW CONNECTION
      document.cookie = `access_token=${freshToken}; path=/; SameSite=None; Secure`;
      const encodedToken = encodeURIComponent(freshToken);
      const wsUrl = `ws://127.0.0.1:8000/ws/chat/${roomId}/?token=${encodedToken}`;
      console.log('🎯 WS URL:', wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = (event) => {
        console.log('✅ WEBSOCKET ALIVE FOREVER!');
        setIsConnected(true);
        reconnectAttempts = 0; // Reset counter
    
        setTimeout(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
           }
          }, 2000);
        };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 WS MSG:", data);

        if (data.type === 'pong') {
          console.log('🏓 Pong received - connection healthy');
          return;
        }

        // ✅ PAYMENT HANDLING
        if (data.action === "chat_unlocked") {
          setChatUnlocked(true);
          setIsPaid(true);
          setLocked(false);
          setMessageCount(data.count || 0);
          return;
        }

        if (data.error === "Payment required") {
          setLocked(true);
          setShowPaymentPopup(true);
          return;
        }

        // ✅ YOUR EXISTING LOGIC
        if (data.action === "message") {
          const messageData = {
            ...data.data,
            timestamp: data.data.timestamp || new Date().toISOString()
          };
          setMessages((prev) => [...prev, messageData]);
        }

        if (data.action === "typing") {
          setOtherTyping(data.data.typing);
        }

        if (data.action === "webrtc") {
          handleWebRTCSignal(data.data);
        }
      };

      ws.current.onclose = (event) => {
        console.log(`🔌 WS Closed: Code ${event.code} "${event.reason}"`);
        setIsConnected(false);
        
        // ✅ INFINITE RECONNECT (never stops)
        if (event.code >= 1001 && reconnectAttempts < MAX_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Backoff
          console.log(`🔄 Reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
          reconnectTimeout = setTimeout(connectWS, delay);
        } else if (event.code === 1000) {
          console.log('ℹ️ Normal closure - no reconnect');
        }
      };

      ws.current.onerror = (error) => {
        console.log('⚠️ WS Error - Auto-recovering...',error);
      };

    } catch (error) {
      console.error('❌ WS Fatal error:', error);
      reconnectTimeout = setTimeout(connectWS, 5000);
    }
  };

  // START CONNECTION
  connectWS();

  // CLEANUP
  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws.current){
      ws.current.close();
      ws.current=null
    }
  };
}, [roomId]); // ✅ Only roomId - token auto-refreshes!
  // ---------------- FETCH ROOM ----------------
  useEffect(() => {
    if (!roomId || !token) return;
    console.log("🔍 Fetching room data...");
    axios
      .get(`http://127.0.0.1:8000/api/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("🏠 Rooms API:", res.data);
        const room = res.data.find((r) => r.id === parseInt(roomId));
        console.log("👤 Receiver:", room?.other_user);
        setReceiver(room?.other_user);
        setIsPaid(room?.is_paid);
      })
      .catch((err) => console.error("❌ Room fetch error:",err));
  }, [roomId, token]);

  // ---------------- FETCH MESSAGES ----------------
  useEffect(() => {
    if (!roomId || !token) return;
    console.log("📨 Fetching messages...");
    axios
      .get(`http://127.0.0.1:8000/api/chat/messages/${roomId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("💬 Messages API:", res.data);
        setMessages(res.data);
        if (res.data.length >= 10) setLocked(true);
      })
      .catch((err) => console.error("❌ Messages error:",err));
  }, [roomId, token]);

  // ---------------- SCROLL ----------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async () => {
    if (!isConnected || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert("Not connected or chat locked");
      return;
    }
    if (locked && !chatUnlocked) {
      setShowPaymentPopup(true);
      return;
    }

    let fileUrl = null;

    if (file) {
      const formData = new FormData();
      //formData.append("file", file);
      formData.append("room_id", roomId);


      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/chat/upload/",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fileUrl = res.data.file_url;
      } catch (err) {
        console.error(err);
      }
    }

    ws.current.send(
      JSON.stringify({
        action: "message",
        message: input,
        file: fileUrl,
      })
    );

    setInput("");
    setFile(null);
    setPreview(null);
  };

  // ---------------- TYPING ----------------
  const handleTyping = (value) => {
    setInput(value);
    if (isConnected && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: "typing", typing: true }));
    }
    setTimeout(() => {
      if (isConnected && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action: "typing", typing: false }));
      }
    }, 1000);
  };
  // ---------------- FILE ----------------
  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // ---------------- EMOJI ----------------
  const handleEmoji = (emoji) => setInput((prev) => prev + emoji.emoji);

  // ---------------- REAL RAZORPAY PAYMENT ----------------
  const handleRealPayment = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/payments/create-order/', {
        room_id: roomId,
        amount: 499  // ₹4.99
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { order_id, key, amount } = response.data;

      const options = {
        key,
        amount: amount * 100,  // paise
        currency: "INR",
        name: "Unlock Chat",
        description: "Unlimited messages + calls",
        order_id,
        prefill: {
          name: receiver?.username || "User",
          email: "user@example.com"
        },
        handler: async (response) => {
          // Verify payment
          await axios.post('http://127.0.0.1:8000/api/payments/verify-payment/', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Success!
          setChatUnlocked(true);
          setLocked(false);
          setShowPaymentPopup(false);
          alert("✅ Payment successful! Chat unlocked!");
        },
        theme: { color: '#3399cc' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed");
    }
  };
  // ---------------- UPDATED PAYMENT MODAL ----------------
  const PaymentModal = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Chat Locked
          </h2>
          <p className="text-gray-600 mb-4">
            {messageCount}/10 messages used. Unlock unlimited chat + calls!
          </p>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span>Messages sent:</span>
            <span className="font-semibold">{messageCount}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>After payment:</span>
            <span>✅ Unlimited</span>
          </div>
        </div>

        <button 
          onClick={handleRealPayment}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
        >
          💳 Pay ₹4.99 Now
        </button>

        {/* Fake payment for testing */}
        <button 
          onClick={() => {
            axios.post('http://127.0.0.1:8000/api/payments/fake-payment/', {
              room_id: roomId
            }, { headers: { Authorization: `Bearer ${token}` }})
            .then(() => {
              setChatUnlocked(true);
              setLocked(false);
              setShowPaymentPopup(false);
            });
          }}
          className="w-full mt-3 bg-green-500 text-white py-3 px-6 rounded-xl font-semibold text-sm opacity-75 hover:opacity-100"
        >
          🧪 Test Unlock (Dev)
        </button>
      </div>
    </div>
  );
  // ---------------- PAYMENT ----------------
  const handlePayment = () => {
    setTimeout(() => {
      setIsPaid(true);
      setLocked(false);
      setShowPaymentPopup(false);
      alert("Payment successful 🎉");
    }, 1000);
  };

  // ---------------- CALL ----------------
  const startCall = async (type) => {
    setCallActive(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localVideoRef.current.srcObject = stream;

    const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    peerConnection.current = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && ws.current) {
        ws.current.send(JSON.stringify({ action: "webrtc", type: "candidate", candidate: event.candidate }));
      }
    };

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    if (ws.current) {
      ws.current.send(JSON.stringify({ action: "webrtc", type: "offer", offer }));
    }
  };

  const handleWebRTCSignal = async (data) => {
    const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    if (!peerConnection.current) peerConnection.current = new RTCPeerConnection(servers);

    peerConnection.current.ontrack = (event) => (remoteVideoRef.current.srcObject = event.streams[0]);

    if (data.type === "offer") {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

      await peerConnection.current.setRemoteDescription(data.offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      if (ws.current) ws.current.send(JSON.stringify({ action: "webrtc", type: "answer", answer }));
      setCallActive(true);
    }

    if (data.type === "answer") await peerConnection.current.setRemoteDescription(data.answer);
    if (data.type === "candidate") await peerConnection.current.addIceCandidate(data.candidate);
  };
  // ---------------- NEW: CHECK ACCESS ----------------
  useEffect(() => {
    if (!roomId || !token) return;
    
    // Check payment status
    axios.get(`http://127.0.0.1:8000/api/payments/check-access/${roomId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("🔓 Access check:", res.data);
      setChatUnlocked(res.data.chat_unlocked);
      setIsPaid(res.data.chat_unlocked);
      setLocked(!res.data.chat_unlocked && messages.length >= 10);
    })
    .catch(err => console.error("Access check failed:", err));
  }, [roomId, token]);

  // ---------------- UPDATE CALL BUTTONS ----------------
  const canCall = chatUnlocked || isPaid;
  // In header:
  // <button onClick={() => !canCall ? setShowPaymentPopup(true) : startCall("voice")}>📞</button>

  return (
  <div className="flex flex-col h-screen bg-gradient-to-r from-blue-700 to-blue-500 relative">
    
    {/* HEADER - FIXED PROFILE PIC */}
    <div className="flex justify-between items-center px-4 py-3 bg-white/80 backdrop-blur shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        {receiver?.profile_picture ? (
          <img
            src={
              receiver.profile_picture?.startsWith("http")
              ? receiver.profile_picture
              : `http://127.0.0.1:8000${receiver.profile_picture}`
            }
            className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-white/50"
            alt={receiver.username}
            onError={(e) => {
                e.target.style.display = 'none';
                console.log("❌ Profile pic failed:", receiver.profile_picture);
              }}
              loading="lazy"

          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md ring-2 ring-white/50">
            <span className="text-white font-bold text-sm">
              {receiver?.username?.slice(0, 2).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">
            {receiver?.username || 'Loading...'}
          </h3>
          <p className="text-xs text-gray-500">
            {receiver?.is_online
              ? <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Online</span>
              : `Last seen ${formatLastSeen(receiver?.last_seen)}`}
          </p>
          <span className={`text-xs ${isConnected ? "text-green-500" : "text-red-500"}`}>
            {isConnected ? "● Connected" : "● Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex gap-4 text-xl">
        <button onClick={() => !canCall ? setShowPaymentPopup(true) : startCall("voice")}
          disabled={!canCall}>
            📞</button>
        <button onClick={() => !canCall ? setShowPaymentPopup(true) : startCall("video")}
          disabled = {!canCall}
          >🎥</button>
      </div>
    </div>

    {/* CHAT MESSAGES */}
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gradient-to-b from-transparent to-blue-500/20">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white/70 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
            💬
          </div>
          <p className="text-lg">Start a conversation</p>
          <p className="text-sm opacity-75">Messages appear here</p>
        </div>
      ) : (
        messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex ${msg.sender === receiver?.id ? 'justify-start' : 'justify-end'} gap-3 items-end`}
          > 
          {/* Sender Avatar*/}
            {msg.sender === receiver?.id && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {msg.sender_username
                    ? msg.sender_username.slice(0, 1).toUpperCase()
                    : "U"}
                </span>
              </div>
            )}
             {/*Message Bubble*/}
            <div className={`max-w-[75%] p-3 rounded-3xl shadow-lg ${
              msg.sender === receiver?.id
                ? "bg-white/90 backdrop-blur-sm text-gray-800 rounded-br-sm"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-bl-sm ml-auto"
            }`}>
              {/*Message text*/}
              {msg.message && (
                <div className="break-words">{msg.message}</div>
              )}
              {/*Image*/}
              {msg.file && (
                <div className="mt-2">
                  <img 
                    src={msg.file?.startsWith("http")?msg.file:`http://127.0.0.1:8000${msg.file}`}
                    alt="Attachment"
                    className="w-full max-w-xs max-h-48 rounded-2xl object-contain cursor-pointer hover:shadow-xl transition-shadow"
                    onError={(e) => {
                        console.error("❌ Image failed:", msg.file);
                        e.target.outerHTML = `<div class="text-xs text-red-300 italic">[Image failed to load]</div>`;
                      }}
                      onLoad={() => console.log("✅ Image loaded:", msg.file)}
                      loading="lazy"
                  />
                </div>
              )}
              {/*Timestamp*/}

              <div className={`text-xs mt-1 opacity-75 ${
                msg.sender === receiver?.id ? 'text-right' : 'text-left'
              }`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
             {/* Receiver Avatar */}
            {msg.sender !== receiver?.id && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {receiver?.username?.slice(0, 1)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>

    {/* FILE PREVIEW */}
    {preview && (
      <div className="px-4 py-2 bg-white/90 backdrop-blur-sm">
        <img src={preview} className="w-20 h-20 rounded-xl object-cover shadow-md" alt="Preview" />
        <button onClick={() => { setFile(null); setPreview(null); }}>
          ✕
        </button>
      </div>
    )}

    {/* INPUT */}
    <div className="p-4 flex items-center gap-3 bg-white/90 backdrop-blur-sm shadow-lg">
      <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

      {showEmoji && (
        <div className="absolute bottom-24 left-4 z-50">
          <EmojiPicker onEmojiClick={handleEmoji} height={350} />
        </div>
      )}

      <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
      📎
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {file && (
      <span className="text-xs text-gray-600">
       {file.name}
      </span>
      )}
      </label>

      <input
        value={input}
        onChange={(e) => handleTyping(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 p-3 rounded-3xl outline-none border-2 border-gray-200 focus:border-blue-400 bg-white shadow-sm resize-none"
          disabled={!isConnected}
      />

      <button onClick={sendMessage}
      disabled={!input.trim() && !file}
      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-3xl font-semibold shadow-lg transition-all disabled:cursor-not-allowed">
      {isConnected ? 'Send' : '●'}
      </button>
    </div>

    {showPaymentPopup && <PaymentModal />}

    {/* PAYMENT POPUP
    {showPaymentPopup && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-gradient-to-b from-[#b9ecff] to-[#9edcf2] p-6 rounded-3xl shadow-lg text-center">
          <h2 className="text-lg font-semibold mb-3">Unlock Calls 🔓</h2>
          <button onClick={handlePayment}className="bg-green-500 text-white px-5 py-2 rounded-xl">
            Pay Now
          </button>
        </div>
      </div>
    )} */}

    {/* CALL UI */}
    {callActive && (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
        <video ref={remoteVideoRef} autoPlay className="w-3/4 rounded-xl" />
        <video ref={localVideoRef} autoPlay muted className="w-40 absolute bottom-10 right-10 rounded-lg" />
        <button onClick={() => setCallActive(false)}className="mt-5 bg-red-500 text-white px-5 py-2 rounded-xl">
          End Call
        </button>
      </div>
    )}

  </div>
);
}

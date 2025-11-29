import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
// import { Intro } from "./Intro";
import { Loading } from "./Loading";
import DarkModeToggle from "./DarkModeToggle";

function ChatBox() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // const [sample, setSample] = useState(false);
  // const [input, setInput] = useState("");

  const sendMessage = async (textbtn) => {
    console.log(textbtn);
    let sample;

    if (typeof textbtn == "string") sample = true;
    console.log(sample);
    if (!sample) if (!input.trim()) return;
    console.log(input);

    const messageText = sample ? textbtn : input;
    setIsLoading(true);

    try {
      setInput("");
      setMessages([
        ...messages,
        { text: messageText, isUser: true, loading: false },
        { text: "generating...", isUser: false, loading: true },
      ])

      // Use environment variable for API URL or fallback to localhost
      const API_URL = process.env.REACT_APP_API_URL || "https://conversational-fashion-outfit-generator.onrender.com";

      const response = await axios.post(
        `${API_URL}/api/recommendations`,
        {
          userMessage: messageText,
        },
        {
          timeout: 60000, // 60 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const botResponse = response.data.bot_response || response.data.error || "No response received";
      setMessages(prevMessages => {
        // Remove the loading message and add the actual response
        const newMessages = prevMessages.slice(0, -1);
        return [
          ...newMessages,
          { text: botResponse, isUser: false, loading: false },
        ];
      });
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      const errorMessage = error.response?.data?.error || error.message || "Failed to connect to server. Please check your connection.";
      setMessages(prevMessages => {
        const newMessages = prevMessages.slice(0, -1);
        return [
          ...newMessages,
          {
            text: `⚠️ ${errorMessage}. Please try again.`,
            isUser: false,
            loading: false,
          },
        ];
      });
      console.error("Error fetching bot response:", error);
    } finally {
      setIsLoading(false);
    }
    // setSample(false);
  };

  const createNewChat = async () => {
    setMessages([]);
    // Fresh chat endpoint is currently disabled on backend
    // await axios.post("http://127.0.0.1:5000/fresh-chat", {
    //   userMessage: null,
    // });
  };
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
        const response = await axios.get(`${API_URL}/api/health`);
        setIsConnected(response.data.status === "ok");
        console.log("Backend connection:", response.data);
      } catch (error) {
        setIsConnected(false);
        console.error("Backend connection error:", error);
      }
    };
    checkConnection();
  }, []);

  //recorder
  const [isRecording, setisRecording] = useState(false);
  const startRecording = () => {
    // setInput(transcript);
    setisRecording(true);
    SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
  };
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const stopRecording = () => {
    setInput(transcript);
    setisRecording(false);
    SpeechRecognition.stopListening();
    resetTranscript();
  };

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <div className="min-h-screen w-full overflow-hidden" style={{ background: darkMode ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-pulse">
          ⚠️ Connection issue. Please check your internet connection.
        </div>
      )}
      <div className="container mx-auto p-0 max-w-full">
        <div className="h-screen md:p-4 p-1 sm:p-2">
          <div className="flex rounded-xl shadow-2xl h-full overflow-hidden" style={{ background: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(25px)', border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)' }}>
            {/* Hamburger Menu Button - Better mobile positioning */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="fixed top-4 left-4 z-50 p-3 rounded-lg transition-all hover:scale-110 active:scale-95 md:relative md:top-auto md:left-auto"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', minWidth: '48px', minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* <!-- Left Sidebar --> */}
            <div
              className={`${sidebarOpen ? 'fixed left-0 top-0 bottom-0 z-40 md:relative md:z-auto' : 'hidden'
                } md:w-[20%] md:flex flex-col transition-all duration-300 w-64`}
              style={{
                background: darkMode ? 'rgba(20, 20, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRight: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
              }}
            >
              {/* <!-- Header --> */}
              <div className="py-4 px-4 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                <h1 className="text-2xl font-bold text-white text-center">Chats</h1>
              </div>

              {/* <!-- Contacts --> */}
              <div className="bg-gray-100 flex-1 overflow-auto">
                <div className="bg-white px-3 flex items-center hover:bg-gray-200 cursor-pointer">
                  <div className="ml-4 flex-1  py-4">
                    <div className="flex  justify-between">
                      <h1 className="  ">Test Conversation 1</h1>
                    </div>
                  </div>
                </div>
                {/* <div className="bg-white px-3 flex items-center hover:bg-gray-200 cursor-pointer">
                  <div
                    onClick={createNewChat}
                    className="ml-4 flex-1 border-b border-gray-400 py-4"
                  >
                    <div className="flex items-bottom justify-between"></div>
                    <h1 className=" ">Create a fresh conversation</h1>
                  </div>
                </div> */}
                <button
                  onClick={() => {
                    createNewChat();
                    // Close sidebar on mobile after action
                    setSidebarOpen(false);
                  }}
                  className="bg-blue-700 overflow-hidden truncate flex justify-center text-white px-6 py-3 mx-4 my-7 border-none cursor-pointer rounded-[10px] text-[16px] font-semibold hover:bg-blue-800 transition-all active:scale-95"
                  style={{ minHeight: '48px', touchAction: 'manipulation' }}
                >
                  New Conversation
                </button>
              </div>
            </div>

            {/* <!-- Right --> */}
            <div className="flex-1 md:w-[80%] w-full flex flex-col" style={{ background: darkMode ? 'rgba(15, 15, 35, 0.4)' : 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
              {/* <!-- Header --> */}
              <div className="py-3 md:py-4 px-4 md:px-6 flex flex-row justify-between items-center shadow-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                <div className="flex items-center flex-1 min-w-0 pl-12 md:pl-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-base md:text-2xl font-bold text-white truncate">Fashion Outfit Assistant</p>
                    <p className="text-xs md:text-sm text-indigo-100 truncate">AI-powered style recommendations</p>
                  </div>
                </div>
                {isConnected && (
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" title="Connected"></div>
                )}
              </div>

              {/* <Intro /> */}

              {/* <>
                <div className="py-2 px-3">
                  <div className={"flex mb-2"}>
                    <div className={"rounded py-2 px-3 bg-gray-50"}>
                      <p className="text-sm ">
                        <p>
                          Welcome to the Conversational Fashion Outfit
                          Generator! I'm here to assist you in finding the
                          perfect outfit for the day. Based on your input, I'll
                          suggest outfit options that match your preferences.
                          Let's get started!
                        </p>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-3">
                  <div className={"flex mb-2"}>
                    <button
                      onClick={() => {
                        // setSample(true);
                        sendMessage("What should I wear for my job interview?");
                      }}
                      className="border-2 border-blue-200 rounded-2xl py-1 px-2 bg-blue-100 mr-2 text-sm"
                    >
                      What should I wear for my job interview?
                    </button>
                    <button
                      onClick={() => {
                        // setSample(true);
                        sendMessage("Suggest me an outfit for Diwali.");
                      }}
                      className="border-2 border-blue-200 rounded-2xl py-1 px-2 bg-blue-100 mr-2 text-sm"
                    >
                      <p className=" ">Suggest me an outfit for Diwali.</p>
                    </button>
                    <button
                      onClick={() => {
                        // setSample(true);
                        sendMessage(
                          "Give me an outfit for a girls' night out."
                        );
                      }}
                      className="border-2 border-blue-200 rounded-2xl py-1 px-2 bg-blue-100 mr-2 text-sm"
                    >
                      <p className="text-sm ">
                        Give me an outfit for a girls' night out.
                      </p>
                    </button>
                  </div>
                </div>
              </> */}
              {/* <!-- Messages --> */}

              <div className="flex-1 overflow-auto p-2 md:p-4" style={{ background: darkMode ? 'rgba(5, 5, 20, 0.2)' : 'rgba(249, 250, 251, 0.15)' }}>
                <>
                  <div className="py-2 px-3">
                    <div className={"flex mb-2"}>
                      <div className={"rounded py-2 px-3 bg-gray-50"}>
                        <p className="text-sm ">
                          <p>
                            Welcome to the Conversational Fashion Outfit
                            Generator! I'm here to assist you in finding the
                            perfect outfit for the day. Based on your input,
                            I'll suggest outfit options that match your
                            preferences. Let's get started!
                          </p>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 md:px-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        onClick={() => {
                          sendMessage("What should I wear for my job interview?");
                        }}
                        disabled={isLoading}
                        className="border-2 border-blue-200 rounded-2xl py-2 px-3 md:py-1 md:px-2 bg-blue-100 hover:bg-blue-200 active:scale-95 transition-all text-xs md:text-sm font-medium touch-manipulation"
                        style={{ minHeight: '44px', touchAction: 'manipulation' }}
                      >
                        What should I wear for my job interview?
                      </button>
                      <button
                        onClick={() => {
                          sendMessage("Suggest me an outfit for Diwali.");
                        }}
                        disabled={isLoading}
                        className="border-2 border-blue-200 rounded-2xl py-2 px-3 md:py-1 md:px-2 bg-blue-100 hover:bg-blue-200 active:scale-95 transition-all text-xs md:text-sm font-medium touch-manipulation"
                        style={{ minHeight: '44px', touchAction: 'manipulation' }}
                      >
                        Suggest me an outfit for Diwali.
                      </button>
                      <button
                        onClick={() => {
                          sendMessage("Give me an outfit for a girls' night out.");
                        }}
                        disabled={isLoading}
                        className="border-2 border-blue-200 rounded-2xl py-2 px-3 md:py-1 md:px-2 bg-blue-100 hover:bg-blue-200 active:scale-95 transition-all text-xs md:text-sm font-medium touch-manipulation"
                        style={{ minHeight: '44px', touchAction: 'manipulation' }}
                      >
                        Give me an outfit for a girls' night out.
                      </button>
                    </div>
                  </div>
                </>

                <div className="py-2 px-2 md:px-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={
                        message.isUser ? "flex justify-end mb-3 md:mb-2" : "flex mb-3 md:mb-2"
                      }
                    >
                      <div
                        className={
                          message.isUser
                            ? "rounded-2xl py-2 px-3 md:py-3 md:px-4 text-white shadow-lg max-w-[85%] md:max-w-[75%]"
                            : "rounded-2xl py-2 px-3 md:py-3 md:px-4 bg-white shadow border border-gray-100 max-w-[85%] md:max-w-[75%]"
                        }
                        style={message.isUser ? {
                          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                          animation: 'slideInRight 0.3s ease-out',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        } : {
                          animation: 'slideInLeft 0.3s ease-out',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {message.loading ? (
                          <Loading />
                        ) : (
                          <>
                            <div className="text-sm md:text-base break-words">
                              {message.text.split("\n").map((i, idx) => {
                                return (
                                  <div key={idx} className="mb-1 last:mb-0">
                                    <div
                                      dangerouslySetInnerHTML={{ __html: i }}
                                      className="prose prose-sm max-w-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* <!-- Input --> */}
              <div className="rounded-2xl box-border outline-none m-2 md:m-4 px-2 md:px-3 py-2 flex items-center shadow-lg border gap-2" style={{ background: darkMode ? 'rgba(30, 30, 50, 0.8)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.4)' }}>
                <div className="flex-1 min-w-0">
                  <input
                    className="w-full px-2 md:px-3 py-2 box-border outline-none bg-transparent"
                    style={{
                      color: darkMode ? '#fff' : '#000',
                      fontSize: '16px', // Prevents zoom on iOS
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitAppearance: 'none',
                      borderRadius: '8px'
                    }}
                    type="text"
                    placeholder="Type your message..."
                    value={isRecording ? transcript : input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoading && input.trim()) {
                          sendMessage();
                        }
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="items-center flex gap-1 md:gap-2 flex-shrink-0">
                  <button
                    className="p-2 md:p-2.5 rounded-full transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-50"
                    style={{
                      minWidth: '44px',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={isRecording ? "#EF4444" : "none"}
                      viewBox="0 0 24 24"
                      strokeWidth={isRecording ? 0 : 1.5}
                      stroke={isRecording ? "" : darkMode ? "#fff" : "#4F46E5"}
                      className="w-5 h-5 md:w-6 md:h-6"
                    >
                      {isRecording ? (
                        <>
                          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                        </>
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                        />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="p-2.5 md:p-3 rounded-xl transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isLoading || !input.trim() ? 'rgba(79, 70, 229, 0.5)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                      minWidth: '44px',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    aria-label="Send message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      strokeWidth={1.5}
                      stroke="white"
                      className="w-4 h-4 md:w-5 md:h-5"
                    >
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;

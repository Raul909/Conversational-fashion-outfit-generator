import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
// import { Intro } from "./Intro";
import { Loading } from "./Loading";

function ChatBox() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  // const [sample, setSample] = useState(false);
  // const [input, setInput] = useState("");

  const sendMessage = async (textbtn) => {
    console.log(textbtn);
    let sample;

    if (typeof textbtn == "string") sample = true;
    console.log(sample);
    if (!sample) if (!input.trim()) return;
    console.log(input);
    try {
      setInput("");
      setMessages([
        ...messages,
        { text: sample ? textbtn : input, isUser: true, loading: false },
        { text: "generating...", isUser: false, loading: true },
      ])

      // Use environment variable for API URL or fallback to localhost
      const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

      const response = await axios.post(
        `${API_URL}/api/recommendations`,
        {
          userMessage: sample ? textbtn : input,
        }
      );

      const botResponse = response.data.bot_response;
      setMessages([
        ...messages,
        { text: sample ? textbtn : input, isUser: true, loading: false },
        { text: botResponse, isUser: false, loading: false },
      ]);
    } catch (error) {
      setMessages([
        ...messages,
        { text: sample ? textbtn : input, isUser: true, loading: false },
        {
          text: `error generating response: ${error.message}`,
          isUser: false,
          loading: false,
        },
      ]);
      console.error("Error fetching bot response:", error);
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container mx-auto">
        <div className="h-screen p-4">
          <div className="flex rounded-xl shadow-2xl h-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            {/* <!-- Left --> */}
            <div className="w-[20%] hidden md:flex flex-col" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(0, 0, 0, 0.1)' }}>
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
                  onClick={createNewChat}
                  className="bg-blue-700 overflow-hidden truncate flex justify-center text-white px-10 py-2 mx-10 my-7 border-none cursor-pointer rounded-[10px] text-[16px] absolute bottom-0"
                >
                  New Conversation
                </button>
              </div>
            </div>

            {/* <!-- Right --> */}
            <div className="flex-1 md:w-[80%] w-full flex flex-col" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
              {/* <!-- Header --> */}
              <div className="py-4 px-6 flex flex-row justify-between items-center shadow-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                <div className="flex items-center">
                  <div>
                    <p className="text-2xl font-bold text-white">Fashion Outfit Assistant</p>
                    <p className="text-sm text-indigo-100">AI-powered style recommendations</p>
                  </div>
                </div>
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

              <div className="flex-1 overflow-auto p-4" style={{ background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.3), rgba(243, 244, 246, 0.5))' }}>
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
                  <div className="px-3">
                    <div className={"flex mb-2"}>
                      <button
                        onClick={() => {
                          // setSample(true);
                          sendMessage(
                            "What should I wear for my job interview?"
                          );
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
                </>

                <div className="py-2 px-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={
                        message.isUser ? "flex justify-end mb-2" : "flex mb-2"
                      }
                    >
                      <div
                        className={
                          message.isUser
                            ? "rounded-2xl py-3 px-4 text-white shadow-lg"
                            : "rounded-2xl py-3 px-4 bg-white shadow border border-gray-100"
                        }
                        style={message.isUser ? {
                          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                          animation: 'slideInRight 0.3s ease-out'
                        } : {
                          animation: 'slideInLeft 0.3s ease-out'
                        }}
                      >
                        {message.loading ? (
                          <Loading />
                        ) : (
                          <>
                            <p className="text-sm ">
                              {message.text.split("\n").map((i) => {
                                return (
                                  <div className="">
                                    <div
                                      dangerouslySetInnerHTML={{ __html: i }}
                                    />
                                  </div>
                                );
                              })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* <!-- Input --> */}
              <div className="rounded-2xl whitespace-nowrap box-border outline-none m-4 md:m-6 px-3 py-2 flex items-center shadow-lg border" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                <div className="flex-1 mx-4">
                  <input
                    className="w-full px-3 py-2 whitespace-nowrap box-border outline-none bg-transparent"
                    type="text"
                    placeholder="Type your message..."
                    value={isRecording ? transcript : input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // 👇 Get input value
                        sendMessage();
                      }
                    }}
                  />
                </div>

                <div className="items-center flex">
                  <button
                    className="p-2 rounded-full transition-all hover:bg-gray-100"
                    onClick={isRecording ? stopRecording : startRecording}
                    style={isRecording ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={isRecording ? "blue" : "none"}
                      viewBox="0 0 24 24"
                      strokeWidth={isRecording ? 0 : 1.5}
                      stroke={isRecording ? "" : "blue"}
                      className="w-6 h-6"
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
                    onClick={sendMessage}
                    className="p-3 rounded-xl ml-2 transition-all hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white   "
                      strokeWidth={1.5}
                      stroke="white"
                      className="w-4 h-4"
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

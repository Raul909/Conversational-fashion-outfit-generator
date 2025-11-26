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
    <div>
      <div className="container mx-auto bg-gray-200">
        <div className=" h-screen">
          <div className="flex border border-yellow-300 rounded shadow-lg h-full">
            {/* <!-- Left --> */}
            <div className="w-[20%] border flex flex-col bg-white">
              {/* <!-- Header --> */}
              <div className="py-2 px-3 mx-2 border-b border-gray-400 bg-white flex flex-row justify-between items-center">
                <h1 className="mx-auto pt-2 text-2xl ">Chats</h1>
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
            <div className="w-[80%] border-2  flex flex-col">
              {/* <!-- Header --> */}
              <div className="py-2 px-3 bg-white flex flex-row justify-between items-center">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="py-2 text-2xl">Test Conversation 1</p>
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

              <div className="flex-1 overflow-auto bg-gray-200">
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
                            ? "rounded py-2 px-3 bg-blue-700 text-white"
                            : "rounded py-2 px-3 bg-gray-50"
                        }
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
              <div className="bg-white rounded-lg whitespace-nowrap box-border outline-none m-6 px-1 py-1 flex items-center">
                <div className="flex-1 mx-4">
                  <input
                    className="w-full  px-2 py-2  whitespace-nowrap box-border outline-none              "
                    type="text"
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
                    className="p-2"
                    onClick={isRecording ? stopRecording : startRecording}
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
                    className="p-2.5 rounded-xl mx-1 bg-blue-700"
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

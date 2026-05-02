// import React, { useEffect, useRef, useState } from "react";
// import { useAppContext } from "../context/AppContext";
// import { assets } from "../assets/assets";
// import Message from "./Message";
// import toast from "react-hot-toast";

// const ChatBox = () => {
//   const containerRef = useRef(null);

//   const { selectedChat, theme, user, axios, token, setUser } = useAppContext();

//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [prompt, setPrompt] = useState("");
//   const [mode, setMode] = useState("text");
//   const [isPublished, setIsPublished] = useState(false);

//   const onSubmit = async (e) => {
//     try {
//       e.preventDefault();
//       if (!user) return toast("Login to send message");
//       setLoading(true);
//       const promptCopy = prompt;
//       setPrompt("");
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "user",
//           content: prompt,
//           timestamp: Date.now(),
//           isImage: false,
//         },
//       ]);

//       const { data } = await axios.post(
//         `/api/message/${mode}`,
//         { chatId: selectedChat._id, prompt, isPublished },
//         { headers: { Authorization: token } }
//       );

//       if (data.success) {
//         setMessages((prev) => [...prev, data.reply]);
//         // decrease credits
//         if (mode === "image") {
//           setUser((prev) => ({ ...prev, credits: prev.credits - 2 }));
//         } else {
//           setUser((prev) => ({ ...prev, credits: prev.credits - 1 }));
//         }
//       } else {
//         toast.error(data.message);
//         setPrompt(promptCopy);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setPrompt("");
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedChat) {
//       setMessages(selectedChat.messages);
//     }
//   }, [selectedChat]);

//   useEffect(() => {
//     if (containerRef.current) {
//       containerRef.current.scrollTo({
//         top: containerRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }
//   }, [messages]);

//   return (
//     <div className="m-5 flex flex-1 flex-col justify-between max-md:mt-14 md:m-10 xl:mx-30 2xl:pr-40">
//       {/* Chat Messages */}
//       <div ref={containerRef} className="mb-5 flex-1 overflow-y-scroll">
//         {messages.length === 0 && (
//           <div className="text-primary flex h-full flex-col items-center justify-center gap-2">
//             <img
//               src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
//               alt=""
//               className="w-full max-w-56 sm:max-w-68"
//             />
//             <p className="mt-5 text-center text-4xl text-gray-400 sm:text-6xl dark:text-white">
//               Ask me anything.
//             </p>
//           </div>
//         )}

//         {messages.map((message, index) => (
//           <Message key={index} message={message} />
//         ))}

//         {/* Three Dots Loading  */}
//         {loading && (
//           <div className="loader flex items-center gap-1.5">
//             <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 dark:bg-white"></div>
//             <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 dark:bg-white"></div>
//             <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 dark:bg-white"></div>
//           </div>
//         )}
//       </div>

//       {mode === "image" && (
//         <label className="mx-auto mb-3 inline-flex items-center gap-2 text-sm">
//           <p className="text-xs">Publish Generated Image to Community</p>
//           <input
//             type="checkbox"
//             className="cursor-pointer"
//             checked={isPublished}
//             onChange={(e) => setIsPublished(e.target.checked)}
//           />
//         </label>
//       )}

//       {/* Prompt Input Box */}
//       <form
//         onSubmit={onSubmit}
//         className="bg-primary/20 border-primary mx-auto flex w-full max-w-2xl items-center gap-4 rounded-full border p-3 pl-4 dark:border-[#80609F]/30 dark:bg-[#583C79]/30"
//       >
//         <select
//           onChange={(e) => setMode(e.target.value)}
//           value={mode}
//           className="pr-2 pl-3 text-sm outline-none"
//         >
//           <option className="dark:bg-purple-900" value="text">
//             Text
//           </option>
//           <option className="dark:bg-purple-900" value="image">
//             Image
//           </option>
//         </select>
//         <input
//           onChange={(e) => setPrompt(e.target.value)}
//           value={prompt}
//           type="text"
//           placeholder="Type your prompt here..."
//           className="w-full flex-1 text-sm outline-none"
//           required
//         />
//         <button disabled={loading}>
//           <img
//             src={loading ? assets.stop_icon : assets.send_icon}
//             className="w-8 cursor-pointer"
//             alt=""
//           />
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ChatBox;

import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Message from "./Message";
import toast from "react-hot-toast";

const ChatBox = () => {
  const containerRef = useRef(null);

  const { selectedChat, theme, user, axios, token, setUser } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!user) return toast("Login to send message");
      if (!selectedChat) return toast("Select or create a chat first");
      if (loading) return;

      setLoading(true);
      const promptCopy = prompt;
      setPrompt("");

      // Optimistically render the user message immediately
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: promptCopy,
          timestamp: Date.now(),
          isImage: false,
        },
      ]);

      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChat._id, prompt: promptCopy, isPublished },
        { headers: { Authorization: token } }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.reply]);
        // Use the authoritative credit value returned by the server
        setUser((prev) => ({ ...prev, credits: data.credits }));
      } else {
        toast.error(data.message);
        // Roll back the optimistically added user message on failure
        setMessages((prev) => prev.slice(0, -1));
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.message);
      // Roll back on network-level failure
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // Sync messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="m-5 flex flex-1 flex-col justify-between max-md:mt-14 md:m-10 xl:mx-30 2xl:pr-40">
      {/* Chat Messages */}
      <div ref={containerRef} className="mb-5 flex-1 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="text-primary flex h-full flex-col items-center justify-center gap-2">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt=""
              className="w-full max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-center text-4xl text-gray-400 sm:text-6xl dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {/* Three Dots Loading */}
        {loading && (
          <div className="loader flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 dark:bg-white"></div>
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 dark:bg-white"></div>
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 dark:bg-white"></div>
          </div>
        )}
      </div>

      {mode === "image" && (
        <label className="mx-auto mb-3 inline-flex items-center gap-2 text-sm">
          <p className="text-xs">Publish Generated Image to Community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      {/* Prompt Input Box */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 border-primary mx-auto flex w-full max-w-2xl items-center gap-4 rounded-full border p-3 pl-4 dark:border-[#80609F]/30 dark:bg-[#583C79]/30"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="pr-2 pl-3 text-sm outline-none"
        >
          <option className="dark:bg-purple-900" value="text">
            Text
          </option>
          <option className="dark:bg-purple-900" value="image">
            Image
          </option>
        </select>
        <input
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          type="text"
          placeholder="Type your prompt here..."
          className="w-full flex-1 text-sm outline-none"
          required
        />
        <button type="submit" disabled={loading}>
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className="w-8 cursor-pointer"
            alt=""
          />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
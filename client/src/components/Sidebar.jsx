import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import moment from "moment";
import toast from "react-hot-toast";

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const {
    chats,
    setSelectedChat,
    theme,
    setTheme,
    user,
    navigate,
    createNewChat,
    axios,
    setChats,
    fetchUsersChats,
    setToken,
    token,
  } = useAppContext();
  const [search, setSearch] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast.success("Logged out successfully");
  };

  const deleteChat = async (e, chatId) => {
    try {
      e.stopPropagation();
      const confirm = window.confirm(
        "Are you sure you want to delete this chat?"
      );
      if (!confirm) return;
      const { data } = await axios.post(
        "/api/chat/delete",
        { chatId },
        { headers: { Authorization: token } }
      );
      if (data.success) {
        setChats((prev) => prev.filter((chat) => chat._id !== chatId));
        await fetchUsersChats();
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      className={`left-0 z-1 flex h-screen min-w-72 flex-col border-r border-[#80609F]/30 from-[#242124]/30 to-[#000000]/30 p-5 backdrop-blur-3xl transition-all duration-500 max-md:absolute dark:bg-gradient-to-b ${!isMenuOpen && "max-md:-translate-x-full"}`}
    >
      {/* Logo */}
      <img
        onClick={() => navigate("/")}
        src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
        alt=""
        className="w-full max-w-48 cursor-pointer"
      />

      {/* New Chat Button */}
      <button
        onClick={createNewChat}
        className="mt-10 flex w-full cursor-pointer items-center justify-center rounded-md bg-gradient-to-r from-[#A456F7] to-[#3D81F6] py-2 text-sm text-white"
      >
        <span className="mr-2 text-xl">+</span> New Chat
      </button>

      {/* Search Conversations */}
      <div className="mt-4 flex items-center gap-2 rounded-md border border-gray-400 p-3 dark:border-white/20">
        <img src={assets.search_icon} className="w-4 not-dark:invert" alt="" />
        <input
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          type="text"
          placeholder="Search conversations"
          className="text-xs outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Recent Chats */}
      {chats.length > 0 && <p className="mt-4 text-sm">Recent Chats</p>}
      <div className="mt-3 flex-1 space-y-3 overflow-y-scroll text-sm">
        {chats
          .filter((chat) =>
            chat.messages[0]
              ? chat.messages[0]?.content
                  .toLowerCase()
                  .includes(search.toLowerCase())
              : chat.name.toLowerCase().includes(search.toLowerCase())
          )
          .map((chat) => (
            <div
              onClick={() => {
                navigate("/");
                setSelectedChat(chat);
                setIsMenuOpen(false);
              }}
              key={chat._id}
              className="group flex cursor-pointer justify-between rounded-md border border-gray-300 p-2 px-4 dark:border-[#80609F]/15 dark:bg-[#57317C]/10"
            >
              <div>
                <p className="w-full truncate">
                  {chat.messages.length > 0
                    ? chat.messages[0].content.slice(0, 32)
                    : chat.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#B1A6C0]">
                  {moment(chat.updatedAt).fromNow()}
                </p>
              </div>
              <img
                src={assets.bin_icon}
                className="hidden w-4 cursor-pointer not-dark:invert group-hover:block"
                alt=""
                onClick={(e) =>
                  toast.promise(deleteChat(e, chat._id), {
                    loading: "deleting...",
                  })
                }
              />
            </div>
          ))}
      </div>

      {/* Community Images */}
      <div
        onClick={() => {
          navigate("/community");
          setIsMenuOpen(false);
        }}
        className="mt-4 flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 p-3 transition-all hover:scale-103 dark:border-white/15"
      >
        <img
          src={assets.gallery_icon}
          className="w-4.5 not-dark:invert"
          alt=""
        />
        <div className="flex flex-col text-sm">
          <p>Community Images</p>
        </div>
      </div>

      {/* Credit Purchases Option */}
      <div
        onClick={() => {
          navigate("/credits");
          setIsMenuOpen(false);
        }}
        className="mt-4 flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 p-3 transition-all hover:scale-103 dark:border-white/15"
      >
        <img src={assets.diamond_icon} className="w-4.5 dark:invert" alt="" />
        <div className="flex flex-col text-sm">
          <p>Credits : {user?.credits}</p>
          <p className="text-xs text-gray-400">
            Purchase credits to use quickgpt
          </p>
        </div>
      </div>

      {/* Dark Mode Toggle  */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-md border border-gray-300 p-3 dark:border-white/15">
        <div className="flex items-center gap-2 text-sm">
          <img src={assets.theme_icon} className="w-4 not-dark:invert" alt="" />
          <p>Dark Mode</p>
        </div>
        <label className="relative inline-flex cursor-pointer">
          <input
            onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="checkbox"
            className="peer sr-only"
            checked={theme === "dark"}
          />
          <div className="h-5 w-9 rounded-full bg-gray-400 transition-all peer-checked:bg-purple-600"></div>
          <span className="absolute top-1 left-1 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-4"></span>
        </label>
      </div>

      {/* User Account */}
      <div className="group mt-4 flex cursor-pointer items-center gap-3 rounded-md border border-gray-300 p-3 dark:border-white/15">
        <img src={assets.user_icon} className="w-7 rounded-full" alt="" />
        <p className="dark:text-primary flex-1 truncate text-sm">
          {user ? user.name : "Login your account"}
        </p>
        {user && (
          <img
            onClick={logout}
            src={assets.logout_icon}
            className="hidden h-5 cursor-pointer not-dark:invert group-hover:block"
          />
        )}
      </div>

      <img
        onClick={() => setIsMenuOpen(false)}
        src={assets.close_icon}
        className="absolute top-3 right-3 h-5 w-5 cursor-pointer not-dark:invert md:hidden"
        alt=""
      />
    </div>
  );
};

export default Sidebar;

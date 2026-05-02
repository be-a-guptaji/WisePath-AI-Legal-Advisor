import React, { useEffect } from "react";
import { assets } from "../assets/assets";
import moment from "moment";
import Markdown from "react-markdown";
import Prism from "prismjs";

const Message = ({ message }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  return (
    <div>
      {message.role === "user" ? (
        <div className="my-4 flex items-start justify-end gap-2">
          <div className="flex max-w-2xl flex-col gap-2 rounded-md border border-[#80609F]/30 bg-slate-50 p-2 px-4 dark:bg-[#57317C]/30">
            <p className="dark:text-primary text-sm">{message.content}</p>
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
          <img src={assets.user_icon} alt="" className="w-8 rounded-full" />
        </div>
      ) : (
        <div className="bg-primary/20 my-4 inline-flex max-w-2xl flex-col gap-2 rounded-md border border-[#80609F]/30 p-2 px-4 dark:bg-[#57317C]/30">
          {message.isImage ? (
            <img
              src={message.content}
              alt=""
              className="mt-2 w-full max-w-md rounded-md"
            />
          ) : (
            <div className="dark:text-primary reset-tw text-sm">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
            {moment(message.timestamp).fromNow()}
          </span>
        </div>
      )}
    </div>
  );
};

export default Message;

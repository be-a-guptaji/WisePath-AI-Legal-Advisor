import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Loading = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAppContext();

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUser();
      navigate("/");
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-[#531B81] to-[#29184B] text-2xl text-white backdrop-opacity-60">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
    </div>
  );
};

export default Loading;

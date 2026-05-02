import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {
  const [state, setState] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { axios, setToken } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = state === "login" ? "/api/user/login" : "/api/user/register";

    try {
      const { data } = await axios.post(url, { name, email, password });
      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="m-auto flex w-80 flex-col items-start gap-4 rounded-lg border border-gray-200 bg-white p-8 py-12 text-gray-500 shadow-xl sm:w-[352px]"
    >
      <p className="m-auto text-2xl font-medium">
        <span className="text-purple-700">User</span>{" "}
        {state === "login" ? "Login" : "Sign Up"}
      </p>
      {state === "register" && (
        <div className="w-full">
          <p>Name</p>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            placeholder="type here"
            className="mt-1 w-full rounded border border-gray-200 p-2 outline-purple-700"
            type="text"
            required
          />
        </div>
      )}
      <div className="w-full">
        <p>Email</p>
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          placeholder="type here"
          className="mt-1 w-full rounded border border-gray-200 p-2 outline-purple-700"
          type="email"
          required
        />
      </div>
      <div className="w-full">
        <p>Password</p>
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          placeholder="type here"
          className="mt-1 w-full rounded border border-gray-200 p-2 outline-purple-700"
          type="password"
          required
        />
      </div>
      {state === "register" ? (
        <p>
          Already have account?{" "}
          <span
            onClick={() => setState("login")}
            className="cursor-pointer text-purple-700"
          >
            click here
          </span>
        </p>
      ) : (
        <p>
          Create an account?{" "}
          <span
            onClick={() => setState("register")}
            className="cursor-pointer text-purple-700"
          >
            click here
          </span>
        </p>
      )}
      <button
        type="submit"
        className="w-full cursor-pointer rounded-md bg-purple-700 py-2 text-white transition-all hover:bg-purple-800"
      >
        {state === "register" ? "Create Account" : "Login"}
      </button>
    </form>
  );
};

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username || !password) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/accounts/login/",
        {
          username,
          password,
        }
      );

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/discover");
    } catch (err) {
      if (err.response) {
        if (err.response.data.username) {
          setError(err.response.data.username.join(" "));
        } else if (err.response.data.password) {
          setError(err.response.data.password.join(" "));
        } else if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError("Login failed. Please check credentials.");
        }
      } else {
        setError("Server not reachable.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-6">
      {/* App Name */}
    <div className="absolute top-6 left-6 text-white text-2xl font-bold tracking-wide">
    ChatConnect
    </div>

        
      <div className="relative w-full max-w-sm p-8 rounded-[40px] bg-gradient-to-b from-[#b9ecff] to-[#9edcf2] shadow-2xl text-center overflow-hidden">
        
        {/* Decorative Circles */}
        <div className="absolute w-36 h-36 bg-white/30 rounded-full -top-10 -left-10"></div>
        <div className="absolute w-44 h-44 bg-white/30 rounded-full -bottom-12 -right-12"></div>

        <h1 className="text-3xl font-semibold text-gray-800 mb-1">
          Log in
        </h1>
        <p className="text-gray-700 text-sm mb-6">
          Enter your login details to access your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">

          {error && (
            <p className="text-red-500 text-xs text-left">{error}</p>
          )}

          <input
            type="text"
            placeholder="Email or Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border-none outline-none text-gray-700 shadow-sm"
          />

          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border-none outline-none text-gray-700 shadow-sm"
            />
            <span
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
            >
              👁
            </span>
          </div>

          <div className="text-right text-xs text-gray-700 cursor-pointer hover:underline">
            Forgot password?
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 transition-transform text-white font-semibold py-3 rounded-xl shadow-md mt-2"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-8">
          <p className="text-gray-800 text-sm">Don’t have an account?</p>
          <button
            onClick={() => navigate("/register")}
            className="text-gray-900 font-semibold hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function Login() {
//   const navigate = useNavigate();

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     if (!username || !password) {
//       setError("Username and password are required.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await axios.post("http://127.0.0.1:8000/api/accounts/login/", {
//         username,
//         password,
//       });

//       // Save JWT tokens in localStorage
//       localStorage.setItem("access", res.data.access);
//       localStorage.setItem("refresh", res.data.refresh);

//       // Redirect to Discover page
//       navigate("/discover");
//     } catch (err) {
//       if (err.response) {
//         // Server returned a response
//         if (err.response.data.username) {
//           setError(err.response.data.username.join(" "));
//         } else if (err.response.data.password) {
//           setError(err.response.data.password.join(" "));
//         } else if (err.response.data.detail) {
//           setError(err.response.data.detail);
//         } else {
//           setError("Login failed. Please check credentials.");
//         }
//       } else {
//         setError("Server not reachable.");
//       }
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-6 rounded shadow-md w-96 flex flex-col gap-4"
//       >
//         <h2 className="text-2xl font-bold text-center">Login</h2>

//         {error && <p className="text-red-500 text-sm">{error}</p>}

//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           className="border p-2 rounded"
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border p-2 rounded"
//         />

//         <button
//           type="submit"
//           className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
//           disabled={loading}
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>

//         <p className="text-sm text-center">
//           Don't have an account?{" "}
//           <span
//             className="text-blue-500 cursor-pointer"
//             onClick={() => navigate("/register")}
//           >
//             Register
//           </span>
//         </p>
//       </form>
//     </div>
//   );
// }

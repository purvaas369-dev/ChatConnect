import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (password !== password2) {
      setErrors({ password2: ["Passwords do not match"] });
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/accounts/register/", {
        username,
        email,
        password,
        password2,
      });
      navigate("/login");
    } catch (err) {
      setErrors(err.response?.data || { detail: "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>

      <style>{`
        .custom-card {
          background: linear-gradient(to bottom, #b9ecff, #9edcf2);
          border-radius: 40px;
          position: relative;
          overflow: hidden;
        }

        .circle {
          position: absolute;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 50%;
        }

        .circle-top {
          width: 150px;
          height: 150px;
          top: -50px;
          left: -40px;
        }

        .circle-bottom {
          width: 180px;
          height: 180px;
          bottom: -60px;
          right: -50px;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-6">
        <div className="absolute top-6 left-6 text-white text-2xl font-bold tracking-wide">
        ChatConnect
        </div>
        <div className="custom-card w-full max-w-sm p-8 shadow-2xl text-center">
          
          {/* Decorative Circles */}
          <div className="circle circle-top"></div>
          <div className="circle circle-bottom"></div>

          <h1 className="text-3xl font-semibold text-gray-800 mb-1">
            Sign Up
          </h1>
          <p className="text-gray-700 text-sm mb-6">
            Get your free account now
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            
            <input
              type="text"
              placeholder="Name"
              className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border-none outline-none text-gray-700 shadow-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border-none outline-none text-gray-700 shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border-none outline-none text-gray-700 shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
              >
                👁
              </span>
            </div>

            <input
              type="password"
              placeholder="Password again"
              className="w-full p-3 rounded-xl bg-white/80 backdrop-blur border-none outline-none text-gray-700 shadow-sm"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />

            {errors.password2 && (
              <p className="text-red-500 text-xs text-left">
                {errors.password2[0]}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 transition-transform text-white font-semibold py-3 rounded-xl shadow-md mt-3"
            >
              {loading ? "Processing..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-gray-800 text-sm">Already a member?</p>
            <button
              onClick={() => navigate("/login")}
              className="text-gray-900 font-semibold hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// export default function Register() {
//   const navigate = useNavigate();

//   // Form state
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [password2, setPassword2] = useState("");

//   // Error state
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrors({}); // clear previous errors

//     // Client-side password check
//     if (password !== password2) {
//       setErrors({ password2: ["Passwords do not match"] });
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await axios.post(
//         "http://127.0.0.1:8000/api/accounts/register/",
//         {
//           username:username,
//           email:email,
//           password:password,
//           password2,
//         }
//       );
//       console.log("Registration successful:", response.data);

//       // Redirect to login
//       navigate("/login");
//     } catch (err) {
//       console.error("Registration failed:", err.response.data);
//       setErrors(err.response.data); // set backend errors to display
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
//       <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* Username */}
//         <div>
//           <label className="block mb-1">Username</label>
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             className="w-full border px-3 py-2 rounded"
//           />
//           {errors.username &&
//             errors.username.map((msg, idx) => (
//               <p key={idx} className="text-red-600 text-sm">{msg}</p>
//             ))}
//         </div>

//         {/* Email */}
//         <div>
//           <label className="block mb-1">Email</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full border px-3 py-2 rounded"
//           />
//           {errors.email &&
//             errors.email.map((msg, idx) => (
//               <p key={idx} className="text-red-600 text-sm">{msg}</p>
//             ))}
//         </div>

//         {/* Password */}
//         <div>
//           <label className="block mb-1">Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="w-full border px-3 py-2 rounded"
//           />
//           {errors.password &&
//             errors.password.map((msg, idx) => (
//               <p key={idx} className="text-red-600 text-sm">{msg}</p>
//             ))}
//         </div>

//         {/* Confirm Password */}
//         <div>
//           <label className="block mb-1">Confirm Password</label>
//           <input
//             type="password"
//             value={password2}
//             onChange={(e) => setPassword2(e.target.value)}
//             className="w-full border px-3 py-2 rounded"
//           />
//           {errors.password2 &&
//             errors.password2.map((msg, idx) => (
//               <p key={idx} className="text-red-600 text-sm">{msg}</p>
//             ))}
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//           disabled={loading}
//         >
//           {loading ? "Registering..." : "Register"}
//         </button>
//       </form>

//       <p className="mt-4 text-center text-sm">
//         Already have an account?{" "}
//         <span
//           onClick={() => navigate("/login")}
//           className="text-blue-600 cursor-pointer underline"
//         >
//           Login
//         </span>
//       </p>
//     </div>
//   );
// }

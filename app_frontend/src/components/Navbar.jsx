import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBadge from "./Navbadge";
import axios from "axios";

export default function Navbar() {
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();

  const token = localStorage.getItem("access");

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/chat/notifications/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    navigate("/login");
  };

  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 flex justify-between items-center shadow-lg">

      {/* LOGO */}
      <h1
        className="text-white text-xl font-bold cursor-pointer tracking-wide"
        onClick={() => navigate("/discover")}
      >
        ChatConnect
      </h1>

      {/* NAV LINKS */}
      <div className="flex items-center gap-6 text-white">

        <Link
          to="/discover"
          className="hover:underline transition"
        >
          Discover
        </Link>

        <Link
          to="/profile"
          className="hover:underline transition"
        >
          Profile
        </Link>

        {/* NOTIFICATION */}
        <div
          className="relative cursor-pointer text-xl"
          onClick={() => navigate("/notifications")}
        >
          🔔

          {notifications > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
              {notifications > 99 ? '99+' : notifications}
            </span>
          )}
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="bg-white/20 backdrop-blur px-4 py-1 rounded-xl hover:bg-white/30 transition"
        >
          Logout
        </button>

      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function Navbar() {
//   const [notifications, setNotifications] = useState(0);
//   const navigate = useNavigate();

//   const token = localStorage.getItem("access");

//   // ---------------- FETCH NOTIFICATIONS ----------------
//   const fetchNotifications = async () => {
//     if (!token) return;
//     try {
//       const res = await axios.get(
//         "http://127.0.0.1:8000/api/chat/notifications/",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       // count unread messages + requests
//       setNotifications(res.data.count);

//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchNotifications();

//     // 🔥 auto refresh every 5 sec
//     const interval = setInterval(fetchNotifications, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   // ---------------- LOGOUT ----------------
//   const handleLogout = () => {
//     localStorage.removeItem("access");
//     navigate("/login");
//   };

//   return (
//     <div className="bg-white shadow-md px-6 py-3 flex justify-between items-center">

//       {/* LOGO */}
//       <h1
//         className="text-xl font-bold cursor-pointer"
//         onClick={() => navigate("/discover")}
//       >
//         ChatApp 🚀
//       </h1>

//       {/* NAV LINKS */}
//       <div className="flex items-center gap-6">

//         <Link to="/discover" className="hover:text-blue-500">
//           Discover
//         </Link>

//         <Link to="/profile" className="hover:text-blue-500">
//           Profile
//         </Link>

//         {/* NOTIFICATION */}
//         <div className="relative cursor-pointer" onClick={() => navigate("/notifications")}>

//           🔔

//           {notifications > 0 && (
//             <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
//               {notifications}
//             </span>
//           )}
//         </div>

//         {/* LOGOUT */}
//         <button
//           onClick={handleLogout}
//           className="bg-red-500 text-white px-3 py-1 rounded"
//         >
//           Logout
//         </button>

//       </div>
//     </div>
//   );
// }

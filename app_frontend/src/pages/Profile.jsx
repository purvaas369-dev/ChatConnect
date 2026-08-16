import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("access");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/accounts/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-6 relative">


      {/* Profile Card */}
      <div className="relative w-full max-w-sm p-8 rounded-[40px] bg-gradient-to-b from-[#b9ecff] to-[#9edcf2] shadow-2xl text-center overflow-hidden">

        {/* Decorative Circles */}
        <div className="absolute w-36 h-36 bg-white/30 rounded-full -top-10 -left-10"></div>
        <div className="absolute w-44 h-44 bg-white/30 rounded-full -bottom-12 -right-12"></div>

        {/* PROFILE IMAGE */}
        <div className="flex flex-col items-center">
          <img
            src={user.profile_picture || "/default.png"}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />

          <h2 className="text-xl font-bold mt-3 text-gray-800">
            {user.username}
          </h2>
          <p className="text-gray-700 text-sm">{user.email}</p>
        </div>

        {/* DETAILS */}
        <div className="mt-6 space-y-3 text-left">

          <div className="flex justify-between bg-white/70 p-3 rounded-xl">
            <span className="text-gray-600">Age</span>
            <span className="text-gray-800">{user.age || "Not set"}</span>
          </div>

          <div className="flex justify-between bg-white/70 p-3 rounded-xl">
            <span className="text-gray-600">City</span>
            <span className="text-gray-800">{user.city || "Not set"}</span>
          </div>

          <div className="bg-white/70 p-3 rounded-xl">
            <span className="text-gray-600 block">Bio</span>
            <p className="text-sm mt-1 text-gray-800">
              {user.bio || "No bio added"}
            </p>
          </div>

        </div>

        {/* BUTTON */}
        <button
          onClick={() => navigate("/edit-profile")}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 transition-transform text-white font-semibold py-3 rounded-xl shadow-md"
        >
          Edit Profile ✏️
        </button>
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// export default function Profile() {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();

//   const token = localStorage.getItem("access");

//   // ---------------- FETCH PROFILE ----------------
//   useEffect(() => {
//     axios
//       .get("http://127.0.0.1:8000/api/accounts/profile/", {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => {
//         setUser(res.data);
//       })
//       .catch((err) => console.error(err));
//   }, []);

//   if (!user) return <p className="text-center mt-10">Loading...</p>;

//   return (
//     <div className="min-h-screen bg-gray-100 flex justify-center items-center p-5">

//       <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">

//         {/* PROFILE IMAGE */}
//         <div className="flex flex-col items-center">
//           <img
//             src={user.profile_picture || "/default.png"}
//             alt=""
//             className="w-28 h-28 rounded-full object-cover border-4 border-blue-400"
//           />

//           <h2 className="text-xl font-bold mt-3">{user.username}</h2>
//           <p className="text-gray-500">{user.email}</p>
//         </div>

//         {/* DETAILS */}
//         <div className="mt-6 space-y-3">

//           <div className="flex justify-between border-b pb-2">
//             <span className="text-gray-600">Age</span>
//             <span>{user.age || "Not set"}</span>
//           </div>

//           <div className="flex justify-between border-b pb-2">
//             <span className="text-gray-600">City</span>
//             <span>{user.city || "Not set"}</span>
//           </div>

//           <div className="border-b pb-2">
//             <span className="text-gray-600 block">Bio</span>
//             <p className="text-sm mt-1">
//               {user.bio || "No bio added"}
//             </p>
//           </div>

//         </div>

//         {/* EDIT BUTTON */}
//         <button
//           onClick={() => navigate("/edit-profile")}
//           className="w-full mt-6 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
//         >
//           Edit Profile ✏️
//         </button>

//       </div>
//     </div>
//   );
// }

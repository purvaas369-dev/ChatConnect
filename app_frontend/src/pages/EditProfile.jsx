import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [form, setForm] = useState({
    username: "",
    age: "",
    city: "",
    bio: "",
  });

  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("access");
  console.log("TOKEN:", token);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/accounts/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setForm(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    if (image) {
      formData.append("profile_picture", image);
    }

    try {
      await axios.put(
        "http://127.0.0.1:8000/api/accounts/profile/edit/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Profile updated ✅");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      console.log("ERROR STATUS:", err.response?.status);
      console.log("ERROR DATA:", err.response?.data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-6 relative">

      

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm p-8 rounded-[40px] bg-gradient-to-b from-[#b9ecff] to-[#9edcf2] shadow-2xl text-center overflow-hidden"
      >

        {/* Decorative Circles */}
        <div className="absolute w-36 h-36 bg-white/30 rounded-full -top-10 -left-10"></div>
        <div className="absolute w-44 h-44 bg-white/30 rounded-full -bottom-12 -right-12"></div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Edit Profile ✏️
        </h2>

        <div className="space-y-3">

          {/* IMAGE */}
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full text-sm text-gray-700"
          />

          {/* USERNAME */}
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur outline-none text-gray-700 shadow-sm"
          />

          {/* AGE */}
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            placeholder="Age"
            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur outline-none text-gray-700 shadow-sm"
          />

          {/* CITY */}
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur outline-none text-gray-700 shadow-sm"
          />

          {/* BIO */}
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Bio"
            className="w-full p-3 rounded-xl bg-white/80 backdrop-blur outline-none text-gray-700 shadow-sm"
          />

        </div>

        {/* BUTTON */}
        <button
          type="submit"
          className="w-full mt-5 bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 transition-transform text-white font-semibold py-3 rounded-xl shadow-md"
        >
          Save Changes 💾
        </button>
      </form>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// export default function EditProfile() {
//   const [form, setForm] = useState({
//     username: "",
//     age: "",
//     city: "",
//     bio: "",
//   });

//   const [image, setImage] = useState(null);
//   const navigate = useNavigate();

//   const token = localStorage.getItem("access");

//   // ---------------- LOAD DATA ----------------
//   useEffect(() => {
//     axios
//       .get("http://127.0.0.1:8000/api/accounts/profile/", {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => {
//         setForm(res.data);
//       });
//   }, []);

//   // ---------------- HANDLE CHANGE ----------------
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   // ---------------- HANDLE SUBMIT ----------------
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();

//     Object.keys(form).forEach((key) => {
//       formData.append(key, form[key]);
//     });

//     if (image) {
//       formData.append("profile_picture", image);
//     }

//     try {
//       await axios.put(
//         "http://127.0.0.1:8000/api/accounts/profile/edit/",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       alert("Profile updated ✅");
//       navigate("/profile");

//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // ---------------- UI ----------------
//   return (
//     <div className="min-h-screen bg-gray-100 flex justify-center items-center p-5">

//       <form
//         onSubmit={handleSubmit}
//         className="bg-white w-full max-w-md p-6 rounded-xl shadow"
//       >
//         <h2 className="text-xl font-bold mb-4 text-center">
//           Edit Profile ✏️
//         </h2>

//         {/* IMAGE */}
//         <input
//           type="file"
//           onChange={(e) => setImage(e.target.files[0])}
//           className="mb-3"
//         />

//         {/* USERNAME */}
//         <input
//           type="text"
//           name="username"
//           value={form.username}
//           onChange={handleChange}
//           placeholder="Username"
//           className="w-full mb-3 p-2 border rounded"
//         />

//         {/* AGE */}
//         <input
//           type="number"
//           name="age"
//           value={form.age}
//           onChange={handleChange}
//           placeholder="Age"
//           className="w-full mb-3 p-2 border rounded"
//         />

//         {/* CITY */}
//         <input
//           type="text"
//           name="city"
//           value={form.city}
//           onChange={handleChange}
//           placeholder="City"
//           className="w-full mb-3 p-2 border rounded"
//         />

//         {/* BIO */}
//         <textarea
//           name="bio"
//           value={form.bio}
//           onChange={handleChange}
//           placeholder="Bio"
//           className="w-full mb-3 p-2 border rounded"
//         />

//         {/* SUBMIT */}
//         <button
//           type="submit"
//           className="w-full bg-green-500 text-white py-2 rounded"
//         >
//           Save Changes 💾
//         </button>
//       </form>
//     </div>
//   );
// }

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Discover from "./pages/Discover";
import Notifications from "./pages/Notification";
import Chat from "./pages/Chat";


import './index.css'

// Layout
import MainLayout from "./components/MainLayout";

// ---------------- AUTH CHECK ----------------
const isAuthenticated = () => {
  return localStorage.getItem("access") !== null;
};

// ---------------- PROTECTED ROUTE ----------------
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Routes>

        {/* ---------------- PUBLIC ROUTES (NO NAVBAR) ---------------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ---------------- PROTECTED ROUTES (WITH NAVBAR) ---------------- */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />  {/* ✅ ADD THIS LINE */}
        </Route>

        {/* ---------------- DEFAULT REDIRECT ---------------- */}
        <Route
          path="/"
          element={
            isAuthenticated()
              ? <Navigate to="/discover" />
              : <Navigate to="/login" />
          }
        />

        {/* ---------------- 404 ---------------- */}
        <Route
          path="*"
          element={<h1 className="text-center mt-10">404 Not Found</h1>}
        />

      </Routes>
    </Router>
  );
}
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// // Pages
// import Login from "./pages/Login";
// import './index.css'
// import Register from "./pages/Register";
// import Profile from "./pages/Profile";
// import EditProfile from "./pages/EditProfile";
// import Discover from "./pages/Discover";
// import Chat from "./pages/Chat";
// import Navbar from "./components/Navbar";

// // ---------------- AUTH CHECK ----------------
// const isAuthenticated = () => {
//   return localStorage.getItem("access") !== null;
// };

// // ---------------- PROTECTED ROUTE ----------------
// const PrivateRoute = ({ children }) => {
//   return isAuthenticated() ? children : <Navigate to="/login" />;
// };

// export default function App() {
//   return (
//     <Router>
//       {isAuthenticated() && <Navbar />}
//       <Routes>
        
//         {/* ---------------- PUBLIC ROUTES ---------------- */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         {/* ---------------- PROTECTED ROUTES ---------------- */}
//         <Route
//           path="/profile"
//           element={
//             <PrivateRoute>
//               <Profile />
//             </PrivateRoute>
//           }
//         />

//         <Route
//           path="/edit-profile"
//           element={
//             <PrivateRoute>
//               <EditProfile />
//             </PrivateRoute>
//           }
//         />

//         <Route
//           path="/discover"
//           element={
//             <PrivateRoute>
//               <Discover />
//             </PrivateRoute>
//           }
//         />

//         <Route
//           path="/chat/:roomId"
//           element={
//             <PrivateRoute>
//               <Chat />
//             </PrivateRoute>
//           }
//         />

//         {/* ---------------- DEFAULT REDIRECT ---------------- */}
//         <Route
//           path="/"
//           element={
//             isAuthenticated() ? <Navigate to="/discover" /> : <Navigate to="/login" />
//           }
//         />

//         {/* ---------------- 404 ---------------- */}
//         <Route path="*" element={<h1 className="text-center mt-10">404 Not Found</h1>} />

//       </Routes>
//     </Router>
//   );
// }

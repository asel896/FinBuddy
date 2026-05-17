import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

const App = () => {
  const isLoggedIn = localStorage.getItem("buddyocto_user");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/Dashboard" /> : <Navigate to="/Login" />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/Login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
import { Route, Router, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyUser } from "./Store/user.slice";
import { useEffect } from "react";
import Login from "./Page/Login/Login";
import Register from "./Page/Register/Register";
import Home from "./Page/Home/Home";
import RoomController from "./Page/Room/RoomController";
import Library from "./Page/Library/Library";
import Success from "./Page/Google/Success";
import NotFound from "./Page/Not Found/NotFound";
import { ProtectedRoute } from "./Protected";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(verifyUser());
  }, [dispatch]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="" element={<Home />} />
        <Route path="/success" element={<Success />} />
        <Route
          path="/room/:roomCode"
          element={
            <ProtectedRoute>
              <RoomController />
            </ProtectedRoute>
          }
        />
        <Route path="/library" element={<Library />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

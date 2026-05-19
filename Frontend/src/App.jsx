import { Route, Router, Routes } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { verifyUser } from "./Store/user.slice"
import { useEffect } from "react"
import Login from './Page/Login/Login'
import Register from './Page/Register/Register'
import Home from './Page/Home/Home'
import Success from "./Page/Google/Success"
import RoomController from "./Page/Room/RoomController"
import Library from "./Page/Library/Library"

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
        <Route path='/room' element={<RoomController />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </>
  )
}

export default App

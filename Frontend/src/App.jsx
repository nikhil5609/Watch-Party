import { Route, Router, Routes } from "react-router-dom"
import Login from './Page/Login/Login'
import Register from './Page/Register/Register'
import Home from './Page/Home/Home'
import { useDispatch, useSelector } from "react-redux"
import { verifyUser } from "./Store/user.slice"
import Success from "./Page/Google/Success"
import RoomController from "./Page/Room/RoomController"
import Theater from "./Page/Room/Theater"

function App() {
  const dispatch = useDispatch();
  dispatch(verifyUser())

  return (
    <>
      {}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="" element={<Home />} />
        <Route path="/success" element={<Success />} />
        <Route path='/room' element={<RoomController />} />
      </Routes>
    </>
  )
}

export default App

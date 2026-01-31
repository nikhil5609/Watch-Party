import { Route, Router, Routes } from "react-router-dom"
import Login from './Page/Login/Login'
import Register from './Page/Register/Register'
import Home from './Page/Home/Home'
import { useDispatch, useSelector } from "react-redux"
import { verifyUser } from "./Store/user.slice"
import Success from "./Page/Google/Success"
import Room from "./Page/Room/Room"
import Theater from "./Page/Theater/Theater"

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
        <Route path='/room' element={<Room />} />
        <Route path="/room/:roomCode/theater" element={<Theater />} />
      </Routes>
    </>
  )
}

export default App

import React from 'react'
import { useSelector } from 'react-redux'
import Main from './Main'
import LandingPage from './LandingPage'

const Home = () => {
    const user = useSelector(state=>state.user)
    
    return (
        user.loggedIn ? <Main /> : <LandingPage />
    )
}

export default Home
import React from 'react'
import { useSelector } from 'react-redux'
import Main from './Main'
import LandingPage from './LandingPage'
import Loading from '../Loading/Loading'

const Home = () => {
    const user = useSelector(state=>state.user)
    if(user.loading) return <Loading />
    
    return (
        user.loggedIn ? <Main /> : <LandingPage />
    )
}

export default Home
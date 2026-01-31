import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { verifyUser } from '../../Store/user.slice';
import { useNavigate } from 'react-router-dom';

const Success = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(verifyUser())
            .then((res) => {
                if (res.payload?.user) {
                  console.log(res);
                    if(res.payload?.token){
                        localStorage.setItem("token",res.payload?.token);
                    }
                    navigate('/');
                } else {
                    navigate('/login');
                }
            })
            .catch(() => {
                navigate('/login');
            });
    }, [dispatch, navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.loader}></div>
            <p>Verifying your session, please wait...</p>
        </div>
    );
};

// Simple CSS-in-JS for the loading look
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
    },
    loader: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 2s linear infinite',
        marginBottom: '20px'
    }
};

export default Success;
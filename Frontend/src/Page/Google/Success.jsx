import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyUser } from '../../Store/user.slice';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const redirectTo = searchParams.get('redirect') || '/';
    if (token) {
      localStorage.setItem('token', token);
      dispatch(verifyUser())
        .unwrap()
        .then(() => {
            sessionStorage.removeItem('redirectAfterLogin'); // 👈 clean up
            navigate(redirectTo, { replace: true });
        })
        .catch((err) => {
          console.error("Verification failed:", err);
          
          localStorage.removeItem('token');
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600 mb-4"></div>
      <p className="font-bold tracking-widest text-sm text-slate-400 uppercase">Syncing your session...</p>
    </div>
  );
};

export default Success;
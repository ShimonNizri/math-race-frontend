import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { verifyAccount } from "../../services/authService.js";
import { ClipLoader } from "react-spinners";

import { getErrorMessage } from "../../utils/errorMapper.js";

import './Auth.css'
import Card from "../../components/ui/Card.jsx";

function VerifyAccountPage() {
    const navigate = useNavigate();
    const { token } = useParams();

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Verifying your account...');

    const hasFetched = useRef(false);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const response = await verifyAccount(token);

                if (response.success === true) {
                    setStatus('success');
                    setMessage('Account verified successfully! Redirecting to login...');

                    setTimeout(() => {
                        navigate('/auth/login');
                    }, 3000);

                } else {
                    setStatus('error');


                    const code = response.errorCode;
                    setMessage(getErrorMessage(code));
                }
            } catch (error) {
                console.error("Error verifying token:", error);
                setStatus('error');

                if (error.response && error.response.status === 404) {
                    setMessage(getErrorMessage(9001));
                } else {
                    setMessage(getErrorMessage(9000));
                }
            }
        };

        if (token && !hasFetched.current) {
            hasFetched.current = true;
            checkToken();
        } else if (!token) {
            setStatus('error');
            setMessage(getErrorMessage(1000));
        }
    }, [navigate, token]);

    return (
        <div className="page-wrapper">

            <Card className="theme-yellow">
                <h2>Account Verification</h2>

                {status === 'loading' && (
                    <div style={{ margin: '20px 0' }}>
                        <ClipLoader color="var(--text-h)" />
                    </div>
                )}

                <p style={{ marginTop: status === 'loading' ? '0' : '20px', fontWeight: status === 'error' ? 'bold' : 'normal', color: status === 'error' ? 'var(--red)' : 'inherit' }}>
                    {message}
                </p>
            </Card>
        </div>
    );
}

export default VerifyAccountPage;
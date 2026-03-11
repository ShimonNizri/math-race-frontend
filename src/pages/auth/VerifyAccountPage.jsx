import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {verifyAccount} from "../../services/authService.js";
import "./Auth.css";

function VerifyAccountPage() {
    const navigate = useNavigate();
    const { token } = useParams();

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('מבצע אימות חשבון...🔄');

    useEffect(() => {

        const checkToken = async () => {
            try {
                const response = await verifyAccount(token);

                if (response.success === true) {
                    setStatus('success');
                    setMessage('החשבון אומת בהצלחה! מיד תועבר לדף ההתחברות...');

                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);

                } else {
                    setStatus('error');
                    setMessage('הקישור פג תוקף או שאינו תקין.');
                }
            } catch (error) {
                console.error("Error verifying token:", error);
                setStatus('error');
                setMessage('שגיאת תקשורת עם השרת.');
            }
        };

        if (token) {
            checkToken();
        }
    }, [navigate, token]);

    return (
        <>
            <div className="verify-container">
                <h2>אימות חשבון</h2>

                <div className={`status-message ${status}`}>
                    {message}
                </div>

            </div>
        </>
    );
}

export default VerifyAccountPage;
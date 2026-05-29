import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { ClipLoader } from "react-spinners";
import { getErrorMessage } from "../../utils/errorMapper.js";

import '../auth/Auth.css'
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { confirmAccountDeletion } from "../../services/userProfileService.js";
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";

function ConfirmDeleteAccount() {
    const navigate = useNavigate();
    const { token } = useParams();

    const { updateAuthToken } = useWebSocket() || {};

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage(getErrorMessage(1000));
        }
    }, [token]);

    const handleConfirmDeletion = async () => {
        setStatus('loading');
        // עדכון הטקסט כך שישקף תהליך אימות ובדיקה
        setMessage('Verifying and processing your request...');
        setErrorMessage('');

        try {
            const response = await confirmAccountDeletion(token);

            if (response.success === true) {
                setStatus('success');
                setMessage('Account deleted successfully. We are sorry to see you go! Redirecting to login...');

                updateAuthToken(null, null);

                setTimeout(() => {
                    navigate('/auth/login');
                }, 4000);

            } else {
                setStatus('error');
                const code = response.errorCode;

                if (code === 1000)
                    setErrorMessage(response.message);
                else
                    setErrorMessage(getErrorMessage(code));
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            setStatus('error');

            if (error.response && error.response.status === 404) {
                setErrorMessage(getErrorMessage(9001));
            } else if (error.response && error.response.data && error.response.data.errorCode) {
                setErrorMessage(getErrorMessage(error.response.data.errorCode));
            } else {
                setErrorMessage(getErrorMessage(9000));
            }
        }
    };

    return (
        <div className="page-wrapper">

            {/* הקפצת הודעות השגיאה בנוסף להצגה בכרטיסייה */}
            <ErrorToast
                message={errorMessage}
                onClose={() => setErrorMessage("")}
            />

            <Card className="theme-red">
                <h2>Delete Account</h2>

                {/* מצב המתנה לאישור המשתמש */}
                {status === 'idle' && (
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ fontWeight: 'bold', color: 'var(--red)', marginBottom: '15px' }}>
                            Warning: This action is permanent and irreversible.
                        </p>
                        <p style={{ marginBottom: '25px' }}>
                            Are you sure you want to delete your account? All your personal data, race history, and achievements will be permanently lost.
                        </p>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <Button onClick={handleConfirmDeletion}>
                                Yes, Delete My Account
                            </Button>
                            <Button onClick={() => navigate('/')} style={{ backgroundColor: 'var(--gray)' }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* מצב טעינה - מציג את הלודר והטקסט שהבקשה באימות */}
                {status === 'loading' && (
                    <div style={{ margin: '20px 0' }}>
                        <ClipLoader color="var(--text-h)" />
                        <p style={{ marginTop: '10px' }}>{message}</p>
                    </div>
                )}

                {/* מצב שגיאה - השגיאה נכתבת במקום, עם כפתור חזרה לדף הבית */}
                {status === 'error' && (
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ fontWeight: 'bold', color: 'var(--red)', marginBottom: '20px' }}>
                            {errorMessage}
                        </p>
                        <Button onClick={() => navigate('/')} style={{ backgroundColor: 'var(--gray)' }}>
                            Return to Home
                        </Button>
                    </div>
                )}

                {/* מצב הצלחה */}
                {status === 'success' && (
                    <p style={{
                        marginTop: '20px',
                        fontWeight: 'normal',
                        color: 'inherit'
                    }}>
                        {message}
                    </p>
                )}
            </Card>
        </div>
    );
}

export default ConfirmDeleteAccount;
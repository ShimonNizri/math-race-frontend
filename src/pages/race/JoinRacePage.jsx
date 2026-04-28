import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Card from "../../components/ui/Card.jsx";
import { ALERT_TYPES, AlertModal } from "../../components/ui/AlertModal.jsx";

import { ClipLoader } from "react-spinners";

import { joinRace } from "../../services/raceService.js";
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import logo from "../../assets/logo.png";
import './RaceForms.css';

function JoinRacePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const codeFromUrl = searchParams.get("code") || "";
    const isCodeLocked = Boolean(codeFromUrl);

    const [formData, setFormData] = useState({
        roomCode: codeFromUrl,
        nickname: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const { clearError, clearLastMessage } = useWebSocket();

    useEffect(() => {
        if (!alert) return;

        const timer = setTimeout(() => {
            if (alert.onClose) {
                alert.onClose();
            } else {
                setAlert(null);
                navigate("/");
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [alert, navigate])

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        clearError();
        clearLastMessage();

        try {
            const response = await joinRace(formData);
            console.log(response);
            if (response.success) {
                const { code, joinToken, type } = response.data;
                console.log(joinToken + " יש טוקן לכניסה ");
                navigate(`/race/${code}/${type.toLowerCase()}`, {
                    state: { joinToken: joinToken }
                });
            } else {
                handleBackendError(response);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Connection failed. Please try again.";
            setAlert({
                type: ALERT_TYPES.ERROR,
                title: "Error",
                message: errorMessage
            });
            setFormData({ roomCode: codeFromUrl, nickname: "" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackendError = (response) => {
        switch (response.errorCode) {
            case 1007:
                setAlert({
                    type: ALERT_TYPES.ERROR,
                    title: "Session Expired",
                    message: "Account not found. Please log in again.",
                    onClose: () => navigate("/auth/login")
                });
                break;
            case 1400:
            case 1401:
            case 1403:
            case 1404:
                setAlert({
                    type: ALERT_TYPES.ERROR,
                    title: "Invalid Request",
                    message: response.message
                });
                setFormData({ roomCode: codeFromUrl, nickname: "" });
                break;
            default:
                setAlert({
                    type: ALERT_TYPES.ERROR,
                    title: "Error",
                    message: response.message || "An unexpected error occurred."
                });
        }
    }

    return (
        <div className="page-wrapper">
            <Card className="game-card-styled theme-yellow">
                <div >

                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />

                    <h2 >Join the Race</h2>
                    <p >Got a room code? Enter it below and start playing!</p>
                </div>

                <form onSubmit={handleSubmit} >
                    <Input
                        name={"roomCode"}
                        type={"text"}
                        placeholder={"Room Code"}
                        value={formData.roomCode}
                        onChange={handleChange}
                        required
                        disabled={isCodeLocked}
                        style={isCodeLocked ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                    />

                    <Input
                        name={"nickname"}
                        type={"text"}
                        placeholder={"Nickname"}
                        value={formData.nickname}
                        onChange={handleChange}
                        autoFocus={isCodeLocked}
                    />

                    <Button  type={"submit"} disabled={isSubmitting}>
                        {isSubmitting ? <ClipLoader size={20} color="#fff" /> : "Join Room"}
                    </Button>

                    <Button  type={"button"} onClick={() => navigate("/")}>
                        Back to Home
                    </Button>
                </form>

                {alert && (
                    <AlertModal
                        type={alert.type}
                        title={alert.title}
                        onClose={alert.onClose || (() => setAlert(null))}
                    >
                        <p>{alert.message}</p>
                    </AlertModal>
                )}
            </Card>
        </div>
    );
}

export default JoinRacePage;
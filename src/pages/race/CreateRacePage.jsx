import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

import { createRace } from "../../services/raceService.js";
import { ALERT_TYPES, AlertModal } from "../../components/ui/AlertModal.jsx";
import { ClipLoader } from "react-spinners";
import logo from "../../assets/logo.png";
import './RaceForms.css';
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";

const INITIAL_STATE = {
    name: "",
    targetScore: "",
    isPrivate: true
};

function CreateRacePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(INITIAL_STATE);
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
    }, [alert, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        clearError();
        clearLastMessage();

        try {
            const response = await createRace(formData);
            if (response.success) {
                const { code } = response.data;
                navigate(`/race/${code}/host`);
            } else {
                handleBackendError(response);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to create race. Please try again.";
            setAlert({
                type: ALERT_TYPES.ERROR,
                title: "Creation Error",
                message: errorMessage
            });
            setFormData(INITIAL_STATE);
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
            case 1403:
                setAlert({
                    type: ALERT_TYPES.ERROR,
                    title: "Already in Race",
                    message: "You are already part of an active race.",
                    onClose: () => navigate("/race/join")
                });
                break;
            case 1400:
            case 14001:
                setAlert({
                    type: ALERT_TYPES.ERROR,
                    title: "Invalid Input",
                    message: response.message
                });
                setFormData(INITIAL_STATE);
                break;
            default:
                setAlert({
                    type: ALERT_TYPES.ERROR,
                    title: "Error",
                    message: response.message || "An unexpected error occurred."
                });
        }
    };

    return (
        <div className="page-wrapper">
            <Card className="game-card-styled theme-red">
                <div >

                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />

                    <h2 >Create Race</h2>
                    <p >Fill in the details to create a race!</p>
                </div>

                <form onSubmit={handleSubmit} >
                    <Input
                        name={"name"}
                        type={"text"}
                        placeholder={"Name for race"}
                        value={formData.name}
                        onChange={handleChange}
                    />

                    <Input
                        name={"targetScore"}
                        type={"number"}
                        min="0"
                        step="1"
                        onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                        placeholder={"Target score"}
                        value={formData.targetScore}
                        onChange={handleChange}
                        required
                    />

                    <div className="checkbox-container">
                        <input
                            id="isPrivate"
                            name="isPrivate"
                            type="checkbox"
                            checked={formData.isPrivate}
                            onChange={handleChange}
                            
                        />
                        <label htmlFor="isPrivate" >Private Race?</label>
                        <span >{formData.isPrivate ? "(Only with code)" : "(Public list)"}</span>
                    </div>

                    <Button  type={"submit"} disabled={isSubmitting}>
                        {isSubmitting ? <ClipLoader /> : "Create Race"}
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

export default CreateRacePage;
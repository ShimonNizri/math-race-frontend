import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

import { createRace } from "../../services/raceService.js";
import { ALERT_TYPES, AlertModal } from "../../components/ui/AlertModal.jsx";
import { ClipLoader } from "react-spinners";
import logo from "../../../public/logo.png";
import './RaceForms.css';
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";

const INITIAL_STATE = {
    name: "",
    nickname: "",
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
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [alert]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        const { name, nickname, targetScore } = formData;

        if (name) {
            if (name.length > 15) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Name cannot exceed 15 characters" });
                return false;
            }
            if (!/^(?:.*\S){3}.*$/.test(name)) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Name must contain at least 3 actual characters" });
                return false;
            }
            if (!/^\S.*\S$/.test(name)) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Name must not start or end with a space" });
                return false;
            }
        }

        if (nickname) {
            if (nickname.length > 15) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Nickname cannot exceed 15 characters" });
                return false;
            }
            if (!/^(?:.*\S){3}.*$/.test(nickname)) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Nickname must contain at least 3 actual characters" });
                return false;
            }
            if (!/^\S.*\S$/.test(nickname)) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Nickname must not start or end with a space" });
                return false;
            }
        }

        if (!targetScore) {
            setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Target score is required" });
            return false;
        } else {
            const score = Number(targetScore);
            if (score < 400 || score > 2500) {
                setAlert({ type: ALERT_TYPES.ERROR, title: "Invalid Input", message: "Target score must be between 400 and 2500." });
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        clearError();
        clearLastMessage();

        const payload = {};
        for (const [key, value] of Object.entries(formData)) {
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed !== "") payload[key] = trimmed;
            } else {
                payload[key] = value;
            }
        }

        try {
            console.log(payload);
            const response = await createRace(payload);

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
                <div>
                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />
                    <h2>Create Race</h2>
                    <p>Fill in the details to create a race!</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"name"}
                        type={"text"}
                        placeholder={"Name for race"}
                        value={formData.name}
                        onChange={handleChange}
                        minLength={3}
                        maxLength={15}
                        pattern={"^[^\\s].*[^\\s]$"}
                        title={"Name must be 3-15 characters and cannot start or end with a space"}
                    />

                    <Input
                        name={"targetScore"}
                        type={"number"}
                        min={400}
                        max={2500}
                        step={1}
                        onKeyDown={(e) => ["e", "E", "-", "+", "."].includes(e.key) && e.preventDefault()}
                        placeholder={"Target score"}
                        value={formData.targetScore}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        name={"nickname"}
                        type={"text"}
                        placeholder={"nickname for race"}
                        value={formData.nickname}
                        onChange={handleChange}
                        minLength={3}
                        maxLength={15}
                        pattern={"^[^\\s].*[^\\s]$"}
                        title={"Nickname must be 3-15 characters and cannot start or end with a space"}
                    />

                    <div className="checkbox-container">
                        <input
                            id="isPrivate"
                            name="isPrivate"
                            type="checkbox"
                            checked={formData.isPrivate}
                            onChange={handleChange}
                        />
                        <label htmlFor="isPrivate">Private Race?</label>
                        <span>{formData.isPrivate ? "(Only with code)" : "(Public list)"}</span>
                    </div>

                    <Button type={"submit"} disabled={isSubmitting}>
                        {isSubmitting ? <ClipLoader /> : "Create Race"}
                    </Button>

                    <Button type={"button"} onClick={() => navigate("/")}>
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
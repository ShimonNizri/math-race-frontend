import Card from "../../components/ui/Card.jsx";

import "./Auth.css";
import {useState} from "react";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import {changePassword} from "../../services/authService.js";

function ResetPasswordPage() {
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            await changePassword(formData.password);
            console.log("Password changed successfully!");
        } catch (err) {
            console.error("Failed to change password:", err);
        }
    };

    return (
        <>
            <Card className="auth-card">
                <div>
                    <h2>Create New Password</h2>
                    <p>
                        Choose a password (8-14 characters, using letters & numbers) to keep your account safe and get
                        back to the game. </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"password"}
                        type={"password"}
                        placeholder={"New Password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        name={"confirmPassword"}
                        type={"password"}
                        placeholder={"Confirm New Password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <Button type="submit">Save Password</Button>
                </form>
            </Card>
        </>
    )
}

export default ResetPasswordPage;
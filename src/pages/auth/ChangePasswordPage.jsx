import Card from "../../components/ui/Card.jsx";

import "./Auth.css";
import {useState} from "react";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import {changePassword} from "../../services/authService.js";
import {useNavigate} from "react-router-dom";

function ChangePasswordPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Waiting');

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
            const response = await changePassword(formData.password);
            if (response.success === true) {
                setStatus("Password change successfully!\n\n" + "מיד תועבר לדף הבית..'")
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            }else {
                setStatus(response.message);
            }
        } catch (err) {
            console.log(err);
            setStatus("Failed to change password");
        }
    };

    return (
        <>
            <Card className="auth-card">
                {status === 'Waiting' ? (
                        <>
                            <div>
                                <h2>Change The Password</h2>
                                <p>
                                    Choose a password (8-14 characters, using letters & numbers) to keep your account safe
                                    and get
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
                        </>
                    ) :

                    <div>{status}</div>
                }
            </Card>
        </>
    )
}

export default ChangePasswordPage;
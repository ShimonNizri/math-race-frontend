import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ProfileModal from "../profile/ProfileModal.jsx";

import logo from '../../assets/logo.png';
import './Dashboard.css';

function DashboardPage({user}) {
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleSubmit = (e) => {
        navigate("/race/" + e.target.name);
    }


    return (
        <>
            <div className="dashboard-wrapper">
                <header className="dashboard-header">
                    <button
                        className="profile-btn"
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => setIsProfileOpen(true)}
                        title="Profile"
                    >
                        {user ? user.username.substring(0, 1).toUpperCase() : 'G'}
                    </button>

                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />
                </header>

                <div className="cards-container">
                    <Card className="card-create">
                        <h2>Create a Race</h2>
                        <p>
                            Create a new room and select your preferred difficulty level. Share the unique code with others
                            so they can join, and watch the race unfold in real time.
                        </p>
                        <Button name={"create"} onClick={handleSubmit}>Create Race</Button>
                    </Card>

                    <Card className="card-join">
                        <h2>Join the Race</h2>
                        <p>
                            Got a room code? Then what are you waiting for! Click the button below, follow the instructions,
                            and start playing!
                        </p>
                        <Button name={"join"} onClick={handleSubmit}>Join Race</Button>
                    </Card>
                </div>
            </div>

            {
                isProfileOpen && (
                    <ProfileModal
                        onClose={() => setIsProfileOpen(false)}
                        user={user}
                    />
                )
            }
        </>
    )
}

export default DashboardPage;
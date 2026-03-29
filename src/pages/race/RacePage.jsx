import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import { useCallback, useEffect, useState } from "react";
import RacePlayerPage from "./RacePlayerPage.jsx";
import RaceHostPage from "./RaceHostPage.jsx";
import { getRaceInfo } from "../../services/raceService.js";

function RacePage() {
    const location = useLocation();
    const joinToken = location.state?.joinToken || null;
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const [userRole, setUserRole] = useState('Waiting');
    const { isConnected, error, clearError } = useWebSocket();
    const [accountId , setAccountId ] = useState();

    const checkInfo = useCallback(async () => {
        try {
            const response = await getRaceInfo(roomCode);
            console.log(response);
            if (response.success) {
                setUserRole(response.data.host ? "HOST" : "PLAYER");
                setAccountId(response.data.accountId);
            } else {
                if (response.errorCode === 1404 || response.errorCode === 1407) {
                    alert(response.message);
                    navigate('/race/join');
                } else {
                    alert(response.message);
                    navigate('/');
                }
            }
        } catch (err) {
            alert(err + "שגיאת תקשורת");
            navigate('/');
            console.log("2")
        }
    }, [roomCode, navigate]);

    useEffect(() => {
        if (error) {
            alert(error);
            console.log(error);
            clearError();
            navigate("/");
        }
    }, [error, navigate, clearError]);

    useEffect(() => {
        if (isConnected && userRole === 'Waiting') {

            Promise.resolve().then(() => {
                checkInfo();
            });
        }
        console.log("פה1")
    }, [isConnected, userRole,checkInfo]);

    if (error) {
        return <div>מתנתק...</div>;
    }

    if (!isConnected) {
        return <div>מתחבר...</div>;
    }

    if (userRole === 'Waiting') {
        return <div>טוען נתונים...</div>;
    }

    return (
        <>
            {userRole === 'HOST' ? (
                <RaceHostPage roomCode={roomCode} joinToken={joinToken}/>
            ) : (
                <RacePlayerPage roomCode={roomCode} joinToken={joinToken} accountId = {accountId} />
            )}
        </>
    );
}

export default RacePage;
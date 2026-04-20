import {BrowserRouter, Routes, Route} from 'react-router-dom';

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import JoinRacePage from "./pages/race/JoinRacePage.jsx";
import VerifyAccountPage from "./pages/auth/VerifyAccountPage.jsx";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage.jsx";
import WebSocketProvider from "./services/webSocket/WebSocketProvider.jsx";
import CreateRacePage from "./pages/race/CreateRacePage.jsx";
import RacePage from "./pages/race/RacePage.jsx";
import GameHistoryPage from "./pages/history/GameHistoryPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import ManageProfileLayout from "./pages/ManageProfileLayout.jsx";
import StatisticsPage from "./pages/statistics/StatisticsPage.jsx";
import {useEffect, useState} from "react";
import {myProfile} from "./services/userProfileService.js";
import {ClipLoader} from "react-spinners";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await myProfile();
                if (response.success) {
                    setUser(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <div>
                <ClipLoader/>
                Loading...
            </div>
        );
    }

    return (
        <WebSocketProvider>
            <BrowserRouter>
                <Routes>

                    <Route path={"/auth"}>
                        <Route path={"login"} element={<LoginPage/>}/>
                        <Route path={"register"} element={<RegisterPage/>}/>
                        <Route path={"forgot-password"} element={<ForgotPasswordPage/>}/>
                        <Route path={"change-password"} element={<ChangePasswordPage/>}/>
                        <Route path={"reset-password/:token"} element={<ResetPasswordPage/>}/>
                        <Route path={"verify/:token"} element={<VerifyAccountPage/>}/>
                    </Route>

                    <Route path={"/race"}>
                        <Route path="join" element={<JoinRacePage/>}/>

                        <Route element={<ProtectedRoute user={user} />}>
                            <Route path="create" element={<CreateRacePage/>}/>
                        </Route>

                        <Route path=":roomCode" element={<RacePage/>}/>
                    </Route>

                    <Route element={<MainLayout/>}>
                        <Route path={"/"} element={<DashboardPage user={user}/>}/>
                        <Route element={<ProtectedRoute user={user} />}>
                            <Route path={"/manage-profile"} element={<ManageProfileLayout/>}>
                                <Route index element={<ProfilePage user={user}/>}/>
                                <Route path="history" element={<GameHistoryPage/>}/>
                                <Route path="statistics" element={<StatisticsPage/>}/>
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </WebSocketProvider>
    )
}

export default App;

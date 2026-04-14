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
import GameDetailsPage from "./pages/history/GameDetailsPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import ManageProfileLayout from "./pages/ManageProfileLayout.jsx";

function App() {

    const user = {
        email: "exemple@example.com",
        username: "Jon walker",
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

                    <Route path={"/history/:gameId"} element={<GameDetailsPage/>}/>

                    <Route path={"/race"}>
                        <Route path="join" element={<JoinRacePage/>}/>
                        <Route path="create" element={<CreateRacePage/>}/>
                        <Route path=":roomCode" element={<RacePage/>}/>
                    </Route>

                    <Route element={<MainLayout/>}>
                        <Route path={"/"} element={<DashboardPage user={user}/>}/>
                        <Route path={"/manage-profile"} element={<ManageProfileLayout/>}>
                            <Route index element={<ProfilePage user={user}/>}/>
                            <Route path="history" element={<GameHistoryPage/>}/>

                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </WebSocketProvider>
    )
}

export default App;

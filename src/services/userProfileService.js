import {apiWithOutToken, apiWithToken} from "../api/axios";

const myProfile = async () => {
    const response = await apiWithToken.get('/users/me');
    return response.data;
}

const myStatistics = async () => {
    const response = await apiWithToken.get('/users/me/statistics');
    return response.data;
}

const myHistory = async () => {
    const response = await apiWithToken.get('/users/me/history');
    return response.data;
};

const myFullHistory = async (raceId) => {
    const response = await apiWithToken.get(`/users/me/history/${raceId}`);
    return response.data;
};

export {
    myProfile,
    myStatistics,
    myHistory,
    myFullHistory,
};
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

const updateUsername = async (newUsername) => {
    const response = await apiWithToken.patch('/users/me/username', { username: newUsername });
    return response.data;
};

const requestAccountDeletion = async () => {
    const response = await apiWithToken.post('/users/me/delete-request');
    return response.data;
};

const confirmAccountDeletion = async (token) => {
    const response = await apiWithToken.delete('/users/me', {
        params: { token: token }
    });
    return response.data;
};

export {
    myProfile,
    myStatistics,
    myHistory,
    myFullHistory,
    updateUsername,
    requestAccountDeletion,
    confirmAccountDeletion
};
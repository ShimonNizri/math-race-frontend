import axios from "axios";

const BASE_URL = 'http://localhost:8085/api';

const apiWithOutToken = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const apiWithToken = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiWithToken.interceptors.request.use((config) => {
    // const token = localStorage.getItem('token');
    // if (token) {
    //     config.headers.Authorization = `Bearer ${token}`;
    // }
    // return config;
    return config;
});

export {
    apiWithOutToken,
    apiWithToken,
};
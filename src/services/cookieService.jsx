import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

export const cookieService = {

    setToken: (token, days) => {
        Cookies.set(TOKEN_KEY, token, {
            expires: days,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });
    },

    getToken: () => {
        return Cookies.get(TOKEN_KEY);
    },

    removeToken: () => {
        Cookies.remove(TOKEN_KEY);
    }
};
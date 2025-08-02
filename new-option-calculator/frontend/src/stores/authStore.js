import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// This function attempts to get the user's token from localStorage.
// It only runs in the browser, not on the server.
const getInitialToken = () => {
    if (browser) {
        return localStorage.getItem('token');
    }
    return null;
};

// Create a 'writable' store. This means its value can be set from outside.
// We initialize it with the token from localStorage, if it exists.
export const authToken = writable(getInitialToken());

// Subscribe to changes in the store.
// Whenever the token changes, we update it in localStorage.
if (browser) {
    authToken.subscribe(token => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    });
}

// You can also add other related stores here, for example, to hold user info.
export const user = writable(null);

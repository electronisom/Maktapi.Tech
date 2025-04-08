import { writable } from 'svelte/store';

export const isAuthenticated = writable(false);

export function login(token) {
    isAuthenticated.set(true);
}

export function logout() {
    isAuthenticated.set(false);
    window.location.href = '/login';
} 
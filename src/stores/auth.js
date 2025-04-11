import { writable } from 'svelte/store';

export const isAuthenticated = writable(true);

export function logout() {
    isAuthenticated.set(false);
    window.location.href = '/';
} 
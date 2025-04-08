import App from './App.svelte';
import { Router } from 'svelte-routing';
import { isAuthenticated } from './stores/auth';

// Set up router base
let base = '';
if (import.meta.env.DEV) {
	base = '';
} else {
	base = window.location.pathname.replace(/\/[^/]*$/, '');
}

// Check if current path is not login and user is not authenticated
const currentPath = window.location.pathname;
if (currentPath !== '/login') {
	isAuthenticated.subscribe(value => {
		if (!value) {
			window.location.href = '/login';
		}
	});
}

const app = new App({
	target: document.getElementById('app'),
	props: {
		url: base
	}
});

export default app;
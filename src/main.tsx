import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import axios from 'axios';

// Initialize axios Authorization header from localStorage synchronously
try {
	const token = localStorage.getItem('token');
	if (token) {
		axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		// eslint-disable-next-line no-console
		console.debug('[main] set axios default Authorization from localStorage');
	}
} catch (e) {
	// ignore (localStorage may not be available in some envs)
}

createRoot(document.getElementById("root")!).render(<App />);

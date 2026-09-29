import { io } from "socket.io-client";

const socketUrl =
	import.meta.env.VITE_SOCKET_URL ||
	`${window.location.protocol}//${window.location.hostname}:3030`;

const socket = io(socketUrl);

export default socket;
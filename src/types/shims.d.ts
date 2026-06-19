// laravel-echo's type graph references optional peer deps that we don't install
// (we only use the Pusher/Reverb connector). Stub them so tsc doesn't fail.
declare module 'socket.io-client';
declare module 'pusher-js/react-native';

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCwB2YX7jWVj75EIwt3m2s4qdFLPsfuZuY",
    authDomain: "rivalize-id.firebaseapp.com",
    projectId: "rivalize-id",
    storageBucket: "rivalize-id.appspot.com",
    messagingSenderId: "1011784486870",
    appId: "1:1011784486870:web:2fda6fe86f9c900b5b9e77"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth, db, storage };
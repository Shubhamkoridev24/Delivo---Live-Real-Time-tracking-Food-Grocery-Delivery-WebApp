// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "delivo-app-f7baf.firebaseapp.com",
  projectId: "delivo-app-f7baf",
  storageBucket: "delivo-app-f7baf.firebasestorage.app",
  messagingSenderId: "919259995327",
  appId: "1:919259995327:web:904e4b011f93b2f53fba0a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
export {app,auth}

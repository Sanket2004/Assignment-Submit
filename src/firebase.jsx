import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {

    apiKey: "AIzaSyDTbT0mxDLq9FFD9wXDiNiBQFZ5PXshUhY",
    authDomain: "assignment-submission-65435.firebaseapp.com",
    projectId: "assignment-submission-65435",
    storageBucket: "assignment-submission-65435.appspot.com",
    messagingSenderId: "873232019860",
    appId: "1:873232019860:web:1fde4dc8af79a289251f81"

};



// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const storage = getStorage();
export const db = getFirestore();
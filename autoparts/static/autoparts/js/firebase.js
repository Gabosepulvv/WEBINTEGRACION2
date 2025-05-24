// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBEE1EXxyZDeffu3YGuO6lEKHwsbzTqSGI",
  authDomain: "autoparts-60ee0.firebaseapp.com",
  projectId: "autoparts-60ee0",
  storageBucket: "autoparts-60ee0.firebasestorage.app",
  messagingSenderId: "685321402071",
  appId: "1:685321402071:web:b7d7d76cc4acb9a152e292",
  measurementId: "G-KW4Z1GY2SC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

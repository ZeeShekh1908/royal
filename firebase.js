// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCiyTRtHEYnWolhiqe-2im_3xRKK0arUR4",
  authDomain: "recipe-suggestion-app-dd270.firebaseapp.com",
  projectId: "recipe-suggestion-app-dd270",
  storageBucket: "recipe-suggestion-app-dd270.appspot.com",
  messagingSenderId: "1081231408480",
  appId: "1:1081231408480:web:b6cb5e45da31bb4a9ab205"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };

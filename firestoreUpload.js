const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');

// Your Firebase configuration (get this from Firebase Console)
const firebaseConfig = {
avfdagrs
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadData() {
  try {
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync('scraped_data.json', 'utf8'));
    
    // Reference to your collection
    const propheciesRef = collection(db, 'prophecies');
    
    // Upload each item
    for (const item of jsonData) {
      try {
        const docRef = await addDoc(propheciesRef, {
          page: item.page,
          row: item.row,
          link: item.link,
          dateLocation: item.dateLocation,
          paragraphs: item.paragraphs,
          timestamp: new Date() // Optional: add upload timestamp
        });
        console.log(`Document written with ID: ${docRef.id}`);
      } catch (e) {
        console.error(`Error adding document: ${e}`);
      }
    }
    
    console.log('Upload complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadData();
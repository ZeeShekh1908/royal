const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

exports.sendNewOrderNotification = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const newOrder = snap.data();

    // Get all Expo push tokens of admins
    const tokensSnapshot = await admin.firestore().collection('adminTokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);

    if (tokens.length === 0) return;

    // Define the function to send notification via Expo
    const sendPushNotification = async (expoPushToken) => {
      const message = {
        to: expoPushToken,
        sound: 'telephone-ring.wav', // custom sound from app.json
        title: '🛒 New Order',
        body: `Order from ${newOrder?.userName || 'a user'}`,
        data: { screen: 'AdminOrders' },
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    };

    // Send to all tokens
    await Promise.all(tokens.map(sendPushNotification));
  });

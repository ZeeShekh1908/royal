const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendNewOrderNotification = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const newOrder = snap.data();

    const tokensSnapshot = await admin.firestore().collection('adminTokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);

    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: '🛒 New Order',
        body: `Order from ${newOrder?.userName || 'a user'}`,
      },
      data: {
        screen: 'AdminOrders',
      },
      android: {
        notification: {
          sound: 'telephone-ring.wav',
          channelId: 'default', // ✅ Add this line
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'telephone-ring.wav',
          },
        },
      },
      tokens,
    };

    await admin.messaging().sendMulticast(message);
  });

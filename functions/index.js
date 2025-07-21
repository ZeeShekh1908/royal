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
        title: '🛒 New Order Placed',
        body: `Order from ${newOrder?.userName || 'a user'}`,
      },
      data: {
        screen: 'AdminOrders',
      },
      android: {
        notification: {
          sound: 'telephone-ring.wav', // ✅ use custom sound if added in app.json
          channelId: 'default',        // ✅ ensure a channel is configured on client
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'telephone-ring.wav', // ✅ custom sound for iOS
          },
        },
      },
      tokens,
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`✅ Sent to ${response.successCount} devices, ${response.failureCount} failures`);
    } catch (err) {
      console.error('❌ Error sending push:', err);
    }
  });

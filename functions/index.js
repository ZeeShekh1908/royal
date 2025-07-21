const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

exports.sendNewOrderNotification = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const newOrder = snap.data();

    const tokensSnapshot = await admin.firestore().collection('adminTokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: '🛒 New Order Placed',
      body: `Order from ${newOrder?.userName || 'a user'}`,
      data: { screen: 'AdminOrders' },
    }));

    await Promise.all(messages.map(msg =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      })
    ));
  });

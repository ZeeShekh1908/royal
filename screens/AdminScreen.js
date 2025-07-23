import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { playBell, stopBell } from '../utils/bell';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AdminScreen() {
  const [orders, setOrders] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    registerForPushNotifications();

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(order => order.status !== 'done' && order.status !== 'rejected');

      setOrders(newOrders);

      const latestChange = snapshot.docChanges().find(change => change.type === 'added');
      if (latestChange) {
        const order = latestChange.doc.data();
        const orderId = latestChange.doc.id;

        const notifiedIdsJSON = await AsyncStorage.getItem('notifiedOrders');
        const notifiedIds = notifiedIdsJSON ? JSON.parse(notifiedIdsJSON) : [];

        if (!notifiedIds.includes(orderId)) {
          await playBell(); // 🔔 Start ringing
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🛎️ New Order!',
              body: `From: ${order.name} | ${order.item.name} x${order.qty} | ₹${order.total}`,
              sound: 'default',
              data: { screen: 'AdminOrders' },
            },
            trigger: null,
          });
          await stopBell(); // 🔕 Stop ringing

          const updatedIds = [...notifiedIds, orderId];
          await AsyncStorage.setItem('notifiedOrders', JSON.stringify(updatedIds));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      alert('Must use physical device for push notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    await setDoc(doc(db, 'adminTokens', token), { token });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default', // change to 'telephone-ring.wav' if needed
      });
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'accepted' });
      alert(`Order ${orderId} accepted`);
    } catch (err) {
      console.error(err);
      alert('Failed to accept order');
    }
  };

  const handleReject = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'rejected' });
      setOrders(prev => prev.filter(order => order.id !== orderId));
      alert(`Order ${orderId} rejected`);
    } catch (err) {
      console.error(err);
      alert('Failed to reject order');
    }
  };

  const handleDone = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'done' });
      alert(`Order ${orderId} marked as done`);
    } catch (err) {
      console.error(err);
      alert('Failed to update order to done');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>📋 Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.dashboardBtn}>
          <Text style={styles.dashboardText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.customer}>👤 {item.name}</Text>
              <View style={[
                styles.statusBadge,
                item.status === 'accepted' ? styles.badgeAccepted :
                item.status === 'rejected' ? styles.badgeRejected : styles.badgePending
              ]}>
                <Text style={styles.badgeText}>{item.status || 'pending'}</Text>
              </View>
            </View>
            <Text style={styles.detail}>🍽️ {item.item.name} x{item.qty}</Text>
            <Text style={styles.detail}>📍 {item.address}</Text>
            <Text style={styles.detail}>💳 {item.paymentMethod}</Text>
            <Text style={styles.total}>💰 ₹{item.total}</Text>

            {item.status === 'accepted' ? (
              <TouchableOpacity style={[styles.actionButton, styles.doneButton]} onPress={() => handleDone(item.id)}>
                <Text style={styles.buttonText}>Mark as Done</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(item.id)}>
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(item.id)}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 }}>
            No active orders right now 🍽️
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFF8F0' },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, marginBottom: 20,
  },
  header: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  dashboardBtn: {
    backgroundColor: '#FF7043', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, elevation: 3,
  },
  dashboardText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6, elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
  },
  customer: { fontWeight: 'bold', fontSize: 16, color: '#444' },
  detail: { fontSize: 14, color: '#555', marginVertical: 2 },
  total: { fontSize: 16, fontWeight: 'bold', color: '#000', marginTop: 6 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  actionButton: {
    flex: 0.48, paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 2,
  },
  acceptButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#F44336' },
  doneButton: { backgroundColor: '#2196F3', marginTop: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize', color: '#fff' },
  badgeAccepted: { backgroundColor: '#4CAF50' },
  badgeRejected: { backgroundColor: '#F44336' },
  badgePending: { backgroundColor: '#FFC107' },
});

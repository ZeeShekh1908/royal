import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [userPhone, setUserPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhone = async () => {
      const phone = await AsyncStorage.getItem('userPhone');
      if (phone) {
        setUserPhone(phone);
      } else {
        console.warn('Phone not found in storage');
        setLoading(false);
      }
    };

    loadPhone();
  }, []);

  useEffect(() => {
    if (!userPhone) return;

    const q = query(
      collection(db, 'orders'),
      where('phone', '==', userPhone),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userPhone]);

  const getStatusColor = (status) =>
    status === 'accepted' ? '#4CAF50'
    : status === 'rejected' ? '#F44336'
    : status === 'done'     ? '#2196F3'
    : '#FFC107'; // pending/default

  const getStatusMessage = (status) => {
    switch (status) {
      case 'accepted':
        return '✅ Your order has been accepted';
      case 'rejected':
        return '❌ Your order was rejected';
      case 'done':
        return '🚚 Your order is on the way';
      case 'delivered':
        return '📦 Order delivered';
      default:
        return '⏳ Waiting for approval';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.itemName}>{item.item.name} x{item.qty}</Text>
      <Text style={styles.text}>Total: ₹{item.total}</Text>
      <Text style={styles.text}>Payment: {item.paymentMethod}</Text>
      <Text style={styles.text}>📍 {item.address}</Text>
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        {getStatusMessage(item.status)}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#4CAF50" />;
  }

  if (!userPhone) {
    return (
      <View style={styles.center}>
        <Text style={styles.noOrders}>
          Could not find your orders. Please login or place an order first.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧾 My Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.noOrders}>You haven’t placed any orders yet.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  itemName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  text: { fontSize: 14, marginBottom: 2 },
  status: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noOrders: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 30,
  },
});

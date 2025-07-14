import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
export default function AdminScreen() {
  const [orders, setOrders] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(newOrders);

      const latest = snapshot.docChanges().find(change => change.type === 'added');
      if (latest) {
        const order = latest.doc.data();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🛎️ New Order!',
            body: `From: ${order.name} | ${order.item.name} x${order.qty} | ₹${order.total}`,
            sound: 'default',
          },
          trigger: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

 const handleAccept = async (orderId) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'accepted',
    });
    alert(`Order ${orderId} accepted`);
  } catch (err) {
    console.error(err);
    alert('Failed to accept order');
  }
};

const handleReject = async (orderId) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'rejected',
    });
    alert(`Order ${orderId} rejected`);
  } catch (err) {
    console.error(err);
    alert('Failed to reject order');
  }
};
const handleDone = async (orderId) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'done',
    });
    alert(`Order ${orderId} marked as done`);
  } catch (err) {
    console.error(err);
    alert('Failed to update order to done');
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>📋 Current Orders</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminDashboard')}
          style={styles.dashboardBtn}
        >
          <Text style={styles.dashboardText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.name}>🧑 {item.name}</Text>
            <Text style={styles.detail}>{item.item.name} x{item.qty}</Text>
            <Text style={styles.detail}>📍 {item.address}</Text>
            <Text style={styles.detail}>💳 {item.paymentMethod}</Text>
            <Text style={styles.total}>💰 ₹{item.total}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => handleAccept(item.id)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
            {item.status === 'accepted' ? (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
    onPress={() => handleDone(item.id)}
  >
    <Text style={styles.buttonText}>Mark as Done</Text>
  </TouchableOpacity>
) : (
  <View style={styles.buttonRow}>
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
      onPress={() => handleAccept(item.id)}
    >
      <Text style={styles.buttonText}>Accept</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: '#F44336' }]}
      onPress={() => handleReject(item.id)}
    >
      <Text style={styles.buttonText}>Reject</Text>
    </TouchableOpacity>
  </View>
)}

          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>
            No current orders.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dashboardBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dashboardText: {
    color: '#fff',
    fontWeight: '600',
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  detail: { fontSize: 14, color: '#555', marginBottom: 2 },
  total: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

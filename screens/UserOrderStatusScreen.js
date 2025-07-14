import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';

export default function UserOrderStatusScreen({ route }) {
    const navigation=useNavigation();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setOrder(docSnap.data());
      }
    });

    return () => unsub();
  }, [orderId]);

  if (!order) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
        <TouchableOpacity
  style={styles.viewOrdersButton}
  onPress={() => navigation.navigate('MyOrders', { userPhone: route.params?.userPhone })}
>
  <Text style={styles.viewOrdersText}>📦 View All My Orders</Text>
</TouchableOpacity>

      <Text style={styles.title}>🛒 Your Order</Text>
      <Text style={styles.info}>Item: {order.item.name} x{order.qty}</Text>
      <Text style={styles.info}>Total: ₹{order.total}</Text>
      <Text style={styles.status}>
        Status: {order.status ? order.status.toUpperCase() : 'Pending'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  info: { fontSize: 16, marginVertical: 4 },
  status: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  viewOrdersButton: {
  backgroundColor: '#4CAF50',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 15,
},
viewOrdersText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},

});

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function UserOrderStatusScreen({ route }) {
  const navigation = useNavigation();
  const { orderId, userPhone } = route.params;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setOrder(docSnap.data());
      }
    });

    return () => unsub();
  }, [orderId]);

  if (!order) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const statusSteps = ['Confirmed', 'Preparing', 'On the Way', 'Delivered'];

  const mapStatusToStep = (status) => {
    switch (status) {
      case 'accepted': return 1;   // Preparing
      case 'done': return 3;       // Delivered
      case 'rejected': return 0;   // Only confirmed
      default: return 0;           // pending or undefined
    }
  };

  const currentStep = mapStatusToStep(order.status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛍️ Order Status</Text>

      <View style={styles.card}>
        <Text style={styles.itemName}>{order.item.name} x{order.qty}</Text>
        <Text style={styles.total}>Total Paid: ₹{order.total}</Text>
      </View>

      <View style={styles.estimateBox}>
        <Ionicons name="bicycle" size={24} color="#4CAF50" />
        <Text style={styles.estimateText}>
          {order.status === 'done'
            ? 'Order delivered'
            : order.status === 'accepted'
            ? 'Your order is being prepared'
            : 'Order confirmed'}
        </Text>
        <Text style={styles.arrival}>
          {order.status === 'done'
            ? 'Thank you for ordering!'
            : 'Arriving in ~20 mins'}
        </Text>
      </View>

      {/* Status Tracker */}
      <View style={styles.tracker}>
        {statusSteps.map((step, index) => {
          const isActive = index <= currentStep;
          const isLast = index === statusSteps.length - 1;

          return (
            <View key={step} style={styles.step}>
              <View style={[styles.circle, isActive ? styles.circleActive : styles.circleInactive]}>
                <Ionicons
                  name={isActive ? 'checkmark' : 'time-outline'}
                  size={16}
                  color="#fff"
                />
              </View>
              <Text style={[styles.stepLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>
                {step}
              </Text>
              {!isLast && (
                <View
                  style={[styles.line, index < currentStep ? styles.lineActive : styles.lineInactive]}
                />
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.viewOrdersButton}
        onPress={() => navigation.navigate('MyOrders', { userPhone })}
      >
        <Text style={styles.viewOrdersText}>📦 View All My Orders</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f1f8e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  total: {
    fontSize: 16,
    marginTop: 8,
    color: '#555',
  },
  estimateBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  estimateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    color: '#444',
  },
  arrival: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  tracker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleActive: {
    backgroundColor: '#4CAF50',
  },
  circleInactive: {
    backgroundColor: '#ccc',
  },
  stepLabel: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  activeLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#999',
  },
  line: {
    position: 'absolute',
    height: 2,
    top: 14,
    left: '50%',
    right: '-50%',
    zIndex: 1,
  },
  lineActive: {
    backgroundColor: '#4CAF50',
  },
  lineInactive: {
    backgroundColor: '#ccc',
  },
  viewOrdersButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  viewOrdersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

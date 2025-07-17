import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckoutScreen({ route }) {
  const { item } = route.params;
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const navigation = useNavigation();

  const totalPrice = item.price * qty;

  const sendAdminNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 New Order Placed!',
        body: `Name: ${name}\nItem: ${item.name} x${qty}\nTotal: ₹${totalPrice}`,
        sound: 'default',
      },
      trigger: null,
    });
  };

  const placeOrder = async () => {
    if (!name || !phone || !address) {
      alert('Please fill all the details.');
      return;
    }

    // ✅ Sanitize item object (remove undefined imageUrl)
    const cleanItem = {
      name: item.name,
      price: item.price,
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
    };

    const orderData = {
      name,
      phone: phone.trim(),
      address,
      paymentMethod,
      item: cleanItem,
      qty,
      total: totalPrice,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      alert('Order placed successfully!');
      await AsyncStorage.setItem('userPhone', phone.trim());
      navigation.navigate('OrderStatus', { orderId: docRef.id });
      await sendAdminNotification(); // 🔔 Notify admin
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[styles.option, paymentMethod === 'COD' && styles.selectedOption]}
            onPress={() => setPaymentMethod('COD')}
          >
            <Text style={styles.optionText}>Cash on Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, paymentMethod === 'Online' && styles.selectedOption]}
            onPress={() => setPaymentMethod('Online')}
          >
            <Text style={styles.optionText}>Pay Online</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.subheading}>Order Summary</Text>
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
        <Text style={styles.itemName}>{item.name}</Text>
        <Text>Price: ₹{item.price}</Text>

        <View style={styles.qtyRow}>
          <Button title="−" onPress={() => qty > 1 && setQty(qty - 1)} />
          <Text style={styles.qty}>{qty}</Text>
          <Button title="+" onPress={() => qty < 10 && setQty(qty + 1)} />
        </View>

        <Text style={styles.total}>Total: ₹{totalPrice}</Text>
      </View>

      <Button title="Place Order" onPress={placeOrder} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
    color: '#4CAF50',
  },
  form: {
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  optionText: {
    color: '#333',
    fontWeight: '600',
  },
  summary: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  qty: {
    marginHorizontal: 20,
    fontSize: 18,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

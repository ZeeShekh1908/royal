import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, ScrollView,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function AddProductScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);

 const handleSubmit = async () => {
  if (!name.trim() || !price.trim() || !category.trim()) {
    Alert.alert('Missing fields', 'Please fill all fields.');
    return;
  }

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    Alert.alert('Invalid price', 'Please enter a valid number.');
    return;
  }

  try {
    setUploading(true);

    await addDoc(collection(db, 'menuItems'), {
      name: name.trim(),
      price: numericPrice,
      category: category.trim(),
      createdAt: serverTimestamp(),
    });

    Alert.alert('✅ Success', 'Product added!');
    navigation.goBack?.();
  } catch (error) {
    console.error('Upload Error:', error);
    Alert.alert('❌ Upload Failed', error.message || 'Something went wrong');
  } finally {
    setUploading(false);
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Product</Text>

      <TextInput
        placeholder="Product Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Price (₹)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <Button
        title={uploading ? 'Saving...' : 'Add Product'}
        onPress={handleSubmit}
        disabled={uploading}
        color="#4CAF50"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4CAF50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
});

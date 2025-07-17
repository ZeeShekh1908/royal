import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function EditProductScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName]        = useState(item.name);
  const [price, setPrice]      = useState(String(item.price));
  const [category, setCategory] = useState(item.category || 'Uncategorized');

  const handleSave = async () => {
    if (!name || !price || !category) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    try {
      await updateDoc(doc(db, 'menuItems', item.id), {
        name,
        price: parseFloat(price),
        category,
      });

      Alert.alert('✅ Success', 'Product updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('❌ Error', 'Failed to update product.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Product</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Picker
        selectedValue={category}
        style={styles.picker}
        onValueChange={(val) => setCategory(val)}
      >
        <Picker.Item label="Noodles" value="Noodles" />
        <Picker.Item label="Breads" value="Breads" />
        <Picker.Item label="Starters" value="Starters" />
        <Picker.Item label="Desserts" value="Desserts" />
        <Picker.Item label="Add New..." value="" />
      </Picker>

      {category === '' && (
        <TextInput
          style={styles.input}
          placeholder="Type new category"
          value={category}
          onChangeText={setCategory}
        />
      )}

      <Button title="Save Changes" onPress={handleSave} color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20,
    textAlign: 'center', color: '#4CAF50',
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    marginBottom: 15, paddingHorizontal: 10, height: 45, backgroundColor: '#f9f9f9',
  },
  picker: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    marginBottom: 15, height: 45, backgroundColor: '#f9f9f9',
  },
});

// AddProductScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function AddProductScreen({ navigation }) {
  const [name,      setName]      = useState('');
  const [price,     setPrice]     = useState('');
  const [imageUri,  setImageUri]  = useState(null);   // local preview
  const [base64Img, setBase64Img] = useState(null);   // base‑64 for upload
  const [category,  setCategory]  = useState('Noodles');

  /* Pick image and keep base‑64 */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera roll access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,              // 🔑 get base‑64
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setBase64Img(result.assets[0].base64);          // save base‑64 string
    }
  };

  /* Upload as base‑64 string (Expo Go‑safe) */
  const handleSubmit = async () => {
    if (!name || !price || !base64Img || !category) {
      Alert.alert('Missing fields', 'Please fill in all fields and pick an image.');
      return;
    }

    try {
      const filename = `img_${Date.now()}.jpg`;
      const imgRef   = ref(storage, `menuImages/${filename}`);

      // 🚀 Upload base‑64 data
      await uploadString(imgRef, base64Img, 'base64', { contentType: 'image/jpeg' });
      const imageUrl = await getDownloadURL(imgRef);

      // 🔥 Save Firestore document
      await addDoc(collection(db, 'menuItems'), {
        name,
        price: parseFloat(price),
        imageUrl,
        category,
      });

      Alert.alert('Success', 'Product added!');
      navigation.goBack();
    } catch (err) {
      console.error('Add product error:', err);
      Alert.alert('Upload failed', 'Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>

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
        onValueChange={setCategory}
      >
        <Picker.Item label="Noodles"   value="Noodles" />
        <Picker.Item label="Breads"    value="Breads" />
        <Picker.Item label="Starters"  value="Starters" />
        <Picker.Item label="Desserts"  value="Desserts" />
        <Picker.Item label="Add New…"  value="" />
      </Picker>

      {category === '' && (
        <TextInput
          style={styles.input}
          placeholder="Type new category"
          value={category}
          onChangeText={setCategory}
        />
      )}

      <Button title="Pick Image" onPress={pickImage} color="#2196F3" />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <Button title="Add Product" onPress={handleSubmit} color="#4CAF50" />
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
  picker: { marginBottom: 15, height: 50, width: '100%' },
  preview: { width: '100%', height: 180, marginVertical: 15, borderRadius: 8 },
});

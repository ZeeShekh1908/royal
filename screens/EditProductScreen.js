import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProductScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName]        = useState(item.name);
  const [price, setPrice]      = useState(String(item.price));
  const [imageUri, setImageUri] = useState(item.imageUrl || '');
  const [category, setCategory] = useState(item.category || 'Uncategorized');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera roll access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !imageUri || !category) {
      Alert.alert('Missing fields', 'Please fill in all fields and pick an image.');
      return;
    }

    try {
      let finalImageUrl = imageUri;

      // Upload new image if it's a local file (not already a Firebase URL)
      if (!imageUri.startsWith('http')) {
        const storage = getStorage();
        const filename = `${uuidv4()}.jpg`;
        const imgRef = ref(storage, `menuImages/${filename}`);

        const resp = await fetch(imageUri);
        const blob = await resp.blob();
        await uploadBytes(imgRef, blob);

        finalImageUrl = await getDownloadURL(imgRef);
      }

      await updateDoc(doc(db, 'menuItems', item.id), {
        name,
        price: parseFloat(price),
        imageUrl: finalImageUrl,
        category,
      });

      Alert.alert('Success', 'Product updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product.');
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

      <Button title="Pick New Image" onPress={pickImage} color="#2196F3" />
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
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
  preview: {
    width: '100%', height: 180, marginVertical: 15, borderRadius: 8,
  },
});

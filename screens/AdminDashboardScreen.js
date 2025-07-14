import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.js'; // your firebase config
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const storage = getStorage();

  const fetchMenuItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'menuItems'));
      const itemList = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        let imageUrl = data.imageUrl;

        if (imageUrl?.startsWith('gs://')) {
          const path = imageUrl.replace('gs://recipe-suggestion-app-dd270.appspot.com/', '');
          const imageRef = ref(storage, path);
          imageUrl = await getDownloadURL(imageRef);
        }

        itemList.push({ id: docSnap.id, ...data, imageUrl });
      }

      setItems(itemList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  useFocusEffect(
  React.useCallback(() => {
    fetchMenuItems();
  }, [])
);

  const handleDelete = async (id) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'menuItems', id));
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
          } catch (err) {
            console.error('Error deleting item:', err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>₹{item.price}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('EditProduct', {
              item,
              onUpdate: fetchMenuItems, // refresh on return
            })
          }
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <TouchableOpacity
  style={styles.addButton}
  onPress={() => navigation.navigate('AddProduct')}
>
  <Text style={styles.addButtonText}>+ Add New Product</Text>
</TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f9f9f9',
    marginVertical: 8,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, color: '#777', marginVertical: 4 },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

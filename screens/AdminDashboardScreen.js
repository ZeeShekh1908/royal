import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Image, ActivityIndicator, TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  collection, getDocs, deleteDoc, doc, onSnapshot, addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastOrderId, setLastOrderId] = useState(null);
  const storage = getStorage();

  // 🔔 Register for push notifications
  useEffect(() => {
    const register = async () => {
      if (!Device.isDevice) {
        alert('Must use physical device for push notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push notification permission');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      if (token) {
        try {
          await addDoc(collection(db, 'adminTokens'), {
            token,
            createdAt: new Date(),
          });
        } catch (err) {
          console.error('Saving token failed:', err);
        }
      }
    };

    register();
  }, []);

  // 🔁 Listen for new orders and play bell
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), async (snapshot) => {
      const added = snapshot.docChanges().filter(change => change.type === 'added');

      if (added.length > 0) {
        const latest = added[0].doc;
        if (!lastOrderId || latest.id !== lastOrderId) {
          await playBell();
          setLastOrderId(latest.id);
        }
      }
    });

    return () => unsubscribe();
  }, [lastOrderId]);

  // 🔊 Bell Sound
  const playBell = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/telephone-ring.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Bell play failed:', err);
    }
  };

  // 📦 Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'menuItems'));
      const list = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        let imageUrl = data.imageUrl;

        if (imageUrl?.startsWith('gs://')) {
          const path = imageUrl.replace('gs://recipe-suggestion-app-dd270.appspot.com/', '');
          const imageRef = ref(storage, path);
          imageUrl = await getDownloadURL(imageRef);
        }

        list.push({ id: docSnap.id, ...data, imageUrl });
      }

      setItems(list);
      setLoading(false);
    } catch (err) {
      console.error('Menu fetch failed:', err);
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMenuItems();
    }, [])
  );

  const handleDelete = async (id, imageUrl) => {
    Alert.alert('Confirm Delete', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'menuItems', id));
            if (imageUrl) {
              const path = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
              const imageRef = ref(storage, path);
              await deleteObject(imageRef);
            }
            fetchMenuItems();
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>₹{item.price}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('EditProduct', {
              item,
              onUpdate: fetchMenuItems,
            })
          }
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.imageUrl)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
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

      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.noResultsText}>No products found.</Text>
        }
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
  searchInput: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#f9f9f9',
    flexBasis: '48%',
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
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    color: '#777',
    marginVertical: 4,
  },
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
  noResultsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

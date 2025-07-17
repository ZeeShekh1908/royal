import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, TextInput
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons'; // For icons

export default function MenuScreen({ route, navigation }) {
  const storage = getStorage();
  const userPhone = route.params?.userPhone;
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

 useEffect(() => {
  const fetchMenu = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'menuItems'));

      const items = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let imageUrl = data.imageUrl;

          if (imageUrl && imageUrl.startsWith('gs://')) {
            try {
              const path = imageUrl.replace('gs://recipe-suggestion-app-dd270.appspot.com/', '');
              const imageRef = ref(storage, path);
              imageUrl = await getDownloadURL(imageRef);
            } catch (err) {
              console.warn('Failed to fetch image:', err.message);
              imageUrl = null; // fallback to null if image load fails
            }
          }

          return { id: docSnap.id, ...data, imageUrl };
        })
      );

      setMenuItems(items);
      setFilteredItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setLoading(false);
    }
  };

  fetchMenu();
}, []);
  

  useEffect(() => {
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchText, menuItems]);

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    acc[category] = acc[category] || [];
    acc[category].push(item);
    return acc;
  }, {});

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>₹{item.price}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Checkout', { item })}
      >
        <Text style={styles.buttonText}>Order now</Text>
      </TouchableOpacity>
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
    <SafeAreaView style={styles.container}>
      {/* Header Row */}
      <View style={styles.topBar}>
        <Text style={styles.header}>Royal Veg Corner</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyOrders', { userPhone })}
        >
          <Ionicons name="receipt-outline" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search for dishes..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Object.keys(groupedItems).map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <FlatList
              data={groupedItems[category]}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContainer}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(240, 226, 215, 1)' },
  scrollContainer: { paddingBottom: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    marginTop:30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
  },
  header: {
    
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },

  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  categorySection: { marginBottom: 25 },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginVertical: 10,
    color: '#444',
  },

  gridContainer: {
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    alignItems: 'center',
    padding: 12,
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  image: {
    width: 110,
    height: 110,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
  },
  price: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 25,
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

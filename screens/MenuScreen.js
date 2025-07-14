import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js'; // your firebase file
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
export default function MenuScreen({ route,navigation }) {
  const storage = getStorage(); // This uses the default initialized Firebase app
 
  const userPhone = route.params?.userPhone;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'menuItems'));
    const items = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      let imageUrl = data.imageUrl;

      // If imageUrl is a gs:// path, convert it
      if (imageUrl.startsWith('gs://')) {
        const path = imageUrl.replace('gs://recipe-suggestion-app-dd270.appspot.com/', '');
        const imageRef = ref(storage, path);
        imageUrl = await getDownloadURL(imageRef);
      }

      items.push({ id: doc.id, ...data, imageUrl });
    }

    setMenuItems(items);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching menu:', error);
    setLoading(false);
  }
};

    fetchMenu();
  }, []);

  const groupedItems = menuItems.reduce((acc, item) => {
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
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Royal Veg Corner Menu</Text>
        {/* <TouchableOpacity
        style={styles.myOrdersButton}
        onPress={() => navigation.navigate('MyOrders', { userPhone})}

      >
        <Text style={styles.myOrdersText}>📦 View My Orders</Text>
      </TouchableOpacity> */}
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
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { paddingBottom: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 30,
    textAlign: 'center',
    color: '#4CAF50',
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  categorySection: { marginBottom: 30 },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
    color: '#333',
  },
  gridContainer: {
  paddingHorizontal: 10,
  justifyContent: 'space-between',
},

 card: {
  flex: 1,
  margin: 5,
  backgroundColor: '#f9f9f9',
  borderRadius: 12,
  overflow: 'hidden',
  elevation: 3,
  alignItems: 'center',
  padding: 10,
  maxWidth: '48%',
},

  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    color: '#777',
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

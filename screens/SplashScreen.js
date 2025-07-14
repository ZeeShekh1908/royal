import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function SplashScreen({ navigation }) {
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tapCount < 5) {
        navigation.replace('Menu');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [tapCount]);

  const handleLogoTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;
      if (newCount === 3) {
        navigation.replace('AdminLogin'); // Navigate to admin login
      }
      return newCount;
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLogoTap}>
        <Image
          source={require('../assets/menu/logo.png')}
          style={styles.logo}
        />
      </TouchableOpacity>
      <Text style={styles.title}>Welcome to Royal Veg Corner</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

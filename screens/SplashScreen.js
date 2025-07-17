import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function SplashScreen({ navigation }) {
  const [tapCount, setTapCount] = useState(0);
  const mountedRef = useRef(false); // ✅ useRef instead of useState

  useEffect(() => {
    mountedRef.current = true;

    const timer = setTimeout(() => {
      // ✅ Use ref instead of state
      if (tapCount < 5 && mountedRef.current) {
        navigation.replace('Menu');
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
    };
  }, [tapCount]);

  const handleLogoTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;

      if (newCount === 3) {
        setTimeout(() => {
          navigation.replace('AdminLogin');
        }, 100);
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

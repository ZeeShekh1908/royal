import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Splash from './screens/SplashScreen';
import Menu from './screens/MenuScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AddProductScreen from './screens/AddProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AdminScreen from './screens/AdminScreen';
import UserOrderStatusScreen from './screens/UserOrderStatusScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to send notifications not granted!');
    return;
  }
}
registerForPushNotificationsAsync();

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Prevent auto-hide
    SplashScreen.preventAutoHideAsync();

    // Hide it after 100ms (before showing custom splash)
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Menu" component={Menu} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderStatus" component={UserOrderStatusScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
<Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
 <Stack.Screen name="Admin" component={AdminScreen} />
<Stack.Screen name="AddProduct" component={AddProductScreen} />
<Stack.Screen name="EditProduct" component={EditProductScreen} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}

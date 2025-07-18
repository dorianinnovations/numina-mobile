import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type RootStackParamList = {
  Home: undefined;
  Details: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const HomeScreen = ({ navigation }: any) => (
  <View style={styles.screen}>
    <Text style={styles.title}>Home Screen</Text>
    <TouchableOpacity 
      style={styles.button}
      onPress={() => {
        console.log('NAVIGATING TO DETAILS');
        navigation.navigate('Details');
      }}
    >
      <Text style={styles.buttonText}>Go to Details</Text>
    </TouchableOpacity>
  </View>
);

const DetailsScreen = ({ navigation }: any) => (
  <View style={styles.screen}>
    <Text style={styles.title}>Details Screen</Text>
    <TouchableOpacity 
      style={styles.button}
      onPress={() => {
        console.log('BACK BUTTON PRESSED');
        navigation.goBack();
      }}
    >
      <Text style={styles.buttonText}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

export const SimpleNavigationTest = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        onStateChange={(state) => {
          console.log('NAV STATE:', state?.routes?.map(r => r.name));
        }}
      >
        <Stack.Navigator
          screenOptions={{
            ...TransitionPresets.SlideFromRightIOS,
            gestureEnabled: true,
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SimpleNavigationTest;
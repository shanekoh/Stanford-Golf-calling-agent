import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import DashboardScreen from '../screens/DashboardScreen';
import CreateCallScreen from '../screens/CreateCallScreen';
import CallDetailScreen from '../screens/CallDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {backgroundColor: '#8C1515'},
          headerTintColor: '#fff',
          headerTitleStyle: {fontWeight: 'bold'},
        }}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{title: 'Stanford Golf Agents'}}
        />
        <Stack.Screen
          name="CreateCall"
          component={CreateCallScreen}
          options={{title: 'New Call'}}
        />
        <Stack.Screen
          name="CallDetail"
          component={CallDetailScreen}
          options={{title: 'Call Details'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

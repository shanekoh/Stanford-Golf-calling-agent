import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider, MD3LightTheme} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DashboardScreen from './src/screens/DashboardScreen';
import CreateCallScreen from './src/screens/CreateCallScreen';
import CallDetailScreen from './src/screens/CallDetailScreen';
import {RootStackParamList} from './src/types';
import {setupNotificationHandlers} from './src/services/scheduler';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#8C1515',
    secondary: '#C62828',
    surface: '#FFFFFF',
    background: '#F5F5F5',
  },
};

function App() {
  useEffect(() => {
    setupNotificationHandlers();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="light-content" backgroundColor="#8C1515" />
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
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;

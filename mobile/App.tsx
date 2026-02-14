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
    primary: '#1B5E20',
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
        <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
              headerStyle: {backgroundColor: '#1B5E20'},
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

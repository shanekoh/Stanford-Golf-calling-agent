/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import {backgroundEventHandler} from './src/services/scheduler';

// Register background notification handler (must be top-level)
notifee.onBackgroundEvent(backgroundEventHandler);

AppRegistry.registerComponent(appName, () => App);

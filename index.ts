import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);


// import { registerRootComponent } from 'expo';

// import { AppRegistry } from 'react-native';

// import App from './App';

// import { name as appName } from './app.json';

// import { setupBackgroundHandler } from './utils/notification'; // adjust path if needed
 
// // 🔔 Setup FCM background handler globally

// setupBackgroundHandler();
 
// // Register for Expo and bare RN compatibility

// registerRootComponent(App);

// AppRegistry.registerComponent(appName, () => App);

 
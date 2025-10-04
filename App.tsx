import 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider,SafeAreaView } from 'react-native-safe-area-context';
import Routes from './app/Navigations/Routes';

const App = () =>{

	const [loaded] = useFonts({
      PoppinsRegular : require('./app/assets/fonts/Poppins-Regular.ttf'),
      PoppinsSemiBold: require('./app/assets/fonts/Poppins-SemiBold.ttf'),
      PoppinsBold : require('./app/assets/fonts/Poppins-Bold.ttf'),
      PoppinsMedium : require('./app/assets/fonts/Poppins-Medium.ttf'),
	});  

	if(!loaded){
		  return null;
	}
  
	return (
      <SafeAreaProvider>
          <SafeAreaView
              style={{
                  flex: 1
                }}
          >
                  <StatusBar style="dark" />
                  <Routes/>
          </SafeAreaView>
      </SafeAreaProvider>
	);
};

export default App;


// import React, { useEffect } from 'react';
// import { View, Text } from 'react-native';
// import {
//   requestUserPermission,
//   getFcmToken,
//   registerTokenToServer,
//   handleForegroundNotifications,
// } from './utils/notification';
// import AsyncStorage from '@react-native-async-storage/async-storage';
 
// const App: React.FC = () => {
//   useEffect(() => {
//     const setupNotifications = async () => {
//       const hasPermission = await requestUserPermission();
//       if (!hasPermission) return;
 
//    const userToken = await AsyncStorage.getItem('userToken');
//       const token = await getFcmToken();

//       if (token) {
//         const jwtToken = ' userToken '; // replace with real auth token
//         await registerTokenToServer(token, jwtToken);
//       }
 
//       handleForegroundNotifications();
//     };
 
//     setupNotifications();
//   }, []);
 
//   return (
// <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
// <Text>React Native FCM Notifications Setup ✅</Text>
// </View>
//   );
// };
 
// export default App;
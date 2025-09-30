import messaging, {

  FirebaseMessagingTypes,

} from '@react-native-firebase/messaging';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Alert } from 'react-native';
 
/**

* Ask notification permission from the user

*/

export async function requestUserPermission(): Promise<boolean> {

  const authStatus = await messaging().requestPermission();

  const enabled =

    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||

    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
 
  return enabled;

}
 
/**

* Get FCM token and persist in AsyncStorage

*/

export async function getFcmToken(): Promise<string | null> {

  try {

    let fcmToken = await AsyncStorage.getItem('fcmToken');

    if (!fcmToken) {

      fcmToken = await messaging().getToken();

      if (fcmToken) {

        await AsyncStorage.setItem('fcmToken', fcmToken);

      }

    }

    return fcmToken;

  } catch (err) {

    console.error('Error getting FCM token', err);

    return null;

  }

}
 
/**

* Send token to your backend

*/

export async function registerTokenToServer(

  token: string,

  jwtToken: string,

): Promise<void> {

  try {

    await fetch('https://your-backend.com/api/devices/register', {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${jwtToken}`,

      },

      body: JSON.stringify({ token, platform: 'react-native' }),

    });

  } catch (err) {

    console.error('Register token error', err);

  }

}
 
/**

* Switch account mode (user ↔ creator) and update topic subscriptions

*/

export async function switchAccountMode({

  token,

  userId,

  mode,

  jwtToken,

}: {

  token: string;

  userId: string;

  mode: 'user' | 'creator';

  jwtToken: string;

}): Promise<void> {

  const subscribeTo =

    mode === 'user'

      ? ['allUsers', `user_${userId}`]

      : ['allCreators', `creator_${userId}`];
 
  const unsubscribeFrom =

    mode === 'user'

      ? ['allCreators', `creator_${userId}`]

      : ['allUsers', `user_${userId}`];
 
  try {

    await fetch('https://your-backend.com/api/devices/subscribe', {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${jwtToken}`,

      },

      body: JSON.stringify({ token, subscribeTo, unsubscribeFrom }),

    });

  } catch (err) {

    console.error('Switch mode error', err);

  }

}
 
/**

* Foreground message handler (in-app notifications)

*/

export function handleForegroundNotifications(

  onMessageCallback?: (msg: FirebaseMessagingTypes.RemoteMessage) => void,

): void {

  messaging().onMessage(async remoteMessage => {

    if (onMessageCallback) {

      onMessageCallback(remoteMessage);

    } else {

      Alert.alert(

        remoteMessage.notification?.title ?? 'New Notification',

        remoteMessage.notification?.body ?? '',

      );

    }

  });

}
 
/**

* Background/quit-state message handler

* Place this in index.tsx (outside component lifecycle)

*/

export function setupBackgroundHandler(): void {

  messaging().setBackgroundMessageHandler(

    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {

      console.log('Message handled in the background!', remoteMessage);

    },

  );

}

 
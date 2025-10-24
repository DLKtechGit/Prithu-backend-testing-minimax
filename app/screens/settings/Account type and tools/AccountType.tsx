import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Header from '../../../layout/Header';
import { GlobalStyleSheet } from '../../../constants/styleSheet';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const API_BASE_URL = 'http://192.168.1.10:5000/api/account';

// 🔹 Type definitions
interface AccountStatusResponse {
  roles: string[];
  activeAccountType: 'Creator' | 'Personal' | null;
  hasAccounts: boolean;
}

interface SwitchResponse {
  token: string;
  sessionId: string;
}

interface AccountOption {
  id: string;
  text: string;
  action: 'switch' | 'create';
  role: 'Creator' | 'Personal';
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const AccountType: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [options, setOptions] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch account status when component mounts
  useEffect(() => {
    fetchAccountStatus();
  }, []);

  const fetchAccountStatus = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
        console.log(userToken)
      const response = await axios.post<AccountStatusResponse>(
        `${API_BASE_URL}/status`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const { activeAccountType, hasAccounts } = response.data;

      // Store active account type in AsyncStorage
      if (activeAccountType) {
        await AsyncStorage.setItem('activeAccountType', activeAccountType);
      } else {
        await AsyncStorage.removeItem('activeAccountType');
      }

      const newOptions: AccountOption[] = [];

      if (activeAccountType === 'Creator') {
        newOptions.push({
          id: 'switch-user',
          text: 'Switch to User Account',
          action: 'switch',
          role: 'Personal',
        });
      }

      if (hasAccounts && !activeAccountType) {
        newOptions.push({
          id: 'switch-creator',
          text: 'Switch to Creator Account',
          action: 'switch',
          role: 'Creator',
        });
      }

      if (!hasAccounts) {
        newOptions.push({
          id: 'create-creator',
          text: 'Create Creator Account',
          action: 'create',
          role: 'Creator',
        });
      }

      setOptions(newOptions);
    } catch (err: any) {
      console.error('Error fetching account status:', err.message);
      if (err.response?.status === 404) {
        setOptions([
          {
            id: 'create-creator',
            text: 'Create Creator Account',
            action: 'create',
            role: 'Creator',
          },
        ]);
      } else {
        setError('Failed to fetch account status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionPress = async (option: AccountOption): Promise<void> => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const sessionId = await AsyncStorage.getItem('sessionId');
      const deviceId = await AsyncStorage.getItem('deviceId');

      if (!userToken) {
        setError('No user token found');
        return;
      }

      if (option.action === 'create') {
        navigation.navigate('CreatorAccount');
        return;
      }

      // 🔹 Switching between accounts
      setLoading(true);
      setError(null);

      const switchUrl =
        option.role === 'Personal'
          ? `${API_BASE_URL}/switch/user`
          : `${API_BASE_URL}/switch/creator`;

      const response = await axios.post<SwitchResponse>(
        switchUrl,
        {
          refreshToken,
          sessionId,
          deviceId,
          deviceType: 'mobile',
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      if (response.status === 200) {
        const { token, sessionId: newSessionId } = response.data;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('sessionId', newSessionId);
        await AsyncStorage.setItem('activeAccountType', option.role);

        navigation.navigate('DrawerNavigation', { screen: 'Home' });
      }
    } catch (err: any) {
      console.error('Error switching account:', err.message);
      setError(err.response?.data?.message || 'Failed to switch account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Render UI
  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color={colors.title} />;

    if (error)
      return (
        <Text style={[styles.errorText, { color: colors.danger || 'red' }]}>
          {error}
        </Text>
      );

    if (options.length === 0)
      return (
        <Text style={[styles.infoText, { color: colors.title }]}>
          No account options available
        </Text>
      );

    return options.map((option) => (
      <TouchableOpacity
        key={option.id}
        style={[styles.optionItem, { borderBottomColor: colors.border }]}
        onPress={() => handleOptionPress(option)}
      >
        <Text style={[styles.optionText, { color: colors.title }]}>{option.text}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <Header title="Account Type" />
      <View style={[GlobalStyleSheet.container, { marginTop: 10 }]}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

export default AccountType;

// 🔹 Styles
const styles = StyleSheet.create({
  optionItem: {
    height: 50,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import Header from '../../../layout/Header';
import { GlobalStyleSheet } from '../../../constants/styleSheet';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AccountType = ({ navigation }) => {
    const theme = useTheme();
    const { colors } = theme;

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAccountStatus = async () => {
            try {
                // Retrieve user token from AsyncStorage
                const userToken = await AsyncStorage.getItem('userToken');
                if (!userToken) {
                    throw new Error('No user token found');
                }

                // Make API call to fetch account status
                const response = await axios.post(
                    'http://192.168.1.77:5000/api/account/status',
                    {}, // Empty body, assuming userId is derived from token in middleware
                    {
                        headers: {
                            Authorization: `Bearer ${userToken}`,
                        },
                    }
                );

                const { roles, activeAccountType, hasAccounts } = response.data;

                // Store activeAccountType in AsyncStorage
                if (activeAccountType) {
                    await AsyncStorage.setItem('activeAccountType', activeAccountType);
                } else {
                    await AsyncStorage.removeItem('activeAccountType');
                }

                // Initialize options array
                const newOptions = [];

                // If activeAccountType is Creator, add "Switch to User Account"
                if (activeAccountType === 'Creator') {
                    newOptions.push({
                        id: 'switch-user',
                        text: 'Switch to User Account',
                        action: 'switch',
                        role: 'Personal',
                    });
                }

                // If hasAccounts is true, add "Switch to Creator Account" (if not already active)
                if (hasAccounts && activeAccountType === null) {
                    newOptions.push({
                        id: 'switch-creator',
                        text: 'Switch to Creator Account',
                        action: 'switch',
                        role: 'Creator',
                    });
                }

                // If hasAccounts is false, add "Create Creator Account"
                if (!hasAccounts) {
                    newOptions.push({
                        id: 'create-creator',
                        text: 'Create Creator Account',
                        action: 'create',
                        role: 'Creator',
                    });
                }

                setOptions(newOptions);
            } catch (err) {
                console.error('Error fetching account status:', err.message);
                if (err.response?.status === 404) {
                    // No accounts found, show "Create Creator Account"
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

        fetchAccountStatus();
    }, []);

    const handleOptionPress = async (option) => {
        try {
            // Retrieve user token from AsyncStorage
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                setError('No user token found');
                return;
            }

            if (option.action === 'create') {
                navigation.navigate('CreatorAccount');
            } else if (option.action === 'switch') {
                setLoading(true);
                setError(null);

                if (option.role === 'Personal') {
                    // API call to switch to User account
                    const response = await axios.post(
                        'http://192.168.1.77:5000/api/account/switch/user',
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${userToken}`,
                            },
                        }
                    );

                    if (response.status === 200) {
                        // Update token in AsyncStorage
                        await AsyncStorage.setItem('userToken', response.data.token);
                        await AsyncStorage.setItem('activeAccountType', 'Personal');
                        // Navigate to DrawerNavigation Home screen
                        navigation.navigate('DrawerNavigation', { screen: 'Home' });
                    }
                } else if (option.role === 'Creator') {
                    // API call to switch to Creator account
                    const response = await axios.post(
                        'http://192.168.1.77:5000/api/account/switch/creator',
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${userToken}`,
                            },
                        }
                    );

                    if (response.status === 200) {
                        // Update token in AsyncStorage
                        await AsyncStorage.setItem('userToken', response.data.token);
                        await AsyncStorage.setItem('activeAccountType', 'Creator');
                        // Navigate to DrawerNavigation Home screen
                        navigation.navigate('DrawerNavigation', { screen: 'Home' });
                    }
                }
            }
        } catch (err) {
            console.error('Error switching account:', err.message);
            setError(
                err.response?.data?.message || 'Failed to switch account. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
            <Header title="Account Type" />
            <View style={[GlobalStyleSheet.container, { marginTop: 10 }]}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.title} />
                ) : error ? (
                    <Text style={{ fontSize: 16, color: colors.danger || 'red', textAlign: 'center' }}>
                        {error}
                    </Text>
                ) : options.length === 0 ? (
                    <Text style={{ fontSize: 16, color: colors.title, textAlign: 'center' }}>
                        No account options available
                    </Text>
                ) : (
                    options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={{
                                height: 50,
                                justifyContent: 'center',
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                            }}
                            onPress={() => handleOptionPress(option)}
                        >
                            <Text style={{ fontSize: 16, color: colors.title }}>
                                {option.text}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </SafeAreaView>
    );
};

export default AccountType;
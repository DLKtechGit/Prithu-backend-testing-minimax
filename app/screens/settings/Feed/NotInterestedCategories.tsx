import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../../apiInterpretor/apiInterceptor';
import { useTheme } from '@react-navigation/native';
import Header from '../../../layout/Header';
import { GlobalStyleSheet } from '../../../constants/styleSheet';

const NotInterestedCategories = () => {
  const theme = useTheme();
  const { colors } = theme;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotInterestedCategories = async () => {
      try {
        // Retrieve token from AsyncStorage
        const token = await AsyncStorage.getItem('userToken');
        console.log('Token:', token);
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        // Make API request
        const response = await api.get('/api/user/notintrested/category');

        console.log('API Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
          setCategories(response.data.data.nonInterestedCategories || []);
        } else {
          throw new Error(response.data.message || 'API request failed');
        }
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('No categories found for your account. Try selecting some categories as not interested.');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch categories. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchNotInterestedCategories();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#020202ff" />
        <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '500', color: colors.title, textAlign: 'center' }}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '500', color: colors.title, textAlign: 'center', paddingHorizontal: 24, lineHeight: 28 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <Header title="Non-Interested Categories" />
      <View style={[GlobalStyleSheet.container, { marginTop: 10 , }]}>
        {categories.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.text, textAlign: 'center', paddingHorizontal: 24, lineHeight: 26 }}>
              You haven’t marked any categories as not interested.
            </Text>
          </View>
        ) : (
          categories.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={{
                height: 50,
                justifyContent: 'center',
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                // width: 400,
              }}
              onPress={() => console.log(`Pressed category: ${item.name}`)} // Optional: Add press handling
            >
              <Text style={{ fontSize: 16, color: colors.title, marginLeft: 17, }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotInterestedCategories;
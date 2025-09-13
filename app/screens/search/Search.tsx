import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IMAGES, SIZES, FONTS, COLORS } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import ProfilePostData from '../profile/ProfilePostData';
import Sharebtn from '../../components/button/Sharebtn';
import Followbtn from '../../components/button/Followbtn';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Search = ({ navigation } : any) => {
  const theme = useTheme();
  const { colors } : {colors : any} = theme;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('No token found in storage');
        return;
      }
      const res = await axios.get('http://192.168.1.77:5000/api/get/all/feeds/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const feeds = res.data.feeds || [];
      const imageFeeds = feeds
  .filter((item: any) => item.type === 'image')
  .map((item: any) => ({
    id: item._id,
    image: { uri: item.contentUrl }, // ✅ wrap here
    like: item.likesCount || 0
  }));

setPosts(imageFeeds);

    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <SafeAreaView style={[GlobalStyleSheet.container, { padding:0, backgroundColor: colors.card, flex: 1 }]}>
      <View style={GlobalStyleSheet.container}>
        <View style={{ marginVertical: 20, marginBottom: 10 }}>
          <TouchableOpacity
            style={{ zIndex: 1, position: 'absolute', top: 13, left: 15 }}
          >
            <Image
              style={{ tintColor: colors.text, width: 20, height: 20, resizeMode: 'contain' }}
              source={IMAGES.search}
            />
          </TouchableOpacity>
          <TextInput
            placeholder='Search chat here...'
            placeholderTextColor={colors.placeholder}
            style={[GlobalStyleSheet.inputBox, { backgroundColor: colors.input }]}
          />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Public Posts */}
          <View style={[GlobalStyleSheet.container, { padding:0, width: SIZES.width > SIZES.container ? SIZES.container : SIZES.width }]}>
            <Text style={[GlobalStyleSheet.textfont, { color: colors.title, fontSize: 14, paddingLeft: 15, marginBottom: 5 }]}>
              Public Posts
            </Text>
            {loading ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.title }}>Loading posts...</Text>
            ) : (
              <ProfilePostData navigation={navigation} ProfilepicData={posts} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Search;

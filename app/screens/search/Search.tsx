import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IMAGES, SIZES } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import ProfilePostData from '../profile/ProfilePostData';
import api from '../../../apiInterpretor/apiInterceptor';
import { configHelpers } from '../../../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Search = ({ navigation }: any) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const mountedRef = useRef(true);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Converts a backend path into a usable full URL using environment config
  const buildUrl = (path: string | undefined | null) => {
    if (!path) return null;
    // Replace backslashes and prepend base from environment config
    return configHelpers.getAPIEndpoint(path.replace(/\\/g, '/'));
  };

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch all posts initially or on refresh
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/get/all/feeds/user');

      const feeds = res.data.feeds || [];
      const imageFeeds = feeds
        .filter((item: any) => item.type === 'image')
        .map((item: any) => ({
          id: item._id,
          image: { uri: item.contentUrl },
          like: item.likesCount || 0,
        }));
      // Shuffle the posts before setting state
      setPosts(shuffleArray(imageFeeds));

      // Clear search and categories when refresh
      setQuery('');
      setCategories([]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search categories
  const searchCategories = async (text: string) => {
    setQuery(text);
    if (!text || text.trim() === '') {
      setCategories([]);
      return;
    }
    try {
      setCatLoading(true);
      const res = await api.post('/api/search/all/category', { query: text });
      setCategories(res.data.categories || []);
    } catch (err) {
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  // Fetch posts for a category
  const fetchCategoryPosts = async (categoryId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/user/get/feed/with/search/cat/${categoryId}`);
    console.log("categry",res.data.feeds)
     const feeds = res.data?.feeds || [];
      const imageFeeds = feeds
        .filter((item: any) => item.type === 'image')
        .map((item: any) => ({
          id: item._id,
          image: { uri: item.contentUrl },
          like: item.likesCount || 0,
        }));
      setPosts(imageFeeds);

      // Hide category list
      setCategories([]);
      setQuery('');
    } catch (err) {
      console.error('Error fetching category posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <SafeAreaView
      style={[
        GlobalStyleSheet.container,
        { padding: 0, backgroundColor: colors.card, flex: 1 },
      ]}
    >
      <View style={GlobalStyleSheet.container}>
        <View style={{ marginVertical: 20, marginBottom: 10 }}>
          <TouchableOpacity
            style={{ zIndex: 1, position: 'absolute', top: 13, left: 15 }}
          >
            <Image
              style={{
                tintColor: colors.text,
                width: 20,
                height: 20,
                resizeMode: 'contain',
              }}
              source={IMAGES.search}
            />
          </TouchableOpacity>
          <TextInput
            value={query}
            onChangeText={searchCategories}
            placeholder="Search category here..."
            placeholderTextColor={colors.placeholder}
            style={[
              GlobalStyleSheet.inputBox,
              { backgroundColor: colors.input, paddingLeft: 45 },
            ]}
          />
        </View>
        {/* Categories List */}
        {query.length > 0 && (
          <View style={{ marginHorizontal: 15 }}>
            {catLoading ? (
              <Text style={{ color: colors.title }}>Searching...</Text>
            ) : categories.length > 0 ? (
              <FlatList
                data={categories}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => fetchCategoryPosts(item._id)}
                    style={{
                      paddingVertical: 10,
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    }}
                  >
                    <Text style={{ color: colors.title }}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{ color: colors.title }}>No categories found</Text>
            )}
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPosts();
              }}
              colors={[colors.primary || colors.title]}
            />
          }
        >
          <View
            style={[
              GlobalStyleSheet.container,
              {
                padding: 0,
                width:
                  SIZES.width > SIZES.container ? SIZES.container : SIZES.width,
              },
            ]}
          >
            <Text
              style={[
                GlobalStyleSheet.textfont,
                {
                  color: colors.title,
                  fontSize: 14,
                  paddingLeft: 15,
                  marginBottom: 5,
                },
              ]}
            >
              Public Posts
            </Text>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary || colors.title}
                style={{ marginTop: 20 }}
              />
            ) : (
              <ProfilePostData navigation={navigation} ProfilepicData={posts} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Search;
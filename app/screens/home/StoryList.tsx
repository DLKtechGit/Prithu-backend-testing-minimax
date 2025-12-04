import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES } from '../../constants/theme';
import api from '../../../apiInterpretor/apiInterceptor';
import { RootStackParamList } from '../../Navigations/RootStackParamList';

interface StoryItemProps {
  title: string;
  image: any;
  isAddStory: boolean;
  isVideo?: boolean;
  onPress: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ title, image, isAddStory, isVideo, onPress }) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  return (
    <TouchableOpacity
      style={{ marginRight: 12, alignItems: 'center', paddingVertical: 8 }}
      onPress={onPress}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <LinearGradient
          colors={["#FFD700", "#32CD32"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 80, // Outer size as requested
            height: 80,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 3,
          }}
        >
          <Image
            style={{
              width: isAddStory ? 74 : 72, // Inner size as requested
              height: isAddStory ? 74 : 72,
              borderRadius: 50,
              backgroundColor: colors.card,
              borderWidth: isAddStory ? 2 : 0,
              borderColor: colors.card,
            }}
            source={image}
            resizeMode="cover"
          />
          {isAddStory && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#32CD32',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: colors.card,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>+</Text>
            </View>
          )}
          {/* Video indicator overlay */}
          {!isAddStory && isVideo && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, marginLeft: 2 }}>▶</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>

      <View style={{ marginTop: 6, maxWidth: 85 }}>
        <Text
          style={{
            fontSize: 12,
            color: colors.title,
            textAlign: 'center',
            fontWeight: isAddStory ? '600' : '400',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const StoryList: React.FC = () => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [profileUrl, setProfileUrl] = useState<any>(IMAGES.profile);
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [trendingFeeds, setTrendingFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch profile avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/get/profile/detail');

        let avatarUrl = IMAGES.profile;
        if (response.data?.profile?.profileAvatar && response.data.profile.profileAvatar !== 'Unknown') {
          avatarUrl = {
            uri: response.data.profile.profileAvatar,
          };
        }

        setProfileUrl(avatarUrl);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  // Fetch active account type
  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('activeAccountType');
        if (storedType) {
          setActiveAccountType(storedType);
        }
      } catch (error) {
        console.log('Error fetching account type:', error);
      }
    };
    fetchAccountType();
  }, []);

  // Fetch trending feeds
  useEffect(() => {
    const fetchTrendingFeeds = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/get/trending/feed');
        console.log('Trending feeds response:', response.data.data);

        if (response.data?.data && Array.isArray(response.data.data)) {
          setTrendingFeeds(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching trending feeds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingFeeds();
  }, []);

  // Convert trending feeds to story format
  const getStoryData = () => {
    // Add "Add story" item first
    const storyData: any[] = [
      {
        id: '1',
        title: 'Add Post',
        image: profileUrl,
        isAddStory: true,
        isVideo: false,
        feedData: null,
      },
    ];

    // Add trending feeds as stories
    trendingFeeds.forEach((feed, index) => {
      const userName = feed.createdByProfile?.userName || 'User';
      const profileAvatar = feed.createdByProfile?.profileAvatar;
      const isVideo = feed.type === 'video';

      // For videos, use profile avatar as thumbnail (Image can't render video URLs)
      // For images, use contentUrl
      let storyImage = IMAGES.profile;
      if (isVideo && profileAvatar) {
        storyImage = { uri: profileAvatar };
      } else if (!isVideo && feed.contentUrl) {
        storyImage = { uri: feed.contentUrl };
      } else if (profileAvatar) {
        storyImage = { uri: profileAvatar };
      }

      storyData.push({
        id: `feed-${feed._id || index}`,
        title: userName.length > 10 ? userName.substring(0, 10) + '...' : userName,
        image: storyImage,
        isAddStory: false,
        isVideo: isVideo,
        feedData: feed,
      });
    });

    return storyData;
  };

  const handleStoryPress = (item: any) => {
    if (item.isAddStory) {
      navigation.navigate('AddStory');
    } else if (item.feedData) {
      // Construct full list of stories for navigation
      const allStories = StoryData
        .filter(story => !story.isAddStory && story.feedData)
        .map(story => {
          const feed = story.feedData!;
          return {
            contentUrl: feed.contentUrl,
            type: feed.type,
            userName: feed.createdByProfile?.userName || 'User',
            profileAvatar: feed.createdByProfile?.profileAvatar,
            userId: feed.createdByProfile?.userId, // User ID for navigation
            _id: feed._id,
            caption: feed.caption,
            totalLikes: feed.totalLikes,
            totalShares: feed.totalShares,
            totalViews: feed.totalViews,
            totalDownloads: feed.totalDownloads,
          };
        });

      // Find index of clicked item
      const initialIndex = allStories.findIndex(s => s._id === item.feedData._id);

      navigation.navigate('status', {
        statusData: allStories,
        initialIndex: initialIndex !== -1 ? initialIndex : 0,
        // Fallback params (will be overridden by dynamic logic in Status.tsx)
        name: item.feedData.createdByProfile?.userName || 'User',
        image: item.feedData.createdByProfile?.profileAvatar
          ? { uri: item.feedData.createdByProfile.profileAvatar }
          : IMAGES.profile,
        type: item.feedData.type,
        isVideo: item.feedData.type === 'video',
        contentUrl: item.feedData.contentUrl,
      });
    }
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const StoryData = getStoryData();

  return (
    <View style={{ paddingVertical: 12 }}>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 8 }}
        horizontal
        data={StoryData}
        renderItem={({ item }) => (
          <StoryItem
            title={item.title}
            image={item.image}
            isAddStory={item.isAddStory}
            isVideo={item.isVideo}
            onPress={() => handleStoryPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border + '20',
          paddingBottom: 12,
        }}
      />
    </View>
  );
};

export default StoryList;
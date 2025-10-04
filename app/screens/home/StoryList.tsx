import { View, FlatList, Image, TouchableOpacity, ActivityIndicator,Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { IMAGES } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample StoryItem component (replace with your actual StoryItem if different)
const StoryItem = ({ title, image, storyItem, id }: { title: string; image: any; storyItem: any[]; id: string }) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(id === '1'); // Only enable loading for "Add story"

  return (
    <TouchableOpacity style={{ marginRight: 10, alignItems: 'center' }}>
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        {id === '1' && isProfileImageLoading && (
          <ActivityIndicator
            style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
            size="small"
            color={colors.primary}
          />
        )}
        <Image
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: id === '1' ? 2 : 0, // Border for "Add story" item
            borderColor: colors.primary,
            opacity: id === '1' && isProfileImageLoading ? 0.1 : 1, // Reduce opacity only for "Add story" during loading
          }}
          source={image}
          onLoadStart={() => id === '1' && setIsProfileImageLoading(true)}
          onLoadEnd={() => id === '1' && setIsProfileImageLoading(false)}
          onError={(error) => {
            if (id === '1') {
              console.log(`StoryItem ${id} image load error:`, error.nativeEvent);
              setIsProfileImageLoading(false);
            }
          }}
        />
        {id !== '1' && ( // Story circle for non-"Add story" items
          <Image
            style={{ width: 68, height: 68, position: 'absolute', resizeMode: 'contain' }}
            source={IMAGES.cricle}
          />
        )}
      </View>
      <View style={{ marginTop: 5 }}>
        <Text style={{ fontSize: 12, color: colors.title, textAlign: 'center' }}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const StoryList = () => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const [profileUrl, setProfileUrl] = useState<any>(IMAGES.profile);
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);

  // Fetch profile avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          console.warn('No user token found');
          return;
        }

        const res = await fetch('http://192.168.1.17:5000/api/get/profile/detail', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          console.error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
          return;
        }

        const data = await res.json();

        // Build full URL + replace backslashes
        let avatarUrl = IMAGES.profile;
        if (data?.profile?.profileAvatar && data.profile.profileAvatar !== 'Unknown') {
          avatarUrl = {
            uri: data.profile.profileAvatar,
          };
        }

        setProfileUrl(avatarUrl);
        console.log('Profile avatar URL:', avatarUrl);
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

  // Story Data
  const StoryData = [
    ...(activeAccountType === 'Creator'
      ? [
          {
            id: '1',
            title: 'Add story',
            image: profileUrl, // dynamic profile avatar
            storyItem: [],
          },
        ]
      : []),
    {
      id: '2',
      title: 'Alex Techie',
      image: IMAGES.storypic2,
      storyItem: [
        IMAGES.profilepic10,
        IMAGES.profilepic11,
        IMAGES.profilepic12,
        IMAGES.profilepic13,
        IMAGES.profilepic14,
        IMAGES.profilepic15,
      ],
    },
    {
      id: '3',
      title: 'Lily Learns',
      image: IMAGES.storypic3,
      storyItem: [
        IMAGES.profilepic3,
        IMAGES.profilepic4,
        IMAGES.profilepic5,
        IMAGES.profilepic7,
        IMAGES.profilepic8,
        IMAGES.profilepic9,
      ],
    },
    {
      id: '4',
      title: 'Mia Maven',
      image: IMAGES.storypic4,
      storyItem: [
        IMAGES.profilepic16,
        IMAGES.profilepic17,
        IMAGES.profilepic18,
        IMAGES.profilepic19,
        IMAGES.profilepic20,
        IMAGES.profilepic21,
      ],
    },
    {
      id: '5',
      title: 'Sophia Techie',
      image: IMAGES.storypic1,
      storyItem: [
        IMAGES.profilepic22,
        IMAGES.profilepic5,
        IMAGES.profilepic7,
        IMAGES.profilepic8,
        IMAGES.profilepic9,
      ],
    },
    {
      id: '6',
      title: 'Herry Maven',
      image: IMAGES.profilepic7,
      storyItem: [
        IMAGES.profilepic13,
        IMAGES.profilepic14,
        IMAGES.profilepic15,
        IMAGES.profilepic3,
        IMAGES.profilepic4,
        IMAGES.profilepic5,
      ],
    },
    {
      id: '7',
      title: 'Anan Learns',
      image: IMAGES.profilepic9,
      storyItem: [IMAGES.profilepic13, IMAGES.profilepic14],
    },
    {
      id: '8',
      title: 'David Miten',
      image: IMAGES.profilepic5,
      storyItem: [IMAGES.profilepic1, IMAGES.profilepic2],
    },
  ];

  return (
    <View style={{ marginHorizontal: -15 }}>
      <FlatList
        contentContainerStyle={{ paddingLeft: 10, paddingTop: -7 }}
        horizontal
        data={StoryData}
        renderItem={({ item }) => (
          <StoryItem
            title={item.title}
            image={item.image}
            storyItem={item.storyItem}
            id={item.id}
          />
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={{
          paddingVertical: 5,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      />
    </View>
  );
};

export default StoryList;
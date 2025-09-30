

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator,Linking  } from 'react-native';
import { COLORS, FONTS, IMAGES, SIZES } from '../constants/theme';
import Swiper from 'react-native-swiper';
import { useNavigation } from '@react-navigation/native';
import LikeBtn from './likebtn/LikeBtn';
import { GlobalStyleSheet } from '../constants/styleSheet';
import { useTheme } from '@react-navigation/native';
import { Video } from 'expo-av';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import BottomSheetComments from './bottomsheet/BottomSheetComments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { removeBackground } from '@imgly/background-removal';
// import * as Permissions from 'expo-permissions'; // For permission handling
import ViewShot from 'react-native-view-shot'; // Import ViewShot

const PostCard = ({
  id,
  name,
  profileimage,
  date,
  postimage,
  like,
  commentsCount, // This should be the comment count
  posttitle,
  posttag,
  sheetRef,
  optionSheet,
  hasStory,
  reelsvideo,
  caption,
  background,
  visibleBoxes,
  setSelectedPostId,
  onNotInterested,
  onHidePost,
  accountId,
}: any) => {
  const navigation = useNavigation<any>();
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(like || 0);
 const [commentCount, setCommentCount] = useState(commentsCount || 0); // Changed from comment to commentsCount
  const [profile, setProfile] = useState<any>({
    displayName: '',
    username: '',
    bio: '',
    balance: '',
    profileAvatar: '',
  });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const [isShow, setIsShow] = useState(false);
  const [show, setshow] = React.useState(true);
  const [mute, setmute] = React.useState(false);
  const video = React.useRef(null);
  const commentSheetRef = useRef(null);
  const viewShotRef = useRef(null); // Ref for ViewShot
  

  console.log('PostCard received account Id id:', accountId);
  console.log('PostCard received feed Id id:', id);

// Request media library permissions
  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Storage permission is required to save images.');
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    try {
      // Check subscription status
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const res = await fetch('http://192.168.1.6:5000/api/user/user/subscriptions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.plan && data.plan.isActive) {
        // Check permissions
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        // Capture the screenshot
        if (viewShotRef.current) {
          const uri = await viewShotRef.current.capture();
          // Save to gallery
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
          Alert.alert('Success', 'image saved to gallery');
        } else {
          Alert.alert('Error', 'Failed to capture PostCard');
        }
      } else {
        // Navigate to subscription page if not subscribed
        navigation.navigate('Subcribe', {});
      }
    } 
    catch (error) {
      // console.error('Download error:', error);
      // Alert.alert('Error', 'Something went wrong while downloading the PostCard');
    }
  };


  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('activeAccountType');
        console.log(storedType);
        if (storedType) setActiveAccountType(storedType);
      } catch (err) {
        console.log('Error fetching account type:', err);
      }
    };
    fetchAccountType();
  }, []);

  const fetchProfile = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const res = await fetch('http://192.168.1.6:5000/api/get/profile/detail', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        const profileData = data.profile;
        const fixedAvatar = profileData.profileAvatar;
        setProfile({
          displayName: profileData.displayName || '',
          username: data.userName || '',
          bio: profileData.bio || '',
          balance: profileData.balance || '',
          profileAvatar: fixedAvatar,
          phoneNumber: profileData.phoneNumber || '',
        });
      } else {
        console.log('Error fetching profile:', data.message);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLike = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const accountType = await AsyncStorage.getItem('activeAccountType');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated or account type missing');
        return;
      }
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      setLikeCount((prev) => (newLikeState ? prev + 1 : prev - 1));
      const endpoint =
        accountType === 'Personal'
          ? 'http://192.168.1.6:5000/api/user/feed/like'
          : 'http://192.168.1.6:5000/api/creator/feed/like';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ feedId: id }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        setIsLiked(!newLikeState);
        setLikeCount((prev) => (newLikeState ? prev - 1 : prev + 1));
        Alert.alert('Error', data.message || 'Failed to like/unlike post');
      }
    } catch (error) {
      console.error('Like error:', error);
      setIsLiked(!isLiked);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
      Alert.alert('Error', 'Something went wrong while liking post');
    }
  };

  // Check if there is no content to display
  if (!postimage && !reelsvideo && !caption) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginHorizontal: -15,
        }}
      >
        <Text
          style={{
            ...FONTS.h4,
            color: colors.title,
            textAlign: 'center',
          }}
        >
          No feeds available
        </Text>
      </View>
    );
  }

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -15 }}>
      <View style={[GlobalStyleSheet.flexalingjust, { paddingVertical: 5, paddingHorizontal: 15, paddingRight: 5 }]}>
        <View style={GlobalStyleSheet.flexaling}>
          <View>
            <TouchableOpacity
              onPress={() => {
                hasStory == false
                  ? navigation.navigate('AnotherProfile', { feedId: id, accountId: accountId })
                  : navigation.navigate('status', {
                      name: name,
                      image: profileimage,
                      statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                    });
              }}
            >
              {hasStory == true ? (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  {isImageLoading && (
                    <ActivityIndicator
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
                      size="small"
                      // color={colors.primary}
                    />
                  )}
                  <Image
                    style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
                    source={
                      profileimage
                        ? { uri: profileimage }
                        : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
                    }
                    onLoadStart={() => setIsImageLoading(true)}
                    onLoadEnd={() => setIsImageLoading(false)}
                  />
                  <Image
                    style={{ width: 48, height: 48, position: 'absolute', resizeMode: 'contain' }}
                    source={IMAGES.cricle}
                  />
                </View>
              ) : (
                <View>
                  {isImageLoading && (
                    <ActivityIndicator
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
                      size="small"
                      // color={colors.primary}
                    />
                  )}
                  <Image
                    style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
                    source={
                      profileimage
                        ? { uri: profileimage }
                        : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
                    }
                    onLoadStart={() => setIsImageLoading(true)}
                    onLoadEnd={() => setIsImageLoading(false)}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: 10 }}>
            <TouchableOpacity>
              <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.title }}>{name}</Text>
            </TouchableOpacity>
            <Text style={{ ...FONTS.fontMedium, fontSize: 11, color: colors.text }}>{date}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => {
              console.log('Opening PostoptionSheet with postId:', id);
              optionSheet.current.openSheet(id, onNotInterested, onHidePost);
              if (setSelectedPostId) {
                setSelectedPostId(id);
              }
            }}
          >
            <Image style={{ width: 18, height: 18, margin: 10, tintColor: colors.title }} source={IMAGES.more} />
          </TouchableOpacity>
        </View>
      </View>
{/* Wrap the content to capture in ViewShot */}
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        {reelsvideo ? (
        <TouchableOpacity
          style={{
            height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * (0 / 100) : SIZES.container - SIZES.container * (0 / 100),
          }}
          onPress={() => navigation.navigate('Reels')}
        >
          <Video
            ref={video}
            source={reelsvideo}
            useNativeControls={false}
            resizeMode={'cover'}
            isLooping
            style={{
              width: '100%',
              height: '100%',
            }}
          />
          <TouchableOpacity
            style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', bottom: 5, right: 5 }}
            onPress={() => {
              setmute(!mute);
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,.6)',
                width: 30,
                height: 30,
                borderRadius: 50,
              }}
            ></View>
            <Image
              style={[GlobalStyleSheet.image, { position: 'absolute', tintColor: COLORS.white }]}
              source={mute ? IMAGES.volumemute : IMAGES.volume}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : caption ? (
        <View
          style={{
            height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * (20 / 100) : SIZES.container - SIZES.container * (20 / 100),
            backgroundColor: background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View>
            <Text style={[GlobalStyleSheet.textfont, { ...FONTS.h4, color: COLORS.white }]}>{caption}</Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * 0.04 : SIZES.container - SIZES.container * 0.1,
            position: 'relative',
          }}
        >
          <Swiper
            height={'auto'}
            showsButtons={false}
            loop={false}
            paginationStyle={{ bottom: 10 }}
            dotStyle={{ width: 5, height: 5, backgroundColor: 'rgba(255, 255, 255, 0.40)' }}
            activeDotStyle={{ width: 6, height: 6, backgroundColor: '#fff' }}
          >
            {postimage.map((data: any, index: any) => (
              <View key={index} style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image style={{ width: '100%', height: '100%' }} source={{ uri: data.image }} resizeMode="contain" />
                {isImageLoading && (
                  <ActivityIndicator
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
                    size="large"
                    color={colors.primary}
                  />
                )}
                <Image
                  style={{
                    position: 'absolute',
                    bottom: 48,
                    left: 20,
                    width: 70,
                    height: 70,
                    borderRadius: 50,
                    // borderWidth: 2,
                    // borderColor: '#fff',
                    opacity: isImageLoading ? 0.5 : 1,
                  }}
                  source={ { uri: profile.profileAvatar } }
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    backgroundColor: '#d2a904ff',
                    paddingVertical: 5,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">
                    {profile.displayName}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">
                    {profile.phoneNumber}
                  </Text>
                </View>
              </View>
            ))}
          </Swiper>
        </View>
      )}
      </ViewShot>


      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingRight: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[GlobalStyleSheet.flexaling, { gap: 22 }]}>
            <View style={GlobalStyleSheet.flexaling}>
              <LikeBtn onPress={handleLike} color={isLiked ? COLORS.red : colors.title} sizes={'sm'} liked={isLiked} />
              <TouchableOpacity>
                <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{likeCount}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('Comments', { feedId: id });
                } catch (error) {
                  console.log('Haptic error:', error);
                  navigation.navigate('Comments', { feedId: id });
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: colors.title }}
                  source={IMAGES.comment}
                />
                {/* Display comment count */}
                <Text style={[GlobalStyleSheet.postlike, { color: colors.title, marginLeft: 5 }]}>{commentsCount}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (postimage && postimage.length > 0) {
                    const imageUrl = postimage[0].image;
                    const fileUri = FileSystem.cacheDirectory + 'sharedImage.jpg';
                    const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(uri, {
                        mimeType: 'image/jpeg',
                        dialogTitle: `Share ${name}'s post`,
                        UTI: 'public.jpeg',
                      });
                    } else {
                      alert('Sharing is not available on this device');
                    }
                  } else {
                    alert('No image to share');
                  }
                } catch (error) {
                  console.log('Error sharing image:', error);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  style={{ width: 24, height: 24, resizeMode: 'contain', tintColor: colors.title }}
                  source={IMAGES.share}
                />
              </View>
            </TouchableOpacity>
        <TouchableOpacity onPress={handleDownload}>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image
      style={{
        width: 28,
        height: 28,
        resizeMode: 'contain',
        tintColor: colors.title,
      }}
      source={IMAGES.download}
    />
  </View>
</TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              onPress={async () => {
                try {
                  setshow(!show);
                  const userToken = await AsyncStorage.getItem('userToken');
                  const accountType = await AsyncStorage.getItem('activeAccountType');
                  if (!userToken) {
                    console.log('token received:', userToken, 'accountType received:', accountType);
                    Alert.alert('Error', 'User not authenticated or account type missing');
                    return;
                  }
                  const endpoint =
                    accountType === 'Personal'
                      ? 'http://192.168.1.6:5000/api/user/feed/save'
                      : 'http://192.168.1.6:5000/api/creator/feed/save';
                  const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${userToken}`,
                    },
                    body: JSON.stringify({ feedId: id }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    console.log(`${accountType} feed saved successfully:`, data.message);
                  } else {
                    console.log('Error saving feed:', data.message);
                    Alert.alert('Error', data.message || 'Failed to save feed');
                  }
                } catch (error) {
                  console.error('Save feed error:', error);
                  Alert.alert('Error', 'Something went wrong while saving feed');
                }
              }}
            >
              <Image
                style={{
                  width: 18,
                  height: 18,
                  resizeMode: 'contain',
                  margin: 15,
                  tintColor: show ? colors.title : colors.primary,
                }}
                source={show ? IMAGES.save : IMAGES.save2}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PostCard;

// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// import { COLORS, FONTS, IMAGES, SIZES } from '../constants/theme';
// import Swiper from 'react-native-swiper';
// import { useNavigation } from '@react-navigation/native';
// import LikeBtn from './likebtn/LikeBtn';
// import { GlobalStyleSheet } from '../constants/styleSheet';
// import { useTheme } from '@react-navigation/native';
// import { Video } from 'expo-av';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library';
// import BottomSheetComments from './bottomsheet/BottomSheetComments';
// import CommentSheet from '../screens/comment/CommentSheet';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Haptics from 'expo-haptics';
// import { removeBackground } from '@imgly/background-removal';

// const PostCard = ({
//   id,
//   name,
//   profileimage,
//   date,
//   postimage,
//   like,
//   commentsCount,
//   posttitle,
//   posttag,
//   sheetRef,
//   optionSheet,
//   hasStory,
//   reelsvideo,
//   caption,
//   background,
//   visibleBoxes,
//   setSelectedPostId,
//   onNotInterested,
//   onHidePost,
//   accountId,
// }: any) => {
//   const navigation = useNavigation<any>();
//   const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
//   const [isLiked, setIsLiked] = useState(false);
//   const [likeCount, setLikeCount] = useState(like || 0);
//   const [commentCount, setCommentCount] = useState(commentsCount || 0);
//   const [profile, setProfile] = useState<any>({
//     displayName: '',
//     username: '',
//     bio: '',
//     balance: '',
//     profileAvatar: '',
//   });
//   const [isImageLoading, setIsImageLoading] = useState(true);
//   const theme = useTheme();
//   const { colors }: { colors: any } = theme;
//   const [isShow, setIsShow] = useState(false);
//   const [show, setShow] = useState(true);
//   const [mute, setMute] = useState(false);
//   const video = useRef(null);
//   const commentSheetRef = useRef(null);
//   const [processedAvatar, setProcessedAvatar] = useState<string | null>(null);

//   console.log('PostCard received account Id id:', accountId);
//   console.log('PostCard received feed Id id:', id);

//   // Function to remove background from the avatar
//   const processAvatar = async (avatarUri: string) => {
//     try {
//       const result = await removeBackground({
//         url: avatarUri,
//         options: {
//           backendHint: 'cpu', // Explicitly force CPU backend
//         },
//       });
//       setProcessedAvatar(result.uri || result); // Update with processed image URI
//     } catch (error) {
//       console.error('Error removing background from avatar:', error);
//       setProcessedAvatar(avatarUri); // Fallback to original image if processing fails
//     }
//   };

//   // Process the avatar when profile data is fetched
//   useEffect(() => {
//     if (profile.profileAvatar) {
//       processAvatar(profile.profileAvatar);
//     }
//   }, [profile.profileAvatar]);

//   useEffect(() => {
//     const fetchAccountType = async () => {
//       try {
//         const storedType = await AsyncStorage.getItem('activeAccountType');
//         console.log(storedType);
//         if (storedType) setActiveAccountType(storedType);
//       } catch (err) {
//         console.log('Error fetching account type:', err);
//       }
//     };
//     fetchAccountType();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       const userToken = await AsyncStorage.getItem('userToken');
//       if (!userToken) {
//         Alert.alert('Error', 'User not authenticated');
//         return;
//       }
//       const res = await fetch('http://192.168.1.6:5000/api/get/profile/detail', {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${userToken}`,
//         },
//       });
//       const data = await res.json();
//       if (res.ok && data.profile) {
//         const profileData = data.profile;
//         const fixedAvatar = profileData.profileAvatar;
//         setProfile({
//           displayName: profileData.displayName || '',
//           username: data.userName || '',
//           bio: profileData.bio || '',
//           balance: profileData.balance || '',
//           profileAvatar: fixedAvatar,
//           phoneNumber: profileData.phoneNumber || '',
//         });
//       } else {
//         console.log('Error fetching profile:', data.message);
//       }
//     } catch (err) {
//       console.error('Fetch profile error:', err);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const handleLike = async () => {
//     try {
//       const userToken = await AsyncStorage.getItem('userToken');
//       const accountType = await AsyncStorage.getItem('activeAccountType');
//       if (!userToken) {
//         Alert.alert('Error', 'User not authenticated or account type missing');
//         return;
//       }
//       const newLikeState = !isLiked;
//       setIsLiked(newLikeState);
//       setLikeCount((prev) => (newLikeState ? prev + 1 : prev - 1));
//       const endpoint =
//         accountType === 'Personal'
//           ? 'http://192.168.1.6:5000/api/user/feed/like'
//           : 'http://192.168.1.6:5000/api/creator/feed/like';
//       const res = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${userToken}`,
//         },
//         body: JSON.stringify({ feedId: id }),
//       });
//       const data = await res.json();
//       console.log(data);
//       if (!res.ok) {
//         setIsLiked(!newLikeState);
//         setLikeCount((prev) => (newLikeState ? prev - 1 : prev + 1));
//         Alert.alert('Error', data.message || 'Failed to like/unlike post');
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       setIsLiked(!isLiked);
//       setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
//       Alert.alert('Error', 'Something went wrong while liking post');
//     }
//   };

//   if (!postimage && !reelsvideo && !caption) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: 'center',
//           alignItems: 'center',
//           padding: 20,
//           borderBottomWidth: 1,
//           borderBottomColor: colors.border,
//           marginHorizontal: -15,
//         }}
//       >
//         <Text style={{ ...FONTS.h4, color: colors.title, textAlign: 'center' }}>No feeds available</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -15 }}>
//       <View style={[GlobalStyleSheet.flexalingjust, { paddingVertical: 5, paddingHorizontal: 15, paddingRight: 5 }]}>
//         <View style={GlobalStyleSheet.flexaling}>
//           <View>
//             <TouchableOpacity
//               onPress={() => {
//                 hasStory === false
//                   ? navigation.navigate('AnotherProfile', { feedId: id, accountId: accountId })
//                   : navigation.navigate('status', {
//                       name: name,
//                       image: profileimage,
//                       statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
//                     });
//               }}
//             >
//               {hasStory === true ? (
//                 <View style={{ justifyContent: 'center', alignItems: 'center' }}>
//                   {isImageLoading && (
//                     <ActivityIndicator
//                       style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
//                       size="small"
//                     />
//                   )}
//                   <Image
//                     style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
//                     source={profileimage ? { uri: profileimage } : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
//                     onLoadStart={() => setIsImageLoading(true)}
//                     onLoadEnd={() => setIsImageLoading(false)}
//                   />
//                   <Image style={{ width: 48, height: 48, position: 'absolute', resizeMode: 'contain' }} source={IMAGES.cricle} />
//                 </View>
//               ) : (
//                 <View>
//                   {isImageLoading && (
//                     <ActivityIndicator
//                       style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
//                       size="small"
//                     />
//                   )}
//                   <Image
//                     style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
//                     source={profileimage ? { uri: profileimage } : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
//                     onLoadStart={() => setIsImageLoading(true)}
//                     onLoadEnd={() => setIsImageLoading(false)}
//                   />
//                 </View>
//               )}
//             </TouchableOpacity>
//           </View>
//           <View style={{ marginLeft: 10 }}>
//             <TouchableOpacity>
//               <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.title }}>{name}</Text>
//             </TouchableOpacity>
//             <Text style={{ ...FONTS.fontMedium, fontSize: 11, color: colors.text }}>{date}</Text>
//           </View>
//         </View>
//         <View style={{ flexDirection: 'row' }}>
//           <TouchableOpacity
//             onPress={() => {
//               console.log('Opening PostoptionSheet with postId:', id);
//               optionSheet.current.openSheet(id, onNotInterested, onHidePost);
//               if (setSelectedPostId) setSelectedPostId(id);
//             }}
//           >
//             <Image style={{ width: 18, height: 18, margin: 10, tintColor: colors.title }} source={IMAGES.more} />
//           </TouchableOpacity>
//         </View>
//       </View>
//       {reelsvideo ? (
//         <TouchableOpacity
//           style={{ height: SIZES.width < SIZES.container ? SIZES.width : SIZES.container }}
//           onPress={() => navigation.navigate('Reels')}
//         >
//           <Video
//             ref={video}
//             source={reelsvideo}
//             useNativeControls={false}
//             resizeMode={'cover'}
//             isLooping
//             style={{ width: '100%', height: '100%' }}
//           />
//           <TouchableOpacity
//             style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', bottom: 5, right: 5 }}
//             onPress={() => setMute(!mute)}
//           >
//             <View style={{ backgroundColor: 'rgba(0,0,0,.6)', width: 30, height: 30, borderRadius: 50 }}></View>
//             <Image
//               style={[GlobalStyleSheet.image, { position: 'absolute', tintColor: COLORS.white }]}
//               source={mute ? IMAGES.volumemute : IMAGES.volume}
//             />
//           </TouchableOpacity>
//         </TouchableOpacity>
//       ) : caption ? (
//         <View
//           style={{
//             height: SIZES.width < SIZES.container ? SIZES.width * 0.8 : SIZES.container * 0.8,
//             backgroundColor: background,
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <View>
//             <Text style={[GlobalStyleSheet.textfont, { ...FONTS.h4, color: COLORS.white }]}>{caption}</Text>
//           </View>
//         </View>
//       ) : (
//         <View style={{ height: SIZES.width * 0.96, position: 'relative' }}>
//           <Swiper
//             height={'auto'}
//             showsButtons={false}
//             loop={false}
//             paginationStyle={{ bottom: 10 }}
//             dotStyle={{ width: 5, height: 5, backgroundColor: 'rgba(255, 255, 255, 0.40)' }}
//             activeDotStyle={{ width: 6, height: 6, backgroundColor: '#fff' }}
//           >
//             {postimage.map((data: any, index: any) => (
//               <View key={index} style={{ width: '100%', height: '100%', position: 'relative' }}>
//                 <Image style={{ width: '100%', height: '100%' }} source={{ uri: data.image }} resizeMode="contain" />
//                 {isImageLoading && (
//                   <ActivityIndicator
//                     style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
//                     size="large"
//                     color={colors.primary}
//                   />
//                 )}
//                 <Image
//                   style={{
//                     position: 'absolute',
//                     bottom: 48,
//                     left: 20,
//                     width: 70,
//                     height: 70,
//                     borderRadius: 50,
//                     opacity: isImageLoading ? 0.5 : 1,
//                   }}
//                   source={{ uri: processedAvatar || profile.profileAvatar }}
//                   onLoadStart={() => setIsImageLoading(true)}
//                   onLoadEnd={() => setIsImageLoading(false)}
//                 />
//                 <View
//                   style={{
//                     position: 'absolute',
//                     bottom: 0,
//                     left: 0,
//                     width: '100%',
//                     backgroundColor: '#d2a904ff',
//                     paddingVertical: 5,
//                     paddingHorizontal: 20,
//                     flexDirection: 'row',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                   }}
//                 >
//                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">
//                     {profile.displayName}
//                   </Text>
//                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">
//                     {profile.phoneNumber}
//                   </Text>
//                 </View>
//               </View>
//             ))}
//           </Swiper>
//         </View>
//       )}
//       <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingRight: 5 }}>
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//           <View style={[GlobalStyleSheet.flexaling, { gap: 22 }]}>
//             <View style={GlobalStyleSheet.flexaling}>
//               <LikeBtn onPress={handleLike} color={isLiked ? COLORS.red : colors.title} sizes={'sm'} liked={isLiked} />
//               <TouchableOpacity>
//                 <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{likeCount}</Text>
//               </TouchableOpacity>
//             </View>
//             <TouchableOpacity
//               onPress={async () => {
//                 try {
//                   await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//                   navigation.navigate('Comments', { feedId: id });
//                 } catch (error) {
//                   console.log('Haptic error:', error);
//                   navigation.navigate('Comments', { feedId: id });
//                 }
//               }}
//             >
//               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                 <Image
//                   style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: colors.title }}
//                   source={IMAGES.comment}
//                 />
//                 <Text style={[GlobalStyleSheet.postlike, { color: colors.title, marginLeft: 5 }]}>{commentsCount}</Text>
//               </View>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={async () => {
//                 try {
//                   if (postimage && postimage.length > 0) {
//                     const imageUrl = postimage[0].image;
//                     const fileUri = FileSystem.cacheDirectory + 'sharedImage.jpg';
//                     const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
//                     if (await Sharing.isAvailableAsync()) {
//                       await Sharing.shareAsync(uri, {
//                         mimeType: 'image/jpeg',
//                         dialogTitle: `Share ${name}'s post`,
//                         UTI: 'public.jpeg',
//                       });
//                     } else {
//                       alert('Sharing is not available on this device');
//                     }
//                   } else {
//                     alert('No image to share');
//                   }
//                 } catch (error) {
//                   console.log('Error sharing image:', error);
//                 }
//               }}
//             >
//               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                 <Image
//                   style={{ width: 24, height: 24, resizeMode: 'contain', tintColor: colors.title }}
//                   source={IMAGES.share}
//                 />
//               </View>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={async () => {
//                 try {
//                   const userToken = await AsyncStorage.getItem('userToken');
//                   if (!userToken) {
//                     Alert.alert('Error', 'User not authenticated');
//                     return;
//                   }
//                   const res = await fetch('http://192.168.1.6:5000/api/user/user/subscriptions', {
//                     method: 'GET',
//                     headers: {
//                       'Content-Type': 'application/json',
//                       Authorization: `Bearer ${userToken}`,
//                     },
//                   });
//                   const data = await res.json();
//                   if (res.ok && data.plan && data.plan.isActive) {
//                     if (postimage && postimage.length > 0) {
//                       const imageUrl = postimage[0].image;
//                       const fileUri = `${FileSystem.cacheDirectory}downloadedImage_${id}.jpg`;
//                       const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
//                       Alert.alert('Success', 'Image saved to gallery');
//                     } else {
//                       Alert.alert('Error', 'No image to download');
//                     }
//                   } else {
//                     navigation.navigate('Subcribe');
//                   }
//                 } catch (error) {
//                   console.log('Download or subscription check error:', error);
//                 }
//               }}
//             >
//               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                 <Image
//                   style={{ width: 28, height: 28, resizeMode: 'contain', tintColor: colors.title }}
//                   source={IMAGES.download}
//                 />
//               </View>
//             </TouchableOpacity>
//           </View>
//           <View>
//             <TouchableOpacity
//               onPress={async () => {
//                 try {
//                   setShow(!show);
//                   const userToken = await AsyncStorage.getItem('userToken');
//                   const accountType = await AsyncStorage.getItem('activeAccountType');
//                   if (!userToken) {
//                     Alert.alert('Error', 'User not authenticated or account type missing');
//                     return;
//                   }
//                   const endpoint =
//                     accountType === 'Personal'
//                       ? 'http://192.168.1.6:5000/api/user/feed/save'
//                       : 'http://192.168.1.6:5000/api/creator/feed/save';
//                   const res = await fetch(endpoint, {
//                     method: 'POST',
//                     headers: {
//                       'Content-Type': 'application/json',
//                       Authorization: `Bearer ${userToken}`,
//                     },
//                     body: JSON.stringify({ feedId: id }),
//                   });
//                   const data = await res.json();
//                   if (!res.ok) Alert.alert('Error', data.message || 'Failed to save feed');
//                 } catch (error) {
//                   console.error('Save feed error:', error);
//                   Alert.alert('Error', 'Something went wrong while saving feed');
//                 }
//               }}
//             >
//               <Image
//                 style={{
//                   width: 18,
//                   height: 18,
//                   resizeMode: 'contain',
//                   margin: 15,
//                   tintColor: show ? colors.title : colors.primary,
//                 }}
//                 source={show ? IMAGES.save : IMAGES.save2}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default PostCard;
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator, Linking, Animated, Share } from 'react-native';
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
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../apiInterpretor/apiInterceptor';

// ============= HELPER FUNCTIONS (OUTSIDE COMPONENT) =============

const GOLD_FRAMES = [
  require("../assets/frames/frame.png"),
  require("../assets/frames/frame22.png"),
  require("../assets/frames/frame3.png"),
  require("../assets/frames/frame4.png")

];

const getGoldFrame = (postIndex) => {
  const str = String(postIndex); // <-- convert number to string
  const index = str.charCodeAt(0) % GOLD_FRAMES.length;
  // console.log("POST ID:", postIndex, "FRAME INDEX:", String(postIndex).charCodeAt(0) % GOLD_FRAMES.length);

  return GOLD_FRAMES[index];
};




const formatPhoneNumber = (num: any) => {
  if (!num) return '';
  const str = String(num);
  const cleaned = str.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7, 12)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
  }
  return str;
};

// ============= SKELETON COMPONENTS (OUTSIDE COMPONENT) =============
const SkeletonAvatar = () => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <Animated.View
      style={{
        width: 40,
        height: 40,
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        opacity: shimmerOpacity,
      }}
    />
  );
};

const SkeletonImage = () => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <Animated.View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#e0e0e0',
        opacity: shimmerOpacity,
      }}
    />
  );
};

// ============= MAIN COMPONENT =============
const PostCard = ({
  id,
  name,
  profileimage,
  avatarToUse,
  date,
  postimage,
  like,
  commentsCount,
  posttitle,
  postIndex,
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
  profileUserId,
  roleRef,
  isLiked: initialIsLiked,
  isSaved: initialIsSaved,
  isDisliked: initialIsDisliked = false,
  dislikeCount: initialDislikeCount = 0,
  onDislikeUpdate,
  onLikeUpdate,
  themeColor,
  textColor,
  currentUserProfile,
  visibilitySettings,
}: any) => {
  const navigation = useNavigation<any>();
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [isDisliked, setIsDisliked] = useState(initialIsDisliked || false);
  const [dislikesCount, setDislikesCount] = useState(initialDislikeCount || 0);
  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const [likeCount, setLikeCount] = useState(like || 0);
  const [commentCount, setCommentCount] = useState(commentsCount || 0);


  const [isImageLoading, setIsImageLoading] = useState(true);
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const [isShow, setIsShow] = useState(false);
  const [show, setshow] = React.useState(true);
  const [mute, setmute] = React.useState(false);
  const video = React.useRef(null);
  const commentSheetRef = useRef(null);
  const viewShotRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [navigateOnClose, setNavigateOnClose] = useState(false);
  const [imageHeight, setImageHeight] = useState(SIZES.width * 1.4);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isVerticalImage, setIsVerticalImage] = useState(true);
  const [avatarPosition, setAvatarPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-left');

  // Double-tap animation states
  const [showHeart, setShowHeart] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;
  const lastTap = useRef(0);

  // Track if we're currently processing a like/dislike action
  const isLikingRef = useRef(false);
  const isDislikingRef = useRef(false);

  // Optimize theme colors - set defaults immediately to prevent render delays
  const optimizedThemeColor = React.useMemo(() => themeColor || '#4A90E2', [themeColor]);
  const optimizedTextColor = React.useMemo(() => textColor || '#FFFFFF', [textColor]);

  // Smart avatar positioning logic
  const calculateAvatarPosition = (width: number, height: number) => {
    const aspectRatio = height / width;

    // For very tall images (portrait mode, like stories)
    if (aspectRatio > 1.5) {
      return 'bottom-left'; // Classic Instagram story style
    }
    // For square or slightly vertical images
    else if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
      return 'bottom-right'; // Balanced look for square images
    }
    // For horizontal/landscape images
    else if (aspectRatio < 0.9) {
      return 'bottom-right'; // Avoid center content
    }
    // Default for moderate vertical images
    else {
      return 'bottom-left';
    }
  };

  useEffect(() => {
    if (postimage?.length > 0) {
      // Set default height immediately to prevent delay
      setImageHeight(SIZES.width * 1.4);

      // Fetch image dimensions asynchronously without blocking render
      Image.getSize(
        postimage[0].image,
        (width, height) => {
          const aspectRatio = height / width;
          const newHeight = Math.min(SIZES.width * aspectRatio, SIZES.width * 1.4);
          setImageHeight(newHeight);
          setImageDimensions({ width, height });
          // Determine if image is vertical (portrait) or horizontal (landscape)
          setIsVerticalImage(height > width);
          // Calculate best avatar position
          setAvatarPosition(calculateAvatarPosition(width, height));
        },
        (error) => {
          // On error, assume vertical image (most common case)
          console.log('Image size fetch error:', error);
          setIsVerticalImage(true);
          setAvatarPosition('bottom-left');
        }
      );
    }
  }, [postimage]);

  // Prefetch images for faster loading
  useEffect(() => {
    if (postimage?.length > 0) {
      postimage.forEach((img: any) => {
        if (img.image) {
          Image.prefetch(img.image).catch(err => console.log('Prefetch error:', err));
        }
      });
    }
    // Also prefetch avatar
    if (avatarToUse) {
      Image.prefetch(avatarToUse).catch(err => console.log('Avatar prefetch error:', err));
    }
  }, [postimage, avatarToUse]);

  // Custom Popup Component
  const Popup = () => (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          width: '90%',
          elevation: 10,
        }}
      >
        <Image
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            marginBottom: 15,
          }}
          source={IMAGES.check1}
        />
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
          }}
        >
          {popupMessage}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginVertical: 10,
          }}
        >
          {popupSubtitle}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#28A745',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginTop: 15,
          }}
          onPress={() => {
            setShowPopup(false);
            if (navigateOnClose) {
              navigation.navigate('Subcribe', {});
            }
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Let's Go
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Share Menu Component
  const ShareMenu = () => (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 20,
          width: '80%',
          elevation: 10,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.title,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Share Post
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
          onPress={handleShareImage}
        >
          <Image
            style={{ width: 24, height: 24, tintColor: colors.primary, marginRight: 15 }}
            source={IMAGES.share}
          />
          <Text style={{ fontSize: 16, color: colors.title, flex: 1 }}>
            Share Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 15,
          }}
          onPress={handleCopyLink}
        >
          <Image
            style={{ width: 24, height: 24, tintColor: colors.primary, marginRight: 15 }}
            source={IMAGES.link}
          />
          <Text style={{ fontSize: 16, color: colors.title, flex: 1 }}>
            Copy Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            marginTop: 20,
            paddingVertical: 12,
            backgroundColor: colors.border,
            borderRadius: 8,
          }}
          onPress={() => setShowShareMenu(false)}
        >
          <Text style={{ fontSize: 16, color: colors.title, textAlign: 'center', fontWeight: '600' }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Generate post link
  const generatePostLink = () => {
    return `https://prithu.app/post/${id}`;
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      const link = generatePostLink();
      await Share.share({
        message: link,
      });

      setShowShareMenu(false);
      setPopupMessage('Link Copied!');
      setPopupSubtitle('Post link has been shared');
      setShowPopup(true);
      setNavigateOnClose(false);
    } catch (error) {
      console.log('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  // Share image function
  const handleShareImage = async () => {
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
          await Share.share({
            message: `Check out this post from ${name}`,
            url: uri,
          });
        }
      } else {
        alert('No image to share');
      }
      setShowShareMenu(false);
    } catch (error) {
      console.log('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  // Open share menu
  const openShareMenu = () => {
    setShowShareMenu(true);
  };

  // Request media library permissions
  const requestPermissions = async () => {
    try {
      const storedPermission = await AsyncStorage.getItem('mediaPermission');
      if (storedPermission === 'granted') return true;
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      if (status === 'granted') {
        await AsyncStorage.setItem('mediaPermission', 'granted');
        return true;
      }
      if (canAskAgain) {
        const { status: requestStatus } = await MediaLibrary.requestPermissionsAsync();
        if (requestStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Storage permission is required to save images.');
          return false;
        }
        await AsyncStorage.setItem('mediaPermission', 'granted');
        return true;
      }
      Alert.alert(
        'Permission Required',
        'Storage permission is required to save images. Please enable it in your device settings.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]
      );
      return false;
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to check or request permissions');
      return false;
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get('/api/user/user/subscriptions');
      const data = response.data;
      if (data.plan && data.plan.hasActive) {
        const trialCheckResponse = await api.get('/api/user/check/active/subcription');
        const trialData = trialCheckResponse.data;
        console.log("sus", trialCheckResponse.data);
        if (trialData.hasActive) {
          const hasPermission = await requestPermissions();
          if (!hasPermission) return;
          if (viewShotRef.current) {
            const uri = await viewShotRef.current.capture();
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('Downloads', asset, false);
            setPopupMessage('Success');
            setPopupSubtitle('Image saved to gallery');
            setShowPopup(true);
            setNavigateOnClose(false);
          } else {
            setPopupMessage('Error');
            setPopupSubtitle('Failed to capture PostCard');
            setShowPopup(true);
            setNavigateOnClose(false);
          }
        } else {
          Alert.alert(
            'Subscription Required',
            'Your trial plan has ended. If you want to download the post, you have to subscribe.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Subscribe', onPress: () => navigation.navigate('Subcribe', {}) },
            ]
          );
        }
      } else {
        navigation.navigate('Subcribe', {});
      }
    } catch (error) {
      // console.error('Download error:', error);
    }
  };


  const renderLikeDislikeSection = () => {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}
          onPress={handleLike}
        >
          <LikeBtn color={isLiked ? COLORS.red : colors.title} sizes={'sm'} liked={isLiked} onPress={handleLike} />
          <Text style={{ marginLeft: 5, color: colors.title, fontSize: 16 }}>{likeCount}</Text>
        </TouchableOpacity>
        <View style={{ width: 1, height: '60%', backgroundColor: '#D3D3D3' }} />
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}
          onPress={handleDislike}
        >
          <Image
            style={{ width: 24, height: 23, tintColor: isDisliked ? COLORS.red : colors.title }}
            source={IMAGES.dislike}
          />
          <Text style={{ marginLeft: 6, color: colors.title, fontSize: 14 }}>{dislikesCount}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleDislike = async () => {
    try {
      isDislikingRef.current = true;
      const newDislikeState = !isDisliked;
      setIsDisliked(newDislikeState);
      setDislikesCount(newDislikeState ? dislikesCount + 1 : dislikesCount - 1);

      const response = await api.post('/api/user/feed/dislike', { feedId: id });
      const data = response.data;

      if (data.success) {
        const actualDislikeCount = data.dislikeCount || 0;
        const actualIsDisliked = data.isDisliked;
        setIsDisliked(actualIsDisliked);
        setDislikesCount(actualDislikeCount);
        if (onDislikeUpdate) {
          onDislikeUpdate(actualIsDisliked, actualDislikeCount);
        }
      } else {
        setIsDisliked(!newDislikeState);
        setDislikesCount(dislikesCount);
        if (onDislikeUpdate) {
          onDislikeUpdate(!newDislikeState, dislikesCount);
        }
      }

      setTimeout(() => {
        isDislikingRef.current = false;
      }, 1000);
    } catch (error) {
      console.error('❌ Dislike error:', error);
      setIsDisliked(isDisliked);
      setDislikesCount(dislikesCount);
      if (onDislikeUpdate) {
        onDislikeUpdate(isDisliked, dislikesCount);
      }
      setTimeout(() => {
        isDislikingRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    setIsSaved(initialIsSaved || false);
    if (!isDislikingRef.current) {
      setIsDisliked(initialIsDisliked || false);
      setDislikesCount(initialDislikeCount || 0);
    }
    if (!isLikingRef.current) {
      setIsLiked(initialIsLiked || false);
      setLikeCount(like || 0);
    }
  }, [initialIsLiked, initialIsSaved, initialIsDisliked, initialDislikeCount, like]);

  const handleLike = async () => {
    try {
      isLikingRef.current = true;
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      setLikeCount(newLikeState ? likeCount + 1 : likeCount - 1);

      const response = await api.post('/api/user/feed/like', { feedId: id });
      const data = response.data;

      if (data.success) {
        const actualLikeCount = data.likeCount || 0;
        const actualIsLiked = data.isLiked;
        setIsLiked(actualIsLiked);
        setLikeCount(actualLikeCount);
        if (onLikeUpdate) {
          onLikeUpdate(actualIsLiked, actualLikeCount);
        }
      } else {
        setIsLiked(!newLikeState);
        setLikeCount(likeCount);
        if (onLikeUpdate) {
          onLikeUpdate(!newLikeState, likeCount);
        }
      }

      setTimeout(() => {
        isLikingRef.current = false;
      }, 1000);
    } catch (error) {
      console.error('❌ Like error:', error);
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      if (onLikeUpdate) {
        onLikeUpdate(isLiked, likeCount);
      }
      setTimeout(() => {
        isLikingRef.current = false;
      }, 1000);
    }
  };

  const handleDoubleTapLike = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowHeart(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);

      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 1000,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowHeart(false);
      });

      if (!isLiked) {
        isLikingRef.current = true;
        setIsLiked(true);
        setLikeCount(likeCount + 1);

        try {
          const response = await api.post('/api/user/feed/like', { feedId: id });
          const data = response.data;

          if (data.success) {
            const actualLikeCount = data.likeCount || 0;
            const actualIsLiked = data.isLiked;
            setIsLiked(actualIsLiked);
            setLikeCount(actualLikeCount);
            if (onLikeUpdate) {
              onLikeUpdate(actualIsLiked, actualLikeCount);
            }
          } else {
            setIsLiked(false);
            setLikeCount(likeCount);
            if (onLikeUpdate) {
              onLikeUpdate(false, likeCount);
            }
          }

          setTimeout(() => {
            isLikingRef.current = false;
          }, 1000);
        } catch (error) {
          console.error('❌ Double-tap like API error:', error);
          setIsLiked(false);
          setLikeCount(likeCount);
          if (onLikeUpdate) {
            onLikeUpdate(false, likeCount);
          }
          setTimeout(() => {
            isLikingRef.current = false;
          }, 1000);
        }
      }
    } catch (error) {
      console.error('❌ Double-tap like error:', error);
    }
  };

  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleDoubleTapLike();
    }
    lastTap.current = now;
  };

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
      <View style={[GlobalStyleSheet.flexalingjust, { paddingVertical: 9, paddingHorizontal: 15, paddingRight: 5 }]}>
        <View style={GlobalStyleSheet.flexaling}>
          <View>
            <TouchableOpacity
              onPress={() => {
                hasStory == false
                  ? navigation.navigate('AnotherProfile', { feedId: id, profileUserId: profileUserId, roleRef: roleRef })
                  : navigation.navigate('status', {
                    name: name,
                    image: avatarToUse || profileimage,
                    statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                  });
              }}
            >

              {hasStory == true ? (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  {isImageLoading ? (
                    <SkeletonAvatar />
                  ) : (
                    <Image
                      style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
                      source={
                        profileimage
                          ? { uri: profileimage }
                          : profileimage
                            ? { uri: profileimage }
                            : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
                      }
                      onLoadStart={() => setIsImageLoading(true)}
                      onLoadEnd={() => setIsImageLoading(false)}
                    />
                  )}
                  <Image
                    style={{ width: 48, height: 48, position: 'absolute', resizeMode: 'contain' }}
                    source={IMAGES.cricle}
                  />
                </View>
              ) : (
                <View>
                  {isImageLoading ? (
                    <SkeletonAvatar />
                  ) : (
                    <Image
                      style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
                      source={
                        profileimage
                          ? { uri: profileimage }
                          : profileimage
                            ? { uri: profileimage }
                            : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
                      }
                      onLoadStart={() => setIsImageLoading(true)}
                      onLoadEnd={() => setIsImageLoading(false)}
                    />
                  )}
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
              backgroundColor: isVerticalImage ? (themeColor || '#4A90E2') : 'lightgray',
              overflow: 'hidden'
            }}
          >
            {/* Background blur for horizontal images */}
            {!isVerticalImage && postimage?.length > 0 && (
              <Image
                source={{ uri: postimage[0].image }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0.5,
                }}
                resizeMode="cover"
                blurRadius={20}
                fadeDuration={0}
              />
            )}


            <Swiper
              height={'auto'}
              showsButtons={false}
              loop={false}
              paginationStyle={{ bottom: 10 }}
              dotStyle={{ width: 5, height: 5, backgroundColor: 'rgba(255, 255, 255, 0.40)' }}
              activeDotStyle={{ width: 6, height: 6, backgroundColor: '#fff' }}
            >
              {postimage.map((data: any, index: any) => (
                <TouchableOpacity
                  key={index}
                  style={{ width: '100%', height: '100%', position: 'relative' }}
                  activeOpacity={1}
                  onPress={handleImageTap}
                >
                  <Image
                    style={{ width: '100%', height: '100%', opacity: isImageLoading ? 0.7 : 1 }}
                    source={{ uri: data.image }}
                    resizeMode="contain"
                    onLoadStart={() => setIsImageLoading(true)}
                    onLoadEnd={() => setIsImageLoading(false)}
                    fadeDuration={0}
                  />

                  {/* Double-tap Like Heart Animation */}
                  {showHeart && (
                    <Animated.View
                      style={{
                        position: 'absolute',
                        alignSelf: 'center',
                        top: '40%',
                        transform: [{ scale: heartScale }],
                        opacity: heartOpacity,
                      }}
                    >
                      <Image
                        source={IMAGES.love}
                        style={{
                          width: 120,
                          height: 120,
                          tintColor: '#ff0050',
                        }}
                      />
                    </Animated.View>
                  )}

                  {/* Dynamic Avatar Positioning */}
                  {avatarToUse && (
                    <View
                      style={{
                        position: "absolute",
                        justifyContent: "center",
                        alignItems: "center",

                        ...(avatarPosition === "bottom-left" && { bottom: 48, left: 20 }),
                        ...(avatarPosition === "bottom-right" && { bottom: 48, right: 20 }),
                        ...(avatarPosition === "top-left" && { top: 20, left: 20 }),
                        ...(avatarPosition === "top-right" && { top: 20, right: 20 }),
                      }}
                    >
                      {/* OUTER GLOW */}
                      <View
                        style={{
                          width: 150,
                          height: 150,
                          borderRadius: 75,
                          // backgroundColor: "rgba(255,215,0,0.20)",
                          position: "absolute",
                          // shadowColor: "#FFD700",
                          // shadowOffset: { width: 0, height: 0 },
                          // shadowOpacity: 0.4,
                          // shadowRadius: 14,
                          // elevation: 12,
                        }}
                      />

                      {/* GOLD FRAME PNG (LOCAL ASSET) */}
                      <Image
                        source={getGoldFrame(postIndex)}
                        style={{
                          width: 135,
                          height: 135,
                          resizeMode: "contain",
                          position: "absolute",
                        }}
                      />

                      {/* INNER SHINE */}
                      <View
                        style={{
                          width: 118,
                          height: 118,
                          borderRadius: 59,
                          // borderWidth: 3,
                          // borderColor: "rgba(255,255,255,0.9)",
                          position: "absolute",
                        }}
                      />

                      {/* USER AVATAR */}
                      <Image
                        source={{ uri: avatarToUse }}
                        style={{
                          width: 90,
                          height: 90,
                          borderRadius: 55,
                          // backgroundColor: "#fff",
                        }}
                      />
                    </View>
                  )}



                </TouchableOpacity>
              ))}
            </Swiper>
          </View>
        )}
      </ViewShot>
      {/* Name and Phone Number Section with Social Media Icons */}
      {currentUserProfile && visibilitySettings && (
        <View style={{
          paddingHorizontal: 40,
          paddingVertical: 4,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: themeColor || '#4A90E2',
          marginHorizontal: -15,
          marginTop: 0,
          marginBottom: 0
        }}>
          {/* Left Side - Name and Phone */}
          <View style={{ flex: 1, marginRight: 15 }}>
            {visibilitySettings.userName === "public" && currentUserProfile.userName && (
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: textColor || '#fff', marginBottom: 2 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentUserProfile.userName}
              </Text>
            )}
            {visibilitySettings.phoneNumber === "public" && currentUserProfile.phoneNumber && (
              <Text
                style={{ fontSize: 13, fontWeight: '500', color: textColor || '#fff', opacity: 0.9 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatPhoneNumber(currentUserProfile.phoneNumber)}
              </Text>
            )}
          </View>

          {/* Right Side - Social Media Icons */}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {/* WhatsApp */}
            {currentUserProfile.phoneNumber && (
              <TouchableOpacity
                onPress={() => {
                  const phone = formatPhoneNumber(currentUserProfile.phoneNumber);
                  Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() => {
                    Alert.alert('Error', 'WhatsApp is not installed');
                  });
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' }}
                  style={{ width: 25, height: 25 }}
                />
              </TouchableOpacity>
            )}

            {/* Instagram */}
            <TouchableOpacity
              onPress={() => {
                const username = currentUserProfile.userName || name;
                Linking.openURL(`instagram://user?username=${username}`).catch(() => {
                  Linking.openURL(`https://instagram.com/${username}`);
                });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png' }}
                style={{ width: 25, height: 25 }}
              />
            </TouchableOpacity>

            {/* Facebook */}
            <TouchableOpacity
              onPress={() => {
                const username = currentUserProfile.userName || name;
                Linking.openURL(`fb://profile/${username}`).catch(() => {
                  Linking.openURL(`https://facebook.com/${username}`);
                });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' }}
                style={{ width: 25, height: 25 }}
              />
            </TouchableOpacity>

            {/* Twitter */}
            <TouchableOpacity
              onPress={() => {
                const username = currentUserProfile.userName || name;
                Linking.openURL(`twitter://user?screen_name=${username}`).catch(() => {
                  Linking.openURL(`https://twitter.com/${username}`);
                });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' }}
                style={{ width: 25, height: 25 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={{ paddingHorizontal: 15, paddingBottom: 12, paddingTop: 3, paddingRight: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[GlobalStyleSheet.flexaling, { gap: 15 }]}>
            {renderLikeDislikeSection()}
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
                <Text style={[GlobalStyleSheet.postlike, { color: colors.title, marginLeft: 5 }]}>{commentsCount}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openShareMenu}
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
                  style={{ width: 28, height: 28, resizeMode: 'contain', tintColor: colors.title }}
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
                  const accountType = await AsyncStorage.getItem('activeAccountType');
                  const response = await api.post('/api/user/feed/save', { feedId: id });
                  const data = response.data;
                  console.log(`${accountType} feed saved successfully:`, data.message);
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
      {showShareMenu && <ShareMenu />}
      {showPopup && <Popup />}
    </View>
  );
};

export default React.memo(PostCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.like === nextProps.like &&
    prevProps.isDisliked === nextProps.isDisliked &&
    prevProps.dislikeCount === nextProps.dislikeCount &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.commentsCount === nextProps.commentsCount &&
    prevProps.visibleBoxes === nextProps.visibleBoxes &&
    prevProps.postimage?.[0]?.image === nextProps.postimage?.[0]?.image &&
    prevProps.avatarToUse === nextProps.avatarToUse
  );
});
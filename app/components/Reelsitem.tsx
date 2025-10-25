// import React, { useEffect, useRef, useState } from 'react';
// import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
// import { Video } from 'expo-av';
// import { COLORS, FONTS, IMAGES } from '../constants/theme';
// import LikeBtn from './likebtn/LikeBtn';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { GlobalStyleSheet } from '../constants/styleSheet';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
// import * as Haptics from 'expo-haptics';


// const Reelsitem = ({
//   id, // Added for API calls
//   like,
//   comment,
//   save,
//   send,
//   image,
//   text,
//   music,
//   holder,
//   sheetRef,
//   reelsvideo,
//   hasStory,
//   autoplay,
// }) => {
//   const navigation = useNavigation();
//   const isFocused = useIsFocused();
//   const video = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(autoplay);
//   const [isShowText, setIsShowText] = useState(false);
//   const [isLiked, setIsLiked] = useState(false);
//   const [isSaved, setIsSaved] = useState(false);
//   const [likeCount, setLikeCount] = useState(like || 0);
//   const [activeAccountType, setActiveAccountType] = useState(null);
//   const [profile, setProfile] = useState({
//     displayName: '',
//     phoneNumber: '',
//   });

//   // Fetch account type
//   useEffect(() => {
//     const fetchAccountType = async () => {
//       try {
//         const storedType = await AsyncStorage.getItem('activeAccountType');
//         if (storedType) setActiveAccountType(storedType);
//       } catch (err) {
//         console.log('Error fetching account type:', err);
//       }
//     };
//     fetchAccountType();
//   }, []);

//   // Fetch profile data
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const userToken = await AsyncStorage.getItem('userToken');
//         if (!userToken) {
//           Alert.alert('Error', 'User not authenticated');
//           return;
//         }
//         const res = await fetch('http://192.168.1.10:5000/api/get/profile/detail', {
//           method: 'GET',
//           headers: {
//             Authorization: `Bearer ${userToken}`,
//           },
//         });
//         const data = await res.json();
//         if (res.ok && data.profile) {
//           setProfile({
//             displayName: data.profile.displayName || '',
//             phoneNumber: data.profile.phoneNumber || '',
//           });
//         } else {
//           console.log('Error fetching profile:', data.message);
//         }
//       } catch (err) {
//         console.error('Fetch profile error:', err);
//       }
//     };
//     fetchProfile();
//   }, []);

//   // Play/pause based on autoplay and focus
//   useEffect(() => {
//     const playPause = async () => {
//       if (video.current) {
//         if (autoplay && isFocused) {
//           await video.current.playAsync();
//           setIsPlaying(true);
//         } else {
//           await video.current.pauseAsync();
//           setIsPlaying(false);
//         }
//       }
//     };
//     playPause();
//   }, [autoplay, isFocused]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (video.current) {
//         video.current.pauseAsync();
//       }
//     };
//   }, []);

//   // Tap handler for play/pause
//   const handleTap = async () => {
//     if (video.current) {
//       if (isPlaying) {
//         await video.current.pauseAsync();
//         setIsPlaying(false);
//       } else {
//         await video.current.playAsync();
//         setIsPlaying(true);
//       }
//     }
//   };

//   // Like handler
//   const handleLike = async () => {
//     try {
//       const userToken = await AsyncStorage.getItem('userToken');
//       if (!userToken || !activeAccountType) {
//         Alert.alert('Error', 'User not authenticated or account type missing');
//         return;
//       }
//       const newLikeState = !isLiked;
//       setIsLiked(newLikeState);
//       setLikeCount((prev) => (newLikeState ? prev + 1 : prev - 1));
//       const endpoint =
//         activeAccountType === 'Personal'
//           ? 'http://192.168.1.10:5000/api/user/feed/like'
//           : 'http://192.168.1.10:5000/api/creator/feed/like';
//       const res = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${userToken}`,
//         },
//         body: JSON.stringify({ feedId: id }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         setIsLiked(!newLikeState);
//         setLikeCount((prev) => (newLikeState ? prev - 1 : prev + 1));
//         Alert.alert('Error', data.message || 'Failed to like/unlike reel');
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       setIsLiked(!isLiked);
//       setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
//       Alert.alert('Error', 'Something went wrong while liking reel');
//     }
//   };

//   // Comment handler
//   const handleComment = async () => {
//     try {
//       await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//       navigation.navigate('Comments', { feedId: id });
//     } catch (error) {
//       console.log('Haptic error:', error);
//       navigation.navigate('Comments', { feedId: id });
//     }
//   };

//   // Save handler
//   const handleSave = async () => {
//     try {
//       const userToken = await AsyncStorage.getItem('userToken');
//       if (!userToken || !activeAccountType) {
//         Alert.alert('Error', 'User not authenticated or account type missing');
//         return;
//       }
//       const newSaveState = !isSaved;
//       setIsSaved(newSaveState);
//       const endpoint =
//         activeAccountType === 'Personal'
//           ? 'http://192.168.1.10:5000/api/user/feed/save'
//           : 'http://192.168.1.10:5000/api/creator/feed/save';
//       const res = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${userToken}`,
//         },
//         body: JSON.stringify({ feedId: id }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         setIsSaved(!newSaveState);
//         Alert.alert('Error', data.message || 'Failed to save reel');
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       setIsSaved(!isSaved);
//       Alert.alert('Error', 'Something went wrong while saving reel');
//     }
//   };

//   // Share handler
//   const handleShare = async () => {
//     try {
//       const videoUrl = reelsvideo.uri;
//       const fileUri = `${FileSystem.cacheDirectory}sharedReel.mp4`;
//       const { uri } = await FileSystem.downloadAsync(videoUrl, fileUri);
//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri, {
//           mimeType: 'video/mp4',
//           dialogTitle: `Share ${holder}'s reel`,
//           UTI: 'public.mpeg-4',
//         });
//       } else {
//         Alert.alert('Error', 'Sharing is not available on this device');
//       }
//     } catch (error) {
//       console.error('Share error:', error);
//       Alert.alert('Error', 'Something went wrong while sharing reel');
//     }
//   };

//   return (
//     <View style={[GlobalStyleSheet.container, { padding: 0, flex: 1, backgroundColor: '#000' }]}>
//       {/* Video Player */}
//       <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleTap}>
//         <Video
//           ref={video}
//           source={reelsvideo}
//           style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
//           resizeMode="cover"
//           isLooping
//         />
//         {!isPlaying && (
//           <Image
//             source={IMAGES.playIcon}
//             style={{
//               position: 'absolute',
//               alignSelf: 'center',
//               top: '45%',
//               width: 50,
//               height: 50,
//               tintColor: '#fff',
//             }}
//           />
//         )}
//       </TouchableOpacity>

//       {/* Bottom Overlay */}
//       <View style={{ position: 'absolute', bottom: 80, left: 20, paddingRight: 120 }}>
//         <View style={GlobalStyleSheet.flexaling}>
//           {/* Profile Image */}
//           <TouchableOpacity
//             onPress={() =>
//               hasStory
//                 ? navigation.navigate('status', {
//                     name: holder,
//                     image: image,
//                     statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
//                   })
//                 : navigation.navigate('AnotherProfile', { feedId: id })
//             }
//             style={{ marginRight: 20 }}
//           >
//             <View style={{ justifyContent: 'center', alignItems: 'center' }}>
//               <Image style={{ width: 45, height: 45, borderRadius: 50 }} source={image} />
//               {hasStory && (
//                 <Image style={{ width: 55, height: 55, position: 'absolute' }} source={IMAGES.cricle} />
//               )}
//             </View>
//           </TouchableOpacity>

//           {/* Creator Name */}
//           <TouchableOpacity onPress={() => navigation.navigate('AnotherProfile', { feedId: id })}>
//             <Text style={{ ...FONTS.font, ...FONTS.fontMedium, color: COLORS.white }}>{holder}</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Caption */}
//         <View style={{ marginTop: 20 }}>
//           <Text numberOfLines={isShowText ? 0 : 1} style={{ ...FONTS.fontRegular, color: COLORS.white, fontSize: 12 }}>
//             {text}
//           </Text>
//           {/* Uncomment if you want to re-enable the "more" button */}
//           {/* {!isShowText && (
//             <TouchableOpacity onPress={() => setIsShowText(true)}>
//               <Text
//                 style={{
//                   ...FONTS.fontRegular,
//                   color: COLORS.white,
//                   opacity: 0.6,
//                   fontSize: 12,
//                   position: 'absolute',
//                   bottom: -4,
//                   right: -30,
//                 }}
//               >
//                 more
//               </Text>
//             </TouchableOpacity>
//           )} */}
//         </View>

//         {/* Music */}
//         <View style={{ marginTop: 10 }}>
//           <TouchableOpacity onPress={() => navigation.navigate('Music')} style={GlobalStyleSheet.flexaling}>
//             <Image style={{ width: 15, height: 15, tintColor: '#fff', resizeMode: 'contain' }} source={IMAGES.music} />
//             <Text style={{ ...FONTS.fontRegular, color: COLORS.white, fontSize: 11, marginLeft: 5 }}>{music}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Name and Phone Number */}
//       <View
//         style={{
//           position: 'absolute',
//           bottom: 0,
//           left: 0,
//           width: '100%',
//           backgroundColor: '#d2a904ff',
//           paddingVertical: 5,
//           paddingHorizontal: 10,
//           flexDirection: 'row',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//         }}
//       >
//         <Text
//           style={{
//             fontSize: 16,
//             fontWeight: 'bold',
//             color: '#fff',
//           }}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {profile.displayName || 'No name provided'}
//         </Text>
//         <Text
//           style={{
//             fontSize: 16,
//             fontWeight: 'bold',
//             color: '#fff',
//           }}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {profile.phoneNumber || 'No number provided'}
//         </Text>
//       </View>

//       {/* Right-side buttons */}
//       <View style={{ position: 'absolute', bottom: 30, right: 20, alignItems: 'center', gap: 10 }}>
//         {/* Like */}
//         <View style={{ alignItems: 'center' }}>
//           <TouchableOpacity onPress={handleLike}>
//             <View style={GlobalStyleSheet.background}>
//               <LikeBtn color={isLiked ? COLORS.primary : '#fff'} sizes="sm" liked={isLiked} />
//             </View>
//           </TouchableOpacity>
//           <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{likeCount}</Text>
//         </View>

//         {/* Comment */}
//         <View style={{ alignItems: 'center' }}>
//           <TouchableOpacity onPress={handleComment}>
//             <View style={GlobalStyleSheet.background}>
//               <Image style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]} source={IMAGES.comment} />
//             </View>
//           </TouchableOpacity>
//           <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{comment}</Text>
//         </View>

//         {/* Save */}
//         <View style={{ alignItems: 'center' }}>
//           <TouchableOpacity onPress={handleSave}>
//             <View style={GlobalStyleSheet.background}>
//               <Image
//                 style={[GlobalStyleSheet.image, { tintColor: isSaved ? COLORS.primary : COLORS.white }]}
//                 source={isSaved ? IMAGES.save2 : IMAGES.save}
//               />
//             </View>
//           </TouchableOpacity>
//           <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{save}</Text>
//         </View>

//         {/* Share */}
//         <View style={{ alignItems: 'center' }}>
//           <TouchableOpacity onPress={handleShare}>
//             <View style={GlobalStyleSheet.background}>
//               <Image style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]} source={IMAGES.send} />
//             </View>
//           </TouchableOpacity>
//           <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{send}</Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default Reelsitem;


import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { COLORS, FONTS, IMAGES } from '../constants/theme';
import LikeBtn from './likebtn/LikeBtn';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/styleSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

const { height: windowHeight } = Dimensions.get('window');

const Reelsitem = ({
  id,
  like,
  comment,
  save,
  send,
  image,
  text,
  music,
  holder,
  sheetRef,
  reelsvideo,
  hasStory,
  autoplay,
  isLiked: initialIsLiked,
  themeColor,
  textColor,
}: any) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const video = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isShowText, setIsShowText] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(like || 0);
  const [activeAccountType, setActiveAccountType] = useState(null);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [isNameVisible, setisNameVisible] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    phoneNumber: '',
  });
  const [hasViewed, setHasViewed] = useState(false);


  useEffect(() => {
    setIsLiked(initialIsLiked || false);
  }, [initialIsLiked]);


  // Fetch account type
  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('activeAccountType');
        if (storedType) setActiveAccountType(storedType);
      } catch (err) {
        console.log('Error fetching account type:', err);
      }
    };
    fetchAccountType();
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        // Step 1: Fetch profile details
        const res = await fetch('http://192.168.1.10:5000/api/get/profile/detail', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.profile) {
          setProfile({
            displayName: data.profile.displayName || '',
            phoneNumber: data.profile.phoneNumber || '',
          });

          // Step 2: Fetch visibility settings *after* profile details
          const visRes = await fetch('http://192.168.1.10:5000/api/profile/visibility', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userToken}`,
            },
          });

          const visData = await visRes.json();

          if (visRes.ok && visData.success) {
            setIsPhoneVisible(visData.visibility?.phoneNumber ?? false);
            setisNameVisible(visData.visibility?.displayName ?? false);
          } else {
            console.log('Failed to get visibility settings:', visData.message);
          }
        } else {
          console.log('Error fetching profile:', data.message);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      }
    };

    fetchProfile();
  }, []);


  // Play/pause based on autoplay and focus
  useEffect(() => {
    const playPause = async () => {
      if (video.current) {
        if (autoplay && isFocused) {
          await video.current.playAsync();
          setIsPlaying(true);
        } else {
          await video.current.pauseAsync();
          setIsPlaying(false);
        }
      }
    };
    playPause();
  }, [autoplay, isFocused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (video.current) {
        video.current.pauseAsync();
      }
    };
  }, []);

  // Handle video end to record view
  const handleVideoEnd = async () => {
    if (hasViewed) {
      console.log('Video view already recorded for feedId:', id);
      return;
    }
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      console.log("user", userToken);
      if (!userToken) {
        return;
      }
      const endpoint = 'http://192.168.1.10:5000/api/user/watching/vidoes';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ feedId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.log('Error recording video view:', data.message);
      } else {
        console.log('Video view recorded:', data.message);
        setHasViewed(true); // Mark as viewed only on successful API call
      }
    } catch (error) {
      console.error('Error recording video view:', error);
    }
  };

  // Tap handler for play/pause
  const handleTap = async () => {
    if (video.current) {
      if (isPlaying) {
        await video.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await video.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  // Like handler
  const handleLike = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) return Alert.alert('Error', 'User not authenticated');

      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      setLikeCount(prev => newLikeState ? prev + 1 : prev - 1);

      const res = await fetch('http://192.168.1.10:5000/api/user/feed/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ feedId: id }),
      });

      const data = await res.json();
      console.log("likebtn", data)
      if (!res.ok) {
        setIsLiked(!newLikeState); // rollback
        setLikeCount(prev => newLikeState ? prev - 1 : prev + 1);
        Alert.alert('Error', data.message || 'Failed to like/unlike reel');
      }
    } catch (error) {
      setIsLiked(!isLiked); // rollback
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      Alert.alert('Error', 'Something went wrong while liking reel');
    }
  };


  // Comment handler
  const handleComment = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Comments', { feedId: id });
    } catch (error) {
      console.log('Haptic error:', error);
      navigation.navigate('Comments', { feedId: id });
    }
  };

  // Save handler
  const handleSave = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const newSaveState = !isSaved;
      setIsSaved(newSaveState);
      const endpoint = 'http://192.168.1.10:5000/api/user/feed/save';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ feedId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsSaved(!newSaveState);
        Alert.alert('Error', data.message || 'Failed to save reel');
      }
    } catch (error) {
      console.error('Save error:', error);
      setIsSaved(!isSaved);
      Alert.alert('Error', 'Something went wrong while saving reel');
    }
  };

  // Share handler
  const handleShare = async () => {
    try {
      const videoUrl = reelsvideo.uri;
      const fileUri = `${FileSystem.cacheDirectory}sharedReel.mp4`;
      const { uri } = await FileSystem.downloadAsync(videoUrl, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'video/mp4',
          dialogTitle: `Share ${holder}'s reel`,
          UTI: 'public.mpeg-4',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Something went wrong while sharing reel');
    }
  };

  return (
    <View
      style={[GlobalStyleSheet.container, { padding: 0, flex: 1, backgroundColor: '#000', height: windowHeight }]}
    >
      {/* Video Player */}
      <TouchableOpacity style={{ flex: 1, height: windowHeight }} activeOpacity={1} onPress={handleTap}>
        <Video
          ref={video}
          source={reelsvideo}
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
          resizeMode="cover"
          isLooping
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              handleVideoEnd();
            }
          }}
        />
        {!isPlaying && (
          <Image
            source={IMAGES.playIcon}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: '45%',
              width: 50,
              height: 50,
              tintColor: '#fff',
            }}
          />
        )}
      </TouchableOpacity>

      {/* Bottom Overlay */}
      <View style={{ position: 'absolute', bottom: 30, left: 20, paddingRight: 120 }}>
        <View style={GlobalStyleSheet.flexaling}>
          {/* Profile Image */}
          <TouchableOpacity
            // onPress={() =>
            //   hasStory
            //     ? navigation.navigate('status', {
            //         name: holder,
            //         image: image,
            //         statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
            //       })
            //     : navigation.navigate('AnotherProfile', { feedId: id })
            // }
            style={{ marginRight: 20 }}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Image style={{ width: 45, height: 45, borderRadius: 50 }} source={image} />
              {hasStory && (
                <Image style={{ width: 55, height: 55, position: 'absolute' }} source={IMAGES.cricle} />
              )}
            </View>
          </TouchableOpacity>

          {/* Creator Name */}
          <TouchableOpacity
          // onPress={() => navigation.navigate('AnotherProfile', { feedId: id })}
          >
            <Text style={{ ...FONTS.font, ...FONTS.fontMedium, color: COLORS.white }}>{holder}</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={{ marginTop: 20 }}>
          <Text numberOfLines={isShowText ? 0 : 1} style={{ ...FONTS.fontRegular, color: COLORS.white, fontSize: 12 }}>
            {text}
          </Text>
          {/* Uncomment if you want to re-enable the "more" button */}
          {/* {!isShowText && (
            <TouchableOpacity onPress={() => setIsShowText(true)}>
              <Text
                style={{
                  ...FONTS.fontRegular,
                  color: COLORS.white,
                  opacity: 0.6,
                  fontSize: 12,
                  position: 'absolute',
                  bottom: -4,
                  right: -30,
                }}
              >
                more
              </Text>
            </TouchableOpacity>
          )} */}
        </View>

        {/* Music */}
        {/* <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Music')} style={GlobalStyleSheet.flexaling}>
            <Image style={{ width: 15, height: 15, tintColor: '#fff', resizeMode: 'contain' }} source={IMAGES.music} />
            <Text style={{ ...FONTS.fontRegular, color: COLORS.white, fontSize: 11, marginLeft: 5 }}>{music}</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Name and Phone Number */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: themeColor || '#b1ba52ff',
          paddingVertical: 5,
          paddingHorizontal: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {isNameVisible && (
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">
            {profile.displayName}
          </Text>
        )}
        {isPhoneVisible && (
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">
            {profile.phoneNumber}
          </Text>
        )}
      </View>

      {/* Right-side buttons */}
      <View style={{ position: 'absolute', bottom: 80, right: 20, alignItems: 'center', gap: 16 }}>
        {/* Like */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={handleLike}>
            <View style={GlobalStyleSheet.background}>
              <LikeBtn
                color={isLiked ? COLORS.primary : '#fff'}
                sizes="sm"
                liked={isLiked}
                onPress={handleLike}
              />

            </View>
          </TouchableOpacity>
          <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{likeCount}</Text>
        </View>

        {/* Comment */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={handleComment}>
            <View style={GlobalStyleSheet.background}>
              <Image style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]} source={IMAGES.comment} />
            </View>
          </TouchableOpacity>
          <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{comment}</Text>
        </View>

        {/* Share */}
        <View style={{ alignItems: 'center', bottom: 12 }}>
          <TouchableOpacity onPress={handleShare}>
            <View style={GlobalStyleSheet.background}>
              <Image style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]} source={IMAGES.send} />
            </View>
          </TouchableOpacity>
          <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{send}</Text>
        </View>

        {/* Save */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={handleSave}>
            <View style={GlobalStyleSheet.background}>
              <Image
                style={[GlobalStyleSheet.image, { tintColor: isSaved ? COLORS.primary : COLORS.white }]}
                source={isSaved ? IMAGES.save2 : IMAGES.save}
              />
            </View>
          </TouchableOpacity>
          {/* <Text style={{ ...FONTS.fontSm, color: COLORS.white }}>{save}</Text> */}
        </View>

      </View>
    </View>
  );
};

export default Reelsitem;
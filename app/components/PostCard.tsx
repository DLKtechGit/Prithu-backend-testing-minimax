

// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator,Linking,Animated  } from 'react-native';
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
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Haptics from 'expo-haptics';
// import { removeBackground } from '@imgly/background-removal';
// // import * as Permissions from 'expo-permissions'; // For permission handling
// import ViewShot from 'react-native-view-shot'; // Import ViewShot

// const PostCard = ({
//   id,
//   name,
//   profileimage,
//   date,
//   postimage,
//   like,
//   commentsCount, // This should be the comment count
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
//   isLiked: initialIsLiked, // Add isLiked prop
//   isSaved: initialIsSaved, // Add isSaved prop
 

// }: any) => {
//   const navigation = useNavigation<any>();
//   const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
//   const [isLiked, setIsLiked] = useState(initialIsLiked || false); // Initialize with prop
//    const [isDisliked, setIsDisliked] = useState(initialIsLiked || false);
//   const [isSaved, setIsSaved] = useState(initialIsSaved || false); // Initialize with prop
//   const [likeCount, setLikeCount] = useState(like || 0);
//  const [commentCount, setCommentCount] = useState(commentsCount || 0); // Changed from comment to commentsCount
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
//   const [show, setshow] = React.useState(true);
//   const [mute, setmute] = React.useState(false);
//   const video = React.useRef(null);
//   const commentSheetRef = useRef(null);
//   const viewShotRef = useRef(null); // Ref for ViewShot
//    const [showPopup, setShowPopup] = useState(false); // State for popup visibility
//   const [popupMessage, setPopupMessage] = useState(''); // Popup title
//   const [popupSubtitle, setPopupSubtitle] = useState(''); // Popup subtitle
//    const [navigateOnClose, setNavigateOnClose] = useState(false);
  


// // --------------------------- Skeleton Loader Components ----------------------------

// const SkeletonAvatar = () => {
//   const shimmer = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.timing(shimmer, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       })
//     ).start();
//   }, [shimmer]);

//   const shimmerOpacity = shimmer.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: [0.3, 0.8, 0.3],
//   });

//   return (
//     <Animated.View
//       style={{
//         width: 40,
//         height: 40,
//         borderRadius: 50,
//         backgroundColor: '#e0e0e0',
//         opacity: shimmerOpacity,
//       }}
//     />
//   );
// };

// const SkeletonImage = () => {
//   const shimmer = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.timing(shimmer, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       })
//     ).start();
//   }, [shimmer]);

//   const shimmerOpacity = shimmer.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: [0.3, 0.8, 0.3],
//   });

//   return (
//     <Animated.View
//       style={{
//         width: '100%',
//         height: '100%',
//         backgroundColor: '#e0e0e0',
//         opacity: shimmerOpacity,
//       }}
//     />
//   );
// };



// // Custom Popup Component
//   const Popup = () => (
//     <View style={{
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       justifyContent: 'center',
//       alignItems: 'center',
//       backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
//     }}>
//       <View style={{
//         backgroundColor: '#fff',
//         borderRadius: 16,
//         padding: 20,
//         alignItems: 'center',
//         width: '90%',
//         elevation: 10,
//       }}>
//         <Image
//           style={{
//             width: 80,
//             height: 80,
//             borderRadius: 40,
//             marginBottom: 15,
//           }}
//           source={IMAGES.bugrepellent}
//         />
//         <Text style={{
//           fontSize: 20,
//           fontWeight: 'bold',
//           color: '#333',
//           textAlign: 'center',
//         }}>{popupMessage}</Text>
//         <Text style={{
//           fontSize: 14,
//           color: '#666',
//           textAlign: 'center',
//           marginVertical: 10,
//         }}>{popupSubtitle}</Text>
//         <TouchableOpacity
//           style={{
//             backgroundColor: '#28A745',
//             paddingVertical: 10,
//             paddingHorizontal: 20,
//             borderRadius: 8,
//             marginTop: 15,
//           }}
//           onPress={() => {
//             setShowPopup(false);
//             if (navigateOnClose) {
//               navigation.navigate('Subcribe', {});
//             }
//           }}
//         >
//           <Text style={{
//             color: '#fff',
//             fontSize: 16,
//             fontWeight: 'bold',
//             textAlign: 'center',
//           }}>Let's Go</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );


// // Request media library permissions
// const requestPermissions = async () => {
//   try {
//     // 1️⃣ Check AsyncStorage first
//     const storedPermission = await AsyncStorage.getItem('mediaPermission');

//     if (storedPermission === 'granted') {

//       return true; // Already granted before
//     }

//     // 2️⃣ Use getPermissionsAsync to check current status
//     const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
//     console.log("Current MediaLibrary permission status:", status, "Can ask again:", canAskAgain);
//     if (status === 'granted') {
//       console.log("MediaLibrary permission already granted, saving to AsyncStorage");
//       await AsyncStorage.setItem('mediaPermission', 'granted');
//       return true;
//     }

//     // 3️⃣ If permission is denied but can ask again, request permission
//     if (canAskAgain) {
//       console.log("Requesting MediaLibrary permission...");
//       const { status: requestStatus } = await MediaLibrary.requestPermissionsAsync();
//       console.log("Requested permission status:", requestStatus);
//       if (requestStatus !== 'granted') {
//         console.log("Permission denied by user");
//         Alert.alert('Permission Denied', 'Storage permission is required to save images.');
//         return false;
//       }
//       console.log("Permission granted, saving to AsyncStorage");
//       await AsyncStorage.setItem('mediaPermission', 'granted');
//       return true;
//     }

//     // 4️⃣ If permission is denied and cannot ask again, inform user
//     console.log("Permission denied and cannot ask again");
//     Alert.alert(
//       'Permission Required',
//       'Storage permission is required to save images. Please enable it in your device settings.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Open Settings', onPress: () => Linking.openSettings() }
//       ]
//     );
//     return false;
//   } catch (error) {
//     console.error('Permission error:', error);
//     Alert.alert('Error', 'Failed to check or request permissions');
//     return false;
//   }
// };


// const handleDownload = async () => {
//   try {
//     // Check subscription status (keeping your original logic)
//     const userToken = await AsyncStorage.getItem('userToken');
//     if (!userToken) {
//       Alert.alert('Error', 'User not authenticated');
//       return;
//     }

//     // Keep your original subscription check
//     const res = await fetch('http://192.168.1.7:5000/api/user/user/subscriptions', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${userToken}`,
//       },
//     });

//     const data = await res.json();

//     if (res.ok && data.plan && data.plan.isActive) {
//       // Additional check for trial plan status
//       const trialCheckRes = await fetch('http://192.168.1.7:5000/api/user/check/active/subcription', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${userToken}`,
//         },
//       });

//       const trialData = await trialCheckRes.json();

//       if (trialCheckRes.ok || trialData.isActive) {
//         // Both checks passed - proceed with download
//         const hasPermission = await requestPermissions();
//         if (!hasPermission) return;

//        // Capture the screenshot
//         if (viewShotRef.current) {
//           const uri = await viewShotRef.current.capture();
//           // Save to gallery
//           const asset = await MediaLibrary.createAssetAsync(uri);
//           await MediaLibrary.createAlbumAsync('Downloads', asset, false);
//             setPopupMessage('Success');
//             setPopupSubtitle('Image saved to gallery');
//             setShowPopup(true);
//             setNavigateOnClose(false);
//         } else {
//            setPopupMessage('Error');
//             setPopupSubtitle('Failed to capture PostCard');
//             setShowPopup(true);
//             setNavigateOnClose(false);
//         }
//       }  else {
//         // Trial has ended - show alert
//         Alert.alert(
//           'Subscription Required',
//           'Your trial plan has ended. If you want to download the post, you have to subscribe.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Subscribe', onPress: () => navigation.navigate('Subcribe', {}) }
//           ]
//         );
//         //  {
//         //   setPopupMessage('Subscription Required');
//         //   setPopupSubtitle('Your trial plan has ended. If you want to download the post, you have to subscribe.');
//         //   setShowPopup(true);
//         //   setNavigateOnClose(true);
//         // }
//       }
//     } else {
//       // Navigate to subscription page if not subscribed (keeping your original behavior)
//       navigation.navigate('Subcribe', {});
//     }
//     //  {
//     //     setPopupMessage('Subscription Required');
//     //     setPopupSubtitle('Please subscribe to download the post.');
//     //     setShowPopup(true);
//     //     setNavigateOnClose(true);
//     //   }
//   } 
//   catch (error) {
//     // console.error('Download error:', error);
//     // Alert.alert('Error', 'Something went wrong while downloading the PostCard');
//   }
// };


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


// // UI for thumbs up and thumbs down
//   const renderLikeDislikeSection = () => {
//     return (
//       <View style={[GlobalStyleSheet.flexaling, { gap: 5, paddingVertical: 5 }]}
//           style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             // backgroundColor: '#F0F0F0',
//             // borderRadius: 20,
//             paddingHorizontal: 10,
//             paddingVertical: 5,
//           }}
//           >
//         <TouchableOpacity
//         style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}
//         onPress={handleLike}
//         >

//         <LikeBtn color={isLiked ? COLORS.red : colors.title} sizes={'sm'} liked={isLiked} onPress={handleLike}/>
//         <Text style={{ marginLeft: 5, color: colors.title, fontSize: 16 }}>{likeCount}</Text>
//       </TouchableOpacity>

//       <View style={{ width: 1, height: '60%', backgroundColor: '#D3D3D3' }} />
//       <TouchableOpacity
//         style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}
//         onPress={handleDislike}
//       >
//           <Image
//             style={{ width: 24, height: 23, tintColor: isDisliked ? COLORS.red : colors.title }}
//             source={IMAGES.dislike}
//           />
//           <Text style={{ marginLeft: 6, color: colors.title, fontSize: 14 }}>0</Text> 
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   // ... (keep all existing functions like handleDownload, fetchProfile, etc.)

//   const handleDislike = async () => {
//     // Add logic for dislike functionality similar to handleLike if needed
//     try {
//       const userToken = await AsyncStorage.getItem('userToken');
//       const accountType = await AsyncStorage.getItem('activeAccountType');
//       if (!userToken) {
//         Alert.alert('Error', 'User not authenticated or account type missing');
//         return;
//       }
//       // Implement dislike API call here if required
//       console.log('Dislike action triggered for post:', id);
//     } catch (error) {
//       console.error('Dislike error:', error);
//       Alert.alert('Error', 'Something went wrong while disliking post');
//     }
//   };



//   const fetchProfile = async () => {
//     try {
//       const userToken = await AsyncStorage.getItem('userToken');
//       if (!userToken) {
//         Alert.alert('Error', 'User not authenticated');
//         return;
//       }
//       const res = await fetch('http://192.168.1.7:5000/api/get/profile/detail', {
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

//   useEffect(() => {
//     setIsLiked(initialIsLiked || false); // Update state when prop changes
//     setIsSaved(initialIsSaved || false); // Update state when prop changes
//   }, [initialIsLiked, initialIsSaved]);

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
//       console.log("setIsLiked",setIsLiked)
//       setLikeCount((prev) => (newLikeState ? prev + 1 : prev - 1));
//       const endpoint =
//         accountType === 'Personal'
//           ? 'http://192.168.1.7:5000/api/user/feed/like'
//           : 'http://192.168.1.7:5000/api/creator/feed/like';
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

//   // Check if there is no content to display
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
//         <Text
//           style={{
//             ...FONTS.h4,
//             color: colors.title,
//             textAlign: 'center',
//           }}
//         >
//           No feeds available
//         </Text>
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
//                 hasStory == false
//                   ? navigation.navigate('AnotherProfile', { feedId: id, accountId: accountId })
//                   : navigation.navigate('status', {
//                       name: name,
//                       image: profileimage,
//                       statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
//                     });
//               }}
//             >
//              {hasStory == true ? (
//                 <View style={{ justifyContent: 'center', alignItems: 'center' }}>
//                   {isImageLoading ? (
//                     <SkeletonAvatar />
//                   ) : (
//                     <Image
//                       style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
//                       source={
//                         profileimage
//                           ? { uri: profileimage }
//                           : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
//                       }
//                       onLoadStart={() => setIsImageLoading(true)}
//                       onLoadEnd={() => setIsImageLoading(false)}
//                     />
//                   )}
//                   <Image
//                     style={{ width: 48, height: 48, position: 'absolute', resizeMode: 'contain' }}
//                     source={IMAGES.cricle}
//                   />
//                 </View>
//               ) : (
//                 <View>
//                   {isImageLoading ? (
//                     <SkeletonAvatar />
//                   ) : (
//                     <Image
//                       style={{ width: 40, height: 40, borderRadius: 50, opacity: isImageLoading ? 0.5 : 1 }}
//                       source={
//                         profileimage
//                           ? { uri: profileimage }
//                           : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
//                       }
//                       onLoadStart={() => setIsImageLoading(true)}
//                       onLoadEnd={() => setIsImageLoading(false)}
//                     />
//                   )}
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
//               if (setSelectedPostId) {
//                 setSelectedPostId(id);
//               }
//             }}
//           >
//             <Image style={{ width: 18, height: 18, margin: 10, tintColor: colors.title }} source={IMAGES.more} />
//           </TouchableOpacity>
//         </View>
//       </View>
// {/* Wrap the content to capture in ViewShot */}
//       <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
//         {reelsvideo ? (
//         <TouchableOpacity
//           style={{
//             height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * (0 / 100) : SIZES.container - SIZES.container * (0 / 100),
//           }}
//           onPress={() => navigation.navigate('Reels')}
//         >
//           <Video
//             ref={video}
//             source={reelsvideo}
//             useNativeControls={false}
//             resizeMode={'cover'}
//             isLooping
//             style={{
//               width: '100%',
//               height: '100%',
//             }}
//           />
//           <TouchableOpacity
//             style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', bottom: 5, right: 5 }}
//             onPress={() => {
//               setmute(!mute);
//             }}
//           >
//             <View
//               style={{
//                 backgroundColor: 'rgba(0,0,0,.6)',
//                 width: 30,
//                 height: 30,
//                 borderRadius: 50,
//               }}
//             ></View>
//             <Image
//               style={[GlobalStyleSheet.image, { position: 'absolute', tintColor: COLORS.white }]}
//               source={mute ? IMAGES.volumemute : IMAGES.volume}
//             />
//           </TouchableOpacity>
//         </TouchableOpacity>
//       ) : caption ? (
//         <View
//           style={{
//             height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * (20 / 100) : SIZES.container - SIZES.container * (20 / 100),
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
//         <View
//           style={{
//             height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * 0.04 : SIZES.container - SIZES.container * 0.1,
//             position: 'relative',
//           }}
//         >
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
//                 {isImageLoading ? (
//                     <SkeletonImage />
//                   ) : (
//                     <Image
//                       style={{ width: '100%', height: '100%' }}
//                       source={{ uri: data.image }}
//                       resizeMode="contain"
//                       onLoadStart={() => setIsImageLoading(true)}
//                       onLoadEnd={() => setIsImageLoading(false)}
//                     />
//                   )}
//                   <Image
//                     style={{
//                       position: 'absolute',
//                       bottom: 48,
//                       left: 20,
//                       width: 90,
//                       height: 90,
//                       borderRadius: 50,
//                       opacity: isImageLoading ? 0.5 : 1,
//                     }}
//                     source={{ uri: profile.profileAvatar }}
//                     onLoadStart={() => setIsImageLoading(true)}
//                     onLoadEnd={() => setIsImageLoading(false)}
//                   />
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
//       </ViewShot>


//          <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingRight: 5 }}>
    
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//           <View style={[GlobalStyleSheet.flexaling, { gap: 15 }]}>
//            {/* <View style={GlobalStyleSheet.flexaling}>
//               <LikeBtn onPress={handleLike} color={isLiked ? COLORS.red : colors.title} sizes={'sm'} liked={isLiked} />
//               <TouchableOpacity>
//                 <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{likeCount}</Text>
//               </TouchableOpacity>
//             </View> */}
//             {renderLikeDislikeSection()}
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
//                 {/* Display comment count */}
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
//         <TouchableOpacity onPress={handleDownload}>
//   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//     <Image
//       style={{
//         width: 28,
//         height: 28,
//         resizeMode: 'contain',
//         tintColor: colors.title,
//       }}
//       source={IMAGES.download}
//     />
//   </View>
// </TouchableOpacity>
//           </View>
//           <View>
//             <TouchableOpacity
//               onPress={async () => {
//                 try {
//                   setshow(!show);
//                   const userToken = await AsyncStorage.getItem('userToken');
//                   const accountType = await AsyncStorage.getItem('activeAccountType');
//                   if (!userToken) {
//                     console.log('token received:', userToken, 'accountType received:', accountType);
//                     Alert.alert('Error', 'User not authenticated or account type missing');
//                     return;
//                   }
//                   const endpoint =
//                     accountType === 'Personal'
//                       ? 'http://192.168.1.7:5000/api/user/feed/save'
//                       : 'http://192.168.1.7:5000/api/creator/feed/save';
//                   const res = await fetch(endpoint, {
//                     method: 'POST',
//                     headers: {
//                       'Content-Type': 'application/json',
//                       Authorization: `Bearer ${userToken}`,
//                     },
//                     body: JSON.stringify({ feedId: id }),
//                   });
//                   const data = await res.json();
//                   if (res.ok) {
//                     console.log(`${accountType} feed saved successfully:`, data.message);
//                   } else {
//                     console.log('Error saving feed:', data.message);
//                     Alert.alert('Error', data.message || 'Failed to save feed');
//                   }
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
//        {showPopup && <Popup />}
//     </View>
//   );
// };

// export default PostCard;


import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator, Linking, Animated } from 'react-native';
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
import ViewShot from 'react-native-view-shot';

const PostCard = ({
  id,
  name,
  profileimage,
  date,
  postimage,
  like,
  commentsCount,
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
  isLiked: initialIsLiked,
  isSaved: initialIsSaved,
  isDisliked: initialIsDisliked = false, // Default to false if not provided
  dislikeCount: initialDislikeCount = 0, // Default to 0 if not provided
  onDislikeUpdate, // Callback to update PostList
}: any) => {
  const navigation = useNavigation<any>();
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [isDisliked, setIsDisliked] = useState(initialIsDisliked || false); // Use initial value from props
  const [dislikeCount, setDislikeCount] = useState(like || 0);
  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const [likeCount, setLikeCount] = useState(like || 0);
  const [commentCount, setCommentCount] = useState(commentsCount || 0);
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
  const viewShotRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [navigateOnClose, setNavigateOnClose] = useState(false);

  // Skeleton Loader Components
  const SkeletonAvatar = () => {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
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
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
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
          source={IMAGES.bugrepellent}
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
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const res = await fetch('http://192.168.1.7:5000/api/user/user/subscriptions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.plan && data.plan.isActive) {
        const trialCheckRes = await fetch('http://192.168.1.7:5000/api/user/check/active/subcription', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
        });
        const trialData = await trialCheckRes.json();
        if (trialCheckRes.ok || trialData.isActive) {
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
      console.error('Download error:', error);
      Alert.alert('Error', 'Something went wrong while downloading the PostCard');
    }
  };

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
          <Text style={{ marginLeft: 6, color: colors.title, fontSize: 14 }}>{dislikeCount}</Text> 
        </TouchableOpacity>
      </View>
    );
  };

  const handleDislike = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const newDislikeState = !isDisliked;
      const newDislikeCount = isDisliked ? dislikeCount - 1 : dislikeCount + 1; // Local increment/decrement
      setIsDisliked(newDislikeState); // Optimistic update
      setDislikeCount(newDislikeCount); // Optimistic update

      const res = await fetch('http://192.168.1.7:5000/api/user/feed/dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ feedId: id }),
      });

      const data = await res.json();
      console.log("data",data)
      if (!res.ok) {
        setIsDisliked(!newDislikeState); // Revert on failure
        setDislikeCount(isDisliked ? dislikeCount : dislikeCount - 1); // Revert count
        Alert.alert('Error', data.message || 'Failed to toggle dislike');
      } else {
        // Notify PostList of the update
        if (onDislikeUpdate) {
          onDislikeUpdate(newDislikeState, newDislikeCount);
        }
        Alert.alert('Success', data.message);
      }
    } catch (error) {
      console.error('Dislike error:', error);
      setIsDisliked(!isDisliked); // Revert on error
      setDislikeCount(isDisliked ? dislikeCount : dislikeCount - 1); // Revert count
      Alert.alert('Error', 'Something went wrong while toggling dislike');
    }
  };

  const fetchProfile = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const res = await fetch('http://192.168.1.7:5000/api/get/profile/detail', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userToken}` },
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

  useEffect(() => {
    setIsLiked(initialIsLiked || false);
    setIsSaved(initialIsSaved || false);
    setIsDisliked(initialIsDisliked || false); // Sync with initial prop
    setDislikeCount(initialDislikeCount || 0); // Sync with initial prop
  }, [initialIsLiked, initialIsSaved, initialIsDisliked, initialDislikeCount]);

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
          ? 'http://192.168.1.7:5000/api/user/feed/like'
          : 'http://192.168.1.7:5000/api/creator/feed/like';
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
                  {isImageLoading ? (
                    <SkeletonAvatar />
                  ) : (
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
                  {isImageLoading ? (
                    <SkeletonImage />
                  ) : (
                    <Image
                      style={{ width: '100%', height: '100%' }}
                      source={{ uri: data.image }}
                      resizeMode="contain"
                      onLoadStart={() => setIsImageLoading(true)}
                      onLoadEnd={() => setIsImageLoading(false)}
                    />
                  )}
                  <Image
                    style={{
                      position: 'absolute',
                      bottom: 48,
                      left: 20,
                      width: 90,
                      height: 90,
                      borderRadius: 50,
                      opacity: isImageLoading ? 0.5 : 1,
                    }}
                    source={{ uri: profile.profileAvatar }}
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
                  const userToken = await AsyncStorage.getItem('userToken');
                  const accountType = await AsyncStorage.getItem('activeAccountType');
                  if (!userToken) {
                    console.log('token received:', userToken, 'accountType received:', accountType);
                    Alert.alert('Error', 'User not authenticated or account type missing');
                    return;
                  }
                  const endpoint =
                    accountType === 'Personal'
                      ? 'http://192.168.1.7:5000/api/user/feed/save'
                      : 'http://192.168.1.7:5000/api/creator/feed/save';
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
      {showPopup && <Popup />}
    </View>
  );
};

export default PostCard;
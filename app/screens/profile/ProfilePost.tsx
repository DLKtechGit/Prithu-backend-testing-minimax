// import React, { useRef, useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { COLORS, IMAGES, FONTS, SIZES } from '../../constants/theme';
// import { useNavigation } from '@react-navigation/native';
// import { useTheme } from '@react-navigation/native';
// import Header from '../../layout/Header';
// import { GlobalStyleSheet } from '../../constants/styleSheet';
// import Swiper from 'react-native-swiper';
// import LikeBtn from '../../components/likebtn/LikeBtn';
// import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
// import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library';
// import * as Haptics from 'expo-haptics';

// const API_BASE = 'http://192.168.1.6:5000/api';

// const ProfilePost = () => {
//     const sheetRef = useRef<any>();
//     const moresheet = useRef<any>();
//     const theme = useTheme();
//     const { colors }: { colors: any } = theme;
//     const navigation = useNavigation<any>();
//     const [posts, setPosts] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [activeAccountType, setActiveAccountType] = useState<string | null>(null);

//     const fetchPosts = async () => {
//         try {
//             setLoading(true);
//             const token = await AsyncStorage.getItem('userToken');
//             if (!token) {
//                 console.warn('No user token found in AsyncStorage');
//                 return;
//             }

//             const res = await axios.get(`${API_BASE}/get/all/feeds/user`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             const feeds = res.data.feeds || [];
//             const mappedFeeds = feeds
//                 .filter((item: any) => item.type === 'image')
//                 .map((item: any) => ({
//                     id: item._id,
//                     name: item.userName || 'Unknown',
//                     image: item.profileAvatar !== 'Unknown'
//                         ? { uri: item.profileAvatar }
//                         : IMAGES.profile,
//                     date: item.timeAgo || 'Unknown',
//                     postimage: [{ image: { uri: item.contentUrl } }],
//                     like: item.likesCount || 0,
//                     comment: item.comments?.length || 0,
//                     posttitle: item.caption || '',
//                     posttag: item.tags?.join(' ') || '',
//                     hasStory: false,
//                     isLiked: false, // Track like state per post
//                 }));

//             setPosts(mappedFeeds);
//         } catch (error) {
//             console.error('Error fetching posts:', error.response?.data || error.message);
//             setPosts([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const fetchAccountType = async () => {
//             try {
//                 const storedType = await AsyncStorage.getItem('activeAccountType');
//                 if (storedType) setActiveAccountType(storedType);
//             } catch (err) {
//                 console.log('Error fetching account type:', err);
//             }
//         };
//         fetchAccountType();
//         fetchPosts();
//     }, []);

//     const handleLike = async (postId: string, index: number) => {
//         try {
//             const userToken = await AsyncStorage.getItem('userToken');
//             if (!userToken || !activeAccountType) {
//                 Alert.alert('Error', 'User not authenticated or account type missing');
//                 return;
//             }

//             const newLikeState = !posts[index].isLiked;
//             const updatedPosts = [...posts];
//             updatedPosts[index] = {
//                 ...updatedPosts[index],
//                 isLiked: newLikeState,
//                 like: newLikeState ? updatedPosts[index].like + 1 : updatedPosts[index].like - 1,
//             };
//             setPosts(updatedPosts);

//             const endpoint = activeAccountType === 'Personal'
//                 ? `${API_BASE}/user/feed/like`
//                 : `${API_BASE}/creator/feed/like`;

//             const res = await axios.post(
//                 endpoint,
//                 { feedId: postId },
//                 {
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${userToken}`,
//                     },
//                 }
//             );

//             if (!res.data.success) {
//                 // Revert state if API call fails
//                 updatedPosts[index] = {
//                     ...updatedPosts[index],
//                     isLiked: !newLikeState,
//                     like: newLikeState ? updatedPosts[index].like - 1 : updatedPosts[index].like + 1,
//                 };
//                 setPosts(updatedPosts);
//                 Alert.alert('Error', res.data.message || 'Failed to like/unlike post');
//             }
//         } catch (error) {
//             console.error('Like error:', error);
//             const updatedPosts = [...posts];
//             updatedPosts[index] = {
//                 ...updatedPosts[index],
//                 isLiked: !posts[index].isLiked,
//                 like: posts[index].isLiked ? updatedPosts[index].like - 1 : updatedPosts[index].like + 1,
//             };
//             setPosts(updatedPosts);
//             Alert.alert('Error', 'Something went wrong while liking post');
//         }
//     };

//     const handleShare = async (imageUrl: string, postOwner: string) => {
//         try {
//             const fileUri = `${FileSystem.cacheDirectory}sharedImage.jpg`;
//             const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
//             if (await Sharing.isAvailableAsync()) {
//                 await Sharing.shareAsync(uri, {
//                     mimeType: 'image/jpeg',
//                     dialogTitle: `Share ${postOwner}'s post`,
//                     UTI: 'public.jpeg',
//                 });
//             } else {
//                 Alert.alert('Error', 'Sharing is not available on this device');
//             }
//         } catch (error) {
//             console.error('Error sharing image:', error);
//             Alert.alert('Error', 'Something went wrong while sharing the post');
//         }
//     };

//     const handleDownload = async (imageUrl: string) => {
//         try {
//             const { status } = await MediaLibrary.requestPermissionsAsync();
//             if (status !== 'granted') {
//                 Alert.alert('Permission Denied', 'Storage permission is required to download images.');
//                 return;
//             }

//             const fileUri = `${FileSystem.cacheDirectory}downloadedImage.jpg`;
//             const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
//             await MediaLibrary.saveToLibraryAsync(uri);
//             Alert.alert('Success', 'Image downloaded and saved to gallery!');
//         } catch (error) {
//             console.error('Download error:', error);
//             Alert.alert('Error', 'Something went wrong while downloading the image');
//         }
//     };
//     const [isShow, setIsShow] = useState(false);

//     return (
//         <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
//             <Header title="Post" />
//             <ScrollView showsVerticalScrollIndicator={false}>
//                 <View style={GlobalStyleSheet.container}>
//                     {loading ? (
//                         <View style={{ paddingVertical: 20, alignItems: 'center' }}>
//                             <ActivityIndicator size="large" color={colors.primary || colors.title} />
//                         </View>
//                     ) : posts.length === 0 ? (
//                         <View style={{ paddingVertical: 20, alignItems: 'center' }}>
//                             <Text style={{ color: colors.title }}>No posts found</Text>
//                         </View>
//                     ) : (
//                         posts.map((data, index) => {

//                             return (
//                                 <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -15 }}>
//                                     <View style={[GlobalStyleSheet.flexalingjust, { paddingVertical: 10, paddingHorizontal: 15 }]}>
//                                         <View style={GlobalStyleSheet.flexaling}>
//                                             <View>
//                                                 <TouchableOpacity
//                                                     onPress={() =>
//                                                         navigation.navigate('status', {
//                                                             name: data.name,
//                                                             image: data.image,
//                                                             statusData: [IMAGES.profilepic17, IMAGES.profilepic18],
//                                                         })
//                                                     }
//                                                 >
//                                                     <View>
//                                                         <Image
//                                                             style={{ width: 42, height: 42, borderRadius: 50 }}
//                                                             source={data.image}
//                                                         />
//                                                         <Image
//                                                             style={{ width: 50, height: 50, position: 'absolute', bottom: -4, right: -4, resizeMode: 'contain' }}
//                                                             source={IMAGES.cricle}
//                                                         />
//                                                     </View>
//                                                 </TouchableOpacity>
//                                             </View>
//                                             <View style={{ marginLeft: 10 }}>
//                                                 <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
//                                                     <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.title }}>{data.name}</Text>
//                                                 </TouchableOpacity>
//                                                 <Text style={{ ...FONTS.fontMedium, fontSize: 11, color: colors.text }}>{data.date}</Text>
//                                             </View>
//                                         </View>
//                                         <View style={{ flexDirection: 'row' }}>
//                                             <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
//                                                 <Image
//                                                     style={{ width: 18, height: 18, tintColor: colors.title }}
//                                                     source={IMAGES.more}
//                                                 />
//                                             </TouchableOpacity>
//                                         </View>
//                                     </View>
//                                     <View
//                                         style={{
//                                             height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * 0.2 : SIZES.container - SIZES.container * 0.2,
//                                         }}
//                                     >
//                                         <Swiper
//                                             height={'auto'}
//                                             showsButtons={false}
//                                             loop={false}
//                                             paginationStyle={{ bottom: 30 }}
//                                             dotStyle={{ width: 5, height: 5, backgroundColor: 'rgba(255, 255, 255, 0.40)' }}
//                                             activeDotStyle={{ width: 6, height: 6, backgroundColor: '#ffff' }}
//                                         >
//                                             {data.postimage.map((post: any, index: number) => (
//                                                 <Image key={index} style={{ width: '100%', height: '100%' }} source={post.image} />
//                                             ))}
//                                         </Swiper>
//                                     </View>
//                                     <View style={{ paddingVertical: 10, paddingHorizontal: 15, paddingBottom: 10 }}>
//                                         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//                                             <View style={[GlobalStyleSheet.flexaling, { gap: 22 }]}>
//                                                 <View style={GlobalStyleSheet.flexaling}>
//                                                     <LikeBtn
//                                                         onPress={() => handleLike(data.id, index)}
//                                                         color={data.isLiked ? colors.primary : colors.title}
//                                                         sizes={'sm'}
//                                                         liked={data.isLiked}
//                                                     />
//                                                     <TouchableOpacity onPress={() => navigation.navigate('like')}>
//                                                         <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{data.like}</Text>
//                                                     </TouchableOpacity>
//                                                 </View>
//                                                 <TouchableOpacity
//                                                     onPress={async () => {
//                                                         try {
//                                                             await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//                                                             navigation.navigate('Comments', { feedId: data.id });
//                                                         } catch (error) {
//                                                             console.log('Haptic error:', error);
//                                                             navigation.navigate('Comments', { feedId: data.id });
//                                                         }
//                                                     }}
//                                                 >
//                                                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                                                         <Image
//                                                             style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: colors.title }}
//                                                             source={IMAGES.comment}
//                                                         />
//                                                         <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{data.comment}</Text>
//                                                     </View>
//                                                 </TouchableOpacity>
//                                                 <TouchableOpacity
//                                                     onPress={() => handleShare(data.postimage[0].image.uri, data.name)}
//                                                 >
//                                                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                                                         <Image
//                                                             style={{ width: 24, height: 24, resizeMode: 'contain', tintColor: colors.title }}
//                                                             source={IMAGES.share}
//                                                         />
//                                                     </View>
//                                                 </TouchableOpacity>
//                                                 <TouchableOpacity
//                                                                         onPress={() => {
//                                                                             navigation.navigate("Subcribe", {

//                                                                             });
//                                                                         }}
//                                                                     >
//                                                                         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                                                                             <Image
//                                                                                 style={{
//                                                                                     width: 28,
//                                                                                     height: 28,
//                                                                                     resizeMode: 'contain',
//                                                                                     tintColor: colors.title,
//                                                                                 }}
//                                                                                 source={IMAGES.download}
//                                                                             />
//                                                                         </View>
//                                                                     </TouchableOpacity>
//                                             </View>
//                                             <View>
//                                                 <TouchableOpacity
//                                                     onPress={async () => {
//                                                         try {
//                                                             const updatedPosts = [...posts];
//                                                             updatedPosts[index] = { ...updatedPosts[index], isSaved: !data.isSaved };
//                                                             setPosts(updatedPosts);

//                                                             const userToken = await AsyncStorage.getItem('userToken');
//                                                             if (!userToken || !activeAccountType) {
//                                                                 Alert.alert('Error', 'User not authenticated or account type missing');
//                                                                 return;
//                                                             }

//                                                             const endpoint = activeAccountType === 'Personal'
//                                                                 ? `${API_BASE}/user/feed/save`
//                                                                 : `${API_BASE}/creator/feed/save`;

//                                                             const res = await axios.post(
//                                                                 endpoint,
//                                                                 { feedId: data.id },
//                                                                 {
//                                                                     headers: {
//                                                                         'Content-Type': 'application/json',
//                                                                         Authorization: `Bearer ${userToken}`,
//                                                                     },
//                                                                 }
//                                                             );

//                                                             if (!res.data.success) {
//                                                                 updatedPosts[index] = { ...updatedPosts[index], isSaved: !data.isSaved };
//                                                                 setPosts(updatedPosts);
//                                                                 Alert.alert('Error', res.data.message || 'Failed to save feed');
//                                                             }
//                                                         } catch (error) {
//                                                             console.error('Save feed error:', error);
//                                                             const updatedPosts = [...posts];
//                                                             updatedPosts[index] = { ...updatedPosts[index], isSaved: !data.isSaved };
//                                                             setPosts(updatedPosts);
//                                                             Alert.alert('Error', 'Something went wrong while saving feed');
//                                                         }
//                                                     }}
//                                                 >
//                                                     <Image
//                                                         style={{
//                                                             width: 18,
//                                                             height: 18,
//                                                             resizeMode: 'contain',
//                                                             margin: 10,
//                                                             tintColor: data.isSaved ? colors.primary : colors.title,
//                                                         }}
//                                                         source={data.isSaved ? IMAGES.save2 : IMAGES.save}
//                                                     />
//                                                 </TouchableOpacity>
//                                             </View>
//                                         </View>
//                                         {/* <View style={{ marginTop: 15 }}>
//                                             <View style={{ paddingRight: 35 }}>
//                                                 <Text
//                                                     numberOfLines={isShow ? 0 : 2}
//                                                     style={{ ...FONTS.fontRegular, color: colors.title, fontSize: 13 }}
//                                                 >
//                                                     {data.posttitle}
//                                                 </Text>
//                                                 {!isShow && data.posttitle.length > 100 && (
//                                                     <TouchableOpacity
//                                                         onPress={() => setIsShow(true)}
//                                                         style={{ position: 'absolute', bottom: -4, right: 0 }}
//                                                     >
//                                                         <Text
//                                                             style={{
//                                                                 ...FONTS.fontRegular,
//                                                                 color: theme.dark ? 'rgba(255,255,255,0.5)' : 'rgba(71, 90, 119, 0.50)',
//                                                                 fontSize: 13,
//                                                             }}
//                                                         >
//                                                             more
//                                                         </Text>
//                                                     </TouchableOpacity>
//                                                 )}
//                                             </View>
//                                             <Text
//                                                 style={{
//                                                     ...FONTS.fontRegular,
//                                                     color: theme.dark ? 'rgba(255,255,255,0.4)' : '#475A77',
//                                                     fontSize: 13,
//                                                 }}
//                                             >
//                                                 {data.posttag}
//                                             </Text>
//                                         </View> */}
//                                     </View>
//                                 </View>
//                             );
//                         })
//                     )}
//                 </View>
//             </ScrollView>
//             <PostShareSheet ref={sheetRef} />
//             <PostoptionSheet ref={moresheet} />
//         </SafeAreaView>
//     );
// };

// export default ProfilePost;

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, IMAGES, FONTS, SIZES } from '../../constants/theme';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Swiper from 'react-native-swiper';
import LikeBtn from '../../components/likebtn/LikeBtn';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

const API_BASE = 'http://192.168.1.6:5000/api';

const ProfilePost = () => {
    const sheetRef = useRef<any>();
    const moresheet = useRef<any>();
    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused(); // Hook to detect screen focus
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>({
        displayName: '',
        username: '',
        bio: '',
        balance: '',
        profileAvatar: '',
    });

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.warn('No user token found in AsyncStorage');
                return;
            }

            const res = await axios.get(`${API_BASE}/get/all/feeds/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const feeds = res.data.feeds || [];
            const mappedFeeds = feeds
                .filter((item: any) => item.type === 'image')
                .map((item: any) => ({
                    id: item._id,
                    name: item.userName || 'Unknown',
                    image: item.profileAvatar !== 'Unknown'
                        ? { uri: item.profileAvatar }
                        : IMAGES.profile,
                    date: item.timeAgo || 'Unknown',
                    postimage: [{ image: { uri: item.contentUrl } }],
                    like: item.likesCount || 0,
                    comment: item.comments?.length || 0, // Ensure comment count is mapped
                    posttitle: item.caption || '',
                    posttag: item.tags?.join(' ') || '',
                    hasStory: false,
                    isLiked: false,
                    isSaved: false,
                }));

            setPosts(mappedFeeds);
        } catch (error) {
            console.error('Error fetching posts:', error.response?.data || error.message);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
            const res = await fetch(`${API_BASE}/get/profile/detail`, {
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
                });
            } else {
                console.log('Error fetching profile:', data.message);
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
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
        fetchPosts();
        fetchProfile();
    }, [isFocused]); // Refetch posts when screen is focused

    const handleLike = async (postId: string, index: number) => {
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken || !activeAccountType) {
                Alert.alert('Error', 'User not authenticated or account type missing');
                return;
            }

            const newLikeState = !posts[index].isLiked;
            const updatedPosts = [...posts];
            updatedPosts[index] = {
                ...updatedPosts[index],
                isLiked: newLikeState,
                like: newLikeState ? updatedPosts[index].like + 1 : updatedPosts[index].like - 1,
            };
            setPosts(updatedPosts);

            const endpoint = activeAccountType === 'Personal'
                ? `${API_BASE}/user/feed/like`
                : `${API_BASE}/creator/feed/like`;

            const res = await axios.post(
                endpoint,
                { feedId: postId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userToken}`,
                    },
                }
            );

            if (!res.data.success) {
                updatedPosts[index] = {
                    ...updatedPosts[index],
                    isLiked: !newLikeState,
                    like: newLikeState ? updatedPosts[index].like - 1 : updatedPosts[index].like + 1,
                };
                setPosts(updatedPosts);
                // Alert.alert('Error', res.data.message || 'Failed to like/unlike post');
            }
        } catch (error) {
            console.error('Like error:', error);
            const updatedPosts = [...posts];
            updatedPosts[index] = {
                ...updatedPosts[index],
                isLiked: !posts[index].isLiked,
                like: posts[index].isLiked ? updatedPosts[index].like - 1 : updatedPosts[index].like + 1,
            };
            setPosts(updatedPosts);
            Alert.alert('Error', 'Something went wrong while liking post');
        }
    };

    const handleShare = async (imageUrl: string, postOwner: string) => {
        try {
            const fileUri = `${FileSystem.cacheDirectory}sharedImage.jpg`;
            const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/jpeg',
                    dialogTitle: `Share ${postOwner}'s post`,
                    UTI: 'public.jpeg',
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing image:', error);
            Alert.alert('Error', 'Something went wrong while sharing the post');
        }
    };

    const handleDownload = async (imageUrl: string) => {
        try {
            const { status } = await MediaLibrary.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    Alert.alert('Error', 'Permission to access media library was denied');
                    return;
                }
            }

            const fileUri = `${FileSystem.cacheDirectory}downloadedImage.jpg`;
            const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert('Success', 'Image downloaded and saved to gallery!');
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Something went wrong while downloading the image');
        }
    };
    const [isShow, setIsShow] = useState(false);

    return (
        <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
            <Header title="Post" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={GlobalStyleSheet.container}>
                    {loading ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary || colors.title} />
                        </View>
                    ) : posts.length === 0 ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.title }}>No posts found</Text>
                        </View>
                    ) : (
                        posts.map((data, index) => {
                            return (
                                <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -15 }}>
                                    <View style={[GlobalStyleSheet.flexalingjust, { paddingVertical: 10, paddingHorizontal: 15 }]}>
                                        <View style={GlobalStyleSheet.flexaling}>
                                            <View>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        navigation.navigate('status', {
                                                            name: data.name,
                                                            image: data.image,
                                                            statusData: [IMAGES.profilepic17, IMAGES.profilepic18],
                                                        })
                                                    }
                                                >
                                                    <View>
                                                        <Image
                                                            style={{ width: 42, height: 42, borderRadius: 50 }}
                                                            source={data.image}
                                                        />
                                                        <Image
                                                            style={{ width: 50, height: 50, position: 'absolute', bottom: -4, right: -4, resizeMode: 'contain' }}
                                                            source={IMAGES.cricle}
                                                        />
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ marginLeft: 10 }}>
                                                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                                                    <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.title }}>{data.name}</Text>
                                                </TouchableOpacity>
                                                <Text style={{ ...FONTS.fontMedium, fontSize: 11, color: colors.text }}>{data.date}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
                                                <Image
                                                    style={{ width: 18, height: 18, tintColor: colors.title }}
                                                    source={IMAGES.more}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            height: SIZES.width < SIZES.container ? SIZES.width - SIZES.width * 0.2 : SIZES.container - SIZES.container * 0.2,
                                            position: 'relative',
                                        }}
                                    >
                                        <Swiper
                                            height={'auto'}
                                            showsButtons={false}
                                            loop={false}
                                            paginationStyle={{ bottom: 30 }}
                                            dotStyle={{ width: 5, height: 5, backgroundColor: 'rgba(255, 255, 255, 0.40)' }}
                                            activeDotStyle={{ width: 6, height: 6, backgroundColor: '#ffff' }}
                                        >
                                            {data.postimage.map((post: any, index: number) => (
                                                <View key={index} style={{ width: '100%', height: '100%', position: 'relative' }}>
                                                    <Image
                                                        style={{ width: '100%', height: '100%' }}
                                                        source={post.image}
                                                        resizeMode="contain"
                                                    />
                                                    <Image
                                                        source={data.image}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: 48,
                                                            left: 20,
                                                            width: 70,
                                                            height: 70,
                                                            borderRadius: 50,
                                                            borderWidth: 2,
                                                            borderColor: '#fff',
                                                        }}
                                                    />
                                                    <View
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            backgroundColor: '#d2a904ff',
                                                            paddingVertical: 5,
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                fontWeight: 'bold',
                                                                color: '#fff',
                                                            }}
                                                            numberOfLines={1}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {data.name}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </Swiper>
                                    </View>
                                    <View style={{ paddingVertical: 10, paddingHorizontal: 15, paddingBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={[GlobalStyleSheet.flexaling, { gap: 22 }]}>
                                                <View style={GlobalStyleSheet.flexaling}>
                                                    <LikeBtn
                                                        onPress={() => handleLike(data.id, index)}
                                                        color={data.isLiked ? colors.primary : colors.title}
                                                        sizes={'sm'}
                                                        liked={data.isLiked}
                                                    />
                                                    <TouchableOpacity onPress={() => navigation.navigate('like')}>
                                                        <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{data.like}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={async () => {
                                                        try {
                                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                            navigation.navigate('Comments', { feedId: data.id });
                                                        } catch (error) {
                                                            console.log('Haptic error:', error);
                                                            navigation.navigate('Comments', { feedId: data.id });
                                                        }
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Image
                                                            style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: colors.title }}
                                                            source={IMAGES.comment}
                                                        />
                                                        <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>{data.comment}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleShare(data.postimage[0].image.uri, data.name)}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Image
                                                            style={{ width: 24, height: 24, resizeMode: 'contain', tintColor: colors.title }}
                                                            source={IMAGES.share}
                                                        />
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDownload(data.postimage[0].image.uri)}
                                                >
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
                                                            const updatedPosts = [...posts];
                                                            updatedPosts[index] = { ...updatedPosts[index], isSaved: !data.isSaved };
                                                            setPosts(updatedPosts);

                                                            const userToken = await AsyncStorage.getItem('userToken');
                                                            if (!userToken || !activeAccountType) {
                                                                Alert.alert('Error', 'User not authenticated or account type missing');
                                                                return;
                                                            }

                                                            const endpoint = activeAccountType === 'Personal'
                                                                ? `${API_BASE}/user/feed/save`
                                                                : `${API_BASE}/creator/feed/save`;

                                                            const res = await axios.post(
                                                                endpoint,
                                                                { feedId: data.id },
                                                                {
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${userToken}`,
                                                                    },
                                                                }
                                                            );

                                                            if (!res.data.success) {
                                                                updatedPosts[index] = { ...updatedPosts[index], isSaved: !data.isSaved };
                                                                setPosts(updatedPosts);
                                                                Alert.alert('Error', res.data.message || 'Failed to save feed');
                                                            }
                                                        } catch (error) {
                                                            console.error('Save feed error:', error);
                                                            const updatedPosts = [...posts];
                                                            updatedPosts[index] = { ...updatedPosts[index], isSaved: !data.isSaved };
                                                            setPosts(updatedPosts);
                                                            Alert.alert('Error', 'Something went wrong while saving feed');
                                                        }
                                                    }}
                                                >
                                                    <Image
                                                        style={{
                                                            width: 18,
                                                            height: 18,
                                                            resizeMode: 'contain',
                                                            margin: 10,
                                                            tintColor: data.isSaved ? colors.primary : colors.title,
                                                        }}
                                                        source={data.isSaved ? IMAGES.save2 : IMAGES.save}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
            <PostShareSheet ref={sheetRef} />
            <PostoptionSheet ref={moresheet} />
        </SafeAreaView>
    );
};

export default ProfilePost;
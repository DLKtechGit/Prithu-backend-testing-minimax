import React, { useEffect, useState } from 'react';

import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';

import { COLORS, FONTS, IMAGES, SIZES } from '../constants/theme';

import Swiper from 'react-native-swiper';

import { useNavigation } from '@react-navigation/native';

import LikeBtn from './likebtn/LikeBtn';

import { GlobalStyleSheet } from '../constants/styleSheet';

import { useTheme } from '@react-navigation/native';

import { Video } from 'expo-av';

import { Share } from "react-native"

import * as Sharing from 'expo-sharing';

import * as FileSystem from 'expo-file-system';

import * as MediaLibrary from 'expo-media-library';

import BottomSheetComments from './bottomsheet/BottomSheetComments';

import { useRef } from 'react';

import CommentSheet from '../screens/comment/CommentSheet';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Haptics from 'expo-haptics'; // Add this



const PostCard = ({ id, name, profileimage, date, postimage, like, comment, posttitle, posttag, sheetRef, optionSheet, hasStory, reelsvideo, caption, background, visibleBoxes,setSelectedPostId, }: any) => {



    const navigation = useNavigation<any>();
  


    // ✅ Account type state
    const [activeAccountType, setActiveAccountType] = useState<string | null>(null);

    // ✅ Like state
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(like || 0);
    // Helper to build full URL for avatars/images
const buildUrl = (path: string | undefined | null) => {
  if (!path) return '';
  return `https://ddbb.onrender.com/${path.replace(/\\/g, '/')}`;
};



    const [profile, setProfile] = useState<any>({

        displayName: '',

        username: '',

        bio: '',

        balance: '',

        profileAvatar: '',

    });

    // 🔹 Fetch active account type once
    useEffect(() => {
        const fetchAccountType = async () => {
            try {
                const storedType = await AsyncStorage.getItem("activeAccountType");
                console.log(storedType)
                if (storedType) setActiveAccountType(storedType);
            } catch (err) {
                console.log("Error fetching account type:", err);
            }
        };
        fetchAccountType();
    }, []);

    // 🔹 Fetch profile
    const fetchProfile = async () => {

        try {

            const userToken = await AsyncStorage.getItem('userToken');

            if (!userToken) {

                Alert.alert('Error', 'User not authenticated');

                return;

            }



            const res = await fetch('https://ddbb.onrender.com/api/get/profile/detail', {

                method: 'GET',

                headers: {

                    Authorization: `Bearer ${userToken}`,

                },

            });

            const data = await res.json();



            if (res.ok && data.profile) {

                const profileData = data.profile;

                const fixedAvatar = profileData.profileAvatar


                setProfile({

                    displayName: profileData.displayName || '',

                    username: data.userName || '',

                    bio: profileData.bio || '',

                    balance: profileData.balance || '',

                    profileAvatar: fixedAvatar,

                });

            } else {

                console.log('Error fetching profile:', data.message);

                // Alert.alert('Error', data.message || 'Failed to fetch profile');

            }

        } catch (err) {

            console.error('Fetch profile error:', err);

            // Alert.alert('Error', 'Failed to fetch profile');

        }

    };

    useEffect(() => {

        fetchProfile();

    }, []);



    const theme = useTheme();

    const { colors }: { colors: any } = theme;



    const [isShow, setIsShow] = useState(false);



    const [show, setshow] = React.useState(true);

    const [mute, setmute] = React.useState(false);



    const video = React.useRef(null);

    const commentSheetRef = useRef(null);



 const handleLike = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    const accountType = await AsyncStorage.getItem('activeAccountType');

    if (!userToken) {
      Alert.alert('Error', 'User not authenticated or account type missing');
      return;
    }

    // Toggle UI optimistically
    const newLikeState = !isLiked;
    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : prev - 1);

    const endpoint =
      accountType === 'Personal'
        ? 'https://ddbb.onrender.com/api/user/feed/like'
        : 'https://ddbb.onrender.com/api/creator/feed/like';

    

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ feedId: id }),
    });

    const data = await res.json();
    console.log(data)
    if (!res.ok) {
      // revert if failed
      setIsLiked(!newLikeState);
      setLikeCount(prev => newLikeState ? prev - 1 : prev + 1);
      Alert.alert('Error', data.message || 'Failed to like/unlike post');
    }
  } catch (error) {
    console.error('Like error:', error);
    // revert
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    Alert.alert('Error', 'Something went wrong while liking post');
  }
};



  return (

        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -15 }}>

            <View style={[GlobalStyleSheet.flexalingjust, { paddingVertical: 5, paddingHorizontal: 15, paddingRight: 5 }]}>

                <View style={GlobalStyleSheet.flexaling}>

                    <View>

                        <TouchableOpacity

                            onPress={() => {

                                hasStory == false ?

                                    navigation.navigate("AnotherProfile", { feedId: id })

                                    :

                                    navigation.navigate('status', {

                                        name: name,

                                        image: profileimage,

                                        statusData: [IMAGES.profilepic11, IMAGES.profilepic12]

                                    })

                            }}

                        >

                            {

                                hasStory == true ?

                                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>

                                        <Image

                                            style={{ width: 40, height: 40, borderRadius: 50 }}

                                            source={

                                                profileimage

                                                    ? { uri: profileimage }

                                                    : { uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }

                                            }

                                        />



                                        <Image

                                            style={{ width: 48, height: 48, position: 'absolute', resizeMode: 'contain' }}

                                            source={IMAGES.cricle}

                                        />

                                    </View>

                                    :

                                    <View>

                                        <Image

                                            style={{ width: 40, height: 40, borderRadius: 50 }}

                                            source={

                                                profileimage

                                                    ? { uri: profileimage }

                                                    : { uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }

                                            }

                                        />



                                    </View>

                            }



                        </TouchableOpacity>

                    </View>

                    <View style={{ marginLeft: 10 }}>

                        <TouchableOpacity

                            onPress={() => navigation.navigate('AnotherProfile')}

                        >

                            <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.title }}>{name}</Text>

                        </TouchableOpacity>

                        <Text style={{ ...FONTS.fontMedium, fontSize: 11, color: colors.text }}>{date}</Text>

                    </View>

                </View>

              

                    {/* <TouchableOpacity

                        onPress={() => sheetRef.current.openSheet()}

                    >

                        <Image

                            style={{

                                width: 18,

                                height: 18,

                                margin: 10,

                                tintColor: colors.title,

                            }}

                            source={IMAGES.share}

                        />

                    </TouchableOpacity> */}

         {/* it is a column button    */}



                <View style={{ flexDirection: 'row' }}>

  <TouchableOpacity
                        onPress={() => optionSheet.current.openSheet()}
                    >
                        <Image
                            style={{ width: 18, height: 18, margin: 10, tintColor: colors.title, }}
                            source={IMAGES.more}
                        />
                    </TouchableOpacity>


                </View>



                {/* to this column button */}

            </View>

            {reelsvideo ?

                <TouchableOpacity

                    style={{

                        height: SIZES.width < SIZES.container ? SIZES.width - (SIZES.width * (0 / 100)) : SIZES.container - (SIZES.container * (0 / 100)),

                    }}



                    onPress={() => navigation.navigate('Reels')}

                >

                    {/* <Video

                        resizeMode="cover"

                        style={{ width: '100%', height: '100%', }}

                        source={reelsvideo}

                        muted={mute}

                        repeat={true}

                        paused={visibleBoxes.includes(id) ? false : true }

                       

                    /> */}

                    <Video

                        ref={video}

                        source={reelsvideo}

                        useNativeControls={false}

                        resizeMode={'cover'}

                        isLooping

                        style={{

                            width: '100%',

                            height: '100%',

                            // position: 'absolute',

                        }}

                    />

                    <TouchableOpacity style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', bottom: 5, right: 5 }}

                        onPress={() => {

                            setmute(!mute)

                        }}

                    >

                        <View style={{

                            backgroundColor: 'rgba(0,0,0,.6)',

                            width: 30,

                            height: 30,

                            borderRadius: 50

                        }}></View>

                        <Image

                            style={[GlobalStyleSheet.image, { position: 'absolute', tintColor: COLORS.white }]}

                            source={mute ?

                                IMAGES.volumemute

                                :

                                IMAGES.volume

                            }

                        />

                    </TouchableOpacity>

                </TouchableOpacity>

                : caption ?

                    <View

                        style={{

                            height: SIZES.width < SIZES.container ? SIZES.width - (SIZES.width * (20 / 100)) : SIZES.container - (SIZES.container * (20 / 100)),

                            backgroundColor: background,

                            alignItems: 'center',

                            justifyContent: 'center'

                        }}

                    >

                        <View>

                            <Text style={[GlobalStyleSheet.textfont, { ...FONTS.h4, color: COLORS.white }]}>{caption}</Text>

                        </View>



                    </View>

                    :

                    <View

                        style={{

                            height:

                                SIZES.width < SIZES.container

                                    ? SIZES.width - SIZES.width * 0.04

                                    : SIZES.container - SIZES.container * 0.1,

                            position: "relative",

                        }}

                    >

                        <Swiper

                            height={"auto"}

                            showsButtons={false}

                            loop={false}

                            paginationStyle={{

                                bottom: 10,

                            }}

                            dotStyle={{

                                width: 5,

                                height: 5,

                                backgroundColor: "rgba(255, 255, 255, 0.40)",

                            }}

                            activeDotStyle={{

                                width: 6,

                                height: 6,

                                backgroundColor: "#fff",

                            }}

                        >

                            {postimage.map((data: any, index: any) => {

                                return (

                                    <View

                                        key={index}

                                        style={{ width: "100%", height: "100%", position: "relative" }}

                                    >

                                        {/* Post Image */}

                                        <Image

                                            style={{ width: "100%", height: "100%" }}

                                            source={{ uri: data.image }}

                                            resizeMode="contain"

                                        />



                                       {/* ✅ Profile avatar (bottom-left) */}
{/* ✅ Profile avatar (bottom-left) */}
<Image
  source={
    profile.profileAvatar
      ? { uri: buildUrl(profile.profileAvatar) } // ✅ full URL just here
      : IMAGES.profile
  }
  style={{
    position: "absolute",
    bottom: 48,
    left: 20,
    width: 70,
    height: 70,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
  }}
/>


{/* ✅ Profile name bar (full width at bottom) */}
<View
  style={{
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",             // full width of post
    backgroundColor: "#d2a904ff",   // white background
    paddingVertical: 5,
    alignItems: "center",      // center text horizontally
  }}
>
  <Text
    style={{
      fontSize: 16,
      fontWeight: "bold",
      color: "#fff",            // black text
    }}
    numberOfLines={1}           // optional: keep single line
    ellipsizeMode="tail"
  >
    {profile.displayName}
  </Text>
</View>
                                    </View>

                                );

                            })}

                        </Swiper>

                    </View>





            }

            <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingRight: 5 }}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

                    <View style={[GlobalStyleSheet.flexaling, { gap: 22 }]}>

           {/* ✅ Like Button */}
<View style={GlobalStyleSheet.flexaling}>
  <LikeBtn
    onPress={handleLike} // pass it directly
    color={isLiked ? colors.primary : colors.title}
    sizes={'sm'}
    liked={isLiked}
  />
  <TouchableOpacity >
    <Text style={[GlobalStyleSheet.postlike, { color: colors.title }]}>
      {likeCount}
    </Text>
  </TouchableOpacity>
</View>



                      
<TouchableOpacity
  onPress={async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Optional haptic
      navigation.navigate('Comments', { feedId: id }); // Pass feedId
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
  </View>
</TouchableOpacity>
                        <TouchableOpacity

                            onPress={async () => {

                                try {

                                    if (postimage && postimage.length > 0) {

                                        const imageUrl = postimage[0].image; // first image of post

                                        const fileUri = FileSystem.cacheDirectory + "sharedImage.jpg";



                                        // Download image to local cache

                                        const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);



                                        // Share only if available

                                        if (await Sharing.isAvailableAsync()) {

                                            await Sharing.shareAsync(uri, {

                                                mimeType: "image/jpeg",

                                                dialogTitle: `Share ${name}'s post`,

                                                UTI: "public.jpeg", // for iOS

                                            });

                                        } else {

                                            alert("Sharing is not available on this device");

                                        }

                                    } else {

                                        alert("No image to share");

                                    }

                                } catch (error) {

                                    console.log("Error sharing image:", error);

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


{/* 
                        <TouchableOpacity

                            onPress={async () => {

                                try {

                                    if (postimage && postimage.length > 0) {

                                        const imageUrl = postimage[0].image; // first image of post

                                        const fileUri = FileSystem.cacheDirectory + "downloadedImage.jpg";



                                        // Download image to local cache

                                        const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);



                                        // Request permission

                                        const { status } = await MediaLibrary.requestPermissionsAsync();

                                        if (status === 'granted') {

                                            const asset = await MediaLibrary.createAssetAsync(uri);

                                            await MediaLibrary.createAlbumAsync("MyApp", asset, false); // optional: create album

                                            alert("Image saved to gallery!");

                                        } else {

                                            alert("Permission denied to save image.");

                                        }

                                    } else {

                                        alert("No image to download");

                                    }

                                } catch (error) {

                                    console.log("Error downloading image:", error);

                                }

                            }}

                        >

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                                <Image

                                    style={{ width: 28, height: 28, resizeMode: 'contain', tintColor: colors.title }}

                                    source={IMAGES.download} // add your download icon in IMAGES

                                />

                            </View>

                        </TouchableOpacity> */}

                        <TouchableOpacity
  onPress={() => {
    // 👇 Navigate to another page instead of downloading
    navigation.navigate("Subcribe", {
      postId: id,
      images: postimage,
      owner: name,
    });
  }}
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
                                    setshow(!show);

                                    const userToken = await AsyncStorage.getItem('userToken');
                                    const accountType = await AsyncStorage.getItem('activeAccountType'); // "creator" or "personal"

                                    if (!userToken) {
                                        console.log("token received:", userToken, "accountType received:", accountType);
                                        Alert.alert('Error', 'User not authenticated or account type missing');
                                        return;
                                    }

                                    // pick endpoint based on role
                                    const endpoint =
                                        accountType === 'Personal'
                                            ? 'https://ddbb.onrender.com/api/user/feed/save'
                                            : 'https://ddbb.onrender.com/api/creator/feed/save';

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

                {/* <View style={{ marginTop: 5 }}>

                    <View style={{ paddingRight: 35 }}>

                        <Text numberOfLines={isShow ? 0 : 2} style={{ ...FONTS.fontRegular, color: colors.title, fontSize: 13 }}>{posttitle}</Text>

                        {isShow === false &&

                            <TouchableOpacity

                                onPress={() => setIsShow(true)}

                                style={{ position: 'absolute', bottom: -4, right: 0 }}

                            >

                                <Text style={{ ...FONTS.fontRegular, color: theme.dark ? 'rgba(255,255,255,0.5)' : 'rgba(71, 90, 119, 0.50)', fontSize: 13 }}>more</Text>

                            </TouchableOpacity>

                        }

                    </View>

                    <Text style={{ ...FONTS.fontRegular, color: theme.dark ? 'rgba(255,255,255,0.4)' : '#475A77', fontSize: 13 }}>{posttag}</Text>

                </View> */}



            </View>

            {/* <CommentSheet ref={commentSheetRef} />  */}

        </View>

    )

}



export default PostCard


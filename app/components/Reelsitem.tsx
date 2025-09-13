import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import { COLORS, FONTS, IMAGES } from '../constants/theme';
import LikeBtn from './likebtn/LikeBtn';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // 👈 add useIsFocused
import { GlobalStyleSheet } from '../constants/styleSheet';

const Reelsitem = ({
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
}: any) => {
  const navigation = useNavigation<any>();
  const video = useRef<Video>(null);
   const isFocused = useIsFocused(); // 👈 check if screen is focused
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isShowText, setIsShowText] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // ✅ Handle play/pause based on "autoplay" prop
// Play/pause based on autoplay
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
  }, [autoplay, isFocused]); // 👈 add isFocused

  // ✅ Pause when component unmounts (good cleanup)
  useEffect(() => {
    return () => {
      if (video.current) {
        video.current.pauseAsync();
      }
    };
  }, []);

  // Tap handler (play/pause toggle)
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

  return (
    <View style={[GlobalStyleSheet.container, { padding: 0, flex: 1, backgroundColor: '#000' }]}>
      {/* Video Player */}
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleTap}>
        <Video
          ref={video}
          source={reelsvideo}
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
          resizeMode="cover"
          isLooping
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
      <View style={{ position: 'absolute', bottom: 20, left: 20, paddingRight: 120 }}>
        <View style={GlobalStyleSheet.flexaling}>
          {/* Profile Image */}
          <TouchableOpacity
            onPress={() =>
              hasStory === false
                ? navigation.navigate('status', {
                    name: holder,
                    image: image,
                    statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                  })
                : navigation.navigate('AnotherProfile')
            }
            style={{ marginRight: 20 }}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Image style={{ width: 45, height: 45, borderRadius: 50 }} source={image} />
              {hasStory === false && (
                <Image style={{ width: 55, height: 55, position: 'absolute' }} source={IMAGES.cricle} />
              )}
            </View>
          </TouchableOpacity>

          {/* Creator Name */}
          <TouchableOpacity onPress={() => navigation.navigate('AnotherProfile')}>
            <Text style={{ ...FONTS.font, ...FONTS.fontMedium, color: COLORS.white }}>{holder}</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={{ marginTop: 20 }}>
          <Text numberOfLines={isShowText ? 0 : 1} style={{ ...FONTS.fontRegular, color: COLORS.white, fontSize: 12 }}>
            {text}
          </Text>
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
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Music')} style={GlobalStyleSheet.flexaling}>
            <Image style={{ width: 15, height: 15, tintColor: '#fff', resizeMode: 'contain' }} source={IMAGES.music} />
            <Text style={{ ...FONTS.fontRegular, color: COLORS.white, fontSize: 11, marginLeft: 5 }}>{music}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Right-side buttons */}
      <View style={{ position: 'absolute', bottom: 30, right: 20 }}>
        {/* Like */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity>
            <View style={GlobalStyleSheet.background}>
              <LikeBtn color={'#fff'} sizes={'sm'} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('like')}>
            <Text style={GlobalStyleSheet.Text}>{like}</Text>
          </TouchableOpacity>
        </View>

        {/* Comment */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Comments')}>
            <View style={GlobalStyleSheet.background}>
              <Image style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]} source={IMAGES.comment} />
            </View>
          </TouchableOpacity>
          <Text style={GlobalStyleSheet.Text}>{comment}</Text>
        </View>

        {/* Save */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setIsSaved(!isSaved)}>
            <View style={GlobalStyleSheet.background}>
              <Image
                style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]}
                source={isSaved ? IMAGES.save : IMAGES.save2}
              />
            </View>
          </TouchableOpacity>
          <Text style={GlobalStyleSheet.Text}>{save}</Text>
        </View>

        {/* Share */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => sheetRef.current.openSheet('PostShare')}>
            <View style={GlobalStyleSheet.background}>
              <Image style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]} source={IMAGES.send} />
            </View>
          </TouchableOpacity>
          <Text style={GlobalStyleSheet.Text}>{send}</Text>
        </View>
      </View>
    </View>
  );
};

export default Reelsitem;

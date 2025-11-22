


import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, FlatList, Modal, ActivityIndicator } from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { ScrollView } from 'react-native-gesture-handler';
import { COLORS, IMAGES, FONTS } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

type AddStoryScreenProps = StackScreenProps<RootStackParamList, 'AddStory'>;

const StoryData = [
  { id: '1', backgroundColor: '#00abc5', image: IMAGES.profilepic, text: 'Images', navigate: 'Music2' },
  { id: '2', backgroundColor: '#8c55e2', image: IMAGES.reels, text: 'Reels' },
  // { id: '3', backgroundColor: '#f151a7', image: IMAGES.text,       text: 'Text',   navigate: 'WriteCaption' },
];

const AddStory = ({ navigation }: AddStoryScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const [gallery, setGallery] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'image' | 'video' | null>(null); // from gallery item
  const [selectedCategory, setSelectedCategory] = useState<'image' | 'video' | 'text' | null>(null); // top grid choice

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Pick media manually
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      // allowsEditing: true,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const type = result.assets[0].type === 'video' ? 'video' : 'image';
      setSelectedMedia(uri);
      setSelectedType(type);
      setGallery(prev => [{ uri, type }, ...prev]);
      // Do NOT auto-select top grid; user must choose it explicitly.
    }
  };

  // ✅ Load device gallery after navigation finishes
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadGallery = async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const media = await MediaLibrary.getAssetsAsync({
            mediaType: ['photo', 'video'],
            first: 50,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });

          if (!isActive) return;

          const assets = media.assets.map((a) => ({
            uri: a.uri,
            type: a.mediaType === MediaLibrary.MediaType.video ? 'video' : 'image',
          }));

          setGallery(assets);

          // Auto-open picker only if gallery is empty, after small delay
          if (assets.length === 0) {
            setTimeout(async () => {
              if (isActive) await pickMedia();
            }, 400); // 400ms delay avoids transition glitch
          }
        }
      };

      loadGallery();

      return () => {
        isActive = false;
      };
    }, [])
  );


  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const type = result.assets[0].type === 'video' ? 'video' : 'image';
      setSelectedMedia(uri);
      setSelectedType(type);
      setGallery(prev => [{ uri, type }, ...prev]);
    }
  };


  // Helper: is selection valid & matching?
  const isMatch = (() => {
    if (!selectedType || !selectedCategory) return false;
    if (selectedCategory === 'text') return false;
    return selectedType === selectedCategory;
  })();

  const canProceed = Boolean(selectedMedia && selectedType && selectedCategory && isMatch);

  const handleNext = () => {
    if (!selectedMedia) {
      setIsSuccess(false);
      setPopupMessage('Select Media');
      setPopupSubtitle('Please pick an image or video from your gallery.');
      setShowPopup(true);
      return;
    }
    if (!selectedCategory) {
      setIsSuccess(false);
      setPopupMessage('Choose a Type');
      setPopupSubtitle('Please select Images or Reels at the top.');
      setShowPopup(true);
      return;
    }
    if (selectedCategory === 'text') {
      setIsSuccess(false);
      setPopupMessage('Invalid Choice');
      setPopupSubtitle('Top selection "Text" can\'t be used with gallery media.');
      setShowPopup(true);
      return;
    }
    if (!isMatch) {
      setIsSuccess(false);
      setPopupMessage('Type Mismatch');
      setPopupSubtitle(
        selectedType === 'image'
          ? 'You selected an image; please choose the "Images" grid.'
          : 'You selected a video; please choose the "Reels" grid.'
      );
      setShowPopup(true);
      return;
    }

    // Pass along to Nextpage (upload logic remains in Nextpage.handlePost)
    console.log("Navigating with:", selectedMedia, selectedType);
    navigation.navigate('Nextpage', {
      mediaUrl: selectedMedia,
      mediaType: selectedType, // 'image' | 'video'
    }
    );
  };

  // Instagram-like Popup Component
  const Popup = () => (
    <Modal
      transparent={true}
      visible={showPopup}
      animationType="fade"
      onRequestClose={() => setShowPopup(false)}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 30,
          alignItems: 'center',
          width: '85%',
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 15,
        }}>
          {/* Success/Error Icon */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isSuccess ? '#E8F5E9' : '#FFEBEE',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 40,
            }}>{isSuccess ? '✓' : '⚠'}</Text>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.title,
            textAlign: 'center',
            marginBottom: 10,
          }}>{popupMessage}</Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: 15,
            color: colors.text,
            textAlign: 'center',
            marginBottom: 25,
            opacity: 0.8,
          }}>{popupSubtitle}</Text>

          {/* Action Button */}
          <TouchableOpacity
            style={{
              backgroundColor: isSuccess ? '#4CAF50' : '#FF9800',
              paddingVertical: 14,
              paddingHorizontal: 40,
              borderRadius: 25,
              width: '100%',
              shadowColor: isSuccess ? '#4CAF50' : '#FF9800',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={() => setShowPopup(false)}
          >
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, backgroundColor: colors.card, flex: 1 }]}>
      {/* Header with Next button (enabled only when canProceed) */}
      <Header
        title="Create story"
        next={true}
        onPress={handleNext}
      // If your Header supports a disabled style, you can pass a flag via props.
      // Otherwise we still hard-guard in handleNext above.
      />

      {/* Top Story Options */}
      <View style={[GlobalStyleSheet.container, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 }]}>
        {StoryData.map((data: any) => {
          const cat: 'image' | 'video' | 'text' =
            data.text.toLowerCase() === 'images' ? 'image' :
              data.text.toLowerCase() === 'reels' ? 'video' : 'text';

          const isSelectedTop = selectedCategory === cat;

          return (
            <View key={data.id}>
              <TouchableOpacity
                style={{
                  backgroundColor: data.backgroundColor,
                  width: 100,
                  height: 150,
                  borderRadius: 8,
                  marginHorizontal: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: isSelectedTop ? 3 : 0,
                  borderColor: isSelectedTop ? COLORS.grey : 'transparent', // grey border when selected
                }}
                onPress={() => {
                  setSelectedCategory(cat);

                  // If Text → go immediately (your existing behavior)
                  if (cat === 'text' && data.navigate) {
                    navigation.navigate(data.navigate);
                  }
                }}
              >
                <View style={{ backgroundColor: COLORS.white, width: 50, height: 50, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <Image style={{ width: 25, height: 25, resizeMode: 'contain' }} source={data.image} />
                </View>
                <Text style={[GlobalStyleSheet.textfont, { color: COLORS.white }]}>{data.text}</Text>

                {/* Optional small tick on selected top tile (mirrors gallery tick) */}
                {isSelectedTop && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 22, // ✅ fixed size for circular shape
                      height: 22,
                      borderRadius: 11, // ✅ perfect circle
                      backgroundColor: '#41c124', // ✅ bright green background
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      source={IMAGES.check}
                      style={{
                        width: 12,
                        height: 12,
                        tintColor: '#fff', // ✅ white tick
                        resizeMode: 'contain',
                      }}
                    />
                  </View>
                )}

              </TouchableOpacity>

              {/* Small helper text if there’s a mismatch */}
              {selectedMedia && selectedType && isSelectedTop && selectedCategory !== 'text' && !isMatch && (
                <Text style={{ color: colors.title, opacity: 0.7, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                  {selectedType === 'image' ? 'Pick “Images” for photos' : 'Pick “Reels” for videos'}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Gallery Header */}
      <View style={[GlobalStyleSheet.flexaling, { paddingHorizontal: 15, marginTop: 30 }]}>
        <Text style={{ flex: 1, ...FONTS.fontMedium, ...FONTS.h5, color: colors.title }}>Gallery</Text>

        {/* Camera button */}
        <TouchableOpacity style={{ padding: 10 }} onPress={openCamera}>
          <Image style={{ height: 24, width: 24, tintColor: colors.title }} source={IMAGES.camera} />
        </TouchableOpacity>

        {/* File button (opens gallery picker) */}
        <TouchableOpacity style={{ padding: 10 }} onPress={pickMedia}>
          <Image style={{ height: 24, width: 24, tintColor: colors.title }} source={IMAGES.profilepic} />
        </TouchableOpacity>
      </View>


      {/* Gallery Grid */}
      <FlatList
        data={gallery}
        numColumns={4}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const isSelected = selectedMedia === item.uri;
          return (
            <TouchableOpacity
              onPress={() => {
                setSelectedMedia(item.uri);
                setSelectedType(item.type); // type from gallery
                // Do not auto-set top category; user must choose explicitly.
              }}
              style={{ width: '25%', aspectRatio: 1, padding: 1 }}
            >
              <Image style={{ width: '100%', height: '100%' }} source={{ uri: item.uri }} />

              {/* Video play icon */}
              {item.type === 'video' && (
                <View
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: -12 }, { translateY: -12 }],
                  }}
                >
                  <Image source={IMAGES.play} style={{ width: 24, height: 24, tintColor: '#fff' }} />
                </View>
              )}

              {/* Tick mark when selected */}
              {isSelected && (
                <View
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    backgroundColor: '#41c124',
                    borderRadius: 12,
                    padding: 3,
                  }}
                >
                  <Image source={IMAGES.check} style={{ width: 10, height: 10, tintColor: '#fff' }} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.title }}>No Media Found</Text>
        }
      />

      {/* (Optional) subtle hint bar for the Next availability */}
      {!canProceed && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          {/* <Text style={{ color: colors.title, opacity: 0.65, fontSize: 12 }}>
            Select a gallery item, then pick the matching top card ({' '}
            <Text style={{ fontWeight: '600' }}>Images</Text> for photos, <Text style={{ fontWeight: '600' }}>Reels</Text> for videos ).
          </Text> */}
        </View>
      )}

      {/* Popup Modal */}
      <Popup />
    </SafeAreaView>
  );
};

export default AddStory;

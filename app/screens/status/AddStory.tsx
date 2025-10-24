// import React from 'react';
// import { View, Text, SafeAreaView, Image, TouchableOpacity, FlatList } from 'react-native';
// import { useTheme } from '@react-navigation/native';
// import Header from '../../layout/Header';
// import { GlobalStyleSheet } from '../../constants/styleSheet';
// import { ScrollView } from 'react-native-gesture-handler';
// import { COLORS, IMAGES, FONTS, SIZES } from '../../constants/theme';
// import { StackScreenProps } from '@react-navigation/stack';
// import { RootStackParamList } from '../../Navigations/RootStackParamList';
// import * as MediaLibrary from 'expo-media-library';
// import * as ImagePicker from 'expo-image-picker';
// import { useState, useEffect } from 'react';

// const StoryData = [
//   {
//     id: '1',
//     backgroundColor: '#00abc5',
//     image: IMAGES.profilepic,
//     text: 'Images',
//     navigate: "Music2"
//   },
//   {
//     id: '2',
//     backgroundColor: '#8c55e2',
//     image: IMAGES.reels,
//     text: 'Reels',


//   },
//   {
//     id: '3',
//     backgroundColor: '#f151a7',
//     image: IMAGES.text,
//     text: 'Text',
//     navigate: "WriteCaption"
//   },
// ]
// type AddStoryScreenProps = StackScreenProps<RootStackParamList, 'AddStory'>;

// const AddStory = ({ navigation }: AddStoryScreenProps) => {

//   const theme = useTheme();
//   const { colors }: { colors: any } = theme;

//   const [gallery, setGallery] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
//   const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
//   const [selectedType, setSelectedType] = useState<'image' | 'video' | null>(null);
//   const [selectedCategory, setSelectedCategory] = useState<'image' | 'video' | 'text' | null>(null);



//   // Pick media manually
//   const pickMedia = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.All,
//       allowsEditing: true,
//       quality: 1,
//       videoMaxDuration: 60,
//     });

//     if (!result.canceled) {
//       const uri = result.assets[0].uri;
//       const type = result.assets[0].type === 'video' ? 'video' : 'image';
//       setSelectedMedia(uri);
//       setSelectedType(type);
//       setGallery([{ uri, type }, ...gallery]);
//     }
//   };

//   // Load device gallery
//   useEffect(() => {
//     (async () => {
//       const { status } = await MediaLibrary.requestPermissionsAsync();
//       if (status === 'granted') {
//         const media = await MediaLibrary.getAssetsAsync({
//           mediaType: ['photo', 'video'],
//           first: 50,
//           sortBy: [[MediaLibrary.SortBy.creationTime, false]],
//         });

//         const assets = media.assets.map((a) => ({
//           uri: a.uri,
//           type: a.mediaType === MediaLibrary.MediaType.video ? 'video' : 'image',
//         }));
//         setGallery(assets);

//         if (assets.length > 0) {
//             setGallery(assets);
//         } else {
//           await pickMedia();
//         }
//       }
//     })();
//   }, []);

//   return (
//     <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, backgroundColor: colors.card, flex: 1 }]}>
//       <Header title='Create story' />

//       {/* Top Story Options */}
//       <View style={[GlobalStyleSheet.container, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 }]}>
//         {StoryData.map((data: any, index) => {
//           return (
//             <View key={index}>
//               <TouchableOpacity
//                 style={{
//                   backgroundColor: data.backgroundColor,
//                   width: 100,
//                   height: 150,
//                   borderRadius: 8,
//                   marginHorizontal: 10,
//                   justifyContent: 'center',
//                   alignItems: 'center',
//                   borderWidth: selectedCategory === (data.text.toLowerCase() === "images" ? "image" : data.text.toLowerCase() === "reels" ? "video" : "text") ? 3 : 0,
//                   borderColor: COLORS.white,
//                 }}
//                 onPress={() => {
//                   if (data.text === "Images") setSelectedCategory("image");
//                   else if (data.text === "Reels") setSelectedCategory("video");
//                   else if (data.text === "Text") {
//                     setSelectedCategory("text");
//                     data.navigate && navigation.navigate(data.navigate);
//                   }
//                 }}
//               >
//                 <View style={{ backgroundColor: COLORS.white, width: 50, height: 50, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
//                   <Image style={{ width: 25, height: 25, resizeMode: 'contain' }} source={data.image} />
//                 </View>
//                 <Text style={[GlobalStyleSheet.textfont, { color: COLORS.white }]}>{data.text}</Text>
//               </TouchableOpacity>
//             </View>
//           );
//         })}
//       </View>

//       {/* Gallery Header */}
//       <View style={[GlobalStyleSheet.flexaling, { paddingHorizontal: 15, marginTop: 30 }]}>
//         <Text style={{ flex: 1, ...FONTS.fontMedium, ...FONTS.h5, color: colors.title }}>Gallery</Text>
//         <TouchableOpacity style={{ padding: 10 }} onPress={pickMedia}>
//           <Image style={{ height: 24, width: 24, tintColor: colors.title }} source={IMAGES.camera} />
//         </TouchableOpacity>
//       </View>

//       {/* Gallery Grid */}
//       <FlatList
//         data={gallery}
//         numColumns={4}
//         keyExtractor={(item, index) => index.toString()}
//         renderItem={({ item }) => {
//           const isSelected = selectedMedia === item.uri;
//           return (
//             <TouchableOpacity
//               onPress={() => {
//                 setSelectedMedia(item.uri);
//                 setSelectedType(selectedCategory || item.type); // prefer category if chosen
//               }}
//               style={{ width: '25%', aspectRatio: 1, padding: 1 }}
//             >
//               <Image style={{ width: '100%', height: '100%' }} source={{ uri: item.uri }} />

//               {/* Video play icon */}
//               {item.type === 'video' && (
//                 <View
//                   style={{
//                     position: 'absolute',
//                     top: '50%',
//                     left: '50%',
//                     transform: [{ translateX: -12 }, { translateY: -12 }],
//                   }}
//                 >
//                   <Image source={IMAGES.play} style={{ width: 24, height: 24, tintColor: '#fff' }} />
//                 </View>
//               )}

//               {/* Tick mark when selected */}
//               {isSelected && (
//                 <View
//                   style={{
//                     position: 'absolute',
//                     top: 5,
//                     right: 5,
//                     backgroundColor: COLORS.blue,
//                     borderRadius: 12,
//                     padding: 3,
//                   }}
//                 >
//                   <Image
//                     source={IMAGES.check} // 👈 make sure you have a tick/check icon in IMAGES
//                     style={{ width: 16, height: 16, tintColor: '#fff' }}
//                   />
//                 </View>
//               )}
//             </TouchableOpacity>
//           );
//         }}
//         ListEmptyComponent={
//           <Text style={{ textAlign: 'center', marginTop: 20, color: colors.title }}>No Media Found</Text>
//         }
//       />
//     </SafeAreaView>
//   );
// }

// export default AddStory




import React, { useState, useEffect ,useCallback} from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useTheme,useFocusEffect } from '@react-navigation/native';
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
  { id: '2', backgroundColor: '#8c55e2', image: IMAGES.reels,      text: 'Reels' },
  { id: '3', backgroundColor: '#f151a7', image: IMAGES.text,       text: 'Text',   navigate: 'WriteCaption' },
];

const AddStory = ({ navigation }: AddStoryScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const [gallery, setGallery] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'image' | 'video' | null>(null); // from gallery item
  const [selectedCategory, setSelectedCategory] = useState<'image' | 'video' | 'text' | null>(null); // top grid choice

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
      Alert.alert('Select media', 'Please pick an image or video from your gallery.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Choose a type', 'Please select Images or Reels at the top.');
      return;
    }
    if (selectedCategory === 'text') {
      Alert.alert('Invalid choice', 'Top selection “Text” can’t be used with gallery media.');
      return;
    }
    if (!isMatch) {
      Alert.alert(
        'Type mismatch',
        selectedType === 'image'
          ? 'You selected an image; please choose the “Images” grid.'
          : 'You selected a video; please choose the “Reels” grid.'
      );
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
            data.text.toLowerCase() === 'reels'  ? 'video' : 'text';

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
                  <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.grey, borderRadius: 12, padding: 3 }}>
                    <Image source={IMAGES.check} style={{ width: 16, height: 16, tintColor: '#fff' }} />
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
                    backgroundColor: COLORS.grey,
                    borderRadius: 12,
                    padding: 3,
                  }}
                >
                  <Image source={IMAGES.check} style={{ width: 16, height: 16, tintColor: '#fff' }} />
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
    </SafeAreaView>
  );
};

export default AddStory;

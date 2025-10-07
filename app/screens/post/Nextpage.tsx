// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   Image,
//   TextInput,
//   KeyboardAvoidingView,
//   Alert,
// } from 'react-native';
// import { Video } from 'expo-av';
// import { useTheme } from '@react-navigation/native';
// import Header from '../../layout/Header';
// import { IMAGES, SIZES } from '../../constants/theme';
// import { GlobalStyleSheet } from '../../constants/styleSheet';
// import { ScrollView } from 'react-native-gesture-handler';
// import { StackScreenProps } from '@react-navigation/stack';
// import { RootStackParamList } from '../../Navigations/RootStackParamList';
// import { Picker } from '@react-native-picker/picker';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
 
// type NextpageScreenProps = StackScreenProps<RootStackParamList, 'Nextpage'>;
 
// type Category = {
//   categoryId: string;
//   categoriesName: string;
// };
 
// const Nextpage = ({ route, navigation }: NextpageScreenProps) => {
//   const theme = useTheme();
//   const { colors }: { colors: any } = theme;
//   const { mediaUrl, mediaType } = route.params || {};
 
//   // states
//   const [categoryId, setCategoryId] = useState<string>(''); // store ID
//   const [categories, setCategories] = useState<Category[]>([]);
// const [loadingCategories, setLoadingCategories] = useState(true);
//   const [language, setLanguage] = useState('');
 
//   // Fetch categories from backend
// useEffect(() => {
//   const fetchCategories = async () => {
//     try {
//       const res = await axios.get('http://192.168.1.7:5000/api/creator/get/feed/category');
//       console.log("ddd", res.data);

//       if (Array.isArray(res.data.categories)) {
//         setCategories(res.data.categories); // already in correct shape
//       } else {
//         setCategories([]);
//       }
//     } catch (error: any) {
//       console.error('Error fetching categories:', error.response?.data || error.message);
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   };
//   fetchCategories();
// }, []);

 
//   const handlePost = async () => {
//     if (!mediaUrl) {
//       Alert.alert('Error', 'No media selected');
//       return;
//     }
//     if (!categoryId) {
//       Alert.alert('Error', 'Please select a category');
//       return;
//     }
//     if (!language) {
//       Alert.alert('Error', 'Please select a language');
//       return;
//     }
 
//     try {
//       const formData = new FormData();
 
//       // File
//       formData.append('file', {
//         uri: mediaUrl,
//         name: mediaType === 'video' ? 'upload.mp4' : 'upload.jpg',
//         type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
//       } as any);
 
//      // Fields
// formData.append('language', language);
// formData.append('categoryId', categoryId); // sending ID instead of name
// formData.append('type', mediaType);

// // 🔹 Debug: log as JSON
// const formDataJSON: any = {};
// formData._parts.forEach(([key, value]) => {
//   formDataJSON[key] = value;
// });
// console.log('FormData JSON:', JSON.stringify(formDataJSON, null, 2));

// const token = await AsyncStorage.getItem('userToken');
// const res = await axios.post(
//   // 'http://192.168.1.7:5000/api/creator/feed/upload',
//   'http://192.168.1.7:5000/api/creator/feed/upload', 
//   formData,
//   {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'multipart/form-data',
//     },
//   }
// );

//       if (res.status === 201) {
//         Alert.alert('Success', 'Post uploaded successfully');
//         navigation.navigate('DrawerNavigation', { screen: 'Home' });
//       }
//     } catch (error: any) {
//       console.error('Upload error:', error.response?.data || error.message);
//       Alert.alert('Error', error.response?.data?.message || 'Upload failed');
//     }
//   };
 
//   return (
//     <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
//       <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
//         <Header title="New Post" post={true} onPress={handlePost} />
//         <KeyboardAvoidingView style={{ flex: 1 }}>
//           <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex: 1 }}>
//             {/* Media Preview */}
//             <View style={[GlobalStyleSheet.container, { padding: 0 }]}>
//               <View style={{ paddingVertical: 30, backgroundColor: 'rgba(71,90,119,.25)' }}>
//                 {mediaUrl && mediaType === 'image' ? (
//                   <Image
//                     style={{
//                       height:
//                         SIZES.width < SIZES.container
//                           ? SIZES.width - SIZES.width * 0.2
//                           : SIZES.container - SIZES.container * 0.2,
//                       width: '100%',
//                       resizeMode: 'contain',
//                     }}
//                     source={{ uri: mediaUrl }}
//                   />
//                 ) : mediaUrl && mediaType === 'video' ? (
//                   <Video
//                     source={{ uri: mediaUrl }}
//                     style={{
//                       height:
//                         SIZES.width < SIZES.container
//                           ? SIZES.width - SIZES.width * 0.2
//                           : SIZES.container - SIZES.container * 0.2,
//                       width: '100%',
//                     }}
//                     useNativeControls
//                     resizeMode="contain"
//                     isLooping
//                   />
//                 ) : (
//                   <Image
//                     style={{
//                       height:
//                         SIZES.width < SIZES.container
//                           ? SIZES.width - SIZES.width * 0.2
//                           : SIZES.container - SIZES.container * 0.2,
//                       width: '100%',
//                       resizeMode: 'contain',
//                     }}
//                     source={IMAGES.profilepic11}
//                   />
//                 )}
//               </View>
//             </View>
 
//             {/* Language Picker */}
//             <View style={[GlobalStyleSheet.container]}>
//               <Text
//                 style={[
//                   GlobalStyleSheet.inputlable,
//                   { color: colors.title, fontWeight: 'bold', fontSize: 15 },
//                 ]}
//               >
//                 Select Language
//               </Text>
//               <View
//                 style={[
//                   GlobalStyleSheet.inputBox,
//                   { borderColor: colors.border, borderWidth: 1, paddingHorizontal: 10 },
//                 ]}
//               >
//                 <Picker
//                   selectedValue={language}
//                   onValueChange={(itemValue) => setLanguage(itemValue)}
//                   style={{ color: colors.title }}
//                 >
//                   <Picker.Item label="Choose Language" value="" />
//                   <Picker.Item label="Tamil" value="Tamil" />
//                   <Picker.Item label="English" value="English" />
//                   <Picker.Item label="Malayalam" value="Malayalam" />
//                   <Picker.Item label="French" value="French" />
//                 </Picker>
//               </View>
//             </View>
 
//             {/* Category Picker */}
//             <View
//   style={[
//     GlobalStyleSheet.inputBox,
//     { borderColor: colors.border, borderWidth: 1, paddingHorizontal: 10 },
//   ]}
// >
//   {loadingCategories ? (
//     <Text style={{ color: colors.text }}>Loading categories...</Text>
//   ) : (
//     <Picker
//   selectedValue={categoryId}
//   onValueChange={(itemValue) => setCategoryId(itemValue)}
//   style={{ color: colors.title }}
// >
//   <Picker.Item label="Choose Category" value="" />
//   {categories.map((cat) => (
//     <Picker.Item
//       key={cat.categoryId}
//       label={cat.categoriesName}
//       value={cat.categoryId}
//     />
//   ))}
// </Picker>
 
//   )}
// </View>
 
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </ScrollView>
//   );
// };
 
// export default Nextpage;
 
 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { Video } from 'expo-av';
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { IMAGES, SIZES } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { ScrollView } from 'react-native-gesture-handler';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type NextpageScreenProps = StackScreenProps<RootStackParamList, 'Nextpage'>;

type Category = {
  categoryId: string;
  categoriesName: string;
};

const Nextpage = ({ route, navigation }: NextpageScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const { mediaUrl, mediaType } = route.params || {};

  // states
  const [categoryId, setCategoryId] = useState<string>(''); // store ID
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [language, setLanguage] = useState('');
  const [showPopup, setShowPopup] = useState(false); // State for popup visibility
  const [popupMessage, setPopupMessage] = useState(''); // Popup title
  const [popupSubtitle, setPopupSubtitle] = useState(''); // Popup subtitle

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://192.168.1.7:5000/api/creator/get/feed/category');
        console.log("ddd", res.data);

        if (Array.isArray(res.data.categories)) {
          setCategories(res.data.categories); // already in correct shape
        } else {
          setCategories([]);
        }
      } catch (error: any) {
        console.error('Error fetching categories:', error.response?.data || error.message);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handlePost = async () => {
    if (!mediaUrl) {
      setPopupMessage('Error!');
      setPopupSubtitle('No media selected');
      setShowPopup(true);
      return;
    }
    if (!categoryId) {
      setPopupMessage('Error!');
      setPopupSubtitle('Please select a category');
      setShowPopup(true);
      return;
    }
    if (!language) {
      setPopupMessage('Error!');
      setPopupSubtitle('Please select a language');
      setShowPopup(true);
      return;
    }

    try {
      const formData = new FormData();

      // File
      formData.append('file', {
        uri: mediaUrl,
        name: mediaType === 'video' ? 'upload.mp4' : 'upload.jpg',
        type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      } as any);

      // Fields
      formData.append('language', language);
      formData.append('categoryId', categoryId);
      formData.append('type', mediaType);

      // Debug: log as JSON
      const formDataJSON: any = {};
      formData._parts.forEach(([key, value]) => {
        formDataJSON[key] = value;
      });
      console.log('FormData JSON:', JSON.stringify(formDataJSON, null, 2));

      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.post(
        'http://192.168.1.7:5000/api/creator/feed/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.status === 201) {
        setPopupMessage('Success');
        setPopupSubtitle('Post uploaded successfully');
        setShowPopup(true);
      } else {
        setPopupMessage('Error!');
        setPopupSubtitle(res.data?.message || 'Upload failed');
        setShowPopup(true);
      }
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      setPopupMessage('Error!');
      setPopupSubtitle(error.response?.data?.message || 'Upload failed');
      setShowPopup(true);
    }
  };

  // Custom Popup Component
  const Popup = () => (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
    }}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        width: '90%',
        elevation: 10,
      }}>
        <Image
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            marginBottom: 15,
          }}
          source={IMAGES.bugrepellent}
        />
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
        }}>{popupMessage}</Text>
        <Text style={{
          fontSize: 14,
          color: '#666',
          textAlign: 'center',
          marginVertical: 10,
        }}>{popupSubtitle}</Text>
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
            if (popupMessage === 'Success') {
              navigation.navigate('DrawerNavigation', { screen: 'Home' });
            }
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
      <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
        <Header title="New Post" post={true} onPress={handlePost} />
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex: 1 }}>
            {/* Media Preview */}
            <View style={[GlobalStyleSheet.container, { padding: 0 }]}>
              <View style={{ paddingVertical: 30, backgroundColor: 'rgba(71,90,119,.25)' }}>
                {mediaUrl && mediaType === 'image' ? (
                  <Image
                    style={{
                      height:
                        SIZES.width < SIZES.container
                          ? SIZES.width - SIZES.width * 0.2
                          : SIZES.container - SIZES.container * 0.2,
                      width: '100%',
                      resizeMode: 'contain',
                    }}
                    source={{ uri: mediaUrl }}
                  />
                ) : mediaUrl && mediaType === 'video' ? (
                  <Video
                    source={{ uri: mediaUrl }}
                    style={{
                      height:
                        SIZES.width < SIZES.container
                          ? SIZES.width - SIZES.width * 0.2
                          : SIZES.container - SIZES.container * 0.2,
                      width: '100%',
                    }}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                  />
                ) : (
                  <Image
                    style={{
                      height:
                        SIZES.width < SIZES.container
                          ? SIZES.width - SIZES.width * 0.2
                          : SIZES.container - SIZES.container * 0.2,
                      width: '100%',
                      resizeMode: 'contain',
                    }}
                    source={IMAGES.profilepic11}
                  />
                )}
              </View>
            </View>

            {/* Language Picker */}
            <View style={[GlobalStyleSheet.container]}>
              <Text
                style={[
                  GlobalStyleSheet.inputlable,
                  { color: colors.title, fontWeight: 'bold', fontSize: 15 },
                ]}
              >
                Select Language
              </Text>
              <View
                style={[
                  GlobalStyleSheet.inputBox,
                  { borderColor: colors.border, borderWidth: 1, paddingHorizontal: 10 },
                ]}
              >
                <Picker
                  selectedValue={language}
                  onValueChange={(itemValue) => setLanguage(itemValue)}
                  style={{ color: colors.title }}
                >
                  <Picker.Item label="Choose Language" value="" />
                  <Picker.Item label="Tamil" value="Tamil" />
                  <Picker.Item label="English" value="English" />
                  <Picker.Item label="Malayalam" value="Malayalam" />
                  <Picker.Item label="French" value="French" />
                </Picker>
              </View>
            </View>

            {/* Category Picker */}
            <View
              style={[
                GlobalStyleSheet.inputBox,
                { borderColor: colors.border, borderWidth: 1, paddingHorizontal: 10 },
              ]}
            >
              {loadingCategories ? (
                <Text style={{ color: colors.text }}>Loading categories...</Text>
              ) : (
                <Picker
                  selectedValue={categoryId}
                  onValueChange={(itemValue) => setCategoryId(itemValue)}
                  style={{ color: colors.title }}
                >
                  <Picker.Item label="Choose Category" value="" />
                  {categories.map((cat) => (
                    <Picker.Item
                      key={cat.categoryId}
                      label={cat.categoriesName}
                      value={cat.categoryId}
                    />
                  ))}
                </Picker>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {showPopup && <Popup />}
      </SafeAreaView>
    </ScrollView>
  );
};

export default Nextpage;
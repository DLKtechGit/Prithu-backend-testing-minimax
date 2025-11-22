import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
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
import api from '../../../apiInterpretor/apiInterceptor';
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
  const [isPosting, setIsPosting] = useState(false); // Loading state during upload
  const [showPopup, setShowPopup] = useState(false); // State for popup visibility
  const [popupMessage, setPopupMessage] = useState(''); // Popup title
  const [popupSubtitle, setPopupSubtitle] = useState(''); // Popup subtitle
  const [isSuccess, setIsSuccess] = useState(false); // Track success/error state

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/user/get/all/category');
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
      setIsSuccess(false);
      setShowPopup(true);
      return;
    }
    if (!categoryId) {
      setPopupMessage('Error!');
      setPopupSubtitle('Please select a category');
      setIsSuccess(false);
      setShowPopup(true);
      return;
    }

    // Show loading state
    setIsPosting(true);

    try {
      const formData = new FormData();

      // File
      formData.append('file', {
        uri: mediaUrl,
        name: mediaType === 'video' ? 'upload.mp4' : 'upload.jpg',
        type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      } as any);

      // Fields
      formData.append('categoryId', categoryId);
      formData.append('type', mediaType);

      // Debug: log as JSON
      const formDataJSON: any = {};
      formData._parts.forEach(([key, value]) => {
        formDataJSON[key] = value;
      });
      console.log('FormData JSON:', JSON.stringify(formDataJSON, null, 2));

      const res = await api.post(
        '/api/creator/feed/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.status === 201) {
        setIsSuccess(true);
        setPopupMessage('Post Shared');
        setPopupSubtitle('Your post has been shared successfully');
        setShowPopup(true);
      } else {
        setIsSuccess(false);
        setPopupMessage('Upload Failed');
        setPopupSubtitle(res.data?.message || 'Something went wrong');
        setShowPopup(true);
      }
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      setIsSuccess(false);
      setPopupMessage('Upload Failed');
      setPopupSubtitle(error.response?.data?.message || 'Something went wrong');
      setShowPopup(true);
    } finally {
      setIsPosting(false);
    }
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
            }}>{isSuccess ? '✓' : '✕'}</Text>
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
              backgroundColor: isSuccess ? '#4CAF50' : '#FF5252',
              paddingVertical: 14,
              paddingHorizontal: 40,
              borderRadius: 25,
              width: '100%',
              shadowColor: isSuccess ? '#4CAF50' : '#FF5252',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={() => {
              setShowPopup(false);
              if (isSuccess) {
                navigation.navigate('DrawerNavigation', { screen: 'Home' });
              }
            }}
          >
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}>{isSuccess ? 'View Post' : 'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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



            {/* Category Picker */}
            <View style={[GlobalStyleSheet.container]}>
              <Text
                style={[
                  GlobalStyleSheet.inputlable,
                  { color: colors.title, fontWeight: 'bold', fontSize: 15 },
                ]}
              >
                Select Category
              </Text>
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
                        label={cat.categoryName}
                        value={cat.categoryId}
                      />
                    ))}
                  </Picker>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Loading Overlay */}
        {isPosting && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 30,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 15,
            }}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={{
                marginTop: 15,
                fontSize: 16,
                fontWeight: '600',
                color: colors.title,
              }}>Posting...</Text>
              <Text style={{
                marginTop: 5,
                fontSize: 13,
                color: colors.text,
                opacity: 0.7,
              }}>Please wait</Text>
            </View>
          </View>
        )}

        {/* Success/Error Popup */}
        <Popup />
      </SafeAreaView>
    </ScrollView>
  );
};

export default Nextpage;
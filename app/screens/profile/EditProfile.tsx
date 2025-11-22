import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { IMAGES, FONTS, COLORS } from '../../constants/theme';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet } from 'react-native';
import api from '../../../apiInterpretor/apiInterceptor';


const EditProfile = () => {
  const theme = useTheme();
  const { colors } = theme;

  const [imageUrl, setImageUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  // const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [maritalStatus, setMaritalStatus] = useState(false);
  const [language, setLanguage] = useState('en');
  const [dob, setDob] = useState<Date | null>(null);
  const [maritalDate, setMaritalDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMaritalDatePicker, setShowMaritalDatePicker] = useState(false);
  const [age, setAge] = useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [popupMessage, setPopupMessage] = useState(''); // Message for the popup
  const [popupSubtitle, setPopupSubtitle] = useState(''); // Subtitle for the popup
  const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade and position
  const [showPhoneNumber, setShowPhoneNumber] = useState(true);
  const [showBio, setShowBio] = useState(true);
  const [showName, setShowName] = useState(true);




  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateAge = (date) => {
    if (!date) return '';
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Format phone number as +91 XXXXX XXXXX (for display)
  // Also provides unformatted version for storage
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '');

    // Ensure it starts with +91
    if (!cleaned.startsWith('+91')) {
      // If user is typing and has some digits, prepend +91
      if (cleaned.length > 0) {
        // Remove any existing + or 91 at the start to avoid duplication
        cleaned = cleaned.replace(/^\+?91?/, '');
        cleaned = '+91' + cleaned;
      } else {
        cleaned = '+91';
      }
    }

    // Extract the digits after +91
    const digitsAfter91 = cleaned.substring(3);

    // Format as +91 XXXXX XXXXX (max 10 digits after +91)
    if (digitsAfter91.length === 0) {
      return '+91';
    } else if (digitsAfter91.length <= 5) {
      return `+91 ${digitsAfter91}`;
    } else {
      // Split into two groups: first 5 digits and remaining (up to 5 more)
      const firstPart = digitsAfter91.substring(0, 5);
      const secondPart = digitsAfter91.substring(5, 10); // Max 10 digits total
      return `+91 ${firstPart}${secondPart ? ' ' + secondPart : ''}`;
    }
  };

  // Get unformatted phone number for storage (removes spaces)
  const getUnformattedPhone = (formattedPhone: string) => {
    return formattedPhone.replace(/\s/g, ''); // Remove all spaces
  };

  const fetchProfileDetail = async () => {
    try {
      const response = await api.get('/api/get/profile/detail');
      const data = response.data;

      if (data.profile) {
        const profile = data.profile;

        console.log("pp", profile)

        // setDisplayName(profile.displayName || '');
        setUsername(profile.userName || '');
        setBio(profile.bio || '');

        // Format phone number or default to +91
        const rawPhone = profile.phoneNumber ? String(profile.phoneNumber) : '';
        setPhoneNumber(rawPhone ? formatPhoneNumber(rawPhone) : '+91');

        setMaritalStatus(profile.maritalStatus === true || profile.maritalStatus === 'true');
        setLanguage(profile.language || 'en');


        if (profile.dateOfBirth) {
          const birthDate = new Date(profile.dateOfBirth);
          setDob(birthDate);
          setAge(calculateAge(birthDate));
        } else {
          setDob(null);
          setAge('');
        }

        if (profile.maritalDate) {
          const md = new Date(profile.maritalDate);
          setMaritalDate(md);
        } else {
          setMaritalDate(null);
        }

        if (profile.profileAvatar) {
          setImageUrl(profile.profileAvatar);
        } else {
          setImageUrl('');
        }

        if (profile.coverPhoto) {
          setCoverPhotoUrl(profile.coverPhoto);
        } else {
          setCoverPhotoUrl('');
        }

        console.log("md", profile.dateOfBirth)
      } else {
        console.log('Error fetching profile:', data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  /* -------------------------- FETCH VISIBILITY -------------------------- */
  const fetchVisibility = async () => {
    try {
      const response = await api.get('/api/profile/visibility');
      const data = response.data;
      console.log("Visibility API response:", data);

      if (data.success && data.visibility) {
        setShowBio(data.visibility.bio === "public");
        setShowPhoneNumber(data.visibility.phoneNumber === "public");
        setShowName(data.visibility.userName === "public");
      } else {
        console.log('Failed to load visibility settings:', data.message);
      }
    } catch (e) {
      console.error('fetchVisibility error:', e);
    }
  };


  useEffect(() => {
    fetchProfileDetail();
    fetchVisibility();
  }, []);


  // ✅ Add this helper function to update toggle visibility to backend
  const handleToggleVisibility = async (fieldName, isVisible) => {
    try {
      const newValue = isVisible ? "public" : "private"; // convert switch to backend format

      const response = await api.put('/api/profile/toggle-visibility', {
        field: fieldName,
        value: newValue,
      });

      console.log("Visibility updated:", response.data);
    } catch (err) {
      console.error("Visibility update error:", err);
    }
  };



  const handleImageSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error selecting image:', e);
    }
  };

  const handleCoverPhotoSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Wide aspect ratio for cover photo
        quality: 1,
      });

      if (!result.canceled) {
        setCoverPhotoUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error selecting cover photo:', e);
    }
  };


  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const accountId = await AsyncStorage.getItem('accountId');

      console.log("userId", userId);
      console.log("accountId", accountId);

      // First, upload cover photo if it's been changed (and is a local URI)
      if (coverPhotoUrl && coverPhotoUrl.startsWith('file://')) {
        try {
          const coverFormData = new FormData();
          const coverFilename = coverPhotoUrl.split('/').pop();
          const coverFileType = coverFilename?.split('.').pop();
          coverFormData.append('coverPhoto', {
            uri: coverPhotoUrl,
            name: coverFilename || 'cover.jpg',
            type: `image/${coverFileType || 'jpg'}`,
          } as any);

          await api.post('/api/user/profile/cover/update', coverFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Cover photo uploaded successfully');
        } catch (coverErr) {
          console.error('Cover photo upload error:', coverErr);
          // Continue with profile update even if cover photo fails
        }
      }

      // Then, update the rest of the profile
      const formData = new FormData();
      if (userId) formData.append('userId', userId);
      if (accountId) formData.append('accountId', accountId);
      // formData.append('displayName', displayName);
      formData.append('bio', bio);
      // Send unformatted phone number to backend (without spaces)
      formData.append('phoneNumber', getUnformattedPhone(phoneNumber));
      formData.append('maritalStatus', maritalStatus ? 'true' : 'false');
      formData.append('language', language);
      formData.append('role', 'Creator');
      formData.append('userName', username);
      formData.append('roleRef', 'Creator');
      if (dob) formData.append('dateOfBirth', dob.toISOString());
      if (maritalDate) {
        console.log("Appending maritalDate:", maritalDate.toISOString()); // Debug log
        formData.append('maritalDate', maritalDate.toISOString());
      }

      // Append visibility settings
      formData.append('visibility', JSON.stringify({
        bio: showBio,
        phoneNumber: showPhoneNumber,
        Name: showName,  // Updated
      }));

      if (imageUrl && imageUrl.startsWith('file://')) {
        const filename = imageUrl.split('/').pop();
        const fileType = filename?.split('.').pop();
        formData.append('file', {
          uri: imageUrl,
          name: filename || 'profile.jpg',
          type: `image/${fileType || 'jpg'}`,
        } as any);
      }

      const response = await api.post('/api/user/profile/detail/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      setPopupMessage('Success');
      setPopupSubtitle('Profile updated successfully!');
      setShowPopup(true);
      fetchProfileDetail();
    } catch (err) {
      console.error('Save error:', err);
      setPopupMessage('Error!');
      setPopupSubtitle(err.response?.data?.message || 'Something went wrong while saving');
      setShowPopup(true);
    }
  };

  const checkUsernameAvailability = async (name: string) => {
    if (!name.trim()) {
      setUsernameError('Please enter a username');
      return;
    }

    try {
      console.log('Checking username:', name);
      const response = await api.get(
        `/api/check/username/availability?username=${encodeURIComponent(name)}`
      );

      const data = response.data;
      console.log('API Response:', data);

      if (data.available) {
        setUsernameError('');
      } else {
        setUsernameError(data.message || 'Username is already taken ');
      }
    } catch (error) {
      console.error('Error:', error);
      setUsernameError(error.response?.data?.message || 'Error checking username');
    }
  };

  useEffect(() => {
    if (showPopup) {
      // Fade-in only (no slide)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade-out only
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPopup]);

  // Custom Popup Component

  const Popup = () => (
    <Animated.View
      style={[
        styles.popupOverlay,               // <-- new style (center + overlay)
        { opacity: fadeAnim },              // only fade animation
      ]}
    >
      <View style={styles.popupContainer}>
        <Image source={IMAGES.bugrepellent} style={styles.popupImage} />
        <Text style={styles.popupTitle}>{popupMessage}</Text>
        <Text style={styles.popupSubtitle}>{popupSubtitle}</Text>

        <TouchableOpacity
          style={styles.popupButton}
          onPress={() => setShowPopup(false)}
        >
          <Text style={styles.popupButtonText}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );


  return (
    <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
      <Header title="Edit profile" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Cover Photo Section */}
        <View style={{ position: 'relative', width: '100%', height: 170, backgroundColor: colors.background }}>
          <Image
            style={{ width: '100%', height: '100%' }}
            source={coverPhotoUrl ? { uri: coverPhotoUrl } : IMAGES.profile}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={handleCoverPhotoSelect}
            style={{ position: 'absolute', bottom: 10, right: 10 }}
          >
            <View
              style={{
                backgroundColor: theme.dark ? '#112036' : '#fff',
                width: 36,
                height: 36,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: '#32CD32',
                  width: 30,
                  height: 30,
                  borderRadius: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  style={{ width: 18, height: 18, resizeMode: 'contain' }}
                  source={IMAGES.edit}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section - Overlapping Cover Photo */}
        <View style={{ flexDirection: 'row', justifyContent: 'left', marginTop: -100, marginLeft: 20, }}>
          <View>
            <Image
              style={{ width: 100, height: 100, borderRadius: 100, borderWidth: 4, borderColor: colors.card }}
              source={imageUrl ? { uri: imageUrl } : IMAGES.profile}
            />
            <TouchableOpacity
              onPress={handleImageSelect}
              style={{ position: 'absolute', bottom: 0, right: 0 }}
            >
              <View
                style={{
                  backgroundColor: theme.dark ? '#112036' : '#fff',
                  width: 36,
                  height: 36,
                  borderRadius: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: '#32CD32',
                    width: 30,
                    height: 30,
                    borderRadius: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    style={{ width: 18, height: 18, resizeMode: 'contain' }}
                    source={IMAGES.edit}
                  />
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        <View style={[GlobalStyleSheet.container, { marginTop: 15 }]}>
          {/* <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Name
          </Text>
          <View
            style={[
              GlobalStyleSheet.inputBox,
              { borderColor: colors.border, 
                borderWidth: 1,
                 paddingLeft: 20 ,
                  flexDirection: 'row', // row layout
                alignItems: 'center', // vertically center 
                paddingHorizontal: 15,
                justifyContent: 'space-between',
                },
                
            ]}
          >
            <TextInput
              style={[GlobalStyleSheet.input, { color: colors.title,flex: 1 }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={colors.placeholder}
            />
              <Switch
              value={showName}
              onValueChange={(val) => {
                setShowName(val);
                handleToggleVisibility('displayName', val); //  sync with backend
              }}
              thumbColor={showName ? COLORS.primary : '#ccc'}
            />
          </View> */}

          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Username
          </Text>
          <View
            style={[
              GlobalStyleSheet.inputBox,
              { borderColor: colors.border, borderWidth: 1, paddingLeft: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, justifyContent: 'space-between' },
            ]}
          >
            <TextInput
              style={[GlobalStyleSheet.input, { color: colors.title, flex: 1 }]}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                checkUsernameAvailability(text);
              }}
              placeholder="Enter username"
              placeholderTextColor={colors.placeholder}
            />

            <Switch
              value={showName}
              onValueChange={(val) => {
                setShowName(val);
                handleToggleVisibility("userName", val);
              }}
              thumbColor={showName ? COLORS.primary : "#ccc"}
            />

          </View>

          {usernameError ? (
            <Text style={{ ...FONTS.fontSm, color: COLORS.danger, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
              {usernameError}
            </Text>
          ) : null}

          {usernameError ? (
            <Text style={{ ...FONTS.fontSm, color: COLORS.danger, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
              {usernameError}
            </Text>
          ) : null}

          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Bio
          </Text>
          <View
            style={[
              GlobalStyleSheet.inputBox,
              {
                borderColor: colors.border,
                borderWidth: 1,
                paddingLeft: 20,
                height: 'auto',
                flexDirection: 'row', // row layout
                alignItems: 'center', // vertically center 
                paddingHorizontal: 15,
                justifyContent: 'space-between',
              },
            ]}
          >
            <TextInput
              multiline
              numberOfLines={5}
              style={[
                GlobalStyleSheet.input,
                {
                  color: colors.title, height: 'auto',
                  paddingTop: 10,
                  paddingRight: 10,
                  flex: 1,

                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Enter your bio"
              placeholderTextColor={colors.placeholder}
            />
            {/* <Switch
              value={showBio}
              onValueChange={(val) => {
                setShowBio(val);
                handleToggleVisibility('bio', val); //  sync with backend
              }}
              thumbColor={showBio ? COLORS.primary : '#ccc'}
            /> */}


          </View>

          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Phone Number
          </Text>

          <View
            style={[
              GlobalStyleSheet.inputBox,
              {
                borderColor: colors.border,
                borderWidth: 1,
                paddingLeft: 20,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 15,
                justifyContent: "space-between",
              },
            ]}
          >
            <TextInput
              style={[
                GlobalStyleSheet.input,
                { color: colors.title, flex: 1 },
              ]}
              value={phoneNumber}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor={colors.placeholder}
              onChangeText={(text) => {
                // Format the phone number as user types
                const formatted = formatPhoneNumber(text);
                setPhoneNumber(formatted);
              }}
              maxLength={17} // +91 XXXXX XXXXX = 17 characters max
            />

            <Switch
              value={showPhoneNumber}
              onValueChange={(val) => {
                setShowPhoneNumber(val);
                handleToggleVisibility("phoneNumber", val);
              }}
              thumbColor={showPhoneNumber ? COLORS.primary : "#ccc"}
            />
          </View>
          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Marital Status
          </Text>
          <View
            style={[
              GlobalStyleSheet.inputBox,
              { borderColor: colors.border, borderWidth: 1, paddingLeft: 10 },
            ]}
          >
            <Picker
              selectedValue={maritalStatus ? 'married' : 'single'}
              onValueChange={(val) => setMaritalStatus(val === 'married')}
              style={{ color: colors.title, width: '100%' }}
              dropdownIconColor={colors.title}
            >
              <Picker.Item label="Single" value="single" />
              <Picker.Item label="Married" value="married" />
            </Picker>
          </View>

          {maritalStatus && (
            <>
              <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
                Marital Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowMaritalDatePicker(true)}
                style={[
                  GlobalStyleSheet.inputBox,
                  { borderColor: colors.border, borderWidth: 1, paddingLeft: 20, justifyContent: 'center' },
                ]}
              >
                <Text style={{ color: maritalDate ? colors.title : colors.placeholder }}>
                  {maritalDate ? formatDate(maritalDate) : 'Select Marital Date'}
                </Text>
              </TouchableOpacity>
              {showMaritalDatePicker && (
                <DateTimePicker
                  value={maritalDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowMaritalDatePicker(false);
                    if (selectedDate) setMaritalDate(selectedDate);
                  }}
                />
              )}
            </>
          )}

          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Date of Birth
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              GlobalStyleSheet.inputBox,
              { borderColor: colors.border, borderWidth: 1, paddingLeft: 20, justifyContent: 'center' },
            ]}
          >
            <Text style={{ color: dob ? colors.title : colors.placeholder }}>
              {dob ? formatDate(dob) : 'Select Date of Birth'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDob(selectedDate);
                  setAge(calculateAge(selectedDate));
                }
              }}
            />
          )}

          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Age
          </Text>
          <View
            style={[
              GlobalStyleSheet.inputBox,
              { borderColor: colors.border, borderWidth: 1, paddingLeft: 20 },
            ]}
          >
            <TextInput
              style={[GlobalStyleSheet.input, { color: colors.title }]}
              value={age}
              editable={false}
              placeholder="Age"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <Text style={[GlobalStyleSheet.inputlable, { color: colors.title, opacity: 0.6 }]}>
            Language
          </Text>
          <View
            style={[
              GlobalStyleSheet.inputBox,
              { borderColor: colors.border, borderWidth: 1, paddingLeft: 10 },
            ]}
          >
            <Picker
              selectedValue={language}
              onValueChange={(val) => setLanguage(val)}
              style={{ color: colors.title, width: '100%' }}
              dropdownIconColor={colors.title}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Tamil" value="ta" />
              <Picker.Item label="Hindi" value="hi" />
              <Picker.Item label="French" value="fr" />
              <Picker.Item label="Spanish" value="es" />
            </Picker>
          </View>


          <Button title="Save" onPress={handleSave} />
        </View>
      </ScrollView>
      {showPopup && <Popup />}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',   // dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },

  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '90%',               // same width as the example you gave
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  popupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },

  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  popupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },

  popupButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },

  popupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EditProfile;
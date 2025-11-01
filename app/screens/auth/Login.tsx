import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connectSocket, disconnectSocket} from '../../../webSocket/webScoket';
import {startHeartbeat, stopHeartbeat} from "../../../webSocket/heartBeat";
import CategoriesScreen from './CategoriesScreen';
import api from '../../../apiInterpretor/apiInterceptor';
 
type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;
 
const Login = ({ navigation }: LoginScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const mountedRef = useRef(true);

  const [show, setshow] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const [inputFocus, setFocus] = React.useState({
    onFocus1: false,
    onFocus2: false
  })
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
 
  const LoginButton = useCallback(async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (!mountedRef.current) return;

    setLoading(true);

    try {
      const response = await api.post('/api/auth/user/login', {
        identifier: email,
        password
      });

      if (!mountedRef.current) return;

      await connectSocket();
      if (mountedRef.current) {
        startHeartbeat();
      }

      const data = response.data;
      console.log("Login response:", data);

      if (res.ok) {
        // Save token
        await AsyncStorage.clear();
        await AsyncStorage.setItem('userToken', data.accessToken);
        await AsyncStorage.setItem("refreshToken", data.refreshToken);
        await AsyncStorage.setItem("sessionId", data.sessionId);
        await AsyncStorage.setItem("deviceId", data.deviceId);
        await AsyncStorage.setItem("userId", data.userId);
        
        const { appLanguage, feedLanguage, category, gender } = data;
        console.log({ appLanguage, feedLanguage, category, gender });
        
        if (!mountedRef.current) return;

        // Sequential onboarding logic
        if (!appLanguage) {
          navigation.navigate('LanguageScreen');
        } 
        else if (!feedLanguage) {
          navigation.navigate('FeedScreen');
        } 
        else if (!category) {
          navigation.navigate('CategoriesScreen');
        } 
        else if (!gender) {
          navigation.navigate('gender');
        } 
        else {
          navigation.navigate('DrawerNavigation', { screen: 'Home' });
        }
      } else {
        if (mountedRef.current) {
          Alert.alert("Error", data.error || data.message || "Invalid email or password");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (mountedRef.current) {
        Alert.alert("Error", "Something went wrong, try again later");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [email, password, navigation]);
 
 
 
  useFocusEffect(
    React.useCallback(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, [])
  );
 
  return (
    <>
      {loading &&
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,.5)',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            zIndex: 9,
            width: '100%',
            height: '100%',
          }}
        >
          <ActivityIndicator
            size={'large'}
            color={COLORS.white}
          />
        </View>
      }
      <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, flex: 1 }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
        //behavior={Platform.OS === 'ios' ? 'padding' : ''}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ backgroundColor: COLORS.secondary, flex: 1 }}>
              <View style={{ alignItems: 'center' }}>
                <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']} style={GlobalStyleSheet.cricleGradient1}>
                </LinearGradient>
                <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']} style={GlobalStyleSheet.cricleGradient2}>
                </LinearGradient>
                <View
                  style={{
                    paddingTop: 40,
                    paddingBottom: 20
                  }}
                >
                  <Image
                    style={{ width: 80, height: 80 }}
                    source={IMAGES.logo}
                  />
                </View>
                <Text style={GlobalStyleSheet.formtitle}>Login Account</Text>
                <Text style={GlobalStyleSheet.forndescription}>Welcome To Login Account to access your account and detail</Text>
              </View>
              <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Email/Username</Text>
                <View
                  style={[
                    GlobalStyleSheet.inputBox, {
                      backgroundColor: colors.input,
                    },
                    inputFocus.onFocus1 && {
                      borderColor: COLORS.primary,
                    }
                  ]}
                >
                  <Image
                    style={[
                      GlobalStyleSheet.inputimage,
                      {
                        tintColor: theme.dark ? colors.title : colors.text,
                      }
                    ]}
                    source={IMAGES.email}
                  />
 
                  <TextInput
                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                    placeholder='Enter your email/Username'
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocus({ ...inputFocus, onFocus1: true })}
                    onBlur={() => setFocus({ ...inputFocus, onFocus1: false })}
                  />
                </View>
 
                <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Password</Text>
                <View
                  style={[
                    GlobalStyleSheet.inputBox, {
                      backgroundColor: colors.input,
                    },
                    inputFocus.onFocus2 && {
                      borderColor: COLORS.primary,
                    }
                  ]}
                >
                  <Image
                    style={[
                      GlobalStyleSheet.inputimage,
                      {
                        tintColor: theme.dark ? colors.title : colors.text,
                      }
                    ]}
                    source={IMAGES.lock}
                  />
 
                  <TextInput
                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                    placeholder='Enter your password'
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={show}
                    value={password}
                    onChangeText={setPassword}
                    keyboardType='default'
                    onFocus={() => setFocus({ ...inputFocus, onFocus2: true })}
                    onBlur={() => setFocus({ ...inputFocus, onFocus2: false })}
                  />
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      position: 'absolute',
                      right: 15,
 
                    }}
                    onPress={() => {
                      setshow(!show)
                    }}
                  >
                    <Image
                      style={[GlobalStyleSheet.inputSecureIcon, {
                        tintColor: theme.dark ? colors.title : colors.text,
                      }]}
                      source={
                        show
                          ?
                          IMAGES.eyeclose
                          :
                          IMAGES.eyeopen
                      }
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Forgot')}
                  >
                    <Text style={GlobalStyleSheet.btnlink}> Forgot Password? </Text>
                  </TouchableOpacity>
                </View>
 
                <Button title="Login" onPress={LoginButton} />
 
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 40, flex: 1 }}>
                  <View style={{ flex: 1, width: 0, backgroundColor: colors.border, height: 1 }}></View>
                  <View>
                    <Text style={{ ...FONTS.font, paddingHorizontal: 30, color: colors.text }}>or login with</Text>
                  </View>
                  <View style={{ flex: 1, width: 0, backgroundColor: colors.border, height: 1 }}></View>
                </View>
 
                <TouchableOpacity style={[GlobalStyleSheet.mediabtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : '#E8ECF2' }]}>
                  <Image
                    style={{ position: 'absolute', left: 25, width: 20, height: 20 }}
                    source={IMAGES.google}
                  />
                  <Text style={{ ...FONTS.font, fontSize: 15, color: colors.title }}>Login with Google</Text>
                </TouchableOpacity>
 
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                  <Text style={{ ...FONTS.font, color: colors.text }}>Don't have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={{ ...FONTS.font, color: COLORS.primary, textDecorationLine: 'underline', textDecorationColor: '#2979F8', marginLeft: 5 }}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};
 
export default Login;
export default Login;
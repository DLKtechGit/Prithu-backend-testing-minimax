import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, IMAGES, SIZES } from '../../constants/theme';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import Sharebtn from '../../components/button/Sharebtn';
import { useTheme, useNavigation } from '@react-navigation/native';
import Followbtn from '../../components/button/Followbtn';
import ChatoptionSheet from '../../components/bottomsheet/ChatoptionSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../apiInterpretor/apiInterceptor';

const following = [
  {
    id: '1',
    title: 'Alex Techie',
    image: IMAGES.storypic2,
    text: "alex_techie_2123",
    hasStory: true,
  },
  {
    id: '2',
    title: 'Deepesh gaur',
    image: IMAGES.storypic1,
    text: "deepesh_gaur22",
    hasStory: false
  },
  {
    id: '3',
    title: 'Sophia James',
    image: IMAGES.storypic4,
    text: "sophia_james",
    hasStory: false,
  },
  {
    id: '4',
    title: 'Mia Maven',
    image: IMAGES.storypic3,
    text: "mia-meaver_420",
    hasStory: false,
  },
  {
    id: '5',
    title: 'Lily Learns',
    image: IMAGES.storypic2,
    text: "your_lily@123",
    hasStory: false,
  },
  {
    id: '6',
    title: 'Alex Techie',
    image: IMAGES.storypic4,
    text: "alex_techie_2123",
    hasStory: false
  },
  {
    id: '7',
    title: 'Deepesh gaur',
    image: IMAGES.storypic1,
    text: "deepesh_gaur22",
    hasStory: false,
  },
  {
    id: '8',
    title: 'Sophia James',
    image: IMAGES.storypic4,
    text: "sophia_james",
    hasStory: true,
  },
  {
    id: '9',
    title: 'Mia Maven',
    image: IMAGES.storypic3,
    text: "mia-meaver_420",
    hasStory: false
  },
  {
    id: '10',
    title: 'Lily Learns',
    image: IMAGES.storypic2,
    text: "your_lily@123",
    hasStory: true,
  },
  {
    id: '11',
    title: 'Alex Techie',
    image: IMAGES.storypic1,
    text: "alex_techie_2123",
    hasStory: false,
  },
];

const Followers = () => {
  const moresheet = useRef<any>();
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  // State to track show status for each follower/following item
  const [showStates, setShowStates] = useState<{ [key: string]: boolean }>({});
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);

  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const buildUrl = (path: string | undefined | null) => {
    if (!path || path === 'Unavailable') return IMAGES.profile;
    // Remove the hardcoded IP and use relative path for images
    const cleanPath = path.replace(/\\/g, '/').replace(/^.*?\/uploads/, '/uploads');
    return { uri: `${cleanPath}` };
  };

  // Fetch active account type
  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem("activeAccountType");
        console.log(storedType);
        if (storedType) setActiveAccountType(storedType);
      } catch (err) {
        console.log("Error fetching account type:", err);
      }
    };
    fetchAccountType();
  }, []);

  // Fetch followers from backend based on account type
  useEffect(() => {
    const fetchData = async () => {
      try {
        let endpoint = '';
        if (activeAccountType === 'Creator') {
          endpoint = '/api/creator/get/followers';
        } else {
          console.log("usercall")
          endpoint = '/api/user/following/data';
        }

        const response = await api.get(endpoint);
        const data = response.data;
        console.log('Fetched data:', data);

        if (data) {
          if (activeAccountType === 'Creator') {
            // Handle creator followers response
            const formattedFollowers = data.followers.map((f: any, index: number) => ({
              id: index.toString(),
              title: f.userName.split('@')[0] || f.userName,
              text: f.userName,
              image: f.profileAvatar,
              hasStory: false,
              userId: f.userId || index.toString(),
            }));
            setFollowers(formattedFollowers);
            setFollowersCount(data.count || 0);
            // Initialize showStates for each follower
            const initialShowStates = formattedFollowers.reduce((acc, follower) => ({
              ...acc,
              [follower.id]: true,
            }), {});
            setShowStates(initialShowStates);
          } else {
            // Handle personal following response
            const formattedFollowers = data.data.followers.map((f: any, index: number) => ({
              id: index.toString(),
              title: f.userName.split('@')[0] || f.userName,
              text: f.userName,
              image: f.profileAvatar,
              hasStory: false,
              userId: f.userId || index.toString(),
            }));
            setFollowers(formattedFollowers);
            setFollowersCount(data.data.followersCount || 0);
            // Initialize showStates for each follower
            const initialShowStates = formattedFollowers.reduce((acc, follower) => ({
              ...acc,
              [follower.id]: true,
            }), {});
            setShowStates(initialShowStates);
          }
        } else {
          console.log('Error fetching data:', data.message);
          Alert.alert('Error', data.message || 'Failed to fetch data');
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        Alert.alert('Error', err.response?.data?.message || 'Failed to fetch data');
      }
    };

    if (activeAccountType) {
      fetchData();
    }
  }, [activeAccountType]);

  // Initialize showStates for following items
  useEffect(() => {
    const initialShowStates = following.reduce((acc, item) => ({
      ...acc,
      [item.id]: true,
    }), {});
    setShowStates(prev => ({ ...prev, ...initialShowStates }));
  }, []);

  const toggleShowState = (id: string) => {
    setShowStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const slideIndicator = scrollX.interpolate({
    inputRange: [0, SIZES.width],
    outputRange: [0, (SIZES.width - 30) / 2],
    extrapolate: 'clamp',
  });

  const onPressTouch = (val: any) => {
    setCurrentIndex(val);
    scrollRef.current?.scrollTo({
      x: SIZES.width * val,
      animated: true,
    });
  };

  // Set header title based on account type
  const getHeaderTitle = () => {
    return activeAccountType === 'Creator' ? 'Followers' : 'Following';
  };

  return (
    <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, backgroundColor: colors.card, flex: 1 }]}>
      <Header title={getHeaderTitle()} />
      <View style={{ flex: 1 }}>
        <View style={GlobalStyleSheet.container}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={() => onPressTouch(0)}
              style={GlobalStyleSheet.TouchableOpacity2}
            >
               
              <Text style={[GlobalStyleSheet.titlefont2, { color: currentIndex === 0 ? colors.title : colors.text }]}>
                {followersCount} {activeAccountType === 'Creator' ? 'follower' : 'following'}{followersCount !== 1 ? 's' : ''}
              </Text>

            </TouchableOpacity>
            {activeAccountType === 'Creator' && (
              <TouchableOpacity
                onPress={() => onPressTouch(1)}
                style={GlobalStyleSheet.TouchableOpacity2}
              >
                <Text style={[GlobalStyleSheet.titlefont2, { color: currentIndex === 1 ? colors.title : colors.text }]}>
                  500 following
                </Text>
              </TouchableOpacity>
            )}
            <Animated.View
              style={{
                backgroundColor: colors.title,
                width: activeAccountType === 'Creator' ? '50%' : '100%',
                height: 2,
                position: 'absolute',
                bottom: 0,
                left: 0,
                transform: [{ translateX: slideIndicator }],
              }}
            ></Animated.View>
          </View>
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={true}
          ref={scrollRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e: any) => {
            if (activeAccountType === 'Creator') {
              if (e.nativeEvent.contentOffset.x.toFixed(0) == SIZES.width.toFixed(0)) {
                setCurrentIndex(1);
              } else if (e.nativeEvent.contentOffset.x.toFixed(0) == 0) {
                setCurrentIndex(0);
              } else {
                setCurrentIndex(0);
              }
            } else {
              setCurrentIndex(0);
            }
          }}
        >
          <View style={[GlobalStyleSheet.container, { padding: 0, width: SIZES.width }]}>
            <ScrollView>
              <View style={GlobalStyleSheet.container}>
                <View style={{ marginTop: 10 }}>
                  <TextInput
                    placeholder='Search here...'
                    placeholderTextColor={colors.placeholder}
                    style={[
                      GlobalStyleSheet.inputBox,
                      {
                        backgroundColor: colors.input,
                        paddingLeft: 25,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={{ paddingHorizontal: 15, marginBottom: 10 }}>
                <Text style={{ ...FONTS.fontRegular, ...FONTS.h6, color: colors.title }}>
                  {activeAccountType === 'Creator' ? 'All Followers' : 'All Following'}
                </Text>
              </View>
              {followers.length > 0 ? (
                followers.map((data: any, index) => (
                  <View key={index} style={[GlobalStyleSheet.flexalingjust, { paddingHorizontal: 15, marginBottom: 10 }]}>
                    <View style={[GlobalStyleSheet.flexaling, { marginBottom: 10 }]}>
                      <View>
                        <TouchableOpacity
                          onPress={() => {
                            if (data.hasStory) {
                              navigation.navigate('status', {
                                name: data.title,
                                image: data.image,
                                statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                              });
                            } else {
                              navigation.navigate('AnotherProfile', { accountId: data.userId });
                            }
                          }}
                          style={{ marginRight: 10 }}
                        >
                          {data.hasStory ? (
                            <View>
                              <Image
                                style={{ width: 50, height: 50, borderRadius: 50 }}
                                source={{uri :data.image}}
                              />
                              <Image
                                style={{ width: 58, height: 58, position: 'absolute', bottom: -3.8, right: -4, resizeMode: 'contain' }}
                                source={IMAGES.cricle}
                              />
                            </View>
                          ) : (
                            <View>
                              <Image
                                style={{ width: 50, height: 50, borderRadius: 50 }}
                                source={{uri :data.image}}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                      <View>
                        <TouchableOpacity
                          // onPress={() => navigation.navigate('AnotherProfile', { accountId: data.userId })}
                        >
                          <Text style={[GlobalStyleSheet.textfont, { color: colors.title }]}>{data.title}</Text>
                        </TouchableOpacity>
                        <Text style={{ ...FONTS.fontXs, color: colors.text }}>{data.text}</Text>
                      </View>
                    </View>
                
                   {/* remove button - only show for creator account */}
                   {activeAccountType === 'Creator' && (
                    <View>
                      {showStates[data.id] ? (
                        <Sharebtn
                          title='Remove'
                          onPress={() => toggleShowState(data.id)}
                        />
                      ) : (
                        <Followbtn
                          title="Follow"
                          onPress={() => toggleShowState(data.id)}
                        />
                      )}
                    </View>
                   )}

                    
                  </View>
                ))
              ) : (
                <View style={{ paddingHorizontal: 15 }}>
                  <Text style={{ ...FONTS.fontRegular, color: colors.text }}>
                    {activeAccountType === 'Creator' ? 'No followers found' : 'Not following anyone yet'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
          {activeAccountType === 'Creator' && (
            <View style={[GlobalStyleSheet.container, { padding: 0, width: SIZES.width }]}>
              <ScrollView>
                <View style={GlobalStyleSheet.container}>
                  <View style={{ marginTop: 10 }}>
                    <TextInput
                      placeholder='Search here...'
                      placeholderTextColor={colors.placeholder}
                      style={[
                        GlobalStyleSheet.inputBox,
                        {
                          backgroundColor: colors.input,
                          paddingLeft: 25,
                        },
                      ]}
                    />
                  </View>
                </View>
                {following.map((data, index) => (
                  <View key={index} style={[GlobalStyleSheet.flexalingjust, { paddingHorizontal: 15, marginBottom: 10 }]}>
                    <View style={[GlobalStyleSheet.flexaling, { marginBottom: 10 }]}>
                      <View>
                        <TouchableOpacity
                          onPress={() => {
                            if (data.hasStory) {
                              navigation.navigate('status', {
                                name: data.title,
                                image: data.image,
                                statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                              });
                            } else {
                              navigation.navigate('AnotherProfile');
                            }
                          }}
                          style={{ marginRight: 10 }}
                        >
                          {data.hasStory ? (
                            <View>
                              <Image
                                style={{ width: 50, height: 50, borderRadius: 50 }}
                                source={data.image}
                              />
                              <Image
                                style={{ width: 58, height: 58, position: 'absolute', bottom: -3.8, right: -4, resizeMode: 'contain' }}
                                source={IMAGES.cricle}
                              />
                            </View>
                          ) : (
                            <View>
                              <Image
                                style={{ width: 50, height: 50, borderRadius: 50 }}
                                source={data.image}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                      <View>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AnotherProfile')}
                        >
                          <Text style={[GlobalStyleSheet.textfont, { color: colors.title }]}>{data.title}</Text>
                        </TouchableOpacity>
                        <Text style={{ ...FONTS.fontXs, color: colors.text }}>{data.text}</Text>
                      </View>
                    </View>
                    <View style={GlobalStyleSheet.flexaling}>
                      <View>
                        {showStates[data.id] ? (
                          <Sharebtn
                            title='Following'
                            onPress={() => toggleShowState(data.id)}
                          />
                        ) : (
                          <Followbtn
                            title="Follow"
                            onPress={() => toggleShowState(data.id)}
                          />
                        )}
                      </View>
                      <View>
                        <TouchableOpacity
                          onPress={() => moresheet.current.openSheet()}
                          style={{ paddingLeft: 10 }}
                        >
                          <Image
                            style={[GlobalStyleSheet.image, { tintColor: colors.title, width: 15, height: 15 }]}
                            source={IMAGES.more}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
      <ChatoptionSheet
        ref={moresheet}
        deleteChat={false}
      />
    </SafeAreaView>
  );
};

export default Followers;


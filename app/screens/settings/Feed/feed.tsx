import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import Header from '../../../layout/Header';
import { GlobalStyleSheet } from '../../../constants/styleSheet';
import { useTheme } from '@react-navigation/native';

const Feed = ({ navigation }: any) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const options = [
    { id: '1', text: 'Feed Language', screen: 'FeedLanguage' },
    { id: '2', text: 'App Language', screen: 'AppLanguage' },
    { id: '3', text: 'Like Feed', screen: 'LikeFeed' },
    { id: '4', text: ' Hidden Posts', screen: 'HiddenPosts' },
    { id: '5', text: ' Not-Intrested Categories', screen: 'NotInterestedCategories' },

  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <Header title="Feed" />
      <View style={[GlobalStyleSheet.container, { marginTop: 10 }]}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={{
              height: 50,
              justifyContent: 'center',
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
            onPress={() => navigation.navigate(opt.screen)}
          >
            <Text style={{ fontSize: 16, color: colors.title }}>
              {opt.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default Feed;

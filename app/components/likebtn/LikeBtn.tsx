// import React from 'react';
// import { Pressable, StyleSheet,Image } from 'react-native';
// import { IMAGES } from '../../constants/theme';
// import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';


// const LikeBtn = ({ color, sizes, onPress, liked, COLORS }: any) => {
//   // animation state starts from prop "liked"
//   const likedAnim = useSharedValue(liked ? 1 : 0);

//   const outlineStyle = useAnimatedStyle(() => ({
//     transform: [
//       {
//         scale: interpolate(likedAnim.value, [0, 1], [1, 0], Extrapolate.CLAMP),
//       },
//     ],
//   }));

//   const fillStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: likedAnim.value }],
//   }));

//   const handleLike = () => {
//     // animate toggle
//     likedAnim.value = withSpring(likedAnim.value ? 0 : 1);

//     // trigger backend update from PostCard
//     if (onPress) {
//       onPress();
//     }
//   };
//     return (
//         <Pressable
//             accessible={true}
//             accessibilityLabel="Like Btn"
//             accessibilityHint="Like this item"
//             onPress={() => {handleLike()}}
//             style={[{
//                 alignItems: 'center',
//                 justifyContent: 'center',
//             },
//             sizes == 'sm'
//                 ?
//                 {
//                     height: 25,
//                     width: 25
//                 }
//                 :
//             sizes == 'xm'
//                 ?
//                 {
//                     height:20,
//                     width: 20
//                 }
//                 : 
//             sizes == 'xs'
//                 ?
//                 {
//                     height: 15,
//                     width: 15
//                 }
//                 : 
//                 {
//                     height: 50,
//                     width: 50,
//                 }
//             ]}    
//         >
//             <Animated.View style={[StyleSheet.absoluteFillObject,outlineStyle,{alignItems:'center',justifyContent:'center'}]}>
//                 <Image
//                     style={[{
//                         tintColor: color ? color : '#ffff',
//                         resizeMode: 'contain',
//                     },
//                         sizes == 'sm'
//                             ?
//                             {
//                                 height: 22,
//                                 width: 22
//                             }
//                             :
//                         sizes == 'xm'
//                             ?
//                             {
//                                 height: 20,
//                                 width: 20
//                             }
//                             :
//                         sizes == 'xs'
//                             ?
//                             {
//                                 height: 15,
//                                 width: 15
//                             }
//                             : 
//                             {
//                                 height: 25,
//                                 width: 25,
//                             }
//                     ]}
//                     source={IMAGES.like2}
//                 />
//             </Animated.View>

//             <Animated.View style={fillStyle}>
//                  <Image
//                     style={[{
//                         resizeMode: 'contain',
                        
//                     },
//                     sizes == 'sm'
//                         ?
//                         {
//                             height: 22,
//                             width: 22
//                         }
//                         :
//                     sizes == 'xm'
//                         ?
//                         {
//                             height: 20,
//                             width: 20
//                         }
//                         : 
//                     sizes == 'xs'
//                         ?
//                         {
//                             height: 15,
//                             width: 15
//                         }
//                         : 
//                         {
//                             height: 25,
//                             width: 25,
//                         }
//                     ]}
//                     source={IMAGES.like}
//                 />
//             </Animated.View>
//         </Pressable>
//     );
// };


// export default LikeBtn;

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Image } from 'react-native';
import { IMAGES } from '../../constants/theme';
import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const LikeBtn = ({ color, sizes, onPress, liked, COLORS }) => {
  // Initialize animation state with liked prop
  const likedAnim = useSharedValue(liked ? 1 : 0);

  // Update likedAnim when liked prop changes
  useEffect(() => {
    likedAnim.value = withSpring(liked ? 1 : 0);
  }, [liked]);

  const outlineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(likedAnim.value, [0, 1], [1, 0], Extrapolate.CLAMP),
      },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likedAnim.value }],
  }));

  const handleLike = () => {
    // Toggle animation
    likedAnim.value = withSpring(likedAnim.value ? 0 : 1);

    // Trigger backend update from parent component
    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      accessible={true}
      accessibilityLabel="Like Button"
      accessibilityHint="Like this item"
      onPress={handleLike}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
        sizes === 'sm'
          ? { height: 25, width: 25 }
          : sizes === 'xm'
          ? { height: 20, width: 20 }
          : sizes === 'xs'
          ? { height: 15, width: 15 }
          : { height: 50, width: 50 },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, outlineStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <Image
          style={[
            {
              tintColor: color || '#ffff',
              resizeMode: 'contain',
            },
            sizes === 'sm'
              ? { height: 22, width: 22 }
              : sizes === 'xm'
              ? { height: 20, width: 20 }
              : sizes === 'xs'
              ? { height: 15, width: 15 }
              : { height: 25, width: 25 },
          ]}
          source={IMAGES.like2}
        />
      </Animated.View>

      <Animated.View style={fillStyle}>
        <Image
          style={[
            { resizeMode: 'contain' },
            sizes === 'sm'
              ? { height: 22, width: 22 }
              : sizes === 'xm'
              ? { height: 20, width: 20 }
              : sizes === 'xs'
              ? { height: 15, width: 15 }
              : { height: 25, width: 25 },
          ]}
          source={IMAGES.like}
        />
      </Animated.View>
    </Pressable>
  );
};

export default LikeBtn;
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingEmojiProps {
    emoji: string;
    onComplete: () => void;
}

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ emoji, onComplete }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Random horizontal drift
        const randomX = (Math.random() - 0.5) * 100;

        Animated.parallel([
            // Move upward
            Animated.timing(translateY, {
                toValue: -SCREEN_HEIGHT * 0.6, // Move up 60% of screen height
                duration: 3000 + Math.random() * 1000, // 3-4 seconds
                useNativeDriver: true,
            }),
            // Horizontal drift
            Animated.timing(translateX, {
                toValue: randomX,
                duration: 3000 + Math.random() * 1000,
                useNativeDriver: true,
            }),
            // Fade out
            Animated.timing(opacity, {
                toValue: 0,
                duration: 3000,
                delay: 500,
                useNativeDriver: true,
            }),
            // Scale up then down
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.2,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.8,
                    duration: 2700,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onComplete();
        });
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { translateY },
                        { translateX },
                        { scale },
                    ],
                    opacity,
                },
            ]}
        >
            <Text style={styles.emoji}>{emoji}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: '50%',
        marginLeft: -20,
    },
    emoji: {
        fontSize: 40,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});

export default FloatingEmoji;

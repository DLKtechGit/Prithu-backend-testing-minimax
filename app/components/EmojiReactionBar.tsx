import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';

interface EmojiReaction {
    emoji: string;
    id: string;
}

interface EmojiReactionBarProps {
    onEmojiPress: (emoji: string) => void;
}

const EMOJIS: EmojiReaction[] = [
    { emoji: '❤️', id: 'heart' },
    { emoji: '😂', id: 'laugh' },
    { emoji: '😮', id: 'wow' },
    { emoji: '😢', id: 'sad' },
    { emoji: '🔥', id: 'fire' },
];

const EmojiReactionBar: React.FC<EmojiReactionBarProps> = ({ onEmojiPress }) => {
    return (
        <View style={styles.container}>
            {EMOJIS.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.emojiButton}
                    onPress={() => onEmojiPress(item.emoji)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.emojiText}>{item.emoji}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        // backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
    },
    emojiButton: {
        padding: 15,
    },
    emojiText: {
        fontSize: 28,
    },
});

export default EmojiReactionBar;

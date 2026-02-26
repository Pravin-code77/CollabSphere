import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SkillTagProps {
    name: string;
    level?: string;
    verified?: boolean;
}

const SkillTag: React.FC<SkillTagProps> = ({ name, level, verified }) => {
    return (
        <View style={[styles.tag, verified && styles.verifiedTag]}>
            <Text style={[styles.text, verified && styles.verifiedText]}>
                {name} {level && `(${level})`} {verified && '✓'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    tag: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    verifiedTag: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    verifiedText: {
        color: '#166534',
    }
});

export default SkillTag;

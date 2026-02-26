import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import client from '../../api/client';

const ALL_SKILLS = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'SQL',
    // Web & Mobile
    'React', 'React Native', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Flutter',
    // Database & DevOps
    'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Git', 'CI/CD',
    // Tech Specialties
    'Machine Learning', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Blockchain', 'Cloud Architecture', 'GraphQL', 'REST API',
    // Non-Technical & Business
    'Project Management', 'Product Management', 'UI/UX Design', 'Graphic Design', 'Content Writing', 'Digital Marketing', 'SEO', 'SEM',
    'Agile Methodologies', 'Scrum', 'Leadership', 'Strategic Planning', 'Financial Analysis', 'Business Development', 'Sales Management',
    'Customer Relationship Management (CRM)', 'Public Relations', 'Human Resources (HR)', 'Recruiting', 'Market Research', 'Retail',
    'Requirements Analysis', 'Public Speaking', 'Social Media Management', 'Video Editing', 'Translation', 'Creative Writing'
];

const SkillTag = ({ name, onRemove }: { name: string; onRemove: () => void }) => (
    <View style={styles.skillTag}>
        <Text style={styles.skillTagText}>{name}</Text>
        <TouchableOpacity onPress={onRemove}>
            <Text style={styles.removeTag}>×</Text>
        </TouchableOpacity>
    </View>
);

const CreateProjectScreen = ({ navigation }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [teamSize, setTeamSize] = useState('3');
    const [urgency, setUrgency] = useState('medium');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSkillInput = (text: string) => {
        setSkillInput(text);
        if (text.length > 0) {
            const filtered = ALL_SKILLS.filter(s =>
                s.toLowerCase().includes(text.toLowerCase()) &&
                !selectedSkills.includes(s)
            );

            // If the typed text isn't in filtered, add it as a "custom" option
            if (text.trim() && !filtered.some(s => s.toLowerCase() === text.toLowerCase())) {
                setSuggestions([`Add "${text.trim()}"`, ...filtered]);
            } else {
                setSuggestions(filtered);
            }
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const addSkill = (skill: string) => {
        let skillToAdd = skill;
        if (skill.startsWith('Add "') && skill.endsWith('"')) {
            skillToAdd = skill.substring(5, skill.length - 1);
        }

        if (!selectedSkills.includes(skillToAdd)) {
            setSelectedSkills([...selectedSkills, skillToAdd]);
        }
        setSkillInput('');
        setShowSuggestions(false);
    };

    const removeSkill = (skillName: string) => {
        setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    };

    const handleSubmit = async () => {
        if (!title || !description || selectedSkills.length === 0) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const requiredSkills = selectedSkills.map(skill => ({
                skill,
                level: 'intermediate'
            }));

            await client.post('/projects', {
                title,
                description,
                teamSize: parseInt(teamSize),
                urgency,
                requiredSkills
            });

            Alert.alert('Success', 'Project created successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Project Title*</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. AI Matchmaking App"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description*</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your vision and what you're building..."
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Skill Autocomplete Implementation */}
                <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                    <Text style={styles.label}>Skills*</Text>
                    <View style={styles.autocompleteContainer}>
                        <TextInput
                            style={[styles.input, showSuggestions && styles.inputWithDropdown]}
                            placeholder="Type to search skills (e.g. RE...)"
                            value={skillInput}
                            onChangeText={handleSkillInput}
                            onFocus={() => handleSkillInput(skillInput)}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <View style={styles.dropdown}>
                                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                                    {suggestions.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.dropdownItem}
                                            onPress={() => addSkill(item)}
                                        >
                                            <Text style={styles.dropdownText}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Selected Skills Tags */}
                    <View style={styles.tagsContainer}>
                        {selectedSkills.map((skill, idx) => (
                            <SkillTag
                                key={idx}
                                name={skill}
                                onRemove={() => removeSkill(skill)}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Team Size</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={teamSize}
                            onChangeText={setTeamSize}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1.5 }]}>
                        <Text style={styles.label}>Urgency</Text>
                        <View style={styles.chipRow}>
                            {['low', 'medium', 'high'].map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.chip, urgency === u && styles.activeChip]}
                                    onPress={() => setUrgency(u)}
                                >
                                    <Text style={[styles.chipText, urgency === u && styles.activeChipText]}>
                                        {u}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Launch Project</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    form: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8fafc',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    chipRow: {
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 6,
        flex: 1,
        alignItems: 'center',
    },
    activeChip: {
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'capitalize',
    },
    activeChipText: {
        color: 'white',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    autocompleteContainer: {
        position: 'relative',
    },
    inputWithDropdown: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 0,
    },
    dropdown: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        zIndex: 2000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    dropdownItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownText: {
        fontSize: 15,
        color: '#334155',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    skillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    skillTagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginRight: 6,
    },
    removeTag: {
        fontSize: 18,
        color: '#94a3b8',
        lineHeight: 18,
    }
});

export default CreateProjectScreen;

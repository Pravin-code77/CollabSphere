import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    FlatList,
    Image,
    Platform,
} from 'react-native';
import client from '../../api/client';
import SkillTag from '../../components/SkillTag';
import { useAuth } from '../../providers/AuthProvider';
import { LogOut, Trash2 } from 'lucide-react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABILITY_OPTIONS = ['full-time', 'part-time', 'weekends'];

const TIMEZONE_LIST = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland',
];

const WORK_HOURS = [
    { label: 'Early Bird  (6 AM – 12 PM)', value: 'early' },
    { label: 'Day Worker  (9 AM – 5 PM)', value: 'day' },
    { label: 'Afternoon  (12 PM – 8 PM)', value: 'afternoon' },
    { label: 'Night Owl  (6 PM – 12 AM)', value: 'night' },
    { label: 'Flexible / Any time', value: 'flexible' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    open: { bg: '#dcfce7', text: '#16a34a' },
    'in-progress': { bg: '#fef9c3', text: '#ca8a04' },
    completed: { bg: '#e0f2fe', text: '#0284c7' },
};

// ─── AvatarView ───────────────────────────────────────────────────────────────

const AvatarView = ({ githubAvatarUri, displayName }: { githubAvatarUri: string | null; displayName: string }) => {
    const [imgError, setImgError] = useState(false);

    if (githubAvatarUri && !imgError) {
        return (
            <Image
                source={{ uri: githubAvatarUri }}
                style={avatarStyles.image}
                onError={() => setImgError(true)}
            />
        );
    }
    return (
        <View style={avatarStyles.placeholder}>
            <Text style={avatarStyles.letter}>
                {displayName[0]?.toUpperCase() ?? 'U'}
            </Text>
        </View>
    );
};

const avatarStyles = StyleSheet.create({
    image: {
        width: 88,
        height: 88,
        borderRadius: 44,
        marginBottom: 14,
        borderWidth: 3,
        borderColor: '#2563eb',
    },
    placeholder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#2563eb',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    letter: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
});

// ─── Component ────────────────────────────────────────────────────────────────

const ProfileScreen = () => {
    const { user, updateUser, logout } = useAuth();

    // ── profile data ──
    const [profile, setProfile] = useState<any>(null);
    const [myProjects, setMyProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // ── edit form fields ──
    const [editUsername, setEditUsername] = useState('');
    const [bio, setBio] = useState('');
    const [githubUsername, setGithubUsername] = useState('');
    const [availability, setAvailability] = useState('full-time');
    const [timezone, setTimezone] = useState('UTC');
    const [workHours, setWorkHours] = useState('flexible');

    // ── picker modals ──
    const [showTzModal, setShowTzModal] = useState(false);
    const [showWhModal, setShowWhModal] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [profileRes, projectsRes] = await Promise.all([
                client.get('/profiles/me'),
                client.get('/projects/my'),
            ]);
            const p = profileRes.data;
            setProfile(p);
            setEditUsername(user?.username || '');
            setBio(p.bio || '');
            setGithubUsername(p.githubUsername || '');
            setAvailability(p.availability || 'full-time');
            setTimezone(p.timezone || 'UTC');
            setWorkHours(p.workHours || 'flexible');
            setMyProjects(projectsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update profile fields
            const profileRes = await client.put('/profiles/me', {
                bio,
                githubUsername,
                availability,
                timezone,
                workHours,
            });
            setProfile(profileRes.data);

            // 2. Update username if it changed
            const trimmedUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '_');
            if (trimmedUsername && trimmedUsername !== user?.username) {
                const userRes = await client.put('/auth/me', { username: trimmedUsername });
                await updateUser(userRes.data.user);
            }

            setIsEditing(false);
            Alert.alert('✅ Saved', 'Profile updated successfully!');
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Failed to update profile. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // reset fields back to profile values
        setEditUsername(user?.username || '');
        setBio(profile?.bio || '');
        setGithubUsername(profile?.githubUsername || '');
        setAvailability(profile?.availability || 'full-time');
        setTimezone(profile?.timezone || 'UTC');
        setWorkHours(profile?.workHours || 'flexible');
        setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
        try {
            await client.delete('/profiles/me');
            logout();
        } catch (error) {
            console.error('Failed to delete account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
        }
    };

    const syncGitHub = async () => {
        if (!githubUsername) {
            Alert.alert('Error', 'Please enter your GitHub username first');
            return;
        }
        setSaving(true);
        try {
            const response = await client.post('/profiles/me/sync-github', { githubUsername });
            setProfile(response.data.profile);
            Alert.alert('Success', `Imported ${response.data.skills.length} skills from GitHub!`);
        } catch {
            Alert.alert('Error', 'Failed to sync with GitHub');
        } finally {
            setSaving(false);
        }
    };

    const workHoursLabel = WORK_HOURS.find(w => w.value === workHours)?.label ?? workHours;

    // ── Loading ──
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const displayName = user?.username ?? profile?.githubUsername ?? 'Your Profile';
    const githubAvatarUri = githubUsername
        ? `https://github.com/${githubUsername}.png`
        : null;

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <AvatarView
                        githubAvatarUri={githubAvatarUri}
                        displayName={displayName}
                    />
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.handleLabel}>@{githubUsername || user?.username || 'not connected'}</Text>
                    <Text style={styles.timezoneLabel}>🌍 {profile?.timezone || 'UTC'}</Text>

                    <View style={styles.headerButtons}>
                        {isEditing ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.btn, styles.cancelBtn]}
                                    onPress={handleCancel}
                                    disabled={saving}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, styles.saveBtn]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving
                                        ? <ActivityIndicator color="white" size="small" />
                                        : <Text style={styles.saveBtnText}>Save Profile</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[styles.btn, styles.editBtn]}
                                onPress={() => setIsEditing(true)}
                            >
                                <Text style={styles.editBtnText}>✏️  Edit Profile</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Username ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Username</Text>
                    {isEditing ? (
                        <View>
                            <TextInput
                                style={styles.input}
                                value={editUsername}
                                onChangeText={setEditUsername}
                                placeholder="Your username"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Text style={styles.inputHint}>
                                Lowercase letters, numbers and underscores only.
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.usernameText}>@{user?.username || '—'}</Text>
                    )}
                </View>

                {/* ── About Me ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Me</Text>
                    {isEditing ? (
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            multiline
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about yourself…"
                            placeholderTextColor="#94a3b8"
                        />
                    ) : (
                        <Text style={styles.bodyText}>
                            {profile?.bio || 'No bio yet. Add one to stand out!'}
                        </Text>
                    )}
                </View>

                {/* ── GitHub Integration ── */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.sectionTitle}>GitHub Integration</Text>
                        {!isEditing && (
                            <TouchableOpacity onPress={syncGitHub} disabled={saving}>
                                <Text style={styles.linkText}>
                                    {saving ? 'Syncing…' : 'Sync Now'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            value={githubUsername}
                            onChangeText={setGithubUsername}
                            placeholder="GitHub Username"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                        />
                    ) : (
                        <Text style={styles.githubText}>
                            @{profile?.githubUsername || 'not connected'}
                        </Text>
                    )}
                </View>

                {/* ── Skills ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills & Expertise</Text>
                    <View style={styles.skillsContainer}>
                        {profile?.skills?.map((skill: any, index: number) => (
                            <SkillTag
                                key={index}
                                name={skill.name}
                                level={skill.level}
                                verified={skill.verified}
                            />
                        ))}
                        {(!profile?.skills || profile.skills.length === 0) && (
                            <Text style={styles.emptyText}>
                                No skills listed. Sync your GitHub to import them!
                            </Text>
                        )}
                    </View>
                </View>

                {/* ── Availability ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Availability</Text>
                    {isEditing ? (
                        <View style={styles.chipRow}>
                            {AVAILABILITY_OPTIONS.map((a) => (
                                <TouchableOpacity
                                    key={a}
                                    style={[styles.chip, availability === a && styles.activeChip]}
                                    onPress={() => setAvailability(a)}
                                >
                                    <Text style={[styles.chipText, availability === a && styles.activeChipText]}>
                                        {a}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.chip, styles.activeChip, { alignSelf: 'flex-start' }]}>
                            <Text style={[styles.chipText, styles.activeChipText]}>
                                {profile?.availability || 'full-time'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Timezone ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🌍 Timezone</Text>
                    {isEditing ? (
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowTzModal(true)}
                        >
                            <Text style={styles.pickerButtonText}>{timezone}</Text>
                            <Text style={styles.pickerChevron}>▾</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.bodyText}>{profile?.timezone || 'UTC'}</Text>
                    )}
                </View>

                {/* ── Preferred Work Hours ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Preferred Work Hours</Text>
                    {isEditing ? (
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowWhModal(true)}
                        >
                            <Text style={styles.pickerButtonText}>{workHoursLabel}</Text>
                            <Text style={styles.pickerChevron}>▾</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.bodyText}>
                            {WORK_HOURS.find(w => w.value === (profile?.workHours || 'flexible'))?.label ?? 'Flexible / Any time'}
                        </Text>
                    )}
                </View>

                {/* ── My Projects ── */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionTitle}>📁 My Projects</Text>
                    {myProjects.length === 0 ? (
                        <View style={styles.emptyProjects}>
                            <Text style={styles.emptyProjectsIcon}>🚀</Text>
                            <Text style={styles.emptyProjectsTitle}>No projects yet</Text>
                            <Text style={styles.emptyText}>
                                Head to the Project Bazaar tab to create your first project!
                            </Text>
                        </View>
                    ) : (
                        myProjects.map((project: any) => {
                            const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.open;
                            return (
                                <View key={project._id} style={styles.projectCard}>
                                    <View style={styles.projectCardTop}>
                                        <Text style={styles.projectTitle} numberOfLines={1}>
                                            {project.title}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                            <Text style={[styles.statusText, { color: statusColor.text }]}>
                                                {project.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.projectDesc} numberOfLines={2}>
                                        {project.description}
                                    </Text>
                                    <View style={styles.projectMeta}>
                                        <Text style={styles.projectMetaText}>
                                            👥 Team size: {project.teamSize ?? 1}
                                        </Text>
                                        <Text style={styles.projectMetaText}>
                                            ⚡ {project.urgency ?? 'medium'} urgency
                                        </Text>
                                    </View>
                                    {project.requiredSkills?.length > 0 && (
                                        <View style={styles.projectSkills}>
                                            {project.requiredSkills.slice(0, 4).map((s: any, i: number) => (
                                                <View key={i} style={styles.skillPill}>
                                                    <Text style={styles.skillPillText}>{s.skill}</Text>
                                                </View>
                                            ))}
                                            {project.requiredSkills.length > 4 && (
                                                <View style={styles.skillPill}>
                                                    <Text style={styles.skillPillText}>
                                                        +{project.requiredSkills.length - 4}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                {/* ── Settings / Danger Zone ── */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>

                    <TouchableOpacity
                        style={[styles.btn, styles.logoutFullBtn]}
                        onPress={logout}
                    >
                        <LogOut size={20} color="#1e293b" />
                        <Text style={styles.logoutFullText}>Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.deleteAccBtn]}
                        onPress={() => {
                            Alert.alert(
                                'Delete Account',
                                'Are you sure you want to permanently delete your account? This action cannot be undone.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: handleDeleteAccount
                                    }
                                ]
                            );
                        }}
                    >
                        <Trash2 size={20} color="#dc2626" />
                        <Text style={styles.deleteAccText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Timezone Picker Modal ── */}
            <Modal visible={showTzModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Timezone</Text>
                            <TouchableOpacity onPress={() => setShowTzModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={TIMEZONE_LIST}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        timezone === item && styles.modalItemActive,
                                    ]}
                                    onPress={() => { setTimezone(item); setShowTzModal(false); }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        timezone === item && styles.modalItemTextActive,
                                    ]}>
                                        {item}
                                    </Text>
                                    {timezone === item && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── Work Hours Picker Modal ── */}
            <Modal visible={showWhModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Preferred Work Hours</Text>
                            <TouchableOpacity onPress={() => setShowWhModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={WORK_HOURS}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        workHours === item.value && styles.modalItemActive,
                                    ]}
                                    onPress={() => { setWorkHours(item.value); setShowWhModal(false); }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        workHours === item.value && styles.modalItemTextActive,
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {workHours === item.value && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    handleLabel: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
        marginBottom: 4,
    },
    timezoneLabel: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 18,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 10,
    },

    // Buttons
    btn: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 12,
    },
    editBtn: {
        backgroundColor: '#2563eb',
    },
    editBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    saveBtn: {
        backgroundColor: '#16a34a',
    },
    saveBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    cancelBtn: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelBtnText: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 15,
    },

    // Section
    section: {
        padding: 24,
        backgroundColor: 'white',
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bodyText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
    },
    githubText: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    usernameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    inputHint: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 6,
    },
    linkText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyText: {
        color: '#94a3b8',
        fontStyle: 'italic',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    // Inputs
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#1e293b',
        backgroundColor: '#f8fafc',
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
    },

    // Chips
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    activeChip: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    chipText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    activeChipText: {
        color: 'white',
    },

    // Skills
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },

    // Picker button
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 14,
        backgroundColor: '#f8fafc',
    },
    pickerButtonText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    pickerChevron: {
        fontSize: 16,
        color: '#94a3b8',
    },

    // My Projects
    emptyProjects: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyProjectsIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    emptyProjectsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
    },
    projectCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    projectCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    projectDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 10,
    },
    projectMeta: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 10,
    },
    projectMetaText: {
        fontSize: 13,
        color: '#64748b',
    },
    projectSkills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    skillPill: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    skillPillText: {
        fontSize: 12,
        color: '#0284c7',
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '65%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalClose: {
        fontSize: 18,
        color: '#94a3b8',
        padding: 4,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    modalItemActive: {
        backgroundColor: '#eff6ff',
    },
    modalItemText: {
        fontSize: 15,
        color: '#334155',
    },
    modalItemTextActive: {
        color: '#2563eb',
        fontWeight: '700',
    },
    checkmark: {
        color: '#2563eb',
        fontSize: 16,
        fontWeight: '700',
    },

    // Danger Zone
    logoutFullBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
        paddingVertical: 14,
    },
    logoutFullText: {
        color: '#1e293b',
        fontWeight: '700',
        fontSize: 16,
    },
    deleteAccBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#fee2e2',
        paddingVertical: 14,
    },
    deleteAccText: {
        color: '#dc2626',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Image,
} from 'react-native';
import client from '../../api/client';
import SkillTag from '../../components/SkillTag';
import { useAuth } from '../../providers/AuthProvider';
import { Edit, Trash2, X, Check, Zap, Plus } from 'lucide-react-native';

const URGENCY_COLORS: Record<string, { bg: string; text: string }> = {
    high: { bg: '#fee2e2', text: '#dc2626' },
    medium: { bg: '#fef9c3', text: '#ca8a04' },
    low: { bg: '#dcfce7', text: '#16a34a' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    open: { bg: '#dcfce7', text: '#16a34a' },
    'in-progress': { bg: '#fef9c3', text: '#ca8a04' },
    completed: { bg: '#e0f2fe', text: '#0284c7' },
};

const ProjectDetailScreen = ({ route, navigation }: any) => {
    const { project: initialProject } = route.params;
    const { user } = useAuth();
    const [project, setProject] = useState(initialProject);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [message, setMessage] = useState('');
    const [joining, setJoining] = useState(false);

    const [editTitle, setEditTitle] = useState(project.title);
    const [editDescription, setEditDescription] = useState(project.description);
    const [editSkills, setEditSkills] = useState(project.requiredSkills || []);
    const [newSkill, setNewSkill] = useState('');
    const [updating, setUpdating] = useState(false);
    const [matchScore, setMatchScore] = useState<number | null>(project.matchScore || null);

    const urgencyColor = URGENCY_COLORS[project.urgency] ?? URGENCY_COLORS.medium;
    const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.open;

    const currentUserId = user?._id || user?.id;
    const isOwner = currentUserId === project.ownerId?._id || currentUserId === project.ownerId?.id || currentUserId === project.ownerId;
    const teamMembers = project.members || [];
    const isMember = teamMembers.some((m: any) => (m._id || m.id || m) === currentUserId);
    const membersNeeded = Math.max(0, project.teamSize - teamMembers.length);

    const owner = project.ownerId;
    const ownerUsername = owner?.username ?? 'Unknown';
    const ownerGithub = owner?.githubUsername ?? ownerUsername;
    const ownerAvatarUrl = `https://github.com/${ownerGithub}.png`;

    useEffect(() => {
        const fetchMatchScore = async () => {
            if (isOwner || isMember || matchScore !== null) return;
            try {
                const resp = await client.get(`/projects/${project._id}/match`);
                setMatchScore(resp.data.score);
            } catch (err) {
                console.error('Failed to fetch match score:', err);
            }
        };
        fetchMatchScore();
    }, [project._id, isOwner, isMember, matchScore]);

    const handleJoin = async () => {
        if (!message.trim()) {
            Alert.alert('Required', 'Please write a short message about why you want to join.');
            return;
        }
        setJoining(true);
        try {
            await client.post(`/projects/${project._id}/join`, { message });
            setShowJoinModal(false);
            Alert.alert('🎉 Request Sent!', 'Your join request has been sent to the project owner.');
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Failed to send join request.';
            Alert.alert('Error', msg);
        } finally {
            setJoining(false);
        }
    };

    const handleUpdate = async () => {
        if (!editTitle.trim() || !editDescription.trim()) {
            Alert.alert('Required', 'Title and description cannot be empty.');
            return;
        }
        setUpdating(true);
        try {
            const resp = await client.put(`/projects/${project._id}`, {
                title: editTitle,
                description: editDescription,
                requiredSkills: editSkills
            });
            setProject(resp.data);
            setShowEditModal(false);
            Alert.alert('Success', 'Project updated successfully!');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to update project');
        } finally {
            setUpdating(false);
        }
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (editSkills.some((s: any) => s.skill.toLowerCase() === newSkill.trim().toLowerCase())) {
            Alert.alert('Duplicate', 'This skill is already in the list.');
            return;
        }
        setEditSkills([...editSkills, { skill: newSkill.trim(), priority: 'medium' }]);
        setNewSkill('');
    };

    const removeSkill = (index: number) => {
        setEditSkills(editSkills.filter((_: any, i: number) => i !== index));
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Project',
            'Are you sure you want to delete this project? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/projects/${project._id}`);
                            Alert.alert('Deleted', 'Project has been deleted.', [
                                { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                        } catch (err: any) {
                            Alert.alert('Error', err?.response?.data?.message || 'Failed to delete project');
                        }
                    }
                }
            ]
        );
    };

    const handleClose = () => {
        Alert.alert(
            'Close Project',
            'Are you sure you want to close this project? It will be removed from the Explore sections but remain in your profile.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const resp = await client.put(`/projects/${project._id}`, { status: 'completed' });
                            setProject(resp.data);
                            Alert.alert('Closed', 'Project has been marked as completed.');
                        } catch (err: any) {
                            Alert.alert('Error', err?.response?.data?.message || 'Failed to close project');
                        }
                    }
                }
            ]
        );
    };

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.hero}>
                    <View style={styles.heroHeader}>
                        <View style={styles.heroBadges}>
                            <View style={[styles.badge, { backgroundColor: urgencyColor.bg }]}>
                                <Text style={[styles.badgeText, { color: urgencyColor.text }]}>
                                    🔥 {project.urgency?.toUpperCase()} URGENCY
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                                <Text style={[styles.badgeText, { color: statusColor.text }]}>
                                    {project.status?.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        {isOwner && (
                            <View style={styles.ownerActions}>
                                {project.status !== 'completed' && (
                                    <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: '#10b981' }]} onPress={handleClose}>
                                        <Check size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.actionIconButton} onPress={() => setShowEditModal(true)}>
                                    <Edit size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: '#ef4444' }]} onPress={handleDelete}>
                                    <Trash2 size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <Text style={styles.heroTitle}>{project.title}</Text>
                    <View style={styles.heroFooter}>
                        <Text style={styles.heroMeta}>👥 {membersNeeded} members needed</Text>
                        {matchScore !== null && !isOwner && !isMember && (
                            <View style={styles.matchBadge}>
                                <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                                <Text style={styles.matchText}>{matchScore}% Match</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About This Project</Text>
                    <Text style={styles.bodyText}>{project.description}</Text>
                </View>

                {/* Required Skills */}
                {project.requiredSkills?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Required Skills</Text>
                        <View style={styles.skillsRow}>
                            {project.requiredSkills.map((req: any, idx: number) => (
                                <SkillTag key={idx} name={req.skill} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Owner */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Project Owner</Text>
                    <View style={styles.ownerCard}>
                        <Image
                            source={{ uri: ownerAvatarUrl }}
                            style={styles.ownerAvatar}
                            defaultSource={{ uri: `https://ui-avatars.com/api/?name=${ownerUsername}&background=2563eb&color=fff&size=128` }}
                        />
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>{ownerUsername}</Text>
                            <Text style={styles.ownerHandle}>@{ownerGithub}</Text>
                        </View>
                    </View>
                </View>

                {/* Team Members */}
                {teamMembers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Team Members</Text>
                        <View style={styles.membersList}>
                            {teamMembers.map((member: any, idx: number) => (
                                <View key={idx} style={styles.memberItem}>
                                    <Image
                                        source={{ uri: `https://ui-avatars.com/api/?name=${member.username}&background=f1f5f9&color=64748b` }}
                                        style={styles.memberAvatar}
                                    />
                                    <Text style={styles.memberName}>{member.username}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {!isOwner && !isMember && project.status !== 'completed' ? (
                    <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => setShowJoinModal(true)}
                    >
                        <Text style={styles.joinBtnText}>🚀  Request to Join</Text>
                    </TouchableOpacity>
                ) : (isOwner || isMember) ? (
                    <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => navigation.navigate('Chat', { project })}
                    >
                        <Text style={styles.chatBtnText}>💬  Open Team Chat</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Join Modal */}
            <Modal visible={showJoinModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Why do you want to join?</Text>
                            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                                <X size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <TextInput
                                style={styles.messageInput}
                                multiline
                                numberOfLines={5}
                                placeholder="Tell the owner about your relevant skills, experience, and what you can contribute…"
                                placeholderTextColor="#94a3b8"
                                value={message}
                                onChangeText={setMessage}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, joining && { opacity: 0.6 }]}
                                onPress={handleJoin}
                                disabled={joining}
                            >
                                {joining
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={styles.sendBtnText}>Send Request</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={showEditModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Project Details</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Project Title</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editTitle}
                                    onChangeText={setEditTitle}
                                    placeholder="Enter project title"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    placeholder="Enter project description"
                                    multiline
                                    numberOfLines={6}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Required Skills</Text>
                                <View style={styles.addSkillRow}>
                                    <TextInput
                                        style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                                        value={newSkill}
                                        onChangeText={setNewSkill}
                                        placeholder="Add a skill (e.g. React Native)"
                                        onSubmitEditing={addSkill}
                                    />
                                    <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                                        <Plus size={20} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.editSkillsList}>
                                    {editSkills.map((s: any, idx: number) => (
                                        <View key={idx} style={styles.editSkillTag}>
                                            <Text style={styles.editSkillText}>{s.skill}</Text>
                                            <TouchableOpacity onPress={() => removeSkill(idx)}>
                                                <X size={14} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.sendBtn, updating && { opacity: 0.6 }]}
                                onPress={handleUpdate}
                                disabled={updating}
                            >
                                {updating
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={styles.sendBtnText}>Save Changes</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    hero: {
        backgroundColor: '#2563eb',
        padding: 24,
        paddingTop: 32,
    },
    heroBadges: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: 'white',
        lineHeight: 34,
        marginBottom: 10,
    },
    heroMeta: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
    },
    section: {
        backgroundColor: 'white',
        marginTop: 10,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    bodyText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    ownerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e2e8f0',
        marginRight: 14,
    },
    ownerInfo: {
        flex: 1,
    },
    ownerName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
    },
    ownerHandle: {
        fontSize: 13,
        color: '#2563eb',
        marginTop: 2,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 16,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    joinBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    joinBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
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
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalClose: {
        fontSize: 18,
        color: '#94a3b8',
        padding: 4,
    },
    modalBody: {
        padding: 20,
        gap: 16,
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1e293b',
        backgroundColor: '#f8fafc',
        textAlignVertical: 'top',
        minHeight: 120,
    },
    sendBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    sendBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    membersList: {
        gap: 12,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    memberAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
        backgroundColor: '#f1f5f9',
    },
    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    chatBtn: {
        backgroundColor: '#0f172a',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    chatBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    ownerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionIconButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1e293b',
        backgroundColor: '#f8fafc',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    matchText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#f59e0b',
    },
    addSkillRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    addSkillBtn: {
        backgroundColor: '#2563eb',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editSkillsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    editSkillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    editSkillText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
    },
});

export default ProjectDetailScreen;

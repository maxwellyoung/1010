import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FocusOverlayProps {
    visible: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const FocusOverlay: React.FC<FocusOverlayProps> = ({ visible, title, subtitle, onClose, children }) => {
    const insets = useSafeAreaInsets();
    const scale = useRef(new Animated.Value(1)).current;
    const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const lastScale = useRef(1);
    const lastTranslate = useRef({ x: 0, y: 0 });
    const startTranslate = useRef({ x: 0, y: 0 });
    const startScale = useRef(1);
    const startDistance = useRef(0);
    const lastTap = useRef(0);

    useEffect(() => {
        if (!visible) {
            scale.setValue(1);
            translate.setValue({ x: 0, y: 0 });
            lastScale.current = 1;
            lastTranslate.current = { x: 0, y: 0 };
        }
    }, [scale, translate, visible]);

    const handleDoubleTap = () => {
        const nextScale = lastScale.current > 1 ? 1 : 1.6;
        lastScale.current = nextScale;
        Animated.timing(scale, {
            toValue: nextScale,
            duration: 220,
            useNativeDriver: true,
        }).start();
        translate.setValue({ x: 0, y: 0 });
        lastTranslate.current = { x: 0, y: 0 };
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const now = Date.now();
                if (now - lastTap.current < 240) {
                    handleDoubleTap();
                }
                lastTap.current = now;
                const touches = evt.nativeEvent.touches;
                if (touches.length === 2) {
                    const [a, b] = touches;
                    startDistance.current = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
                    startScale.current = lastScale.current;
                } else {
                    startTranslate.current = lastTranslate.current;
                }
            },
            onPanResponderMove: (evt, gesture) => {
                const touches = evt.nativeEvent.touches;
                if (touches.length === 2) {
                    const [a, b] = touches;
                    const distance = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
                    const rawScale = startScale.current * (distance / Math.max(1, startDistance.current));
                    const nextScale = clamp(rawScale, 1, 2.4);
                    scale.setValue(nextScale);
                    lastScale.current = nextScale;
                } else {
                    const nextX = startTranslate.current.x + gesture.dx;
                    const nextY = startTranslate.current.y + gesture.dy;
                    translate.setValue({ x: nextX, y: nextY });
                    lastTranslate.current = { x: nextX, y: nextY };
                }
            },
        })
    ).current;

    if (!visible) {
        return null;
    }

    const { width, height } = Dimensions.get('window');
    const contentHeight = height - insets.top - insets.bottom - Spacing.xxxl;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, { paddingTop: insets.top + Spacing.md }]}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>{title}</Text>
                            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>DRAG / PINCH / DOUBLE TAP</Text>
                    <View style={[styles.canvas, { height: contentHeight, width }]}>
                        <Animated.View
                            style={{ transform: [{ translateX: translate.x }, { translateY: translate.y }, { scale }] }}
                            {...panResponder.panHandlers}
                        >
                            {children}
                        </Animated.View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
    },
    sheet: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    subtitle: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 1,
        fontFamily: Typography.mono,
        marginTop: Spacing.xs,
    },
    closeButton: {
        borderWidth: 1,
        borderColor: Colors.tertiary,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
    },
    closeText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    hint: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
        marginBottom: Spacing.md,
    },
    canvas: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

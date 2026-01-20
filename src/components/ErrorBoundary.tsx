import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { Glyphs } from '../constants/Glyphs';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary
 *
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the app.
 *
 * Inspired by Dieter Rams' honesty principle:
 * When something fails, communicate it clearly.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.glyph}>{Glyphs.status.off}</Text>
                    <Text style={styles.title}>SIGNAL INTERRUPTED</Text>
                    <Text style={styles.message}>
                        Something unexpected occurred.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <Text style={styles.errorDetail}>
                            {this.state.error.message}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                        <Text style={styles.buttonText}>RETRY</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

/**
 * Lightweight error fallback for non-critical components
 */
export const ErrorFallback: React.FC<{ message?: string }> = ({
    message = 'Component unavailable'
}) => (
    <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    glyph: {
        fontSize: 48,
        color: Colors.tertiary,
        marginBottom: Spacing.lg,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontFamily: Typography.mono,
        letterSpacing: 2,
        marginBottom: Spacing.md,
    },
    message: {
        color: Colors.secondary,
        fontSize: Typography.size.sm,
        fontFamily: Typography.mono,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    errorDetail: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    button: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.tertiary,
    },
    buttonText: {
        color: Colors.primary,
        fontSize: Typography.size.sm,
        fontFamily: Typography.mono,
        letterSpacing: 2,
    },
    fallback: {
        padding: Spacing.md,
        alignItems: 'center',
    },
    fallbackText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
    },
});

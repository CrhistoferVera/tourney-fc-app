import { View, Text, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

export default function BallLoader({ size = 52 }: { size?: number }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bounceAnim, {
            toValue: -(size * 1.5),
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shadowAnim, {
            toValue: 0.35,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 420,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shadowAnim, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, [bounceAnim, shadowAnim, size]);

  const shadowScale = shadowAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.45, 1] });
  const shadowOpacity = shadowAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.05, 0.18] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'flex-end', height: size * 3.2 }}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: '#0D7A3E',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#0D7A3E', shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
        }}>
          <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.72 }}>⚽</Text>
        </View>
      </Animated.View>
      <Animated.View style={{
        width: size * 0.65, height: 5, borderRadius: 10,
        backgroundColor: '#0F1A14',
        opacity: shadowOpacity,
        transform: [{ scaleX: shadowScale }],
        marginTop: 8,
      }} />
    </View>
  );
}

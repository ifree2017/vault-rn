/**
 * ImageViewerModal — Full-screen image viewer with pinch-to-zoom
 * Uses React Native's built-in Image component with transform gestures
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  uri?: string;
  onClose: () => void;
}

export default function ImageViewerModal({ visible, uri, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const originX = useRef(0);
  const originY = useRef(0);

  const resetTransform = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 1) {
          originX.current = evt.nativeEvent.locationX;
          originY.current = evt.nativeEvent.locationY;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch
          const dx = evt.nativeEvent.touches[0].pageX - evt.nativeEvent.touches[1].pageX;
          const dy = evt.nativeEvent.touches[0].pageY - evt.nativeEvent.touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const newScale = Math.max(0.5, Math.min(dist / 200, 4));
          setScale(newScale);
          lastScale.current = newScale;
        } else if (evt.nativeEvent.touches.length === 1) {
          // Single finger pan
          if (scale > 1) {
            setTranslateX(lastTranslateX.current + gestureState.dx);
            setTranslateY(lastTranslateY.current + gestureState.dy);
          }
        }
      },
      onPanResponderRelease: () => {
        lastTranslateX.current = translateX;
        lastTranslateY.current = translateY;
        if (scale < 1) {
          resetTransform();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <IconButton icon="close" iconColor="#fff" size={28} />
        </TouchableOpacity>

        {uri ? (
          <View style={styles.imageContainer} {...panResponder.panHandlers}>
            <Animated.Image
              source={{ uri }}
              style={[
                styles.image,
                {
                  transform: [
                    { scale },
                    { translateX: translateX / scale },
                    { translateY: translateY / scale },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}

        {scale > 1 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
          </View>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={resetTransform}>
          <IconButton icon="fit-to-screen" iconColor="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  imageContainer: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.8,
  },
  placeholder: {
    width: SCREEN_W,
    height: SCREEN_H * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
  },
  resetBtn: {
    position: 'absolute',
    bottom: 40,
    right: 16,
  },
});

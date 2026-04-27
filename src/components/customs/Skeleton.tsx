import React from 'react';
import { View, StyleSheet } from 'react-native';

const Skeleton: React.FC = () => {
  return <View style={styles.skeleton} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    height: 20,
    width: '100%',
  },
});

export default Skeleton;

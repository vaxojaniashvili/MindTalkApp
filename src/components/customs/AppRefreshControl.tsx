import React from 'react';
import { RefreshControl } from 'react-native';
import { Colors } from '../../constants/theme';

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
};

/** Themed pull-to-refresh control used across dynamic list/scroll screens. */
export default function AppRefreshControl({ refreshing, onRefresh }: Props) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.primary.ink}
      colors={[Colors.primary.ink]}
    />
  );
}

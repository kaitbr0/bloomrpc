import * as React from 'react';

interface BadgeProps {
  type: 'protoFile' | 'service' | 'method';
  children: React.ReactNode;
}

export function Badge({ type, children }: BadgeProps) {
  const styles = {
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      borderRadius: '3px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginRight: '8px',
      ...getBadgeColors(type),
    }
  };

  return (
    <span style={styles.badge}>
      {children}
    </span>
  );
}

function getBadgeColors(type: BadgeProps['type']) {
  switch (type) {
    case 'protoFile':
      return {
        backgroundColor: '#e6f7ff',
        color: '#1890ff',
        border: '1px solid #91d5ff'
      };
    case 'service':
      return {
        backgroundColor: '#fff7e6',
        color: '#fa8c16',
        border: '1px solid #ffd591'
      };
    case 'method':
      return {
        backgroundColor: '#f6ffed',
        color: '#52c41a',
        border: '1px solid #b7eb8f'
      };
  }
}

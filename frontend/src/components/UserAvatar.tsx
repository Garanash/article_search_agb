import React from 'react';

interface UserAvatarProps {
  user?: {
    username?: string;
    avatar_url?: string;
  } | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'medium', 
  className = '', 
  style = {} 
}) => {
  const sizeMap = {
    small: { width: 24, height: 24, fontSize: 10 },
    medium: { width: 32, height: 32, fontSize: 14 },
    large: { width: 48, height: 48, fontSize: 18 }
  };

  const sizeStyles = sizeMap[size];

  const defaultStyle: React.CSSProperties = {
    width: sizeStyles.width,
    height: sizeStyles.height,
    borderRadius: '50%',
    background: user?.avatar_url 
      ? `url(${user.avatar_url}) center/cover` 
      : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: sizeStyles.fontSize,
    fontWeight: 'bold',
    border: '2px solid rgba(255,255,255,0.3)',
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    ...style
  };

  const getInitials = (username?: string): string => {
    if (!username) return 'У';
    
    const words = username.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`;
    }
    return username.charAt(0);
  };

  return (
    <div
      className={`user-avatar ${className}`}
      style={defaultStyle}
      title={user?.username || 'Пользователь'}
    >
      {!user?.avatar_url && getInitials(user?.username)}
    </div>
  );
};

export default UserAvatar;

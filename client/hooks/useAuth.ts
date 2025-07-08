import { useUser } from '@clerk/clerk-expo';

export const useAuthRole = () => {
  const { user } = useUser();
  
  const isAdmin = () => {
    if (!user?.publicMetadata) return false;
    return user.publicMetadata.role === 'admin';
  };

  return {
    isAdmin: isAdmin(),
    user
  };
};
import { supabase } from './supabase';

export type Profile = {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    phone: data.phone,
    username: data.username,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    role: data.role,
    isVerified: data.is_verified,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateProfile(
  userId: string,
  updates: {
    fullName?: string;
    phone?: string;
    bio?: string;
    role?: 'TENANT' | 'LANDLORD';
  }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      phone: updates.phone,
      bio: updates.bio,
      role: updates.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    phone: data.phone,
    username: data.username,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    role: data.role,
    isVerified: data.is_verified,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const filePath = `avatars/${userId}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const avatarUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) throw updateError;

  return avatarUrl;
}
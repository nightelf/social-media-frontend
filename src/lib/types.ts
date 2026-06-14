export type Channel = "EMAIL" | "SMS";

export interface Challenge {
  challenge_id: number;
  channel: Channel;
  destination: string;
}

export interface Me {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  bio: string;
  email_verified: boolean;
  phone_verified: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface PublicUser {
  id: number;
  username: string;
  bio: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  created_at: string;
}

export interface Author {
  id: number;
  username: string;
}

export interface Post {
  id: number;
  body: string;
  author: Author;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  body: string;
  author: Author;
  created_at: string;
}

export interface Paginated<T> {
  results: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AuthComplete {
  status: "complete";
  access: string;
  refresh: string;
  user: { id: number; username: string; email_verified: boolean; phone_verified: boolean };
}

export interface AuthPending {
  status: "pending";
  remaining: { challenge_id: number; channel: Channel }[];
}

export type VerifyResult = AuthComplete | AuthPending;

export type PublicContentType = "DOCTOR" | "SERVICE" | "MEDICINE";

export interface PublicContentSummary {
  id: string;
  refId?: string;
  refType: PublicContentType;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  active: boolean;
  featured: boolean;
  sortOrder?: number;
}

export interface PublicContent {
  id: string;
  refId?: string;
  refType: PublicContentType;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  subImages?: string[];
  thumbnailUrl?: string;
  extraData?: string;
  active: boolean;
  featured: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicContentSearchRequest {
  refType?: PublicContentType;
  active?: boolean;
  featured?: boolean;
  keyword?: string;
  refId?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface CreatePublicContentRequest {
  refId?: string;
  refType: PublicContentType;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  subImages?: string[];
  thumbnailUrl?: string;
  extraData?: string;
  active?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

export interface UpdatePublicContentRequest {
  refId?: string;
  refType?: PublicContentType;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  subImages?: string[];
  thumbnailUrl?: string;
  extraData?: string;
  active?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

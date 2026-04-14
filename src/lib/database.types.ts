// Row types (what you get back from select)
export type Notice = {
  id: number;
  title: string;
  content: string;
  category: 'competition' | 'education' | 'event' | 'association';
  pinned: boolean;
  created_at: string;
  updated_at: string;
  author: string | null;
  thumbnail_url: string | null;
};

export type Program = {
  id: number;
  name: string;
  status: 'recruiting' | 'ongoing' | 'closed';
  schedule: string | null;
  apply_link: string | null;
  description: string;
  image_url: string | null;
  category: 'instructor' | 'referee' | 'specialized';
  created_at: string;
  updated_at: string;
};

export type Competition = {
  id: number;
  name: string;
  status: 'recruiting' | 'ongoing' | 'closed';
  schedule: string | null;
  result: string | null;
  description: string;
  image_url: string | null;
  year: number;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: number;
  title: string;
  date: string;
  media_urls: string[];
  category: string | null;
  description: string | null;
  created_at: string;
};

export type PressItem = {
  id: number;
  title: string;
  source: string | null;
  url: string | null;
  date: string;
  created_at: string;
  /** 본문 내용 (TiptapEditor로 생성된 HTML). migration 002 이후 추가됨. */
  content: string;
};

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
};

// Helper: make nullable fields optional for inserts
type NullableOptional<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as null extends T[K] ? K : never]?: T[K];
};

// Insert/Update helper types
export type NoticeInsert = NullableOptional<Omit<Notice, 'id' | 'created_at' | 'updated_at'>>;
export type NoticeUpdate = Partial<Omit<Notice, 'id' | 'created_at' | 'updated_at'>>;

export type ProgramInsert = NullableOptional<Omit<Program, 'id' | 'created_at' | 'updated_at'>>;
export type ProgramUpdate = Partial<Omit<Program, 'id' | 'created_at' | 'updated_at'>>;

export type CompetitionInsert = NullableOptional<Omit<Competition, 'id' | 'created_at' | 'updated_at'>>;
export type CompetitionUpdate = Partial<Omit<Competition, 'id' | 'created_at' | 'updated_at'>>;

export type GalleryInsert = NullableOptional<Omit<GalleryItem, 'id' | 'created_at'>>;
export type GalleryUpdate = Partial<Omit<GalleryItem, 'id' | 'created_at'>>;

export type PressInsert = NullableOptional<Omit<PressItem, 'id' | 'created_at'>>;
export type PressUpdate = Partial<Omit<PressItem, 'id' | 'created_at'>>;

export type FaqInsert = NullableOptional<Omit<FaqItem, 'id'>>;
export type FaqUpdate = Partial<Omit<FaqItem, 'id'>>;

// Derived types
export type NoticeCategory = Notice['category'];
export type ProgramCategory = Program['category'];
export type StatusType = Program['status'];

// Label maps
export const NOTICE_CATEGORY_LABEL: Record<NoticeCategory, string> = {
  competition: '대회',
  education: '교육',
  event: '행사',
  association: '협회',
};

export const STATUS_LABEL: Record<StatusType, string> = {
  recruiting: '모집중',
  ongoing: '진행중',
  closed: '종료',
};

export const PROGRAM_CATEGORY_LABEL: Record<ProgramCategory, string> = {
  instructor: '강사 교육',
  referee: '심판 교육',
  specialized: '서핑특화 교육',
};

// Database type for Supabase client
export type Database = {
  public: {
    Tables: {
      notices: {
        Row: Notice;
        Insert: NoticeInsert;
        Update: NoticeUpdate;
        Relationships: [];
      };
      programs: {
        Row: Program;
        Insert: ProgramInsert;
        Update: ProgramUpdate;
        Relationships: [];
      };
      competitions: {
        Row: Competition;
        Insert: CompetitionInsert;
        Update: CompetitionUpdate;
        Relationships: [];
      };
      gallery: {
        Row: GalleryItem;
        Insert: GalleryInsert;
        Update: GalleryUpdate;
        Relationships: [];
      };
      press: {
        Row: PressItem;
        Insert: PressInsert;
        Update: PressUpdate;
        Relationships: [];
      };
      faq: {
        Row: FaqItem;
        Insert: FaqInsert;
        Update: FaqUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

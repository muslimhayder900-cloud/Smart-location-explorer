
export interface Location {
  latitude: number;
  longitude: number;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: GroundingChunk[];
  location?: Location;
}

export interface GeminiResponse {
  text: string;
  sources: GroundingChunk[];
}

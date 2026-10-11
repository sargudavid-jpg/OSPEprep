export interface ClassItem {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface StudyMaterialItem {
  id: string;
  class_id: string;
  file_name: string;
  file_url: string;
  extracted_text?: string | null;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

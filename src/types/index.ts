export interface SavedSnippet {
  id: string;
  name: string;
  code: string;
  language?: string;
  description?: string;
  createdAt: string;
  tags?: string[]; // e.g., 'generated', 'fixed', 'explained'
}

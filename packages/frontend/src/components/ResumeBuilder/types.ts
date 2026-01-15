export interface ResumeSection {
  id: string;
  type:
    | 'personal'
    | 'experience'
    | 'education'
    | 'skills'
    | 'projects'
    | 'custom';
  title: string;
  content: string;
}

export interface ResumeTheme {
  id: string;
  name: string;
  primary: string;
  background: string;
  text: string;
  accent: string;
  fontFamily: string;
}

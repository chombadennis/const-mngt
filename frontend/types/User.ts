export interface User {
  id: number;       // consistent with backend
  email: string;
  full_name: string;
  username: string;
  roles: string[];
}

export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  requiresPasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  data: {
    staff: Staff;
    permissions: string[];
    token: string;
  };
};

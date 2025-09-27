// Utility to check if admin is authenticated
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

import bcrypt from "bcrypt";
const saltRounds = 10;

/**
 * hash password using bcrypt
 * @param password password in string format
 * @returns hash string of password
 */
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * 
 * @param password password in string formet
 * @param hash hash string of password 
 * @returns boolean
 */
export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
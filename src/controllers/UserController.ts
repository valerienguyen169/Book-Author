import { Request, Response } from 'express';
import argon2 from 'argon2';
import {
  addUser,
  getUserByEmail,
  getUserById,
  incrementProfileViews,
  allUserData,
  resetAllProfileViews,
  updateEmailAddress,
} from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function getAllUserProfiles(req: Request, res: Response): Promise<void> {
  res.json(await allUserData());
}

async function registerUser(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as AuthRequest;

  // IMPORTANT: Hash the password
  const passwordHash = await argon2.hash(password);

  try {
    // IMPORTANT: Store the `passwordHash` and NOT the plaintext password
    const newUser = await addUser(email, passwordHash);
    console.log(newUser);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as AuthRequest;

  const user = await getUserByEmail(email);
  if (!user) {
    res.sendStatus(404); // 404 Not Found - email doesn't exist
    return;
  }

  const { passwordHash } = user;
  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(404); // 404 Not Found - user with email/pass doesn't exist
    return;
  }

  res.sendStatus(200);
}

async function getUserProfileData(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as UserIdParam;

  // Get the user account
  let user = await getUserById(userId);

  if (!user) {
    res.sendStatus(404); // 404 Not Found
    return;
  }

  // Now update their profile views
  user = await incrementProfileViews(user);

  res.json(user);
}

async function resetProfileViews(req: Request, res: Response): Promise<void> {
  await resetAllProfileViews();
  res.sendStatus(200);
}

async function updateUserEmail(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as UserIdParam;
  console.log(req.session);

  const { email } = req.body as { email: string };

  // Get the user account
  const user = await getUserById(userId);

  if (!user) {
    res.sendStatus(404); // 404 Not Found
    return;
  }

  // Now update their email address
  try {
    await updateEmailAddress(userId, email);
  } catch (err) {
    // The email was taken so we need to send an error message
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
    return;
  }

  res.sendStatus(200);
}

export {
  registerUser,
  logIn,
  getUserProfileData,
  getAllUserProfiles,
  resetProfileViews,
  updateUserEmail,
};

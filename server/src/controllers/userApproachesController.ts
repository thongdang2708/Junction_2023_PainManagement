import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import userApproachModel from '../models/userApproachModel.js'
import painsServices from '../services/painsServices.js'
import UsersServices from '../services/usersServices.js'
import { ApiError } from '../utils/ApiError.js'
import approachesServices from '../services/approachesServices.js'
import userAchievementModel from '../models/userAchievementModel.js'
import approachModel from '../models/approachModel.js'

export async function createUserApproach(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = req.params
  const { approachId } = req.body

  if (approachId === undefined) {
    next(ApiError.badRequest('approachId is missing'))
    return
  }

  const approach = await approachesServices.findById(approachId)

  if (approach === null) {
    next(
      ApiError.notFound('This approach with this approach id does not exist!')
    )
    return
  }

  const newUserApproach = await UsersServices.createUserApproach(
    userId,
    approachId
  )

  if (newUserApproach === null) {
    next(ApiError.badRequest('This approach cannot be saved!'))
    return
  }
  res.status(201).json(newUserApproach)
}

export async function findAllUserApproaches(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = req.params

  try {
    const userApproaches = await UsersServices.findAllUserApproaches(userId)
    res.json(userApproaches)
  } catch (error) {
    next(ApiError.internal('something wrong happed'))
  }
}

export async function updateStatusForUserApproach(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userApproachId } = req.body;


  let userApproach = await userApproachModel.findById(userApproachId);

  if (userApproach === null) {
    next(ApiError.notFound("There is no user approach with this user approach id"));
    return;
  }

  if (userApproach?.status === "not_started") {
    userApproach = await userApproachModel.findByIdAndUpdate(userApproachId, { status: "in_process"}, { new: true});
  } else if (userApproach?.status === "in_process") {
    userApproach = await userApproachModel.findByIdAndUpdate(userApproachId, { status: "completed"}, { new: true});

    let approach = await approachModel.findById(userApproach?.approachId);

    if (approach === null) {
      next(ApiError.notFound("There is no approach with this approach id"));
      return;
    }

    try {
      const userAchievement = new userAchievementModel({
        userId: userApproach?.userId,
        achievementId: approach?.achievement?._id
      })
  
      userAchievement.save();
    } catch {
      next(ApiError.internal("Problem when saving data!s"))
    }
    
  }
  
  res.status(200).json(userApproach);

}

export default {
  createUserApproach,
  findAllUserApproaches,
  updateStatusForUserApproach,
}

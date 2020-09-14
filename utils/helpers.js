const validator = require('validator')

const TWILIO_COST_PER_TEXT = 0.0075

export const getApproxCost = (students) =>
  getNumberOfTexts(students) * TWILIO_COST_PER_TEXT

export const getNumberOfTexts = (students) =>
  students.filter((student) => !validator.isEmpty(student.phone)).length

export const isPopulated = (obj) => !isEmpty(obj)

export const { isEmpty } = require('lodash')

export const error = (res, status, message) => {
  res.status(status).json({
    status,
    message,
  })
}

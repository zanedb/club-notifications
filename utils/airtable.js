const Airtable = require('airtable')
const validator = require('validator')

const { AIRTABLE_API_KEY, AIRTABLE_BASE_SUFFIX } = process.env

const TWILIO_COST_PER_TEXT = 0.0075

export const getAirtableStudents = async (options) => {
  const { baseId, tableName, select } = options
  const airtable = new Airtable({ AIRTABLE_API_KEY }).base(baseId)(
    table(tableName)
  )
  const rawResults = await airtable.select(select).all()

  return await rawResults.reduce((students, record) => {
    if (record.fields['Notifications'] === 'Enabled') {
      const contactInfo = record.fields['Contact info']
      const student = {
        recordId: record.id,
        firstName: record.fields['First name'],
        lastName: record.fields['Last name'],
      }

      student.email = validator.isEmail(contactInfo) ? contactInfo : ''
      student.phone = validator.isMobilePhone(contactInfo) ? contactInfo : ''

      students.push(student)
    }
    return students
  }, [])
}

export const createAirtableRecord = async (options, apiKey) => {
  const { baseId, tableName, fields } = options

  return new Promise((resolve, reject) => {
    const airtable = new Airtable({ AIRTABLE_API_KEY }).base(baseId)(
      table(tableName)
    )
    airtable.create(fields, (err, records) => {
      if (err) {
        reject(err)
      }
      resolve(records)
    })
  })
}

export const getApproxCost = (students) =>
  getNumberOfTexts(students) * TWILIO_COST_PER_TEXT

export const getNumberOfTexts = (students) =>
  students.filter((student) => !validator.isEmpty(student.phone)).length

const table = (tableName) =>
  `${tableName}${AIRTABLE_BASE_SUFFIX ? ` ${AIRTABLE_BASE_SUFFIX}` : ''}`

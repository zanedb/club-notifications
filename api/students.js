const { authorization } = require("../utils/authorization");
const { getAirtableStudents } = require("../utils/airtable");

const { AIRTABLE_BASE_ID } = process.env;

const students = async (req, res) => {
  if (req.method === "GET") {
    const students = await getAirtableStudents({
      baseId: AIRTABLE_BASE_ID,
      tableName: "Students",
    });

    await res.send(students);
  }
};

module.exports = authorization(students);

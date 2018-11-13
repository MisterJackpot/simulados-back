var exports = module.exports = {}
var db = require('../config/datasource.js')
var Exam = require('../models/practise_exam')(db.sequelize, db.Sequelize)
var Participation = require('../models/participation')(db.sequelize, db.Sequelize)
var Question = require('../models/question')(db.sequelize, db.Sequelize)
var ExamQuestion = require('../models/practiseexam_questions')(db.sequelize, db.Sequelize)
var Student = require('../models/student')(db.sequelize, db.Sequelize)
var Practise_exam = require('../models/practise_exam')(db.sequelize, db.Sequelize)

const findStudentById = async (id, res) => {
    let student = await Student.findById(id)

    if (!student)
        return res.status(400).json({success: false, error: 'User not found'})

    return student
}

const createParticipation = async (student, exam, questions, res) => {
    let date = new Date()

    let participation = await Participation.create(
        {
            participation_date: date,
            time_of_conclusion: null,
            student_id: student.id,
            practise_exam_id: exam.id,
            numberOfQuestions: questions.length,
            numberOfCorrectAnswers: 0,
            numberOfWrongAnswers: 0,
            hitRatio: 0,
        })

    if (!participation)
        return res.status(400).json({success: false, error: 'Error on create participation'})

    return participation
}


exports.create = async (req, res) => {
    try {
        const body = req.body

        let date = new Date()

        //get student
        let student = await findStudentById(body.student_id, res)

        //Fetch questions
        let questions = await Question.all({where: {approved: 1}})

        //Create exam
        let exam = await Exam.create({aob_exam: true, aob_exam_year: date.getFullYear()})

        //Add questions
        await Promise.all(
            questions.map((q) => {
                return ExamQuestion.create({practise_exam_id: exam.id, question_id: q.id})
            })
        )

        let participation = await createParticipation(student, exam, questions, res)

        res.status(201).json({
            success: true,
            message: 'Successfully created new exam',
            participation: participation.toJSON(),
            exam: exam.toJSON()
        })
    }catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

/**
 * This function returns a list with all OAB (or AOB) exams
 */
exports.getOabExams = async (req, res) => {
    try {
        let exams = await Practise_exam.findAll({ where: { is_aob_exam: true }});
        
        let message = "";
        
        if(exams && exams.length > 0) {
            message = "Exames encontrados com sucesso";
        } else {
            message = "Nenhum exame da OAB foi encontrado na base da dados";
        }

        res.status(200).json({
            success: true,
            message: message,
            exams: exams
        });

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}
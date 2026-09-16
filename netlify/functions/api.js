const express = require('express');
const serverless = require('serverless-http');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const dbUrl = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn('Database URL is missing. Set NETLIFY_DB_URL in Netlify.');
}

const pool = dbUrl
  ? new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;


/* =========================================================
   รายชื่อนักเรียน
   ========================================================= */

const students = [
  {
    no: 1,
    student_id: '12290',
    prefix: 'เด็กชาย',
    first_name: 'ไชยวัฒน์',
    last_name: 'หอมสมบัติ'
  },
  {
    no: 2,
    student_id: '12307',
    prefix: 'เด็กชาย',
    first_name: 'วิชญะ',
    last_name: 'ศรีแผ้ว'
  },
  {
    no: 3,
    student_id: '12406',
    prefix: 'เด็กชาย',
    first_name: 'คงภพ',
    last_name: 'วิวาเก้า'
  },
  {
    no: 4,
    student_id: '12431',
    prefix: 'เด็กชาย',
    first_name: 'ปัญญาวุฒิ',
    last_name: 'เอี่ยมบัวหลวง'
  },
  {
    no: 5,
    student_id: '12433',
    prefix: 'เด็กชาย',
    first_name: 'ธนากร',
    last_name: 'ทองคำ'
  },
  {
    no: 6,
    student_id: '12441',
    prefix: 'เด็กชาย',
    first_name: 'พลภัทร',
    last_name: 'เรืองมนต์'
  },
  {
    no: 7,
    student_id: '12442',
    prefix: 'เด็กชาย',
    first_name: 'กันตภณ',
    last_name: 'ทองศรี'
  },
  {
    no: 8,
    student_id: '13238',
    prefix: 'เด็กชาย',
    first_name: 'ภัทรพงศ์',
    last_name: 'พุ่มพวง'
  },
  {
    no: 9,
    student_id: '13259',
    prefix: 'เด็กชาย',
    first_name: 'รัฐพล',
    last_name: 'มั่นทอง'
  },
  {
    no: 10,
    student_id: '13262',
    prefix: 'เด็กชาย',
    first_name: 'ธนโชติ',
    last_name: 'ทวีพงษ์'
  },
  {
    no: 11,
    student_id: '13282',
    prefix: 'เด็กชาย',
    first_name: 'กิตติชัย',
    last_name: 'ใจหนักแน่น'
  },
  {
    no: 12,
    student_id: '13331',
    prefix: 'เด็กชาย',
    first_name: 'กรตตะวัน',
    last_name: 'มัฒาภาพ'
  },
  {
    no: 13,
    student_id: '13340',
    prefix: 'เด็กชาย',
    first_name: 'วีรภาพ',
    last_name: 'จันทร์นุ่ม'
  },
  {
    no: 14,
    student_id: '13664',
    prefix: 'เด็กชาย',
    first_name: 'ชัญญาพล',
    last_name: 'เอกปริญญา'
  },
  {
    no: 15,
    student_id: '13665',
    prefix: 'เด็กชาย',
    first_name: 'ธนากร',
    last_name: 'มากรร'
  },

  {
    no: 16,
    student_id: '12418',
    prefix: 'เด็กหญิง',
    first_name: 'ปภาพินท์',
    last_name: 'ขำชื่น'
  },
  {
    no: 17,
    student_id: '12423',
    prefix: 'เด็กหญิง',
    first_name: 'ปิญากรณ์',
    last_name: 'ถาวงษ์กลาง'
  },
  {
    no: 18,
    student_id: '12459',
    prefix: 'เด็กหญิง',
    first_name: 'กัญญาณัฐ',
    last_name: 'นากุล'
  },
  {
    no: 19,
    student_id: '13241',
    prefix: 'เด็กหญิง',
    first_name: 'ชลดา',
    last_name: 'จันทร์โฉม'
  },
  {
    no: 20,
    student_id: '13246',
    prefix: 'เด็กหญิง',
    first_name: 'กนกวรรณ',
    last_name: 'พลพัตร'
  },
  {
    no: 21,
    student_id: '13250',
    prefix: 'เด็กหญิง',
    first_name: 'รักษณาลี',
    last_name: 'บุญบาล'
  },
  {
    no: 22,
    student_id: '13273',
    prefix: 'เด็กหญิง',
    first_name: 'กุลนิษฐ์',
    last_name: 'เพียราชา'
  },
  {
    no: 23,
    student_id: '13274',
    prefix: 'เด็กหญิง',
    first_name: 'เสาวลักษณ์',
    last_name: 'เสนาเพ็ง'
  },
  {
    no: 24,
    student_id: '13290',
    prefix: 'เด็กหญิง',
    first_name: 'สุพรรษา',
    last_name: 'เงินอยู่'
  },
  {
    no: 25,
    student_id: '13295',
    prefix: 'เด็กหญิง',
    first_name: 'พิชญธิดา',
    last_name: 'พิณดนตรี'
  },
  {
    no: 26,
    student_id: '13298',
    prefix: 'เด็กหญิง',
    first_name: 'นรินญา',
    last_name: 'เปรมวิชัย'
  },
  {
    no: 27,
    student_id: '13313',
    prefix: 'เด็กหญิง',
    first_name: 'ปรางย์ทิพย์',
    last_name: 'เอี่ยมพูล'
  },
  {
    no: 28,
    student_id: '13483',
    prefix: 'เด็กหญิง',
    first_name: 'พิชชานันท์',
    last_name: 'เกตุบำรุง'
  },
  {
    no: 29,
    student_id: '13484',
    prefix: 'เด็กหญิง',
    first_name: 'โสภิษฐา',
    last_name: 'โฉมยง'
  },
  {
    no: 30,
    student_id: '13666',
    prefix: 'เด็กหญิง',
    first_name: 'สุภาลักษณ์',
    last_name: 'ประสาทเขตต์การ'
  }
];


/* =========================================================
   รายวิชา
   ========================================================= */

const subjects = [
  ['ง20224', 'การขาย 2'],
  ['ค22101', 'คณิตศาสตร์'],
  ['ท22101', 'ภาษาไทย'],
  ['ว22101', 'วิทยาศาสตร์'],
  ['อ22101', 'ภาษาอังกฤษ'],
  ['ส22101', 'สังคมศึกษา']
];

let readyPromise;


/* =========================================================
   เริ่มต้น Database
   ========================================================= */

async function init() {

  if (!pool) {
    throw new Error('ยังไม่ได้ตั้งค่า Database');
  }

  if (!readyPromise) {

    readyPromise = (async () => {

      /* ตารางนักเรียน */

      await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          no INT UNIQUE NOT NULL,
          student_id TEXT UNIQUE NOT NULL,
          prefix TEXT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          class_name TEXT NOT NULL DEFAULT 'มัธยมศึกษาปีที่ 2.10'
        )
      `);


      /* ตารางผู้ใช้ */

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          student_id TEXT UNIQUE
        )
      `);


      /* ตารางวิชา */

      await pool.query(`
        CREATE TABLE IF NOT EXISTS subjects (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL
        )
      `);


      /* ตารางการเช็กชื่อ */

      await pool.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          student_id TEXT NOT NULL,
          subject_id INT NOT NULL REFERENCES subjects(id),
          attendance_date DATE NOT NULL,
          status TEXT NOT NULL,
          note TEXT DEFAULT '',
          UNIQUE(student_id, subject_id, attendance_date)
        )
      `);


      /* =====================================================
         สร้างบัญชีนักเรียน
         Username = เลขประจำตัวนักเรียน
         Password เริ่มต้น = student1234
         ===================================================== */

      const hash = await bcrypt.hash('student1234', 10);

      for (const s of students) {

        await pool.query(
          `
          INSERT INTO students
          (
            no,
            student_id,
            prefix,
            first_name,
            last_name
          )
          VALUES
          ($1,$2,$3,$4,$5)

          ON CONFLICT(student_id)
          DO UPDATE SET
            no = EXCLUDED.no,
            prefix = EXCLUDED.prefix,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name
          `,
          [
            s.no,
            s.student_id,
            s.prefix,
            s.first_name,
            s.last_name
          ]
        );


        await pool.query(
          `
          INSERT INTO users
          (
            username,
            password_hash,
            role,
            student_id
          )
          VALUES
          ($1,$2,'student',$1)

          ON CONFLICT(username)
          DO NOTHING
          `,
          [
            s.student_id,
            hash
          ]
        );
      }


      /* =====================================================
         บัญชีครู
         Username = teacher
         Password = teacher1234
         ===================================================== */

      const teacherHash = await bcrypt.hash(
        'teacher1234',
        10
      );

      await pool.query(`
        INSERT INTO users(username,password_hash,role,student_id) 
        VALUES('teacher',$1,'teacher',NULL) 
        ON CONFLICT(username) 
        DO UPDATE SET 
          password_hash=EXCLUDED.password_hash, 
          role='teacher' 
      `, [teacherHash]);


      /* =====================================================
         เพิ่มรายวิชา
         ===================================================== */

      for (const [code, name] of subjects) {

        await pool.query(
          `
          INSERT INTO subjects
          (
            code,
            name
          )
          VALUES
          ($1,$2)

          ON CONFLICT(code)
          DO NOTHING
          `,
          [
            code,
            name
          ]
        );
      }

    })();
  }

  return readyPromise;
}


/* =========================================================
   JWT
   ========================================================= */

function tokenFor(user) {

  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      student_id: user.student_id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '12h'
    }
  );
}


/* =========================================================
   Authentication
   ========================================================= */

function auth(req, res, next) {

  try {

    const raw =
      req.headers.authorization || '';

    const token =
      raw.startsWith('Bearer ')
        ? raw.slice(7)
        : null;

    if (!token) {

      return res.status(401).json({
        error: 'กรุณาเข้าสู่ระบบ'
      });

    }

    req.user =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    next();

  } catch (e) {

    return res.status(401).json({
      error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
    });

  }
}


/* =========================================================
   ตรวจสอบสิทธิ์
   ========================================================= */

function role(requiredRole) {

  return (req, res, next) => {

    if (req.user?.role === requiredRole) {

      return next();

    }

    return res.status(403).json({
      error: 'ไม่มีสิทธิ์ใช้งาน'
    });

  };

}


/* =========================================================
   Health Check
   ========================================================= */

app.get(
  '/api/health',
  async (req, res) => {

    try {

      await init();

      res.json({
        ok: true
      });

    } catch (e) {

      res.status(500).json({
        ok: false,
        error: e.message
      });

    }

  }
);


/* =========================================================
   Login
   ========================================================= */

app.post(
  '/api/login',
  async (req, res) => {

    try {

      await init();

      const {
        username,
        password
      } = req.body || {};

      const result =
        await pool.query(
          'SELECT * FROM users WHERE username=$1',
          [
            String(username || '')
          ]
        );

      const user = result.rows[0];

      if (
        !user ||
        !(await bcrypt.compare(
          String(password || ''),
          user.password_hash
        ))
      ) {

        return res.status(401).json({
          error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        });

      }

      res.json({
        token: tokenFor(user),

        user: {
          role: user.role,
          username: user.username,
          student_id: user.student_id
        }

      });

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Current User
   ========================================================= */

app.get(
  '/api/me',
  auth,
  (req, res) => {

    res.json({
      user: req.user
    });

  }
);


/* =========================================================
   Subjects
   ========================================================= */

app.get(
  '/api/subjects',
  auth,
  async (req, res) => {

    try {

      await init();

      const result =
        await pool.query(
          'SELECT * FROM subjects ORDER BY id'
        );

      res.json(result.rows);

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Student Dashboard
   ========================================================= */

app.get(
  '/api/student/dashboard',
  auth,
  role('student'),
  async (req, res) => {

    try {

      await init();


      const studentResult =
        await pool.query(
          `
          SELECT *
          FROM students
          WHERE student_id=$1
          `,
          [
            req.user.student_id
          ]
        );

      const student =
        studentResult.rows[0];


      const attendanceResult =
        await pool.query(
          `
          SELECT
            a.attendance_date,
            a.status,
            a.note,
            sub.code,
            sub.name

          FROM attendance a

          JOIN subjects sub
            ON sub.id = a.subject_id

          WHERE a.student_id=$1

          ORDER BY
            a.attendance_date DESC,
            a.id DESC
          `,
          [
            req.user.student_id
          ]
        );


      const rows =
        attendanceResult.rows;


      const stats = {

        total: rows.length,

        present:
          rows.filter(
            x => x.status === 'present'
          ).length,

        late:
          rows.filter(
            x => x.status === 'late'
          ).length,

        absent:
          rows.filter(
            x => x.status === 'absent'
          ).length,

        leave:
          rows.filter(
            x => x.status === 'leave'
          ).length

      };


      res.json({

        student,

        stats,

        recent:
          rows.slice(0, 20)

      });

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Student Attendance
   ========================================================= */

app.get(
  '/api/student/attendance',
  auth,
  role('student'),
  async (req, res) => {

    try {

      await init();

      const result =
        await pool.query(
          `
          SELECT
            a.*,
            s.code,
            s.name

          FROM attendance a

          JOIN subjects s
            ON s.id = a.subject_id

          WHERE a.student_id=$1

          ORDER BY
            attendance_date DESC
          `,
          [
            req.user.student_id
          ]
        );

      res.json(result.rows);

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Teacher - Students
   ========================================================= */

app.get(
  '/api/teacher/students',
  auth,
  role('teacher'),
  async (req, res) => {

    try {

      await init();

      const result =
        await pool.query(
          `
          SELECT *
          FROM students
          ORDER BY no
          `
        );

      res.json(result.rows);

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Teacher - Attendance
   ========================================================= */

app.get(
  '/api/teacher/attendance',
  auth,
  role('teacher'),
  async (req, res) => {

    try {

      await init();

      const date =
        req.query.date;

      const subject =
        Number(req.query.subject_id);


      const result =
        await pool.query(
          `
          SELECT *
          FROM attendance
          WHERE attendance_date=$1
          AND subject_id=$2
          `,
          [
            date,
            subject
          ]
        );


      res.json(result.rows);

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Teacher - Save Attendance
   ========================================================= */

app.post(
  '/api/teacher/attendance',
  auth,
  role('teacher'),
  async (req, res) => {

    try {

      await init();

      const {
        date,
        subject_id,
        records
      } = req.body || {};


      for (
        const x of records || []
      ) {

        await pool.query(
          `
          INSERT INTO attendance
          (
            student_id,
            subject_id,
            attendance_date,
            status,
            note
          )

          VALUES
          ($1,$2,$3,$4,$5)

          ON CONFLICT
          (
            student_id,
            subject_id,
            attendance_date
          )

          DO UPDATE SET
            status = EXCLUDED.status,
            note = EXCLUDED.note
          `,
          [
            x.student_id,
            Number(subject_id),
            date,
            x.status,
            x.note || ''
          ]
        );

      }


      res.json({
        ok: true
      });

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  }
);


/* =========================================================
   Netlify Function
   ========================================================= */

module.exports.handler =
  serverless(app);

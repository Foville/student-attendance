const express = require('express');
const serverless = require('serverless-http');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const dbUrl = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) console.warn('Database URL is missing. Set NETLIFY_DB_URL in Netlify.');
const pool = dbUrl ? new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } }) : null;
const students = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/students.json'), 'utf8'));
const subjects = [
  ['ง20224','การขาย 2'],['ค22101','คณิตศาสตร์'],['ท22101','ภาษาไทย'],
  ['ว22101','วิทยาศาสตร์'],['อ22101','ภาษาอังกฤษ'],['ส22101','สังคมศึกษา']
];
let readyPromise;

async function init(){
  if (!pool) throw new Error('ยังไม่ได้ตั้งค่า Database');
  if (!readyPromise) readyPromise = (async()=>{
    await pool.query(`CREATE TABLE IF NOT EXISTS students (id SERIAL PRIMARY KEY, no INT UNIQUE NOT NULL, student_id TEXT UNIQUE NOT NULL, prefix TEXT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, class_name TEXT NOT NULL DEFAULT 'มัธยมศึกษาปีที่ 2.10')`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, student_id TEXT UNIQUE)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS subjects (id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS attendance (id SERIAL PRIMARY KEY, student_id TEXT NOT NULL, subject_id INT NOT NULL REFERENCES subjects(id), attendance_date DATE NOT NULL, status TEXT NOT NULL, note TEXT DEFAULT '', UNIQUE(student_id, subject_id, attendance_date))`);
    const hash = await bcrypt.hash('student1234', 10);
    for (const s of students) {
      await pool.query(`INSERT INTO students(no,student_id,prefix,first_name,last_name) VALUES($1,$2,$3,$4,$5) ON CONFLICT(student_id) DO UPDATE SET no=EXCLUDED.no,prefix=EXCLUDED.prefix,first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name`, [s.no,s.student_id,s.prefix,s.first_name,s.last_name]);
      await pool.query(`INSERT INTO users(username,password_hash,role,student_id) VALUES($1,$2,'student',$1) ON CONFLICT(username) DO NOTHING`, [s.student_id,hash]);
    }
    const teacherHash = await bcrypt.hash('teacher1234',10);
    await pool.query(`INSERT INTO users(username,password_hash,role,student_id) VALUES('teacher',$1,'teacher',NULL) ON CONFLICT(username) DO NOTHING`, [teacherHash]);
    for (const [code,name] of subjects) await pool.query(`INSERT INTO subjects(code,name) VALUES($1,$2) ON CONFLICT(code) DO NOTHING`,[code,name]);
  })();
  return readyPromise;
}

function tokenFor(user){ return jwt.sign({ id:user.id, username:user.username, role:user.role, student_id:user.student_id }, process.env.JWT_SECRET, {expiresIn:'12h'}); }
function auth(req,res,next){
  try{
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
    if(!token) return res.status(401).json({error:'กรุณาเข้าสู่ระบบ'});
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch(e){ return res.status(401).json({error:'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'}); }
}
function role(role){ return (req,res,next)=>req.user?.role===role?next():res.status(403).json({error:'ไม่มีสิทธิ์ใช้งาน'}); }

app.get('/api/health', async (req,res)=>{ try{await init(); res.json({ok:true});}catch(e){res.status(500).json({ok:false,error:e.message});} });
app.post('/api/login', async (req,res)=>{
  try{ await init(); const {username,password}=req.body||{}; const r=await pool.query('SELECT * FROM users WHERE username=$1',[String(username||'')]); if(!r.rows[0] || !(await bcrypt.compare(String(password||''),r.rows[0].password_hash))) return res.status(401).json({error:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'}); res.json({token:tokenFor(r.rows[0]),user:{role:r.rows[0].role,username:r.rows[0].username,student_id:r.rows[0].student_id}}); }
  catch(e){res.status(500).json({error:e.message});}
});
app.get('/api/me', auth, (req,res)=>res.json({user:req.user}));
app.get('/api/subjects', auth, async (req,res)=>{try{await init();res.json((await pool.query('SELECT * FROM subjects ORDER BY id')).rows)}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/student/dashboard', auth, role('student'), async(req,res)=>{try{await init();const s=(await pool.query('SELECT * FROM students WHERE student_id=$1',[req.user.student_id])).rows[0];const rows=(await pool.query(`SELECT a.attendance_date,a.status,a.note,sub.code,sub.name FROM attendance a JOIN subjects sub ON sub.id=a.subject_id WHERE a.student_id=$1 ORDER BY a.attendance_date DESC,a.id DESC`,[req.user.student_id])).rows;const c={total:rows.length,present:rows.filter(x=>x.status==='present').length,late:rows.filter(x=>x.status==='late').length,absent:rows.filter(x=>x.status==='absent').length,leave:rows.filter(x=>x.status==='leave').length};res.json({student:s,stats:c,recent:rows.slice(0,20)})}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/student/attendance', auth, role('student'), async(req,res)=>{try{await init();res.json((await pool.query(`SELECT a.*,s.code,s.name FROM attendance a JOIN subjects s ON s.id=a.subject_id WHERE a.student_id=$1 ORDER BY attendance_date DESC`,[req.user.student_id])).rows)}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/teacher/students', auth, role('teacher'), async(req,res)=>{try{await init();res.json((await pool.query('SELECT * FROM students ORDER BY no')).rows)}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/teacher/attendance', auth, role('teacher'), async(req,res)=>{try{await init();const date=req.query.date, subject=Number(req.query.subject_id);res.json((await pool.query('SELECT * FROM attendance WHERE attendance_date=$1 AND subject_id=$2',[date,subject])).rows)}catch(e){res.status(500).json({error:e.message})}});
app.post('/api/teacher/attendance', auth, role('teacher'), async(req,res)=>{try{await init();const {date,subject_id,records}=req.body||{};for(const x of records||[]) await pool.query(`INSERT INTO attendance(student_id,subject_id,attendance_date,status,note) VALUES($1,$2,$3,$4,$5) ON CONFLICT(student_id,subject_id,attendance_date) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note`,[x.student_id,Number(subject_id),date,x.status,x.note||'']);res.json({ok:true})}catch(e){res.status(500).json({error:e.message})}});

module.exports.handler = serverless(app);

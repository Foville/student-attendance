# ระบบเช็กชื่อนักเรียน - Netlify

## บัญชีทดลอง
- ครู: teacher / teacher1234
- นักเรียน: 13664 / student1234

## Deploy แบบง่าย
1. สร้าง GitHub repository ใหม่
2. อัปโหลดไฟล์/โฟลเดอร์ทั้งหมดโดยรักษาโครงสร้างเดิม
3. Netlify > Add new project > Import an existing project > GitHub
4. เลือก repository นี้
5. Build command เว้นว่าง และ Publish directory = public (netlify.toml ตั้งไว้แล้ว)
6. สร้าง Netlify Database (Postgres)
7. ตั้ง Environment variable: JWT_SECRET เป็นข้อความสุ่มยาวๆ และให้ Database URL เป็น NETLIFY_DB_URL ตามที่ Netlify ให้
8. Deploy

หมายเหตุ: เลขประจำตัวประชาชนไม่ได้ถูกนำเข้าในระบบนี้

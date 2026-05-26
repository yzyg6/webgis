-- ucas_earth/server/db/courses.sql
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  classroom VARCHAR(50) NOT NULL,
  building_name VARCHAR(100) NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  week_range VARCHAR(50) NOT NULL,
  teacher VARCHAR(50),
  course_type VARCHAR(20) DEFAULT 'required',
  credits DECIMAL(3,1) DEFAULT 0,
  homework_due TIMESTAMP,
  exam_time TIMESTAMP,
  evaluation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_building ON courses(building_name);
CREATE INDEX IF NOT EXISTS idx_courses_weekday ON courses(weekday);

-- 插入示例数据
INSERT INTO courses (name, classroom, building_name, weekday, start_time, end_time, week_range, teacher, course_type, credits) VALUES
('高等数学', '301', '教学楼A', 1, '08:00', '09:40', '1-16', '张三', 'required', 4),
('大学英语', '201', '外语楼', 1, '10:00', '11:40', '1-16', '李四', 'required', 3),
('数据结构', '405', '计算机楼', 2, '14:00', '15:40', '1-16', '王五', 'required', 3),
('体育', '操场', '体育馆', 3, '15:00', '16:40', '1-16', '赵六', 'required', 1),
('线性代数', '302', '教学楼A', 4, '08:00', '09:40', '1-16', '钱七', 'required', 3),
('思政课', '101', '综合楼', 5, '10:00', '11:40', '1-16', '孙八', 'required', 2),
('选修课', '501', '艺术楼', 6, '14:00', '15:40', '1-8', '周九', 'elective', 2);

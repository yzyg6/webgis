import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ucas_earth',
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { weekday, weekNumber, buildingName } = req.query;
    let query = 'SELECT * FROM courses';
    const params: any[] = [];
    const conditions: string[] = [];

    if (weekday) {
      params.push(weekday);
      conditions.push(`weekday = $${params.length}`);
    }

    if (buildingName) {
      params.push(buildingName);
      conditions.push(`building_name = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY weekday, start_time';

    const result = await pool.query(query, params);
    res.json(result.rows.map(mapCourseFromDb));
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date().getDay() || 7;
    const result = await pool.query(
      'SELECT * FROM courses WHERE weekday = $1 ORDER BY start_time',
      [today]
    );
    res.json(result.rows.map(mapCourseFromDb));
  } catch (err) {
    console.error('Error fetching today courses:', err);
    res.status(500).json({ error: 'Failed to fetch today courses' });
  }
});

router.get('/week/:weekNumber', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY weekday, start_time');
    res.json(result.rows.map(mapCourseFromDb));
  } catch (err) {
    console.error('Error fetching week courses:', err);
    res.status(500).json({ error: 'Failed to fetch week courses' });
  }
});

router.get('/building/:buildingName', async (req: Request, res: Response) => {
  try {
    const { buildingName } = req.params;
    const result = await pool.query(
      'SELECT * FROM courses WHERE building_name = $1 ORDER BY weekday, start_time',
      [buildingName]
    );
    res.json(result.rows.map(mapCourseFromDb));
  } catch (err) {
    console.error('Error fetching building courses:', err);
    res.status(500).json({ error: 'Failed to fetch building courses' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name, classroom, buildingName, weekday, startTime, endTime,
      weekRange, teacher, courseType, credits, homeworkDue, examTime
    } = req.body;

    const result = await pool.query(
      `INSERT INTO courses (
        name, classroom, building_name, weekday, start_time, end_time,
        week_range, teacher, course_type, credits, homework_due, exam_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [name, classroom, buildingName, weekday, startTime, endTime,
       weekRange, teacher, courseType || 'required', credits || 0,
       homeworkDue || null, examTime || null]
    );

    res.json(mapCourseFromDb(result.rows[0]));
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, classroom, buildingName, weekday, startTime, endTime,
      weekRange, teacher, courseType, credits, homeworkDue, examTime
    } = req.body;

    const result = await pool.query(
      `UPDATE courses SET
        name = $1, classroom = $2, building_name = $3, weekday = $4,
        start_time = $5, end_time = $6, week_range = $7, teacher = $8,
        course_type = $9, credits = $10, homework_due = $11, exam_time = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING *`,
      [name, classroom, buildingName, weekday, startTime, endTime,
       weekRange, teacher, courseType, credits, homeworkDue || null,
       examTime || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(mapCourseFromDb(result.rows[0]));
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const rows = req.body;
    const errors: string[] = [];
    let success = 0;

    for (const row of rows) {
      try {
        await pool.query(
          `INSERT INTO courses (
            name, classroom, building_name, weekday, start_time, end_time,
            week_range, teacher, course_type, credits, homework_due, exam_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [row.name, row.classroom, row.buildingName, row.weekday,
           row.startTime, row.endTime, row.weekRange, row.teacher,
           row.courseType || 'required', row.credits || 0,
           row.homeworkDue || null, row.examTime || null]
        );
        success++;
      } catch (err) {
        errors.push(`导入失败: ${row.name} - ${err}`);
      }
    }

    res.json({ success, errors });
  } catch (err) {
    console.error('Error importing courses:', err);
    res.status(500).json({ error: 'Failed to import courses' });
  }
});

router.get('/template', async (req: Request, res: Response) => {
  res.json({ message: 'Template download endpoint' });
});

function mapCourseFromDb(row: any) {
  return {
    id: row.id,
    name: row.name,
    classroom: row.classroom,
    buildingName: row.building_name,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    weekRange: row.week_range,
    teacher: row.teacher,
    courseType: row.course_type,
    credits: row.credits,
    homeworkDue: row.homework_due,
    examTime: row.exam_time,
    evaluation: row.evaluation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;

import express from 'express';
import { and, asc, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import { departments, subjects } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

// Get all subjects with optional search, filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10, _sort, _order } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 10));

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    // If search query exists, filter by subject name OR subject code
    if (search) {
      filterConditions.push(
        or(ilike(subjects.name, `%${search}%`), ilike(subjects.code, `%${search}%`)),
      );
    }

    // If department filter exists, match department name
    if (department) {
      filterConditions.push(ilike(departments.name, `%${department}%`));
    }

    // Combine all filters using AND if any exist
    const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    let sortClause = desc(subjects.createdAt);

    if (_sort && _order) {
      const sortField = _sort as string;
      const sortOrder = _order as string;

      const tableColumns = getTableColumns(subjects);

      // Check if the requested field exists in the subjects table to prevent crashes
      if (sortField in subjects) {
        const column = tableColumns[sortField as keyof typeof tableColumns];
        sortClause = sortOrder === 'desc' ? desc(column) : asc(column);
      }
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const subjectsList = await db
      .select({
        ...getTableColumns(subjects),
        departments: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause)
      .orderBy(sortClause, desc(subjects.id))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: subjectsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (e) {
    console.error(`GET /subjects error: ${e}`);
    res.status(500).json({ error: 'Failed to get subjects' });
  }
});

export default router;

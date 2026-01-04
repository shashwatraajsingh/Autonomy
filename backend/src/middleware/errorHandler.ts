import { Request, Response, NextFunction } from 'express';

export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error:', error);

    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database error',
            message: error.message
        });
    }

    // Validation errors
    if (error.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation error',
            message: error.message
        });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
}

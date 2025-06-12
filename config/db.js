// Chỉ sử dụng Prisma, không cần kết nối trực tiếp database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
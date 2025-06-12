import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllBaoTri = async (req, res) => {
    try {
        const baoTriList = await prisma.bao_tri.findMany({
            orderBy: {
                ngay_bat_dau: 'desc'
            }
        });
        res.json({
            success: true,
            message: "Lấy danh sách bảo trì thành công",
            data: baoTriList
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách bảo trì",
            error: error.message
        });
    }
};

export const getBaoTriById = async (req, res) => {
    try {
        const baoTri = await prisma.bao_tri.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!baoTri) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bảo trì"
            });
        }
        res.json({
            success: true,
            message: "Lấy thông tin bảo trì thành công",
            data: baoTri
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin bảo trì",
            error: error.message
        });
    }
};

export const createBaoTri = async (req, res) => {
    try {
        const baoTri = await prisma.bao_tri.create({
            data: req.body
        });
        res.status(201).json({
            success: true,
            message: "Tạo bảo trì thành công",
            data: baoTri
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo bảo trì",
            error: error.message
        });
    }
};

export const updateBaoTri = async (req, res) => {
    try {
        const baoTri = await prisma.bao_tri.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json({
            success: true,
            message: "Cập nhật bảo trì thành công",
            data: baoTri
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật bảo trì",
            error: error.message
        });
    }
};

export const deleteBaoTri = async (req, res) => {
    try {
        await prisma.bao_tri.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({
            success: true,
            message: "Xóa bảo trì thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa bảo trì",
            error: error.message
        });
    }
}; 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all roles
export const getAllRoles = async (req, res) => {
    try {
        // Log the available models to debug
        // console.log("Available Prisma models:", Object.keys(prisma));
        
        // Use the exact model name as defined in schema
        const roles = await prisma.role.findMany({
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách vai trò thành công",
            data: roles
        });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách vai trò",
            error: error.message
        });
    }
};

// Get role by ID
export const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Looking for role with ID: "${id}"`);
        
        // First check if any roles exist with this ID
        const allRoles = await prisma.role.findMany();
        console.log("All available roles:", allRoles.map(r => ({id: r.ma_vai_tro, name: r.vai_tro})));
        
        const role = await prisma.role.findUnique({
            where: { ma_vai_tro: id }
        });
        
        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy vai trò",
                debug: {
                    requestedId: id,
                    availableIds: allRoles.map(r => r.ma_vai_tro)
                }
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin vai trò thành công",
            data: role
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin vai trò",
            error: error.message
        });
    }
};

// Create new role
export const createRole = async (req, res) => {
    try {
        const { ma_vai_tro, vai_tro, nguoi_cap_nhat, ghi_chu } = req.body;
        
        const role = await prisma.role.create({
            data: {
                ma_vai_tro,
                vai_tro,
                nguoi_cap_nhat,
                ghi_chu
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo vai trò thành công",
            data: role
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo vai trò",
            error: error.message
        });
    }
};

// Update role
export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { vai_tro, nguoi_cap_nhat, ghi_chu } = req.body;
        
        const role = await prisma.role.update({
            where: { ma_vai_tro: id },
            data: {
                vai_tro,
                nguoi_cap_nhat,
                ngay_cap_nhat: new Date(),
                ghi_chu
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật vai trò thành công",
            data: role
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật vai trò",
            error: error.message
        });
    }
};

// Delete role
export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.role.delete({
            where: { ma_vai_tro: id }
        });
        
        res.json({
            success: true,
            message: "Xóa vai trò thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa vai trò",
            error: error.message
        });
    }
};
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all interaction types without pagination
export const getAllInteractionTypes = async (req, res) => {
    try {
        const { 
            sortBy = 'stt', 
            sortDir = 'asc',
            search = '',
            status = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { ma_loai_tuong_tac: { contains: search, mode: 'insensitive' } },
                { loai_tuong_tac: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (status) {
            where.trang_thai = status;
        }
        
        // Fetch all interaction types - no pagination as requested
        const interactionTypes = await prisma.interaction_type.findMany({
            where,
            orderBy,
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        customer_interactions: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách loại tương tác thành công",
            data: interactionTypes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách loại tương tác",
            error: error.message
        });
    }
};

// Get interaction type by ID
export const getInteractionTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const interactionType = await prisma.interaction_type.findUnique({
            where: { ma_loai_tuong_tac: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                customer_interactions: {
                    select: {
                        ma_tuong_tac_khach_hang: true,
                        ten_khach_hang: true,
                        nguoi_phu_trach: true,
                        thoi_gian: true,
                        noi_dung_tuong_tac: true
                    },
                    take: 10,
                    orderBy: {
                        thoi_gian: 'desc'
                    }
                },
                _count: {
                    select: {
                        customer_interactions: true
                    }
                }
            }
        });
        
        if (!interactionType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại tương tác"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin loại tương tác thành công",
            data: interactionType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin loại tương tác",
            error: error.message
        });
    }
};

// Create interaction type
export const createInteractionType = async (req, res) => {
    try {
        const { ma_loai_tuong_tac, loai_tuong_tac, trang_thai, nguoi_cap_nhat } = req.body;
        
        // Validate required fields
        if (!ma_loai_tuong_tac || !loai_tuong_tac) {
            return res.status(400).json({
                success: false,
                message: "Mã loại tương tác và tên loại tương tác là bắt buộc"
            });
        }
        
        // Check if ID already exists
        const existingType = await prisma.interaction_type.findUnique({
            where: { ma_loai_tuong_tac }
        });
        
        if (existingType) {
            return res.status(400).json({
                success: false,
                message: "Mã loại tương tác đã tồn tại"
            });
        }
        
        // Check for duplicate name
        const existingName = await prisma.interaction_type.findFirst({
            where: { loai_tuong_tac }
        });
        
        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Tên loại tương tác đã tồn tại"
            });
        }
        
        // Validate user if provided
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Người dùng không tồn tại"
                });
            }
        }
        
        // Get next sequence number
        const maxStt = await prisma.interaction_type.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new interaction type
        const interactionType = await prisma.interaction_type.create({
            data: {
                stt: nextStt,
                ma_loai_tuong_tac,
                loai_tuong_tac,
                trang_thai: trang_thai || 'Hoạt động',
                nguoi_cap_nhat
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo loại tương tác thành công",
            data: interactionType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo loại tương tác",
            error: error.message
        });
    }
};

// Update interaction type
export const updateInteractionType = async (req, res) => {
    try {
        const { id } = req.params;
        const { loai_tuong_tac, trang_thai, nguoi_cap_nhat } = req.body;
        
        // Check if interaction type exists
        const existingType = await prisma.interaction_type.findUnique({
            where: { ma_loai_tuong_tac: id }
        });
        
        if (!existingType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại tương tác"
            });
        }
        
        // Check for duplicate name
        if (loai_tuong_tac) {
            const existingName = await prisma.interaction_type.findFirst({
                where: { 
                    loai_tuong_tac,
                    ma_loai_tuong_tac: { not: id }
                }
            });
            
            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: "Tên loại tương tác đã tồn tại"
                });
            }
        }
        
        // Validate user if provided
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Người dùng không tồn tại"
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (loai_tuong_tac !== undefined) updateData.loai_tuong_tac = loai_tuong_tac;
        if (trang_thai !== undefined) updateData.trang_thai = trang_thai;
        if (nguoi_cap_nhat !== undefined) updateData.nguoi_cap_nhat = nguoi_cap_nhat;
        
        // Only update if we have data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có dữ liệu để cập nhật"
            });
        }
        
        // Update timestamp
        updateData.ngay_cap_nhat = new Date();
        
        // Update interaction type
        const interactionType = await prisma.interaction_type.update({
            where: { ma_loai_tuong_tac: id },
            data: updateData,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật loại tương tác thành công",
            data: interactionType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật loại tương tác",
            error: error.message
        });
    }
};

// Delete interaction type
export const deleteInteractionType = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if interaction type exists
        const interactionType = await prisma.interaction_type.findUnique({
            where: { ma_loai_tuong_tac: id },
            include: {
                customer_interactions: true
            }
        });
        
        if (!interactionType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại tương tác"
            });
        }
        
        // Check if there are customer interactions using this type
        if (interactionType.customer_interactions.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa loại tương tác vì đang được sử dụng trong tương tác khách hàng",
                count: interactionType.customer_interactions.length
            });
        }
        
        // Delete interaction type
        await prisma.interaction_type.delete({
            where: { ma_loai_tuong_tac: id }
        });
        
        res.json({
            success: true,
            message: "Xóa loại tương tác thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa loại tương tác",
            error: error.message
        });
    }
};

// Get interaction type statistics
export const getInteractionTypeStats = async (req, res) => {
    try {
        const totalCount = await prisma.interaction_type.count();
        
        const activeCount = await prisma.interaction_type.count({
            where: { trang_thai: 'Hoạt động' }
        });
        
        const inactiveCount = await prisma.interaction_type.count({
            where: { trang_thai: 'Không hoạt động' }
        });
        
        const interactionCounts = await prisma.$queryRaw`
            SELECT it."ma_loai_tuong_tac", it."loai_tuong_tac", COUNT(ci.*) as "count"
            FROM "interaction_type" it
            LEFT JOIN "customer_interactions" ci ON it."ma_loai_tuong_tac" = ci."loai_tuong_tac"
            GROUP BY it."ma_loai_tuong_tac", it."loai_tuong_tac"
            ORDER BY "count" DESC
        `;
        
        const recentUpdates = await prisma.interaction_type.findMany({
            orderBy: {
                ngay_cap_nhat: 'desc'
            },
            take: 5,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê loại tương tác thành công",
            data: {
                totalCount,
                activeCount,
                inactiveCount,
                interactionsByType: interactionCounts,
                recentUpdates
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê loại tương tác",
            error: error.message
        });
    }
};
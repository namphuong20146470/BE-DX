import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all customer interactions without pagination
export const getAllCustomerInteractions = async (req, res) => {
    try {
        const { 
            sortBy = 'thoi_gian', 
            sortDir = 'desc',
            search = '',
            customer = '',
            manager = '',
            interactionType = '',
            contactMethod = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { ma_tuong_tac_khach_hang: { contains: search, mode: 'insensitive' } },
                { ten_khach_hang: { contains: search, mode: 'insensitive' } },
                { noi_dung_tuong_tac: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (customer) where.ten_khach_hang = customer;
        if (manager) where.nguoi_phu_trach = manager;
        if (interactionType) where.loai_tuong_tac = interactionType;
        if (contactMethod) where.hinh_thuc_goi = contactMethod;
        
        // Date filter
        if (startDate || endDate) {
            where.thoi_gian = {};
            if (startDate) where.thoi_gian.gte = new Date(startDate);
            if (endDate) where.thoi_gian.lte = new Date(endDate);
        }
        
        // Fetch ALL customer interactions without pagination
        const customerInteractions = await prisma.customer_interactions.findMany({
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
                interaction_type: {
                    select: {
                        ma_loai_tuong_tac: true,
                        loai_tuong_tac: true
                    }
                }
            }
        });
        
        const totalCount = customerInteractions.length;
        
        res.json({
            success: true,
            message: "Lấy danh sách tương tác khách hàng thành công",
            data: customerInteractions,
            totalCount
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tương tác khách hàng",
            error: error.message
        });
    }
};

// Get customer interaction by ID
export const getCustomerInteractionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const customerInteraction = await prisma.customer_interactions.findUnique({
            where: { ma_tuong_tac_khach_hang: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                interaction_type: {
                    select: {
                        ma_loai_tuong_tac: true,
                        loai_tuong_tac: true
                    }
                }
            }
        });
        
        if (!customerInteraction) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tương tác khách hàng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin tương tác khách hàng thành công",
            data: customerInteraction
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin tương tác khách hàng",
            error: error.message
        });
    }
};

// Create customer interaction
export const createCustomerInteraction = async (req, res) => {
    try {
        const { 
            ma_tuong_tac_khach_hang, 
            ten_khach_hang, 
            nguoi_phu_trach, 
            loai_tuong_tac, 
            hinh_thuc_goi,
            thoi_gian,
            noi_dung_tuong_tac 
        } = req.body;
        
        // Validate required fields
        if (!ma_tuong_tac_khach_hang || !thoi_gian) {
            return res.status(400).json({
                success: false,
                message: "Mã tương tác khách hàng và thời gian là bắt buộc"
            });
        }
        
        // Check if ID already exists
        const existingInteraction = await prisma.customer_interactions.findUnique({
            where: { ma_tuong_tac_khach_hang }
        });
        
        if (existingInteraction) {
            return res.status(400).json({
                success: false,
                message: "Mã tương tác khách hàng đã tồn tại"
            });
        }
        
        // Validate references if provided
        if (nguoi_phu_trach) {
            const manager = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: "Người phụ trách không tồn tại"
                });
            }
        }
        
        if (loai_tuong_tac) {
            const interactionType = await prisma.interaction_type.findUnique({
                where: { ma_loai_tuong_tac: loai_tuong_tac }
            });
            
            if (!interactionType) {
                return res.status(400).json({
                    success: false,
                    message: "Loại tương tác không tồn tại"
                });
            }
        }
        
        // Get next sequence number
        const maxStt = await prisma.customer_interactions.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new customer interaction
        const customerInteraction = await prisma.customer_interactions.create({
            data: {
                stt: nextStt,
                ma_tuong_tac_khach_hang,
                ten_khach_hang,
                nguoi_phu_trach,
                loai_tuong_tac,
                hinh_thuc_goi,
                thoi_gian: new Date(thoi_gian),
                noi_dung_tuong_tac
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                interaction_type: {
                    select: {
                        loai_tuong_tac: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo tương tác khách hàng thành công",
            data: customerInteraction
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo tương tác khách hàng",
            error: error.message
        });
    }
};

// Update customer interaction
export const updateCustomerInteraction = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_khach_hang, 
            nguoi_phu_trach, 
            loai_tuong_tac, 
            hinh_thuc_goi,
            thoi_gian,
            noi_dung_tuong_tac 
        } = req.body;
        
        // Check if customer interaction exists
        const existingInteraction = await prisma.customer_interactions.findUnique({
            where: { ma_tuong_tac_khach_hang: id }
        });
        
        if (!existingInteraction) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tương tác khách hàng"
            });
        }
        
        // Validate references if provided
        if (nguoi_phu_trach) {
            const manager = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: "Người phụ trách không tồn tại"
                });
            }
        }
        
        if (loai_tuong_tac) {
            const interactionType = await prisma.interaction_type.findUnique({
                where: { ma_loai_tuong_tac: loai_tuong_tac }
            });
            
            if (!interactionType) {
                return res.status(400).json({
                    success: false,
                    message: "Loại tương tác không tồn tại"
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (ten_khach_hang !== undefined) updateData.ten_khach_hang = ten_khach_hang;
        if (nguoi_phu_trach !== undefined) updateData.nguoi_phu_trach = nguoi_phu_trach;
        if (loai_tuong_tac !== undefined) updateData.loai_tuong_tac = loai_tuong_tac;
        if (hinh_thuc_goi !== undefined) updateData.hinh_thuc_goi = hinh_thuc_goi;
        if (thoi_gian !== undefined) updateData.thoi_gian = new Date(thoi_gian);
        if (noi_dung_tuong_tac !== undefined) updateData.noi_dung_tuong_tac = noi_dung_tuong_tac;
        
        // Only update if we have data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có dữ liệu để cập nhật"
            });
        }
        
        // Update customer interaction
        const customerInteraction = await prisma.customer_interactions.update({
            where: { ma_tuong_tac_khach_hang: id },
            data: updateData,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                interaction_type: {
                    select: {
                        loai_tuong_tac: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật tương tác khách hàng thành công",
            data: customerInteraction
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật tương tác khách hàng",
            error: error.message
        });
    }
};

// Delete customer interaction
export const deleteCustomerInteraction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer interaction exists
        const customerInteraction = await prisma.customer_interactions.findUnique({
            where: { ma_tuong_tac_khach_hang: id }
        });
        
        if (!customerInteraction) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tương tác khách hàng"
            });
        }
        
        // Delete customer interaction
        await prisma.customer_interactions.delete({
            where: { ma_tuong_tac_khach_hang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa tương tác khách hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa tương tác khách hàng",
            error: error.message
        });
    }
};

// Get customer interactions by customer
export const getCustomerInteractionsByCustomer = async (req, res) => {
    try {
        const { customerName } = req.params;
        
        const customerInteractions = await prisma.customer_interactions.findMany({
            where: { ten_khach_hang: customerName },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                },
                interaction_type: {
                    select: {
                        ma_loai_tuong_tac: true,
                        loai_tuong_tac: true
                    }
                }
            },
            orderBy: { thoi_gian: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách tương tác của khách hàng ${customerName} thành công`,
            data: customerInteractions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tương tác theo khách hàng",
            error: error.message
        });
    }
};

// Get customer interactions by manager
export const getCustomerInteractionsByManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        
        const customerInteractions = await prisma.customer_interactions.findMany({
            where: { nguoi_phu_trach: managerId },
            include: {
                interaction_type: {
                    select: {
                        ma_loai_tuong_tac: true,
                        loai_tuong_tac: true
                    }
                }
            },
            orderBy: { thoi_gian: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách tương tác của người phụ trách ${managerId} thành công`,
            data: customerInteractions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tương tác theo người phụ trách",
            error: error.message
        });
    }
};

// Get customer interactions by type
export const getCustomerInteractionsByType = async (req, res) => {
    try {
        const { typeId } = req.params;
        
        const customerInteractions = await prisma.customer_interactions.findMany({
            where: { loai_tuong_tac: typeId },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                }
            },
            orderBy: { thoi_gian: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách tương tác theo loại ${typeId} thành công`,
            data: customerInteractions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tương tác theo loại",
            error: error.message
        });
    }
};

// Get customer interaction statistics
export const getCustomerInteractionStats = async (req, res) => {
    try {
        const totalCount = await prisma.customer_interactions.count();
        
        const interactionsByType = await prisma.$queryRaw`
            SELECT it."ma_loai_tuong_tac", it."loai_tuong_tac", COUNT(ci.*) as "count"
            FROM "customer_interactions" ci
            JOIN "interaction_type" it ON ci."loai_tuong_tac" = it."ma_loai_tuong_tac"
            WHERE ci."loai_tuong_tac" IS NOT NULL
            GROUP BY it."ma_loai_tuong_tac", it."loai_tuong_tac"
            ORDER BY "count" DESC
        `;
        
        const interactionsByMethod = await prisma.$queryRaw`
            SELECT "hinh_thuc_goi", COUNT(*) as "count"
            FROM "customer_interactions"
            WHERE "hinh_thuc_goi" IS NOT NULL
            GROUP BY "hinh_thuc_goi"
            ORDER BY "count" DESC
        `;
        
        const interactionsByManager = await prisma.$queryRaw`
            SELECT a."ma_nguoi_dung", a."ho_va_ten", COUNT(ci.*) as "count"
            FROM "customer_interactions" ci
            JOIN "accounts" a ON ci."nguoi_phu_trach" = a."ma_nguoi_dung"
            WHERE ci."nguoi_phu_trach" IS NOT NULL
            GROUP BY a."ma_nguoi_dung", a."ho_va_ten"
            ORDER BY "count" DESC
            LIMIT 5
        `;
        
        const monthlyStats = await prisma.$queryRaw`
            SELECT 
                EXTRACT(YEAR FROM ci."thoi_gian") as "year",
                EXTRACT(MONTH FROM ci."thoi_gian") as "month",
                COUNT(*) as "count"
            FROM "customer_interactions" ci
            WHERE ci."thoi_gian" >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY 
                EXTRACT(YEAR FROM ci."thoi_gian"),
                EXTRACT(MONTH FROM ci."thoi_gian")
            ORDER BY "year" DESC, "month" DESC
        `;
        
        const recentInteractions = await prisma.customer_interactions.findMany({
            take: 5,
            orderBy: { thoi_gian: 'desc' },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                interaction_type: {
                    select: {
                        loai_tuong_tac: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê tương tác khách hàng thành công",
            data: {
                totalCount,
                byType: interactionsByType,
                byMethod: interactionsByMethod,
                byManager: interactionsByManager,
                monthlyStats,
                recentInteractions
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê tương tác khách hàng",
            error: error.message
        });
    }
};
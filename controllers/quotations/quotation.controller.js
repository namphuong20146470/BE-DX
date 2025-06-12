import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all quotations with pagination and filtering
// Get all quotations without pagination limits
export const getAllQuotations = async (req, res) => {
    try {
        const { 
            sortBy = 'ngay_bao_gia', 
            sortDir = 'desc',
            search = '',
            status = '',
            type = '',
            manager = '',
            startDate = '',
            endDate = '',
            minValue = '',
            maxValue = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { so_bao_gia: { contains: search, mode: 'insensitive' } },
                { tieu_de: { contains: search, mode: 'insensitive' } },
                { ten_khach_hang: { contains: search, mode: 'insensitive' } },
                { nguoi_lien_he: { contains: search, mode: 'insensitive' } },
                { so_dien_thoai: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (status) where.tinh_trang = status;
        if (type) where.loai_bao_gia = type;
        if (manager) where.nguoi_phu_trach = manager;
        
        // Date filter
        if (startDate || endDate) {
            where.ngay_bao_gia = {};
            if (startDate) where.ngay_bao_gia.gte = new Date(startDate);
            if (endDate) where.ngay_bao_gia.lte = new Date(endDate);
        }
        
        // Value filter
        if (minValue || maxValue) {
            where.tong_tri_gia = {};
            if (minValue) where.tong_tri_gia.gte = parseFloat(minValue);
            if (maxValue) where.tong_tri_gia.lte = parseFloat(maxValue);
        }
        
        // Get total count for metadata
        const totalCount = await prisma.quotations.count({ where });
        
        // Fetch ALL quotations without pagination limits
        const quotations = await prisma.quotations.findMany({
            where,
            orderBy,
            include: {
                quotation_type: {
                    select: {
                        ma_loai_bao_gia: true,
                        loai_bao_gia: true
                    }
                },
                quotation_status: {
                    select: {
                        ma_trang_thai_bao_gia: true,
                        trang_thai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách báo giá thành công",
            data: quotations,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách báo giá",
            error: error.message
        });
    }
};

// Get quotation by ID
export const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const quotation = await prisma.quotations.findUnique({
            where: { so_bao_gia: id },
            include: {
                quotation_type: {
                    select: {
                        ma_loai_bao_gia: true,
                        loai_bao_gia: true
                    }
                },
                quotation_status: {
                    select: {
                        ma_trang_thai_bao_gia: true,
                        trang_thai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                }
            }
        });
        
        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy báo giá"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin báo giá thành công",
            data: quotation
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin báo giá",
            error: error.message
        });
    }
};

// Create quotation
export const createQuotation = async (req, res) => {
    try {
        const { 
            so_bao_gia, 
            tinh_trang, 
            tieu_de, 
            ten_khach_hang, 
            loai_bao_gia, 
            ngay_bao_gia, 
            price_list, 
            so_dien_thoai, 
            nguoi_lien_he, 
            nguoi_phu_trach, 
            tong_tri_gia, 
            ghi_chu 
        } = req.body;
        
        // Validate required fields
        if (!so_bao_gia || !ten_khach_hang || !ngay_bao_gia || !price_list) {
            return res.status(400).json({
                success: false,
                message: "Số báo giá, tên khách hàng, ngày báo giá và bảng giá là bắt buộc"
            });
        }
        
        // Check if quotation ID already exists
        const existingQuotation = await prisma.quotations.findUnique({
            where: { so_bao_gia }
        });
        
        if (existingQuotation) {
            return res.status(400).json({
                success: false,
                message: "Số báo giá đã tồn tại"
            });
        }
        
        // Validate references if provided
        if (tinh_trang) {
            const status = await prisma.quotation_status.findUnique({
                where: { ma_trang_thai_bao_gia: tinh_trang }
            });
            
            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: "Trạng thái báo giá không tồn tại"
                });
            }
        }
        
        if (loai_bao_gia) {
            const type = await prisma.quotation_type.findUnique({
                where: { ma_loai_bao_gia: loai_bao_gia }
            });
            
            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: "Loại báo giá không tồn tại"
                });
            }
        }
        
        if (nguoi_phu_trach) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: "Người phụ trách không tồn tại"
                });
            }
        }
        
        // Get next sequence number
        const maxStt = await prisma.quotations.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new quotation
        const quotation = await prisma.quotations.create({
            data: {
                stt: nextStt,
                so_bao_gia,
                tinh_trang,
                tieu_de,
                ten_khach_hang,
                loai_bao_gia,
                ngay_bao_gia: new Date(ngay_bao_gia),
                price_list,
                so_dien_thoai,
                nguoi_lien_he,
                nguoi_phu_trach,
                tong_tri_gia: tong_tri_gia ? parseFloat(tong_tri_gia) : 0,
                ghi_chu
            },
            include: {
                quotation_type: {
                    select: {
                        loai_bao_gia: true
                    }
                },
                quotation_status: {
                    select: {
                        trang_thai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo báo giá thành công",
            data: quotation
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo báo giá",
            error: error.message
        });
    }
};

// Update quotation
export const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            tinh_trang, 
            tieu_de, 
            ten_khach_hang, 
            loai_bao_gia, 
            ngay_bao_gia, 
            price_list, 
            so_dien_thoai, 
            nguoi_lien_he, 
            nguoi_phu_trach, 
            tong_tri_gia, 
            ghi_chu 
        } = req.body;
        
        // Check if quotation exists
        const existingQuotation = await prisma.quotations.findUnique({
            where: { so_bao_gia: id }
        });
        
        if (!existingQuotation) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy báo giá"
            });
        }
        
        // Validate references if provided
        if (tinh_trang) {
            const status = await prisma.quotation_status.findUnique({
                where: { ma_trang_thai_bao_gia: tinh_trang }
            });
            
            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: "Trạng thái báo giá không tồn tại"
                });
            }
        }
        
        if (loai_bao_gia) {
            const type = await prisma.quotation_type.findUnique({
                where: { ma_loai_bao_gia: loai_bao_gia }
            });
            
            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: "Loại báo giá không tồn tại"
                });
            }
        }
        
        if (nguoi_phu_trach) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: "Người phụ trách không tồn tại"
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (tinh_trang !== undefined) updateData.tinh_trang = tinh_trang;
        if (tieu_de !== undefined) updateData.tieu_de = tieu_de;
        if (ten_khach_hang !== undefined) updateData.ten_khach_hang = ten_khach_hang;
        if (loai_bao_gia !== undefined) updateData.loai_bao_gia = loai_bao_gia;
        if (ngay_bao_gia !== undefined) updateData.ngay_bao_gia = new Date(ngay_bao_gia);
        if (price_list !== undefined) updateData.price_list = price_list;
        if (so_dien_thoai !== undefined) updateData.so_dien_thoai = so_dien_thoai;
        if (nguoi_lien_he !== undefined) updateData.nguoi_lien_he = nguoi_lien_he;
        if (nguoi_phu_trach !== undefined) updateData.nguoi_phu_trach = nguoi_phu_trach;
        if (tong_tri_gia !== undefined) updateData.tong_tri_gia = parseFloat(tong_tri_gia);
        if (ghi_chu !== undefined) updateData.ghi_chu = ghi_chu;
        
        // Only update if we have data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có dữ liệu để cập nhật"
            });
        }
        
        // Update quotation
        const quotation = await prisma.quotations.update({
            where: { so_bao_gia: id },
            data: updateData,
            include: {
                quotation_type: {
                    select: {
                        loai_bao_gia: true
                    }
                },
                quotation_status: {
                    select: {
                        trang_thai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật báo giá thành công",
            data: quotation
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật báo giá",
            error: error.message
        });
    }
};

// Delete quotation
export const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if quotation exists
        const quotation = await prisma.quotations.findUnique({
            where: { so_bao_gia: id }
        });
        
        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy báo giá"
            });
        }
        
        // Delete quotation
        await prisma.quotations.delete({
            where: { so_bao_gia: id }
        });
        
        res.json({
            success: true,
            message: "Xóa báo giá thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa báo giá",
            error: error.message
        });
    }
};

// Get quotations by status
export const getQuotationsByStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        
        const quotations = await prisma.quotations.findMany({
            where: { tinh_trang: statusId },
            include: {
                quotation_type: {
                    select: {
                        ma_loai_bao_gia: true,
                        loai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                }
            },
            orderBy: { ngay_bao_gia: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách báo giá theo trạng thái ${statusId} thành công`,
            data: quotations
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách báo giá theo trạng thái",
            error: error.message
        });
    }
};

// Get quotations by type
export const getQuotationsByType = async (req, res) => {
    try {
        const { typeId } = req.params;
        
        const quotations = await prisma.quotations.findMany({
            where: { loai_bao_gia: typeId },
            include: {
                quotation_status: {
                    select: {
                        ma_trang_thai_bao_gia: true,
                        trang_thai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                }
            },
            orderBy: { ngay_bao_gia: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách báo giá theo loại ${typeId} thành công`,
            data: quotations
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách báo giá theo loại",
            error: error.message
        });
    }
};

// Get quotations by manager
export const getQuotationsByManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        
        const quotations = await prisma.quotations.findMany({
            where: { nguoi_phu_trach: managerId },
            include: {
                quotation_status: {
                    select: {
                        ma_trang_thai_bao_gia: true,
                        trang_thai_bao_gia: true
                    }
                },
                quotation_type: {
                    select: {
                        ma_loai_bao_gia: true,
                        loai_bao_gia: true
                    }
                }
            },
            orderBy: { ngay_bao_gia: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách báo giá theo người phụ trách ${managerId} thành công`,
            data: quotations
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách báo giá theo người phụ trách",
            error: error.message
        });
    }
};

// Get quotation statistics
export const getQuotationStats = async (req, res) => {
    try {
        const totalCount = await prisma.quotations.count();
        
        const statusCounts = await prisma.$queryRaw`
            SELECT qs."ma_trang_thai_bao_gia", qs."trang_thai_bao_gia", COUNT(q.*) as "count", SUM(q."tong_tri_gia") as "total_value"
            FROM "quotations" q
            JOIN "quotation_status" qs ON q."tinh_trang" = qs."ma_trang_thai_bao_gia"
            GROUP BY qs."ma_trang_thai_bao_gia", qs."trang_thai_bao_gia"
            ORDER BY "count" DESC
        `;
        
        const typeCounts = await prisma.$queryRaw`
            SELECT qt."ma_loai_bao_gia", qt."loai_bao_gia", COUNT(q.*) as "count", SUM(q."tong_tri_gia") as "total_value"
            FROM "quotations" q
            JOIN "quotation_type" qt ON q."loai_bao_gia" = qt."ma_loai_bao_gia"
            GROUP BY qt."ma_loai_bao_gia", qt."loai_bao_gia"
            ORDER BY "count" DESC
        `;
        
        const monthlyStats = await prisma.$queryRaw`
            SELECT 
                EXTRACT(YEAR FROM q."ngay_bao_gia") as "year",
                EXTRACT(MONTH FROM q."ngay_bao_gia") as "month",
                COUNT(*) as "count",
                SUM(q."tong_tri_gia") as "total_value"
            FROM "quotations" q
            WHERE q."ngay_bao_gia" >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY 
                EXTRACT(YEAR FROM q."ngay_bao_gia"),
                EXTRACT(MONTH FROM q."ngay_bao_gia")
            ORDER BY "year" DESC, "month" DESC
        `;
        
        const topManagers = await prisma.$queryRaw`
            SELECT a."ma_nguoi_dung", a."ho_va_ten", COUNT(q.*) as "count", SUM(q."tong_tri_gia") as "total_value"
            FROM "quotations" q
            JOIN "accounts" a ON q."nguoi_phu_trach" = a."ma_nguoi_dung"
            GROUP BY a."ma_nguoi_dung", a."ho_va_ten"
            ORDER BY "count" DESC
            LIMIT 5
        `;
        
        const recentQuotations = await prisma.quotations.findMany({
            take: 5,
            orderBy: { ngay_bao_gia: 'desc' },
            include: {
                quotation_type: {
                    select: {
                        loai_bao_gia: true
                    }
                },
                quotation_status: {
                    select: {
                        trang_thai_bao_gia: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê báo giá thành công",
            data: {
                totalCount,
                byStatus: statusCounts,
                byType: typeCounts,
                monthlyStats,
                topManagers,
                recentQuotations
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê báo giá",
            error: error.message
        });
    }
};
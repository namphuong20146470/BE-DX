import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all quotation statuses with pagination and filtering
// Get all quotation statuses without pagination limits
export const getAllQuotationStatuses = async (req, res) => {
    try {
        const { 
            sortBy = 'stt', 
            sortDir = 'asc',
            search = '',
            updatedBy = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { ma_trang_thai_bao_gia: { contains: search, mode: 'insensitive' } },
                { trang_thai_bao_gia: { contains: search, mode: 'insensitive' } },
                { mo_ta: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (updatedBy) {
            where.nguoi_cap_nhat = updatedBy;
        }
        
        // Get total count for metadata
        const totalCount = await prisma.quotation_status.count({ where });
        
        // Fetch ALL quotation statuses without pagination limits
        const quotationStatuses = await prisma.quotation_status.findMany({
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
                        quotations: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách trạng thái báo giá thành công",
            data: quotationStatuses,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách trạng thái báo giá",
            error: error.message
        });
    }
};

// Get quotation status by ID
export const getQuotationStatusById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const quotationStatus = await prisma.quotation_status.findUnique({
            where: { ma_trang_thai_bao_gia: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                quotations: {
                    select: {
                        so_bao_gia: true,
                        tieu_de: true,
                        ten_khach_hang: true,
                        ngay_bao_gia: true
                    },
                    take: 10,
                    orderBy: {
                        ngay_bao_gia: 'desc'
                    }
                },
                _count: {
                    select: {
                        quotations: true
                    }
                }
            }
        });
        
        if (!quotationStatus) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy trạng thái báo giá"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin trạng thái báo giá thành công",
            data: quotationStatus
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin trạng thái báo giá",
            error: error.message
        });
    }
};

// Create quotation status
export const createQuotationStatus = async (req, res) => {
    try {
        const { ma_trang_thai_bao_gia, trang_thai_bao_gia, mo_ta, nguoi_cap_nhat } = req.body;
        
        // Validate required fields
        if (!ma_trang_thai_bao_gia || !trang_thai_bao_gia) {
            return res.status(400).json({
                success: false,
                message: "Mã trạng thái báo giá và tên trạng thái báo giá là bắt buộc"
            });
        }
        
        // Check if ID already exists
        const existingStatus = await prisma.quotation_status.findUnique({
            where: { ma_trang_thai_bao_gia }
        });
        
        if (existingStatus) {
            return res.status(400).json({
                success: false,
                message: "Mã trạng thái báo giá đã tồn tại"
            });
        }
        
        // Check if name already exists
        const existingName = await prisma.quotation_status.findFirst({
            where: { trang_thai_bao_gia }
        });
        
        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Tên trạng thái báo giá đã tồn tại"
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
        const maxStt = await prisma.quotation_status.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new quotation status
        const quotationStatus = await prisma.quotation_status.create({
            data: {
                stt: nextStt,
                ma_trang_thai_bao_gia,
                trang_thai_bao_gia,
                mo_ta,
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
            message: "Tạo trạng thái báo giá thành công",
            data: quotationStatus
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo trạng thái báo giá",
            error: error.message
        });
    }
};

// Update quotation status
export const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { trang_thai_bao_gia, mo_ta, nguoi_cap_nhat } = req.body;
        
        // Check if quotation status exists
        const existingStatus = await prisma.quotation_status.findUnique({
            where: { ma_trang_thai_bao_gia: id }
        });
        
        if (!existingStatus) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy trạng thái báo giá"
            });
        }
        
        // Check if name already exists and belongs to a different record
        if (trang_thai_bao_gia) {
            const existingName = await prisma.quotation_status.findFirst({
                where: { 
                    trang_thai_bao_gia,
                    ma_trang_thai_bao_gia: { not: id }
                }
            });
            
            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: "Tên trạng thái báo giá đã tồn tại"
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
        
        if (trang_thai_bao_gia !== undefined) updateData.trang_thai_bao_gia = trang_thai_bao_gia;
        if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
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
        
        // Update quotation status
        const quotationStatus = await prisma.quotation_status.update({
            where: { ma_trang_thai_bao_gia: id },
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
            message: "Cập nhật trạng thái báo giá thành công",
            data: quotationStatus
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật trạng thái báo giá",
            error: error.message
        });
    }
};

// Delete quotation status
export const deleteQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if quotation status exists
        const quotationStatus = await prisma.quotation_status.findUnique({
            where: { ma_trang_thai_bao_gia: id },
            include: {
                quotations: true
            }
        });
        
        if (!quotationStatus) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy trạng thái báo giá"
            });
        }
        
        // Check if there are quotations using this status
        if (quotationStatus.quotations.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa trạng thái báo giá vì đang được sử dụng bởi báo giá",
                count: quotationStatus.quotations.length
            });
        }
        
        // Delete quotation status
        await prisma.quotation_status.delete({
            where: { ma_trang_thai_bao_gia: id }
        });
        
        res.json({
            success: true,
            message: "Xóa trạng thái báo giá thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa trạng thái báo giá",
            error: error.message
        });
    }
};

// Get quotation status statistics
export const getQuotationStatusStats = async (req, res) => {
    try {
        const totalCount = await prisma.quotation_status.count();
        
        const quotationCounts = await prisma.$queryRaw`
            SELECT qs."ma_trang_thai_bao_gia", qs."trang_thai_bao_gia", COUNT(q.*) as "count"
            FROM "quotation_status" qs
            LEFT JOIN "quotations" q ON qs."ma_trang_thai_bao_gia" = q."tinh_trang"
            GROUP BY qs."ma_trang_thai_bao_gia", qs."trang_thai_bao_gia"
            ORDER BY "count" DESC
        `;
        
        const recentStatuses = await prisma.quotation_status.findMany({
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
            message: "Lấy thống kê trạng thái báo giá thành công",
            data: {
                totalCount,
                quotationsByStatus: quotationCounts,
                recentStatuses
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê trạng thái báo giá",
            error: error.message
        });
    }
};
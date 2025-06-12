import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all opportunity sources with pagination and filtering
// Get all opportunity sources without pagination limits
export const getAllOpportunitySources = async (req, res) => {
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
                { ma_nguon: { contains: search, mode: 'insensitive' } },
                { nguon: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (status) {
            where.trang_thai = status;
        }
        
        // Get total count for metadata
        const totalCount = await prisma.opportunity_source.count({ where });
        
        // Fetch ALL opportunity sources without pagination
        const opportunitySources = await prisma.opportunity_source.findMany({
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
                        potential_customer: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách nguồn cơ hội thành công",
            data: opportunitySources,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nguồn cơ hội",
            error: error.message
        });
    }
};

// Get opportunity source by ID
export const getOpportunitySourceById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const opportunitySource = await prisma.opportunity_source.findUnique({
            where: { ma_nguon: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                potential_customer: {
                    select: {
                        ma_khach_hang_tiem_nang: true,
                        ten_khach_hang: true,
                        nguoi_phu_trach: true,
                    }
                },
                _count: {
                    select: {
                        potential_customer: true
                    }
                }
            }
        });
        
        if (!opportunitySource) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn cơ hội"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin nguồn cơ hội thành công",
            data: opportunitySource
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin nguồn cơ hội",
            error: error.message
        });
    }
};

// Create opportunity source
export const createOpportunitySource = async (req, res) => {
    try {
        const { ma_nguon, nguon, trang_thai, nguoi_cap_nhat } = req.body;
        
        // Validate required fields
        if (!ma_nguon || !nguon) {
            return res.status(400).json({
                success: false,
                message: "Mã nguồn và tên nguồn là bắt buộc"
            });
        }
        
        // Check if ID already exists
        const existingSource = await prisma.opportunity_source.findUnique({
            where: { ma_nguon }
        });
        
        if (existingSource) {
            return res.status(400).json({
                success: false,
                message: "Mã nguồn đã tồn tại"
            });
        }
        
        // Check if name already exists
        const existingName = await prisma.opportunity_source.findFirst({
            where: { nguon }
        });
        
        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Tên nguồn đã tồn tại"
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
        const maxStt = await prisma.opportunity_source.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new opportunity source
        const opportunitySource = await prisma.opportunity_source.create({
            data: {
                stt: nextStt,
                ma_nguon,
                nguon,
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
            message: "Tạo nguồn cơ hội thành công",
            data: opportunitySource
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo nguồn cơ hội",
            error: error.message
        });
    }
};

// Update opportunity source
export const updateOpportunitySource = async (req, res) => {
    try {
        const { id } = req.params;
        const { nguon, trang_thai, nguoi_cap_nhat } = req.body;
        
        // Check if opportunity source exists
        const existingSource = await prisma.opportunity_source.findUnique({
            where: { ma_nguon: id }
        });
        
        if (!existingSource) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn cơ hội"
            });
        }
        
        // Check if name already exists and belongs to a different record
        if (nguon) {
            const existingName = await prisma.opportunity_source.findFirst({
                where: { 
                    nguon,
                    ma_nguon: { not: id }
                }
            });
            
            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: "Tên nguồn đã tồn tại"
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
        
        if (nguon !== undefined) updateData.nguon = nguon;
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
        
        // Update opportunity source
        const opportunitySource = await prisma.opportunity_source.update({
            where: { ma_nguon: id },
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
            message: "Cập nhật nguồn cơ hội thành công",
            data: opportunitySource
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật nguồn cơ hội",
            error: error.message
        });
    }
};

// Delete opportunity source
export const deleteOpportunitySource = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if opportunity source exists
        const opportunitySource = await prisma.opportunity_source.findUnique({
            where: { ma_nguon: id },
            include: {
                potential_customer: true
            }
        });
        
        if (!opportunitySource) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn cơ hội"
            });
        }
        
        // Check if there are potential customers using this source
        if (opportunitySource.potential_customer.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa nguồn cơ hội vì đang được sử dụng bởi khách hàng tiềm năng",
                count: opportunitySource.potential_customer.length
            });
        }
        
        // Delete opportunity source
        await prisma.opportunity_source.delete({
            where: { ma_nguon: id }
        });
        
        res.json({
            success: true,
            message: "Xóa nguồn cơ hội thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa nguồn cơ hội",
            error: error.message
        });
    }
};

// Get opportunity source statistics
export const getOpportunitySourceStats = async (req, res) => {
    try {
        const totalCount = await prisma.opportunity_source.count();
        
        const activeCount = await prisma.opportunity_source.count({
            where: { trang_thai: 'Hoạt động' }
        });
        
        const inactiveCount = await prisma.opportunity_source.count({
            where: { trang_thai: 'Không hoạt động' }
        });
        
        const sourcesWithPotentialCustomers = await prisma.opportunity_source.findMany({
            select: {
                ma_nguon: true,
                nguon: true,
                _count: {
                    select: {
                        potential_customer: true
                    }
                }
            },
            orderBy: {
                _count: {
                    potential_customer: 'desc'
                }
            },
            take: 5
        });
        
        const recentSources = await prisma.opportunity_source.findMany({
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
            message: "Lấy thống kê nguồn cơ hội thành công",
            data: {
                totalCount,
                activeCount,
                inactiveCount,
                topSourcesByPotentialCustomers: sourcesWithPotentialCustomers,
                recentSources
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê nguồn cơ hội",
            error: error.message
        });
    }
};